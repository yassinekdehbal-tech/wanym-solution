import { NextResponse } from "next/server";
import { badRequest, isAuthorized, notFound, readJson, unauthorized } from "@/lib/api";
import { env } from "@/lib/env";
import { getOrder, getOrderEvents, logEvent, updateOrder } from "@/lib/orders";
import { STATUS_LABELS, type Order, type OrderStatus } from "@/lib/types";
import { z } from "zod";

/**
 * POST /api/webhooks/namy — NAMY → site. Fired by NAMY's trigger
 * (trg_wanym_site_expedition_statut) on every status change of a course the
 * site created (event `expedition.statut`).
 * Auth: Bearer NAMY_INBOUND_KEY (stored in NAMY's vault as wanym_site_api_key), CONTENT_API_KEY as fallback.
 * Idempotent: replaying an event changes nothing.
 */
const schema = z.object({
  reference: z.string().trim().toUpperCase().regex(/^WS-\d{4}-\d{5}$/),
  event: z.string().max(60),
  expedition_id: z.union([z.number(), z.string()]).nullable().optional(),
  commande_publique_id: z.string().nullable().optional(),
  statut: z.string().nullable().optional(),
  motif: z.string().nullable().optional(),
  prix_ht: z.number().nullable().optional(),
  prix_ttc: z.number().nullable().optional(),
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
  if (!isAuthorized(req, env.namyInboundKey)) return unauthorized();
  const parsed = schema.safeParse(await readJson(req));
  if (!parsed.success) return badRequest(parsed.error);
  const ev = parsed.data;
  const order = await getOrder(ev.reference);
  if (!order) return notFound(`Unknown order ${ev.reference}`);

  const patch: Partial<Order> = {};
  let message: string | null = null;
  let type: "status" | "note" | "namy" = "status";

  if (ev.event !== "expedition.statut") {
    return NextResponse.json({ ok: true, ignored: ev.event });
  } else {
    const statut = ev.statut ?? "";
    const next = EXPEDITION_TO_SITE[statut];
    if (next === undefined) return NextResponse.json({ ok: true, ignored: statut });
    if (ev.expedition_id != null && !order.namy_ref) patch.namy_ref = String(ev.expedition_id);
    if (ev.date_livraison && ev.date_livraison !== order.wanted_date) patch.wanted_date = ev.date_livraison;
    if (next && next !== order.status) patch.status = next;
    else if (!next) type = "note";
    message = (EXPEDITION_LABEL[statut] ?? `Statut NAMY : ${statut}`) + (ev.motif ? ` — ${ev.motif}` : "");
    if (statut === "annule" && order.payment_status === "paid") message += " — remboursement à traiter";
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
