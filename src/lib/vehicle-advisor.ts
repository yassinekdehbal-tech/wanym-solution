/**
 * Size advisor — pure, deterministic, UI-free.
 *
 * Given an inventory (catalogue items × quantities) and the vehicle sizes NAMY
 * sells (1 / 2 / 4 / 8 m²), it SUGGESTS a size. It never guarantees that a load
 * fits: the result carries a status (`suggere`, `a_verifier`, `hors_capacite`)
 * and the reasons, so the UI can word it honestly. The price stays NAMY's.
 *
 * Model (kept explainable on purpose):
 *  - footprint: every item occupies its floor footprint; stackable items (and
 *    items that can bear load under them) share the floor by layers, limited by
 *    the vehicle's interior height;
 *  - volume: Σ l×w×h, compared to the usable volume;
 *  - longest item compared to the interior length (and the diagonal of the
 *    floor, for items that may lie across);
 *  - weight compared to the payload;
 *  - a configurable safety margin on footprint and volume (no universal 0.85).
 * Unknown dimensions or unvalidated capacities downgrade the status to
 * `a_verifier` instead of pretending.
 */

export type Orientation = "libre" | "debout" | "a_plat";

export interface CatalogueItem {
  id: string;
  nom: string;
  categorie: string;
  icone?: string | null;
  longueur_cm: number | null;
  largeur_cm: number | null;
  hauteur_cm: number | null;
  poids_kg: number | null;
  /** Explicit floor footprint; derived from l × w when absent. */
  emprise_m2?: number | null;
  empilable: boolean;
  supporte_charge: boolean;
  fragile: boolean;
  orientation: Orientation;
  a_confirmer?: boolean;
}

export interface VehiculeCapacite {
  /** Join key with NAMY's categories_vehicules.surface_m2. */
  surface_m2: number;
  volume_m3: number | null;
  longueur_int_cm: number | null;
  largeur_int_cm: number | null;
  hauteur_int_cm: number | null;
  charge_utile_kg: number | null;
  a_confirmer?: boolean;
}

/** A NAMY vehicle (from the site context) enriched with its capacity. */
export interface VehiculeOption {
  id: string;
  nom: string;
  volume: string | null;
  surface_m2: number | null;
  ordre: number | null;
}

export interface InventaireLigne {
  item: CatalogueItem;
  quantite: number;
}

export interface AdvisorParams {
  /** Safety margin applied to footprint and volume (0.15 = 15 %). */
  marge: number;
  /** Fallback height (cm) for an item without dimensions, used for volume only. */
  hauteur_defaut_cm: number;
}

export const DEFAULT_PARAMS: AdvisorParams = { marge: 0.1, hauteur_defaut_cm: 80 };

export type AdvisorStatus = "vide" | "suggere" | "a_verifier" | "hors_capacite";

export interface AdvisorResult {
  statut: AdvisorStatus;
  vehicule: VehiculeOption | null;
  /** Human-readable reasons for the status (French, short). */
  raisons: string[];
  /** What was measured, for the UI and for debugging. */
  mesures: { objets: number; emprise_m2: number; emprise_ajustee_m2: number; volume_m3: number; poids_kg: number; longueur_max_cm: number };
  /** Why the result is uncertain (empty when `suggere`). */
  incertitudes: string[];
}

const r2 = (n: number) => Math.round(n * 100) / 100;

/**
 * Catalogue dimensions are given IN TRANSPORT ORIENTATION (a mattress "debout" is
 * 200 long × 25 wide × 140 high on its edge): the footprint is always l × w and
 * the height is `hauteur_cm`. `orientation` documents that convention and tells
 * the UI what to draw; it is not a second geometry.
 */
export function empriseItem(it: CatalogueItem): number {
  if (it.emprise_m2 != null && it.emprise_m2 > 0) return it.emprise_m2;
  if (it.longueur_cm && it.largeur_cm) return (it.longueur_cm * it.largeur_cm) / 10_000;
  return 0;
}

export function volumeItem(it: CatalogueItem, p: AdvisorParams): number {
  if (it.longueur_cm && it.largeur_cm && it.hauteur_cm) return (it.longueur_cm * it.largeur_cm * it.hauteur_cm) / 1_000_000;
  return empriseItem(it) * (p.hauteur_defaut_cm / 100);
}

/** Longest dimension along the floor (the height is checked against the interior height). */
export function longueurMax(it: CatalogueItem): number {
  return Math.max(it.longueur_cm ?? 0, it.largeur_cm ?? 0);
}

/**
 * Footprint after stacking, in two moves:
 *  1. stackable items share the floor by layers (their own height vs the interior height;
 *     an item that cannot bear load only goes on top, so one layer less);
 *  2. what remains of the stackable footprint rides on top of the load-bearing items
 *     (sofa, table, washing machine…) before touching the floor.
 * Non-stackable items always take their full footprint.
 */
export function empriseAjustee(lignes: InventaireLigne[], hauteurIntCm: number | null): number {
  let solFixe = 0; // non-stackable, on the floor
  let porteur = 0; // floor area of items that can carry something
  let empilable = 0; // stackable items, after self-stacking
  for (const { item, quantite } of lignes) {
    if (quantite <= 0) continue;
    const e = empriseItem(item) * quantite;
    if (item.supporte_charge) porteur += e;
    const h = item.hauteur_cm ?? null;
    if (!item.empilable || !h || !hauteurIntCm) {
      solFixe += e;
      continue;
    }
    const couchesMax = Math.max(1, Math.floor(hauteurIntCm / h) - (item.supporte_charge ? 0 : 1));
    empilable += e / Math.min(couchesMax, quantite);
  }
  const surPorteurs = Math.min(empilable, porteur - 0); // stackables first go on the carriers
  return solFixe + Math.max(0, empilable - surPorteurs);
}

export function recommander(
  lignes: InventaireLigne[],
  vehicules: VehiculeOption[],
  capacites: VehiculeCapacite[],
  params: AdvisorParams = DEFAULT_PARAMS,
): AdvisorResult {
  const actives = lignes.filter((l) => l.quantite > 0 && l.item);
  const objets = actives.reduce((n, l) => n + l.quantite, 0);
  const tri = [...vehicules].filter((v) => v.surface_m2 != null).sort((a, b) => (a.surface_m2 ?? 0) - (b.surface_m2 ?? 0));
  const base = { objets, emprise_m2: 0, emprise_ajustee_m2: 0, volume_m3: 0, poids_kg: 0, longueur_max_cm: 0 };
  if (!objets) return { statut: "vide", vehicule: null, raisons: ["Ajoutez ce que vous transportez."], mesures: base, incertitudes: [] };
  if (!tri.length) return { statut: "a_verifier", vehicule: null, raisons: ["Aucune taille de véhicule disponible."], mesures: base, incertitudes: ["vehicules_indisponibles"] };

  const incertitudes = new Set<string>();
  const emprise = actives.reduce((s, l) => s + empriseItem(l.item) * l.quantite, 0);
  const volume = actives.reduce((s, l) => s + volumeItem(l.item, params) * l.quantite, 0);
  const poidsConnu = actives.every((l) => l.item.poids_kg != null);
  const poids = actives.reduce((s, l) => s + (l.item.poids_kg ?? 0) * l.quantite, 0);
  const longueur = Math.max(...actives.map((l) => longueurMax(l.item)));
  for (const l of actives) {
    if (!l.item.longueur_cm || !l.item.largeur_cm || !l.item.hauteur_cm) incertitudes.add(`dimensions:${l.item.id}`);
    if (l.item.a_confirmer) incertitudes.add(`a_confirmer:${l.item.id}`);
  }
  if (!poidsConnu) incertitudes.add("poids_inconnu");

  const marge = 1 + Math.max(0, params.marge);
  let retenu: VehiculeOption | null = null;
  let capRetenue: VehiculeCapacite | null = null;
  let empriseAj = emprise;
  const raisons: string[] = [];

  for (const v of tri) {
    const cap = capacites.find((c) => c.surface_m2 === v.surface_m2) ?? null;
    const surface = v.surface_m2 ?? 0;
    const eAj = empriseAjustee(actives, cap?.hauteur_int_cm ?? null);
    const okSurface = eAj * marge <= surface;
    const volumeUtile = cap?.volume_m3 ?? parseVolume(v.volume);
    const okVolume = volumeUtile == null ? true : volume * marge <= volumeUtile;
    const okLongueur = cap?.longueur_int_cm == null ? true : longueur <= Math.max(cap.longueur_int_cm, diagonale(cap));
    const okHauteur = cap?.hauteur_int_cm == null ? true : actives.every((l) => (l.item.hauteur_cm ?? 0) <= cap.hauteur_int_cm!);
    const okPoids = cap?.charge_utile_kg == null || !poidsConnu ? true : poids <= cap.charge_utile_kg;
    if (okSurface && okVolume && okLongueur && okHauteur && okPoids) {
      retenu = v;
      capRetenue = cap;
      empriseAj = eAj;
      break;
    }
  }

  const mesures = { objets, emprise_m2: r2(emprise), emprise_ajustee_m2: r2(empriseAj), volume_m3: r2(volume), poids_kg: r2(poids), longueur_max_cm: Math.round(longueur) };

  if (!retenu) {
    const plusGrand = tri[tri.length - 1];
    const cap = capacites.find((c) => c.surface_m2 === plusGrand.surface_m2);
    if (cap?.longueur_int_cm && longueur > Math.max(cap.longueur_int_cm, diagonale(cap))) raisons.push(`Un objet de ${Math.round(longueur)} cm dépasse la longueur utile du plus grand véhicule.`);
    const tropHaut = cap?.hauteur_int_cm ? actives.find((l) => (l.item.hauteur_cm ?? 0) > cap.hauteur_int_cm!) : null;
    if (tropHaut) raisons.push(`${tropHaut.item.nom} (${tropHaut.item.hauteur_cm} cm) dépasse la hauteur utile du plus grand véhicule.`);
    if (cap?.charge_utile_kg && poidsConnu && poids > cap.charge_utile_kg) raisons.push(`Le poids total (${Math.round(poids)} kg) dépasse la charge utile du plus grand véhicule.`);
    if (!raisons.length) raisons.push("Le volume dépasse la capacité d'un véhicule standard : notre exploitation vous proposera une solution sur devis.");
    return { statut: "hors_capacite", vehicule: null, raisons, mesures, incertitudes: [...incertitudes] };
  }

  const surface = retenu.surface_m2 ?? 0;
  const taux = surface ? empriseAj / surface : 0;
  if (capRetenue?.a_confirmer) incertitudes.add("capacites_a_valider");
  if (taux > 0.8) incertitudes.add("chargement_serre");
  const statut: AdvisorStatus = incertitudes.size && (taux > 0.8 || [...incertitudes].some((i) => i.startsWith("dimensions:") || i.startsWith("a_confirmer:"))) ? "a_verifier" : "suggere";

  raisons.push(`${mesures.objets} objet${objets > 1 ? "s" : ""}, environ ${mesures.emprise_ajustee_m2} m² au sol${capRetenue?.hauteur_int_cm ? " une fois empilés" : ""} sur ${surface} m² disponibles.`);
  if (statut === "a_verifier") raisons.push(taux > 0.8 ? "Le chargement sera serré : vérifiez les dimensions des objets volumineux." : "Certaines dimensions sont indicatives : vérifiez les objets volumineux ou prenez la taille au-dessus.");
  return { statut, vehicule: retenu, raisons, mesures, incertitudes: [...incertitudes] };
}

function parseVolume(v: string | null): number | null {
  if (!v) return null;
  const n = parseFloat(v.replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

function diagonale(cap: VehiculeCapacite): number {
  if (!cap.longueur_int_cm || !cap.largeur_int_cm) return cap.longueur_int_cm ?? 0;
  return Math.sqrt(cap.longueur_int_cm ** 2 + cap.largeur_int_cm ** 2) * 0.95;
}

/** A readable summary of the inventory for the « Que transportons-nous ? » field. */
export function resumeInventaire(lignes: InventaireLigne[]): string {
  return lignes
    .filter((l) => l.quantite > 0)
    .map((l) => `${l.quantite} ${l.item.nom.toLowerCase()}`)
    .join(", ");
}
