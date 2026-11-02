import { randomBytes } from "node:crypto";
import Stripe from "stripe";
import { env } from "@/lib/env";
import type { Order } from "@/lib/types";

let stripe: Stripe | null = null;
/** One StripeClient instance per process (never the deprecated global-key pattern). SDK 23 pins API 2026-10-28.endive. */
export function getStripe(): Stripe | null {
  if (!env.stripeSecretKey) return null;
  if (!stripe) stripe = new Stripe(env.stripeSecretKey, { appInfo: { name: "wanymsolution.com", url: env.siteUrl } });
  return stripe;
}

/** Dashboard label for this checkout flow (8 random letters per deployment, as Stripe recommends). */
const INTEGRATION_ID = `wanym_site_checkout_${Array.from(randomBytes(8), (b) => String.fromCharCode(97 + (b % 26))).join("")}`;

function lineDescription(order: Order) {
  return `${order.pickup_address} → ${order.delivery_address}${order.wanted_date ? " · " + order.wanted_date : ""}`;
}

/**
 * Hosted Checkout, immediate charge. Amounts:
 *  - Stripe Tax OFF (default): one TTC line, the price NAMY computed (HT + TVA 20 %).
 *  - Stripe Tax ON: the HT line with `tax_behavior: exclusive`, Stripe computes the VAT from the
 *    customer's address (and the tax ID collected for B2B); the webhook stores the final amounts.
 * No `payment_method_types`: Stripe picks the methods enabled in the Dashboard (cards, Apple/Google Pay, Link…).
 */
export async function createCheckoutSession(order: Order): Promise<Stripe.Checkout.Session | null> {
  const s = getStripe();
  if (!s || order.total_cents == null || order.price_cents == null) return null;
  const tax = env.stripeAutomaticTax;
  const metadata = { order_id: order.id, reference: order.reference };
  return s.checkout.sessions.create({
    mode: "payment",
    integration_identifier: INTEGRATION_ID,
    customer_email: order.email,
    customer_creation: "always", // a Customer for the invoice, the receipt and later Invoicing
    client_reference_id: order.id,
    metadata,
    // The card is kept (with the customer's consent, CGV § suppléments) to charge measured extras after the course:
    // on-site time beyond what was booked, undeclared floor, failed pickup. See chargeSupplement().
    payment_intent_data: { description: `Transport ${order.reference}`, metadata, setup_future_usage: "off_session" },
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: order.currency.toLowerCase(),
          unit_amount: tax ? order.price_cents : order.total_cents,
          ...(tax ? { tax_behavior: "exclusive" as const } : {}),
          product_data: {
            name: `Transport ${order.reference}`,
            description: tax ? lineDescription(order) : `${lineDescription(order)} (${(order.price_cents / 100).toFixed(2)} € HT, TVA ${order.vat_rate} %)`,
            ...(tax && env.stripeTaxCode ? { tax_code: env.stripeTaxCode } : {}),
          },
        },
      },
    ],
    ...(tax ? { automatic_tax: { enabled: true }, tax_id_collection: { enabled: true } } : {}),
    invoice_creation: { enabled: true, invoice_data: { metadata, description: `Transport ${order.reference} — ${lineDescription(order)}` } },
    locale: "fr",
    success_url: `${env.siteUrl}/commander/merci?ref=${order.reference}&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${env.siteUrl}/commander?ref=${order.reference}&cancelled=1`,
    expires_at: Math.floor(Date.now() / 1000) + 60 * 60, // 1h
  });
}

/** Find the Stripe Customer of an order's e-mail, or create it (company + contact kept on the customer). */
async function upsertCustomer(s: Stripe, order: Order): Promise<Stripe.Customer> {
  const found = await s.customers.search({ query: `email:'${order.email.replace(/'/g, "\\'")}'`, limit: 1 });
  const data: Stripe.CustomerUpdateParams = {
    name: order.company || order.contact_name,
    phone: order.phone,
    metadata: { contact_name: order.contact_name, last_order: order.reference },
    preferred_locales: ["fr"],
  };
  if (found.data[0]) return s.customers.update(found.data[0].id, data);
  return s.customers.create({ email: order.email, ...data });
}

export type StripeInvoiceResult = { id: string; number: string | null; hosted_invoice_url: string | null; invoice_pdf: string | null; status: string | null };

/**
 * Stripe Invoicing for orders paid on invoice (ops-confirmed quotes, B2B accounts): one invoice,
 * one line at the order's HT price, sent by Stripe with its hosted payment page. `invoice.paid`
 * on the webhook marks the order paid and hands the course to NAMY.
 */
export async function createStripeInvoice(order: Order, opts: { daysUntilDue?: number; memo?: string; send?: boolean } = {}): Promise<StripeInvoiceResult | null> {
  const s = getStripe();
  if (!s || order.price_cents == null) return null;
  const tax = env.stripeAutomaticTax;
  const customer = await upsertCustomer(s, order);
  const metadata = { order_id: order.id, reference: order.reference };
  const invoice = await s.invoices.create({
    customer: customer.id,
    collection_method: "send_invoice",
    days_until_due: opts.daysUntilDue ?? env.stripeInvoiceDaysDue,
    description: opts.memo ?? `Transport ${order.reference} — ${lineDescription(order)}`,
    metadata,
    ...(tax ? { automatic_tax: { enabled: true } } : {}),
    pending_invoice_items_behavior: "exclude",
  });
  await s.invoiceItems.create({
    customer: customer.id,
    invoice: invoice.id,
    currency: order.currency.toLowerCase(),
    description: `Transport ${order.reference} · ${lineDescription(order)}`,
    pricing: { price_data: { currency: order.currency.toLowerCase(), unit_amount: order.price_cents, product_data: { name: `Transport ${order.reference}`, ...(tax && env.stripeTaxCode ? { tax_code: env.stripeTaxCode } : {}) }, ...(tax ? { tax_behavior: "exclusive" as const } : {}) } },
    ...(tax ? {} : { tax_rates: [] }),
  } as Stripe.InvoiceItemCreateParams);
  if (!tax && order.vat_rate > 0) {
    // Without Stripe Tax: the invoice shows the TTC total NAMY computed. A single "TVA" line keeps HT, TVA and TTC
    // visible on the document; an account-level tax rate (Dashboard → Tax rates) can replace it later.
    await s.invoiceItems.create({
      customer: customer.id,
      invoice: invoice.id,
      currency: order.currency.toLowerCase(),
      description: `TVA ${order.vat_rate} %`,
      pricing: { price_data: { currency: order.currency.toLowerCase(), unit_amount: Math.round(order.price_cents * order.vat_rate / 100), product_data: { name: `TVA ${order.vat_rate} %` } } },
    } as Stripe.InvoiceItemCreateParams);
  }
  let final = await s.invoices.finalizeInvoice(invoice.id, { auto_advance: false });
  if (opts.send !== false) final = await s.invoices.sendInvoice(final.id);
  return { id: final.id, number: final.number, hosted_invoice_url: final.hosted_invoice_url ?? null, invoice_pdf: final.invoice_pdf ?? null, status: final.status };
}

export type SupplementResult =
  | { ok: true; mode: "charge"; payment_intent: string; amount_cents: number }
  | { ok: true; mode: "invoice"; invoice: StripeInvoiceResult; amount_cents: number }
  | { ok: false; reason: string };

/**
 * Charge a measured supplement (TTC cents) on the card saved at checkout, off-session. If the bank asks for
 * authentication or the card is gone, fall back to a Stripe invoice the customer pays online.
 * Never used for the original price: the course was paid up-front and NAMY's correction is the source of the amount.
 */
export async function chargeSupplement(order: Order, amountCents: number, label: string): Promise<SupplementResult> {
  const s = getStripe();
  if (!s) return { ok: false, reason: "stripe_non_configure" };
  if (!Number.isInteger(amountCents) || amountCents <= 0) return { ok: false, reason: "montant_invalide" };
  const metadata = { order_id: order.id, reference: order.reference, supplement: "1", label: label.slice(0, 200) };
  if (order.stripe_payment_intent) {
    try {
      const pi = await s.paymentIntents.retrieve(order.stripe_payment_intent);
      const customer = typeof pi.customer === "string" ? pi.customer : pi.customer?.id;
      const paymentMethod = typeof pi.payment_method === "string" ? pi.payment_method : pi.payment_method?.id;
      if (customer && paymentMethod) {
        const intent = await s.paymentIntents.create({
          amount: amountCents,
          currency: order.currency.toLowerCase(),
          customer,
          payment_method: paymentMethod,
          off_session: true,
          confirm: true,
          description: `Supplément ${order.reference} — ${label}`.slice(0, 1000),
          metadata,
        });
        if (intent.status === "succeeded") return { ok: true, mode: "charge", payment_intent: intent.id, amount_cents: amountCents };
      }
    } catch (e) {
      // authentication_required, card_declined, missing customer… → invoice below
      if (!(e instanceof Error) || !/authentication_required|card_declined|payment_method|customer|off_session/i.test(e.message)) throw e;
    }
  }
  const customer = await upsertCustomer(s, order);
  const invoice = await s.invoices.create({
    customer: customer.id,
    collection_method: "send_invoice",
    days_until_due: env.stripeInvoiceDaysDue,
    description: `Supplément ${order.reference} — ${label}`,
    metadata,
    pending_invoice_items_behavior: "exclude",
  });
  await s.invoiceItems.create({
    customer: customer.id,
    invoice: invoice.id,
    currency: order.currency.toLowerCase(),
    description: label,
    pricing: { price_data: { currency: order.currency.toLowerCase(), unit_amount: amountCents, product_data: { name: `Supplément ${order.reference}` } } },
  } as Stripe.InvoiceItemCreateParams);
  const final = await s.invoices.sendInvoice((await s.invoices.finalizeInvoice(invoice.id, { auto_advance: false })).id);
  return { ok: true, mode: "invoice", invoice: { id: final.id, number: final.number, hosted_invoice_url: final.hosted_invoice_url ?? null, invoice_pdf: final.invoice_pdf ?? null, status: final.status }, amount_cents: amountCents };
}

/** Full refund of a paid order (ops action after a cancellation); `charge.refunded` updates the order. */
export async function refundOrder(order: Order, reason?: string): Promise<Stripe.Refund | null> {
  const s = getStripe();
  if (!s || !order.stripe_payment_intent) return null;
  return s.refunds.create({ payment_intent: order.stripe_payment_intent, metadata: { order_id: order.id, reference: order.reference, reason: reason ?? "" } });
}
