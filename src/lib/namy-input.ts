import { CATALOGUE_OBJETS } from "./catalogue-objets.ts";
import type { NamySiteInput } from "./namy";
import type { Order } from "./types";

/** Pure mapping of what the site stores onto what NAMY expects (no I/O, unit-tested in tests/order-to-namy.test.ts). */

export const AIDE_CLIENT_NOTE = "Le client aidera le chauffeur au portage (objet lourd déclaré sans équipier).";

/** Human summary of the size-advisor inventory ("Inventaire déclaré : 3 carton standard, 1 lave-linge, autre : piano droit"), for the dispatch notes. */
export function inventaireResume(input: { inventaire?: Record<string, number> | null; inventaire_autre?: string | null }): string | null {
  const parts = Object.entries(input.inventaire ?? {})
    .filter(([, q]) => Number(q) > 0)
    .map(([id, q]) => `${q} ${(CATALOGUE_OBJETS.find((c) => c.id === id)?.nom ?? id).toLowerCase()}`);
  const autre = input.inventaire_autre?.trim();
  if (autre) parts.push(`autre : ${autre}`);
  return parts.length ? `Inventaire déclaré : ${parts.join(", ")}` : null;
}

/**
 * Site order row → NAMY `commande` payload. The order keeps NAMY-specific fields in
 * `orders.options` (vehicule_id, porte_depart/arrivee, option ids, inventory, aide_client):
 * every field NAMY validates for the zone grid must come back out of there — the first
 * real order (WS-2026-00006, 08/11/2026) was refused with `champs_invalides: vehicule_id`
 * because this mapping only carried the weight-grid fields.
 */
export function orderToNamyInput(order: Order): NamySiteInput {
  const o = (order.options ?? {}) as Record<string, unknown>;
  const num = (v: unknown) => (v == null || v === "" || Number.isNaN(Number(v)) ? undefined : Number(v));
  const str = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : null);
  const notes = [
    str(order.notes),
    inventaireResume({ inventaire: (o.inventaire as Record<string, number> | null) ?? null, inventaire_autre: str(o.inventaire_autre) }),
    o.aide_client ? AIDE_CLIENT_NOTE : null,
  ].filter(Boolean).join("\n");
  return {
    reference: order.reference,
    pickup: { adresse: order.pickup_address, contact_nom: order.pickup_contact, telephone: str(o.pickup_phone) ?? order.phone },
    delivery: {
      adresse: order.delivery_address,
      contact_nom: order.delivery_contact,
      telephone: str(o.delivery_phone) ?? order.phone,
      email: str(o.delivery_email) ?? order.email,
      instructions: str(o.delivery_instructions),
    },
    date: order.wanted_date ?? "",
    creneau: order.wanted_slot,
    mode_id: str(o.mode_id),
    vehicule_id: str(o.vehicule_id),
    porte_depart: Boolean(o.porte_depart),
    porte_arrivee: Boolean(o.porte_arrivee),
    nb_colis: num(order.quantity) ?? 1,
    poids_total_kg: num(order.weight_kg) ?? 0,
    poids_max_colis_kg: num(o.poids_max_colis_kg) ?? null,
    nb_colis_lourds: num(o.nb_colis_lourds) ?? 0,
    longueur_max_cm: num(o.longueur_max_cm) ?? 0,
    etage: num(o.etage) ?? 0,
    acces_escalier: Boolean(o.acces_escalier),
    options: Array.isArray(o.option_ids) ? (o.option_ids as string[]) : [],
    marchandise: order.goods_type,
    notes: notes || null,
    company: order.company,
    contact_name: order.contact_name,
    email: order.email,
    phone: order.phone,
    payment: { status: order.payment_status, stripe_payment_intent: order.stripe_payment_intent, total_cents: order.total_cents },
  };
}
