import { NextResponse } from "next/server";
import { badRequest, isAuthorized, notFound, readJson, unauthorized } from "@/lib/api";
import { getOrder, getOrderEvents, logEvent, updateOrder } from "@/lib/orders";
import { STATUS_LABELS, type Order, type OrderStatus } from "@/lib/types";
import { z } from "zod";

/**
 * POST /api/webhooks/namy — NAMY → site. Fired by NAMY's database triggers
 * (fn_wanym_site_notify) on every state change of an order the site handed over.
 * Auth: Bearer CONTENT_API_KEY (stored in NAMY's vault as wanym_site_api_key).
 * Idempotent: replaying an event changes nothing.
 */
const schema = z.object({
  reference: z.string().trim().toUpperCase().regex(/^WS-\d{4}-\d{5}$/),
  event: z.enum(["commande.convertie", "commande.refusee", "expedition.statut"]),
  expedition_id: z.union([z.number(), z.string()]).nullable().optional(),
  commande_publique_id: z.string().nullable().optional(),
  statut: z.string().nullable().optional(),
  motif: z.string().nullable().optional(),
  paiement_statut: z.string().nullable().optional(),
  date_livraison: z.string().nullable().optional(),
  creneau: z.string().nullable().optional(),
});

/** NAMY expedition status → site status (null = no change on the site). */
const EXPEDITION_TO_SITE: Record<string, OrderStatus | null> = {
  accepte: "confirmed",
  devis_attente: null,
  devis_propose: "quoted",
  planifie: "confirmed",
  retire: "in_progress",
  livre: "delivered",
  echec_retrait: "sav",
  echec_livraison: "sav",
  retourne: "sav",
  annule: "cancelled",
};
const EXPEDITION_LABEL: Record<string, string> = {
  accepte: "Commande acceptée par l'exploitation",
  planifie: "Livraison planifiée",
  retire: "Marchandise enlevée, en cours de livraison",
  livre: "Livraison effectuée",
  echec_retrait: "Enlèvement impossible, notre équipe vous contacte",
  echec_livraison: "Livraison non aboutie, notre équipe vous contacte",
  retourne: "Marchandise retournée à l'expéditeur",
  annule: "Commande annulée",
  devis_propose: "Devis transmis",
};

export async function POST(req: Request) {
  if (!isAuthorized(req)) return unauthorized();
  const parsed = schema.safeParse(await readJson(req));
  if (!parsed.success) return badRequest(parsed.error);
  const ev = parsed.data;
  const order = await getOrder(ev.reference);
  if (!order) return notFound(`Unknown order ${ev.reference}`);

  const patch: Partial<Order> = {};
  let message: string | null = null;
  let type: "status" | "note" | "namy" = "status";

  if (ev.event === "commande.convertie") {
    if (ev.expedition_id != null) patch.namy_ref = String(ev.expedition_id);
    if (!order.namy_synced_at) patch.namy_synced_at = new Date().toISOString();
    if (!["in_progress", "delivered", "cancelled", "sav"].includes(order.status)) patch.status = "confirmed";
    if (ev.paiement_statut === "capture" && order.payment_status !== "paid") {
      patch.payment_status = "paid";
      patch.paid_at = new Date().toISOString();
    }
    message = "Commande acceptée par l'exploitation" + (ev.expedition_id != null ? ` (expédition NAMY n° ${ev.expedition_id})` : "");
  } else if (ev.event === "commande.refusee") {
    if (order.status !== "delivered") patch.status = "cancelled";
    if (order.payment_status === "authorized") patch.payment_status = "refunded";
    message = `Commande refusée par l'exploitation${ev.motif ? " : " + ev.motif : ""}`;
  } else {
    const statut = ev.statut ?? "";
    const next = EXPEDITION_TO_SITE[statut];
    if (next === undefined) return NextResponse.json({ ok: true, ignored: statut });
    if (ev.expedition_id != null && !order.namy_ref) patch.namy_ref = String(ev.expedition_id);
    if (ev.date_livraison && ev.date_livraison !== order.wanted_date) patch.wanted_date = ev.date_livraison;
    if (next && next !== order.status) patch.status = next;
    else if (!next) type = "note";
    message = (EXPEDITION_LABEL[statut] ?? `Statut NAMY : ${statut}`) + (ev.motif ? ` — ${ev.motif}` : "");
    if (statut === "annule" && order.payment_status === "authorized") patch.payment_status = "refunded";
  }

  const changed = Object.keys(patch).length > 0;
  const updated = changed ? await updateOrder(order.id, patch) : order;
  // Same event replayed (no change) → acknowledge without a second log line.
  const events = await getOrderEvents(order.id);
  const duplicate = events.some((e) => e.author === "namy" && e.message === message && !changed);
  if (!duplicate && message) {
    await logEvent(order.id, patch.status ? "status" : type, message, {
      author: "namy",
      public: true,
      data: { event: ev.event, statut: ev.statut ?? null, expedition_id: ev.expedition_id ?? null, from: order.status, to: updated.status },
    });
  }
  return NextResponse.json({ ok: true, reference: updated.reference, status: updated.status, status_label: STATUS_LABELS[updated.status], payment_status: updated.payment_status });
}
