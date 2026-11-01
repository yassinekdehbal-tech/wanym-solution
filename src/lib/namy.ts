import { cacheLife } from "next/cache";
import { env } from "@/lib/env";
import type { Order } from "@/lib/types";

/**
 * NAMY = the WANYM SOLUTION TMS. The site is one of its order channels: every
 * order becomes an expedition of the client account "WANYM SOLUTION — Site web",
 * priced by NAMY's own engine on the grid assigned to that account.
 *
 * Endpoint: Edge Function `creer-commande-publique`, header `x-wanym-site-key`.
 * Actions: contexte (form metadata), creneaux (slots of a date), devis (price),
 * commande (create the expedition, idempotent on the site reference).
 */
export type NamyContexte = {
  client: { id: string; nom: string | null };
  grille: { id: string; nom: string | null; type: string; tarif_par_colis: boolean };
  modes: { id: string; code: string; libelle: string }[];
  /** Grille ZONE : les surfaces plancher vendues (catégories de véhicule NAMY), avec le forfait de la plus petite zone. */
  vehicules: { id: string; nom: string; volume: string | null; surface_m2: number | null; couleur: string | null; ordre: number | null; prix_base_ht: number | null; rayon_km: number | null }[];
  options: { id: string; code: string | null; nom: string; description: string | null; icone: string | null; prix: number | null; format_prix: string | null; unite_label: string | null }[];
  /** Règles automatiques affichées au client (étage sans ascenseur…), jamais recalculées par le site. */
  regles: { code: string | null; nom: string; description: string | null; champ: string | null; seuil: number | null; prix: number | null }[];
  seuils_devis: { poids_total: number | null; colis_kg: number | null; colis_cm: number | null };
  jours_service: string[];
  commande_jour_j: boolean;
  heure_limite_jour_j: string;
  fermetures: { date: string; raison: string }[];
  mode_devis: boolean;
};

export type NamyPrix = {
  mode: { id: string; code: string; libelle: string } | null;
  vehicule: { id: string; nom: string; volume: string | null; surface_m2: number | null } | null;
  zone: { mode: "fixe" | "depassement"; rayon_km: number | null; extra_km: number; prix_km_ht: number; forfait_ht: number } | null;
  distance_km: number;
  categorie: number | null;
  base_ht: number;
  supplement_lourd_ht: number;
  supplement_distance_ht: number;
  options: { libelle: string; prix_ht: number }[];
  majoration_creneau: { delta_pct: number; delta_eur: number; libelle_court: string; libelle_long: string };
  remise: { delta_pct: number; libelles: string[] };
  ht_brut: number;
  ht: number;
  tva: number;
  ttc: number;
  devis_requis: boolean;
  refus: boolean;
  motifs: string[];
};

export type NamyDevis = {
  ok: true;
  date_bloquee: string | null;
  creneaux: { value: string; label: string }[];
  geo: { pickup: NamyGeo; delivery: NamyGeo };
  prix: NamyPrix;
};
export type NamyGeo = { label: string; lat: number; lng: number; cp: string | null; ville: string | null; adresse: string | null };

export type NamyError = { ok: false; status: number; error: string; champs?: string[]; detail?: unknown; creneaux?: { value: string; label: string }[] };

/** Shape NAMY expects for devis / commande. Built from the site's order fields. */
export type NamySiteInput = {
  reference?: string;
  pickup: { adresse: string; contact_nom?: string | null; telephone?: string | null };
  delivery: { adresse: string; contact_nom?: string | null; telephone?: string | null; email?: string | null; instructions?: string | null };
  date: string;
  creneau?: string | null;
  mode_id?: string | null;
  vehicule_id?: string | null;
  porte_depart?: boolean;
  porte_arrivee?: boolean;
  nb_colis: number;
  poids_total_kg: number;
  poids_max_colis_kg?: number | null;
  nb_colis_lourds?: number;
  longueur_max_cm: number;
  etage?: number;
  acces_escalier?: boolean;
  options?: string[];
  marchandise?: string | null;
  notes?: string | null;
  company?: string | null;
  contact_name?: string | null;
  email?: string | null;
  phone?: string | null;
  payment?: { status: string; stripe_payment_intent?: string | null; total_cents?: number | null } | null;
};

export function namyConfigured(): boolean {
  return Boolean(env.namyWebhookUrl && env.namyApiKey);
}

async function namyCall<T>(action: string, payload: Record<string, unknown>, timeoutMs = 15_000): Promise<T | NamyError> {
  if (!namyConfigured()) return { ok: false, status: 503, error: "namy_non_configure" };
  try {
    const res = await fetch(env.namyWebhookUrl, {
      method: "POST",
      headers: { "content-type": "application/json", "x-wanym-site-key": env.namyApiKey, "x-wanym-event": action },
      body: JSON.stringify({ action, ...payload }),
      signal: AbortSignal.timeout(timeoutMs),
      cache: "no-store",
    });
    const json = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    if (!res.ok || json.ok === false) {
      return { ok: false, status: res.status, error: String(json.error ?? `namy_${res.status}`), champs: json.champs as string[] | undefined, detail: json.detail, creneaux: json.creneaux as NamyError["creneaux"] };
    }
    return json as T;
  } catch (e) {
    return { ok: false, status: 0, error: e instanceof Error ? e.message : String(e) };
  }
}

let contexteCache: { at: number; value: NamyContexte } | null = null;

/** Form metadata (modes, options, service days). Cached 5 minutes per instance. */
export async function getNamyContexte(): Promise<NamyContexte | NamyError> {
  if (contexteCache && Date.now() - contexteCache.at < 5 * 60_000) return contexteCache.value;
  const r = await namyCall<NamyContexte & { ok: true }>("contexte", {});
  if (r.ok) contexteCache = { at: Date.now(), value: r };
  return r;
}

/** Les 4 tailles pour la vitrine (accueil) : lues en cache court, jamais de prix en dur ; vide si NAMY ne répond pas. */
export async function getVehiculesVitrine(): Promise<NamyContexte["vehicules"]> {
  "use cache";
  cacheLife("minutes");
  if (!namyConfigured()) return [];
  const ctx = await getNamyContexte();
  if ("ok" in ctx && ctx.ok === false) return [];
  return [...((ctx as NamyContexte).vehicules ?? [])].sort((a, b) => (a.ordre ?? 0) - (b.ordre ?? 0));
}

export async function getNamyCreneaux(date: string): Promise<{ ok: true; date_bloquee: string | null; creneaux: { value: string; label: string }[] } | NamyError> {
  return namyCall("creneaux", { date });
}

export async function namyDevis(input: NamySiteInput): Promise<NamyDevis | NamyError> {
  return namyCall<NamyDevis>("devis", input as unknown as Record<string, unknown>);
}

export async function namyCommande(input: NamySiteInput): Promise<{ ok: true; expedition_id: number; uuid: string; statut: string; prix_ht?: number; prix_ttc?: number; devis_requis?: boolean; deja_recue?: boolean } | NamyError> {
  return namyCall("commande", input as unknown as Record<string, unknown>, 25_000);
}

/** Site order row → NAMY payload (the site stores NAMY-specific fields in orders.options). */
export function orderToNamyInput(order: Order): NamySiteInput {
  const o = (order.options ?? {}) as Record<string, unknown>;
  const num = (v: unknown) => (v == null || v === "" || Number.isNaN(Number(v)) ? undefined : Number(v));
  return {
    reference: order.reference,
    pickup: { adresse: order.pickup_address, contact_nom: order.pickup_contact, telephone: (o.pickup_phone as string) ?? order.phone },
    delivery: {
      adresse: order.delivery_address,
      contact_nom: order.delivery_contact,
      telephone: (o.delivery_phone as string) ?? order.phone,
      email: (o.delivery_email as string) ?? order.email,
      instructions: (o.delivery_instructions as string) ?? null,
    },
    date: order.wanted_date ?? "",
    creneau: order.wanted_slot,
    mode_id: (o.mode_id as string) ?? null,
    nb_colis: num(order.quantity) ?? 1,
    poids_total_kg: num(order.weight_kg) ?? 0,
    poids_max_colis_kg: num(o.poids_max_colis_kg) ?? null,
    nb_colis_lourds: num(o.nb_colis_lourds) ?? 0,
    longueur_max_cm: num(o.longueur_max_cm) ?? 0,
    etage: num(o.etage) ?? 0,
    acces_escalier: Boolean(o.acces_escalier),
    options: Array.isArray(o.option_ids) ? (o.option_ids as string[]) : [],
    marchandise: order.goods_type,
    notes: order.notes,
    company: order.company,
    contact_name: order.contact_name,
    email: order.email,
    phone: order.phone,
    payment: { status: order.payment_status, stripe_payment_intent: order.stripe_payment_intent, total_cents: order.total_cents },
  };
}
