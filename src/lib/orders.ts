import { createHash } from "node:crypto";
import { sendCustomerConfirmation, sendInternalNotification } from "@/lib/email";
import { namyCommande, namyConfigured, namyDevis, orderToNamyInput, type NamyDevis, type NamyError, type NamySiteInput } from "@/lib/namy";
import { eurosToCents } from "@/lib/pricing";
import type { OrderInput, QuoteInput } from "@/lib/schemas/order";
import { supabaseAdmin } from "@/lib/supabase/client";
import { getContent, splitList } from "@/lib/supabase/content";
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

const n = (v: string | number | boolean | undefined | null) => (v === "" || v == null ? null : v);

/** Services priced and paid online through NAMY's grid (content key `order.namy_services`, "|"-separated slugs). */
export async function namyServiceSlugs(): Promise<string[]> {
  const content = await getContent();
  return splitList(content["order.namy_services"]);
}

/** Form fields → NAMY payload (quote or order). */
export function inputToNamy(input: QuoteInput | OrderInput, reference?: string): NamySiteInput {
  const i = input as OrderInput;
  return {
    reference,
    pickup: { adresse: input.pickup_address, contact_nom: n(input.pickup_contact) as string | null, telephone: (n(input.pickup_phone) as string | null) ?? (n(i.phone) as string | null) },
    delivery: {
      adresse: input.delivery_address,
      contact_nom: n(input.delivery_contact) as string | null,
      telephone: (n(input.delivery_phone) as string | null) ?? (n(i.phone) as string | null),
      email: (n(input.delivery_email) as string | null) ?? (n(i.email) as string | null),
      instructions: n(input.delivery_instructions) as string | null,
    },
    date: input.wanted_date,
    creneau: n(input.creneau) as string | null,
    mode_id: n(input.mode_id) as string | null,
    nb_colis: input.nb_colis,
    poids_total_kg: input.poids_total_kg,
    poids_max_colis_kg: typeof input.poids_max_colis_kg === "number" ? input.poids_max_colis_kg : null,
    nb_colis_lourds: input.nb_colis_lourds,
    longueur_max_cm: input.longueur_max_cm,
    etage: input.etage,
    acces_escalier: input.acces_escalier,
    options: input.options,
    marchandise: n(i.goods_type) as string | null,
    notes: n(i.notes) as string | null,
    company: n(i.company) as string | null,
    contact_name: n(i.contact_name) as string | null,
    email: n(i.email) as string | null,
    phone: n(i.phone) as string | null,
  };
}

export type SiteQuote =
  | { mode: "instant"; devis: NamyDevis; price_cents: number; total_cents: number; distance_km: number }
  | { mode: "quote"; reason: string; devis?: NamyDevis; error?: NamyError; distance_km?: number | null };

/** Ask NAMY for the price. Quote mode when the service is not sold online, NAMY says "devis", or NAMY is unreachable. */
export async function quoteWithNamy(input: QuoteInput | OrderInput): Promise<SiteQuote> {
  const slugs = await namyServiceSlugs();
  if (input.service_slug && slugs.length && !slugs.includes(input.service_slug)) return { mode: "quote", reason: "service_on_quote" };
  if (!namyConfigured()) return { mode: "quote", reason: "namy_non_configure" };
  const devis = await namyDevis(inputToNamy(input));
  if (!devis.ok) return { mode: "quote", reason: devis.error, error: devis };
  if (devis.prix.devis_requis || devis.prix.refus) return { mode: "quote", reason: devis.prix.refus ? "capacite_depassee" : "hors_grille", devis, distance_km: devis.prix.distance_km };
  if (devis.date_bloquee) return { mode: "quote", reason: "date_indisponible", devis, distance_km: devis.prix.distance_km };
  return {
    mode: "instant",
    devis,
    price_cents: eurosToCents(devis.prix.ht) ?? 0,
    total_cents: eurosToCents(devis.prix.ttc) ?? 0,
    distance_km: devis.prix.distance_km,
  };
}

/** Price the request with NAMY and insert it. Returns the stored order plus the quote used. */
export async function createOrder(input: OrderInput, ip: string): Promise<{ order: Order; quote: SiteQuote }> {
  const quote = await quoteWithNamy(input);
  const instant = quote.mode === "instant";
  const namyDetail = quote.devis?.prix ?? null;
  const row = {
    status: "new",
    service_slug: n(input.service_slug),
    pickup_address: input.pickup_address,
    pickup_postal_code: quote.devis?.geo.pickup.cp ?? input.pickup_address.match(/\b(\d{5})\b/)?.[1] ?? null,
    pickup_contact: n(input.pickup_contact),
    delivery_address: input.delivery_address,
    delivery_postal_code: quote.devis?.geo.delivery.cp ?? input.delivery_address.match(/\b(\d{5})\b/)?.[1] ?? null,
    delivery_contact: n(input.delivery_contact),
    goods_type: input.goods_type,
    quantity: String(input.nb_colis),
    quantity_unit: "colis",
    dimensions: `${input.longueur_max_cm} cm`,
    weight_kg: input.poids_total_kg,
    wanted_date: input.wanted_date,
    wanted_slot: input.creneau,
    options: {
      mode_id: n(input.mode_id),
      option_ids: input.options,
      poids_max_colis_kg: typeof input.poids_max_colis_kg === "number" ? input.poids_max_colis_kg : null,
      nb_colis_lourds: input.nb_colis_lourds,
      longueur_max_cm: input.longueur_max_cm,
      etage: input.etage,
      acces_escalier: input.acces_escalier,
      pickup_phone: n(input.pickup_phone),
      delivery_phone: n(input.delivery_phone),
      delivery_email: n(input.delivery_email),
      delivery_instructions: n(input.delivery_instructions),
      namy_prix: namyDetail,
      quote_reason: quote.mode === "quote" ? quote.reason : null,
    },
    company: n(input.company),
    contact_name: input.contact_name,
    email: input.email,
    phone: input.phone,
    notes: n(input.notes),
    gclid: n(input.gclid),
    utm: input.utm && Object.keys(input.utm).length ? input.utm : null,
    source: input.gclid ? "google_ads" : (input.utm?.utm_source ?? "direct"),
    distance_km: quote.distance_km ?? null,
    pricing_mode: quote.mode,
    price_cents: instant ? quote.price_cents : null,
    vat_rate: 20,
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
    data: { quote: { mode: quote.mode, reason: quote.mode === "quote" ? quote.reason : null, prix: namyDetail } },
  });
  return { order, quote };
}

/**
 * Who talks to the customer:
 *  - NAMY confirms, tracks and closes every course it receives (confirmation
 *    e-mail at creation, day-before and day-of reminders, completion).
 *  - The site only acknowledges quote requests (NAMY does not know them yet)
 *    and sends ops-triggered messages/invoices through PATCH /api/orders/[id].
 *
 * Called right after creation (quotes) and after Stripe confirms payment.
 */
export async function dispatchOrder(order: Order) {
  const handedToNamy = order.status === "confirmed" || order.payment_status === "paid";
  const [internal, customer] = await Promise.all([
    sendInternalNotification(order),
    handedToNamy ? Promise.resolve({ skipped: true as const, reason: "handled by NAMY" }) : sendCustomerConfirmation(order),
  ]);
  await logEvent(order.id, "email", handedToNamy ? "Exploitation prévenue (confirmation client assurée par NAMY)" : "Exploitation prévenue, accusé de réception envoyé au client", {
    data: { internal, customer },
  });
  if (handedToNamy) await syncOrderToNamy(order);
}

/** Create the course in NAMY once (idempotent on the site reference). Safe to call repeatedly. */
export async function syncOrderToNamy(order: Order): Promise<Order> {
  if (order.namy_synced_at) return order;
  if (!namyConfigured()) return order;
  const r = await namyCommande(orderToNamyInput(order));
  if (r.ok) {
    const synced = await updateOrder(order.id, { namy_ref: String(r.expedition_id), namy_synced_at: new Date().toISOString() });
    await logEvent(order.id, "namy", `Course créée dans NAMY (n° ${r.expedition_id}${r.devis_requis ? ", en attente de devis" : ""})`, { public: true, data: r as unknown as Record<string, unknown> });
    return synced;
  }
  await logEvent(order.id, "namy", `Échec de création dans NAMY : ${r.error}${r.detail ? " — " + JSON.stringify(r.detail).slice(0, 300) : ""}`, { data: r as unknown as Record<string, unknown> });
  return order;
}

/** Only the ops notification: used when a paid order was created but the customer left before paying. */
export async function notifyAbandoned(order: Order) {
  const internal = await sendInternalNotification(order);
  await logEvent(order.id, "email", "Exploitation prévenue (paiement non finalisé)", { data: { internal } });
}
