import Stripe from "stripe";
import { env } from "@/lib/env";
import type { Order } from "@/lib/types";

let stripe: Stripe | null = null;
export function getStripe(): Stripe | null {
  if (!env.stripeSecretKey) return null;
  if (!stripe) stripe = new Stripe(env.stripeSecretKey, { appInfo: { name: "wanymsolution.com" } });
  return stripe;
}

export async function createCheckoutSession(order: Order): Promise<Stripe.Checkout.Session | null> {
  const s = getStripe();
  if (!s || order.total_cents == null || order.price_cents == null) return null;
  return s.checkout.sessions.create({
    mode: "payment",
    customer_email: order.email,
    client_reference_id: order.id,
    metadata: { order_id: order.id, reference: order.reference },
    // Pré-autorisation : l'empreinte est posée ici, la capture (ou la relâche) est
    // faite par NAMY à l'acceptation / au refus de la commande (même compte Stripe).
    payment_intent_data: {
      capture_method: "manual",
      description: `Transport ${order.reference}`,
      metadata: { order_id: order.id, reference: order.reference },
    },
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: order.currency.toLowerCase(),
          unit_amount: order.total_cents,
          product_data: {
            name: `Transport ${order.reference}`,
            description: `${order.pickup_address} → ${order.delivery_address}${order.wanted_date ? " · " + order.wanted_date : ""} (${(order.price_cents / 100).toFixed(2)} € HT, TVA ${order.vat_rate} %)`,
          },
        },
      },
    ],
    invoice_creation: { enabled: true },
    locale: "fr",
    success_url: `${env.siteUrl}/commander/merci?ref=${order.reference}&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${env.siteUrl}/commander?ref=${order.reference}&cancelled=1`,
    expires_at: Math.floor(Date.now() / 1000) + 60 * 60, // 1h
  });
}
