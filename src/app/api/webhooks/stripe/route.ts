import { NextResponse } from "next/server";
import { after } from "next/server";
import type Stripe from "stripe";
import { env } from "@/lib/env";
import { dispatchOrder, getOrder, logEvent, notifyAbandoned, updateOrder } from "@/lib/orders";
import { getStripe } from "@/lib/stripe";

/**
 * POST /api/webhooks/stripe — Stripe → site. Configure the endpoint in the Stripe
 * dashboard with events: checkout.session.completed, checkout.session.expired,
 * payment_intent.succeeded, payment_intent.canceled, charge.refunded.
 * Signature verified with STRIPE_WEBHOOK_SECRET.
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
        if (!order || order.payment_status === "paid" || order.payment_status === "authorized") break; // idempotent
        // Capture manuelle : "paid" côté Checkout = empreinte AUTORISÉE, pas encore
        // débitée. NAMY capture à l'acceptation (→ payment_intent.succeeded) ou
        // relâche au refus (→ payment_intent.canceled).
        const authorized = await updateOrder(order.id, {
          payment_status: "authorized",
          paid_at: new Date().toISOString(),
          stripe_session_id: session.id,
          stripe_payment_intent: typeof session.payment_intent === "string" ? session.payment_intent : (session.payment_intent?.id ?? null),
        });
        await logEvent(order.id, "payment", `Empreinte bancaire enregistrée (${((session.amount_total ?? 0) / 100).toFixed(2)} € TTC), débit à la prise en charge`, {
          public: true,
          data: { session: session.id, amount_total: session.amount_total },
        });
        after(() => dispatchOrder(authorized));
        break;
      }
      case "payment_intent.succeeded": {
        const pi = event.data.object;
        const order = pi.metadata?.order_id ? await getOrder(pi.metadata.order_id) : null;
        if (!order || order.payment_status === "paid") break;
        await updateOrder(order.id, { payment_status: "paid", paid_at: new Date().toISOString(), stripe_payment_intent: pi.id });
        await logEvent(order.id, "payment", `Paiement débité (${((pi.amount_received ?? pi.amount ?? 0) / 100).toFixed(2)} € TTC)`, { public: true, data: { payment_intent: pi.id } });
        break;
      }
      case "payment_intent.canceled": {
        const pi = event.data.object;
        const order = pi.metadata?.order_id ? await getOrder(pi.metadata.order_id) : null;
        if (!order || order.payment_status === "refunded") break;
        await updateOrder(order.id, { payment_status: "refunded", status: order.status === "delivered" ? order.status : "cancelled" });
        await logEvent(order.id, "payment", "Empreinte bancaire relâchée, aucun débit", { public: true, data: { payment_intent: pi.id } });
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
