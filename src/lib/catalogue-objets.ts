/**
 * Default object catalogue and vehicle capacities for the size advisor.
 *
 * Dimensions are given in TRANSPORT orientation (a mattress on its edge, a wardrobe flat).
 * Both are STARTING VALUES, not certified data: every figure marked `a_confirmer`
 * must be validated by the operations team. At runtime the catalogue and the
 * capacities are read from `site_content` (keys `order.catalogue_objets` and
 * `order.vehicules_capacites`, JSON) so they can be edited through the content
 * API without a deploy; these constants are the fallback and the seed.
 */
import type { CatalogueItem, VehiculeCapacite } from "@/lib/vehicle-advisor";

export const CATALOGUE_OBJETS: CatalogueItem[] = [
  { id: "carton", nom: "Carton standard", categorie: "cartons", icone: "box", longueur_cm: 55, largeur_cm: 35, hauteur_cm: 30, poids_kg: 12, empilable: true, supporte_charge: true, fragile: false, orientation: "libre" },
  { id: "carton_livres", nom: "Petit carton (livres)", categorie: "cartons", icone: "box", longueur_cm: 40, largeur_cm: 30, hauteur_cm: 30, poids_kg: 18, empilable: true, supporte_charge: true, fragile: false, orientation: "libre" },
  { id: "valise", nom: "Valise / sac", categorie: "cartons", icone: "box", longueur_cm: 70, largeur_cm: 45, hauteur_cm: 30, poids_kg: 15, empilable: true, supporte_charge: false, fragile: false, orientation: "libre" },
  { id: "lave_linge", nom: "Lave-linge", categorie: "electromenager", icone: "box", longueur_cm: 60, largeur_cm: 60, hauteur_cm: 85, poids_kg: 70, empilable: false, supporte_charge: true, fragile: false, orientation: "debout" },
  { id: "refrigerateur", nom: "Réfrigérateur", categorie: "electromenager", icone: "box", longueur_cm: 60, largeur_cm: 65, hauteur_cm: 180, poids_kg: 70, empilable: false, supporte_charge: false, fragile: true, orientation: "debout" },
  { id: "petit_electro", nom: "Petit électroménager", categorie: "electromenager", icone: "box", longueur_cm: 45, largeur_cm: 40, hauteur_cm: 40, poids_kg: 8, empilable: true, supporte_charge: false, fragile: true, orientation: "libre" },
  { id: "canape_2", nom: "Canapé 2 places", categorie: "mobilier", icone: "box", longueur_cm: 160, largeur_cm: 90, hauteur_cm: 85, poids_kg: 45, empilable: false, supporte_charge: true, fragile: false, orientation: "libre" },
  { id: "canape_3", nom: "Canapé 3 places", categorie: "mobilier", icone: "box", longueur_cm: 210, largeur_cm: 90, hauteur_cm: 85, poids_kg: 60, empilable: false, supporte_charge: true, fragile: false, orientation: "libre" },
  { id: "matelas", nom: "Matelas (debout)", categorie: "literie", icone: "box", longueur_cm: 200, largeur_cm: 25, hauteur_cm: 140, poids_kg: 25, empilable: false, supporte_charge: false, fragile: false, orientation: "debout" },
  { id: "lit_demonte", nom: "Lit démonté", categorie: "literie", icone: "box", longueur_cm: 200, largeur_cm: 30, hauteur_cm: 100, poids_kg: 40, empilable: false, supporte_charge: false, fragile: false, orientation: "libre" },
  { id: "table", nom: "Table 4 personnes", categorie: "mobilier", icone: "box", longueur_cm: 140, largeur_cm: 80, hauteur_cm: 75, poids_kg: 30, empilable: false, supporte_charge: true, fragile: false, orientation: "libre" },
  { id: "chaise", nom: "Chaise", categorie: "mobilier", icone: "box", longueur_cm: 45, largeur_cm: 45, hauteur_cm: 90, poids_kg: 6, empilable: true, supporte_charge: true, fragile: false, orientation: "libre" },
  { id: "commode", nom: "Commode", categorie: "mobilier", icone: "box", longueur_cm: 100, largeur_cm: 50, hauteur_cm: 90, poids_kg: 40, empilable: false, supporte_charge: true, fragile: false, orientation: "debout" },
  { id: "meuble_tv", nom: "Meuble TV", categorie: "mobilier", icone: "box", longueur_cm: 140, largeur_cm: 45, hauteur_cm: 50, poids_kg: 30, empilable: false, supporte_charge: true, fragile: false, orientation: "libre" },
  { id: "armoire_demontee", nom: "Armoire démontée", categorie: "mobilier", icone: "box", longueur_cm: 200, largeur_cm: 60, hauteur_cm: 40, poids_kg: 70, empilable: false, supporte_charge: true, fragile: false, orientation: "a_plat" },
  { id: "tv", nom: "Téléviseur", categorie: "fragile", icone: "box", longueur_cm: 125, largeur_cm: 15, hauteur_cm: 75, poids_kg: 20, empilable: false, supporte_charge: false, fragile: true, orientation: "debout" },
  { id: "velo", nom: "Vélo", categorie: "divers", icone: "box", longueur_cm: 175, largeur_cm: 60, hauteur_cm: 105, poids_kg: 15, empilable: false, supporte_charge: false, fragile: false, orientation: "debout" },
  { id: "plante", nom: "Plante / arbuste", categorie: "divers", icone: "box", longueur_cm: 50, largeur_cm: 50, hauteur_cm: 150, poids_kg: 15, empilable: false, supporte_charge: false, fragile: true, orientation: "debout" },
  { id: "autre", nom: "Autre objet", categorie: "divers", icone: "box", longueur_cm: null, largeur_cm: null, hauteur_cm: null, poids_kg: null, emprise_m2: 0.5, empilable: false, supporte_charge: false, fragile: false, orientation: "libre", a_confirmer: true },
];

/** Interior capacities. Surface and volume come from NAMY; the other figures are typical values TO VALIDATE. */
export const VEHICULES_CAPACITES: VehiculeCapacite[] = [
  { surface_m2: 1, volume_m3: 3, longueur_int_cm: 180, largeur_int_cm: 120, hauteur_int_cm: 125, charge_utile_kg: 600, a_confirmer: true },
  { surface_m2: 2, volume_m3: 6, longueur_int_cm: 240, largeur_int_cm: 160, hauteur_int_cm: 140, charge_utile_kg: 1000, a_confirmer: true },
  { surface_m2: 4, volume_m3: 12, longueur_int_cm: 320, largeur_int_cm: 180, hauteur_int_cm: 190, charge_utile_kg: 1200, a_confirmer: true },
  { surface_m2: 8, volume_m3: 20, longueur_int_cm: 420, largeur_int_cm: 200, hauteur_int_cm: 230, charge_utile_kg: 1100, a_confirmer: true },
];
