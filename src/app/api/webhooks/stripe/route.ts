import { NextResponse } from "next/server";
import { after } from "next/server";
import type Stripe from "stripe";
import { env } from "@/lib/env";
import { sendOpsAlert } from "@/lib/email";
import { dispatchOrder, getOrder, logEvent, notifyAbandoned, updateOrder } from "@/lib/orders";
import { getStripe } from "@/lib/stripe";

/**
 * POST /api/webhooks/stripe — Stripe → site. Fulfilment lives here, never on the success page.
 * Events to subscribe in the Dashboard: checkout.session.completed,
 * checkout.session.async_payment_succeeded, checkout.session.async_payment_failed,
 * checkout.session.expired, invoice.paid, invoice.payment_failed, charge.refunded,
 * charge.dispute.created. Signature verified with STRIPE_WEBHOOK_SECRET.
 */
export async function POST(req: Request) {
  const stripe = getStripe();
  const sig = req.headers.get("stripe-signature");
  if (!stripe || !env.stripeWebhookSecret || !sig) return NextResponse.json({ error: "Stripe not configured" }, { status: 503 });

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(await req.text(), sig, env.stripeWebhookSecret);
  } catch (e) {
    return NextResponse.json({ error: `Invalid signature: ${e instanceof Error ? e.message : e}` }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
      case "checkout.session.async_payment_succeeded": {
        const session = event.data.object;
        const orderId = session.metadata?.order_id ?? session.client_reference_id;
        if (!orderId || session.payment_status !== "paid") break;
        const order = await getOrder(orderId);
        if (!order || order.payment_status === "paid") break; // idempotent
        // With Stripe Tax the VAT is computed by Stripe (address, tax ID): the order keeps Stripe's amounts.
        const taxed = session.automatic_tax?.enabled && session.amount_total != null && session.amount_subtotal != null;
        const paid = await updateOrder(order.id, {
          payment_status: "paid",
          status: order.status === "new" ? "confirmed" : order.status,
          paid_at: new Date().toISOString(),
          stripe_session_id: session.id,
          stripe_payment_intent: typeof session.payment_intent === "string" ? session.payment_intent : (session.payment_intent?.id ?? null),
          ...(taxed ? { price_cents: session.amount_subtotal!, total_cents: session.amount_total! } : {}),
        });
        await logEvent(order.id, "payment", `Paiement reçu (${((session.amount_total ?? 0) / 100).toFixed(2)} € TTC)`, {
          public: true,
          data: { session: session.id, amount_total: session.amount_total, amount_tax: session.total_details?.amount_tax ?? null, invoice: typeof session.invoice === "string" ? session.invoice : (session.invoice?.id ?? null) },
        });
        // Hands the course to NAMY (dispatchable at once) and tells ops.
        after(() => dispatchOrder(paid));
        break;
      }
      case "checkout.session.expired": {
        const session = event.data.object;
        const orderId = session.metadata?.order_id ?? session.client_reference_id;
        const order = orderId ? await getOrder(orderId) : null;
        if (!order || order.payment_status !== "pending") break;
        const abandoned = await updateOrder(order.id, { payment_status: "failed" });
        await logEvent(order.id, "payment", "Session de paiement expirée sans paiement", { data: { session: session.id } });
        after(() => notifyAbandoned(abandoned));
        break;
      }
      case "checkout.session.async_payment_failed": {
        // Delayed-notification method (bank debit…) that failed after the session completed.
        const session = event.data.object;
        const orderId = session.metadata?.order_id ?? session.client_reference_id;
        const order = orderId ? await getOrder(orderId) : null;
        if (!order || order.payment_status === "paid") break;
        const failed = await updateOrder(order.id, { payment_status: "failed" });
        await logEvent(order.id, "payment", "Paiement différé refusé par la banque", { public: true, data: { session: session.id } });
        after(() => sendOpsAlert(failed, "Paiement refusé", "Le paiement différé de cette commande a échoué. La course n'a pas été transmise à NAMY."));
        break;
      }
      case "invoice.paid": {
        // Stripe Invoicing (POST /api/orders/[id]/invoice): payment received on the hosted invoice page.
        const invoice = event.data.object;
        const orderId = invoice.metadata?.order_id;
        const order = orderId ? await getOrder(orderId) : null;
        if (!order || order.payment_status === "paid") break;
        const paid = await updateOrder(order.id, {
          payment_status: "paid",
          status: order.status === "new" || order.status === "quoted" ? "confirmed" : order.status,
          paid_at: new Date().toISOString(),
          invoice_number: invoice.number ?? order.invoice_number,
          invoice_url: invoice.hosted_invoice_url ?? order.invoice_url,
          ...(invoice.automatic_tax?.enabled && invoice.subtotal != null ? { price_cents: invoice.subtotal, total_cents: invoice.total } : {}),
        });
        await logEvent(order.id, "payment", `Facture ${invoice.number ?? invoice.id} réglée (${((invoice.amount_paid ?? 0) / 100).toFixed(2)} € TTC)`, { public: true, data: { invoice: invoice.id } });
        after(() => dispatchOrder(paid));
        break;
      }
      case "invoice.payment_failed": {
        const invoice = event.data.object;
        const orderId = invoice.metadata?.order_id;
        const order = orderId ? await getOrder(orderId) : null;
        if (!order || order.payment_status === "paid") break;
        await logEvent(order.id, "payment", `Échec de paiement de la facture ${invoice.number ?? invoice.id}`, { data: { invoice: invoice.id } });
        after(() => sendOpsAlert(order, "Facture impayée", `Le paiement de la facture ${invoice.number ?? invoice.id} a échoué.`));
        break;
      }
      case "charge.dispute.created": {
        // Chargeback: the money is on hold, ops must answer in the Dashboard before the deadline.
        const dispute = event.data.object;
        const pi = typeof dispute.payment_intent === "string" ? dispute.payment_intent : dispute.payment_intent?.id;
        const orderId = (dispute.metadata as Record<string, string> | null)?.order_id;
        let order = orderId ? await getOrder(orderId) : null;
        if (!order && pi) {
          const charge = await stripe.charges.retrieve(typeof dispute.charge === "string" ? dispute.charge : dispute.charge.id);
          order = charge.metadata?.order_id ? await getOrder(charge.metadata.order_id) : null;
        }
        if (!order) break;
        const flagged = order.status === "sav" ? order : await updateOrder(order.id, { status: "sav" });
        await logEvent(order.id, "sav", `Litige bancaire ouvert (${(dispute.amount / 100).toFixed(2)} €, motif ${dispute.reason})`, { data: { dispute: dispute.id, due_by: dispute.evidence_details?.due_by ?? null } });
        after(() => sendOpsAlert(flagged, "Litige bancaire (chargeback)", `Un litige de ${(dispute.amount / 100).toFixed(2)} € est ouvert sur cette commande (motif : ${dispute.reason}). Répondre dans Stripe → Paiements → Litiges avant l'échéance.`));
        break;
      }
      case "charge.refunded": {
        const charge = event.data.object;
        const orderId = charge.metadata?.order_id;
        const order = orderId ? await getOrder(orderId) : null;
        if (!order) break;
        await updateOrder(order.id, { payment_status: "refunded" });
        await logEvent(order.id, "payment", `Remboursement (${((charge.amount_refunded ?? 0) / 100).toFixed(2)} €)`, { public: true, data: { charge: charge.id } });
        break;
      }
      default:
        break;
    }
  } catch (e) {
    console.error("[stripe webhook]", event.type, e);
    return NextResponse.json({ error: "handler failed" }, { status: 500 });
  }
  return NextResponse.json({ received: true });
}
