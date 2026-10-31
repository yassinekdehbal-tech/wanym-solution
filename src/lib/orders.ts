import { createHash } from "node:crypto";
import { sendCustomerConfirmation, sendInternalNotification } from "@/lib/email";
import { pushOrderToNamy } from "@/lib/namy";
import { computeQuote, type Quote } from "@/lib/pricing";
import type { OrderInput } from "@/lib/schemas/order";
import { supabaseAdmin } from "@/lib/supabase/client";
import { getPricingRules } from "@/lib/supabase/content";
import type { EventType, Order, OrderEvent } from "@/lib/types";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function logEvent(
  orderId: string,
  type: EventType,
  message: string | null,
  opts: { data?: Record<string, unknown>; author?: string; public?: boolean } = {},
) {
  const { error } = await supabaseAdmin().from("order_events").insert({
    order_id: orderId,
    type,
    message,
    data: opts.data ?? null,
    author: opts.author ?? "system",
    public: opts.public ?? false,
  });
  if (error) console.error("[orders] event insert failed:", error.message);
}

export async function getOrder(idOrRef: string): Promise<Order | null> {
  const q = supabaseAdmin().from("orders").select("*");
  const { data } = UUID_RE.test(idOrRef) ? await q.eq("id", idOrRef).maybeSingle() : await q.eq("reference", idOrRef.toUpperCase()).maybeSingle();
  return (data as Order | null) ?? null;
}

export async function getOrderEvents(orderId: string, onlyPublic = false): Promise<OrderEvent[]> {
  let q = supabaseAdmin().from("order_events").select("*").eq("order_id", orderId).order("created_at", { ascending: true });
  if (onlyPublic) q = q.eq("public", true);
  const { data } = await q;
  return (data ?? []) as OrderEvent[];
}

export async function updateOrder(id: string, patch: Partial<Order>): Promise<Order> {
  const { data, error } = await supabaseAdmin().from("orders").update(patch).eq("id", id).select("*").single();
  if (error) throw new Error(`order update failed: ${error.message}`);
  return data as Order;
}

const n = (v: string | number | undefined | null) => (v === "" || v == null ? null : v);

/** Price the request and insert it. Returns the stored order plus the quote used. */
export async function createOrder(input: OrderInput, ip: string): Promise<{ order: Order; quote: Quote }> {
  const rules = await getPricingRules();
  const quote = await computeQuote(input, rules);
  const instant = quote.mode === "instant";
  const row = {
    status: "new",
    service_slug: input.service_slug,
    pickup_address: input.pickup_address,
    pickup_postal_code: input.pickup_address.match(/\b(\d{5})\b/)?.[1] ?? null,
    pickup_contact: n(input.pickup_contact),
    delivery_address: input.delivery_address,
    delivery_postal_code: input.delivery_address.match(/\b(\d{5})\b/)?.[1] ?? null,
    delivery_contact: n(input.delivery_contact),
    goods_type: input.goods_type,
    quantity: String(input.quantity),
    quantity_unit: input.quantity_unit,
    dimensions: n(input.dimensions),
    weight_kg: n(input.weight_kg),
    wanted_date: input.wanted_date,
    wanted_slot: input.wanted_slot,
    options: input.options,
    company: n(input.company),
    contact_name: input.contact_name,
    email: input.email,
    phone: input.phone,
    notes: n(input.notes),
    gclid: n(input.gclid),
    utm: input.utm && Object.keys(input.utm).length ? input.utm : null,
    source: input.gclid ? "google_ads" : (input.utm?.utm_source ?? "direct"),
    distance_km: quote.distance_km,
    pricing_mode: quote.mode,
    price_cents: instant ? quote.price_cents : null,
    vat_rate: instant ? quote.vat_rate : 20,
    total_cents: instant ? quote.total_cents : null,
    payment_status: instant ? "pending" : "not_required",
    ip_hash: createHash("sha256").update(ip).digest("hex").slice(0, 32),
  };
  const { data, error } = await supabaseAdmin().from("orders").insert(row).select("*").single();
  if (error) throw new Error(`order insert failed: ${error.message}`);
  const order = data as Order;
  await logEvent(order.id, "created", instant ? "Commande créée, en attente de paiement" : "Demande de devis reçue", {
    author: "customer",
    public: true,
    data: { quote },
  });
  return { order, quote };
}

/**
 * Who talks to the customer:
 *  - NAMY handles confirmation, tracking and end-of-delivery messages for every
 *    order it receives. The site therefore never e-mails a paid/confirmed customer.
 *  - The site only acknowledges quote requests (NAMY does not know them yet) and
 *    sends ops-triggered messages/invoices through PATCH /api/orders/[id].
 *
 * Called right after creation (quotes) and after Stripe confirms payment.
 */
export async function dispatchOrder(order: Order) {
  const confirmed = order.status === "confirmed" || order.payment_status === "paid";
  const [internal, customer] = await Promise.all([
    sendInternalNotification(order),
    confirmed ? Promise.resolve({ skipped: true as const, reason: "handled by NAMY" }) : sendCustomerConfirmation(order),
  ]);
  await logEvent(order.id, "email", confirmed ? "Exploitation prévenue (confirmation client assurée par NAMY)" : "Exploitation prévenue, accusé de réception envoyé au client", {
    data: { internal, customer },
  });
  if (confirmed) await syncOrderToNamy(order);
}

/** Push a confirmed order to NAMY once. Safe to call repeatedly. */
export async function syncOrderToNamy(order: Order): Promise<Order> {
  if (order.namy_synced_at) return order;
  const r = await pushOrderToNamy(order);
  if (r.ok) {
    const synced = await updateOrder(order.id, { namy_ref: r.ref ?? order.namy_ref, namy_synced_at: new Date().toISOString() });
    await logEvent(order.id, "namy", `Transmise à NAMY${r.ref ? " (" + r.ref + ")" : ""}`, { data: r });
    return synced;
  }
  if (!r.skipped) await logEvent(order.id, "namy", `Échec de transmission à NAMY : ${r.error}`, { data: r });
  return order;
}

/** Only the ops notification: used when a paid order was created but the customer left before paying. */
export async function notifyAbandoned(order: Order) {
  const internal = await sendInternalNotification(order);
  await logEvent(order.id, "email", "Exploitation prévenue (paiement non finalisé)", { data: { internal } });
}
