import assert from "node:assert/strict";
import { test } from "node:test";
import { CATALOGUE_OBJETS, VEHICULES_CAPACITES } from "../src/lib/catalogue-objets.ts";
import { empriseItem, recommander, resumeInventaire, type InventaireLigne, type VehiculeOption } from "../src/lib/vehicle-advisor.ts";

const VEHICULES: VehiculeOption[] = [
  { id: "v1", nom: "Kangoo", volume: "3 m³", surface_m2: 1, ordre: 1 },
  { id: "v2", nom: "Jumpy", volume: "6 m³", surface_m2: 2, ordre: 2 },
  { id: "v4", nom: "Master", volume: "12 m³", surface_m2: 4, ordre: 3 },
  { id: "v8", nom: "Grand volume", volume: "20 m³", surface_m2: 8, ordre: 4 },
];
const item = (id: string) => {
  const it = CATALOGUE_OBJETS.find((i) => i.id === id);
  if (!it) throw new Error("objet inconnu " + id);
  return it;
};
const inv = (...pairs: [string, number][]): InventaireLigne[] => pairs.map(([id, quantite]) => ({ item: item(id), quantite }));
const reco = (l: InventaireLigne[]) => recommander(l, VEHICULES, VEHICULES_CAPACITES);

test("aucun objet → vide, aucune taille", () => {
  const r = reco([]);
  assert.equal(r.statut, "vide");
  assert.equal(r.vehicule, null);
});

test("un petit objet → la plus petite taille (1 m²), capacités à valider = a_verifier jamais garanti", () => {
  const r = reco(inv(["carton", 1]));
  assert.equal(r.vehicule?.id, "v1");
  assert.ok(["suggere", "a_verifier"].includes(r.statut));
  assert.ok(r.mesures.emprise_m2 < 0.3);
});

test("plusieurs objets identiques empilables partagent le sol : 12 cartons tiennent dans 1 m²", () => {
  const r = reco(inv(["carton", 12]));
  assert.equal(r.vehicule?.id, "v1", JSON.stringify(r));
  assert.ok(r.mesures.emprise_ajustee_m2 < r.mesures.emprise_m2, "l'empilement réduit l'emprise ajustée");
});

test("un lave-linge + 6 cartons tiennent dans 1 m² (les cartons montent sur le lave-linge)", () => {
  const r = reco(inv(["lave_linge", 1], ["carton", 6]));
  assert.equal(r.vehicule?.id, "v1", JSON.stringify(r.mesures));
  assert.ok(r.mesures.emprise_ajustee_m2 <= 0.4, "les cartons ne consomment pas de sol");
});

test("un lave-linge + un meuble TV passent en 2 m² : deux objets au sol, aucun ne monte sur l'autre", () => {
  const r = reco(inv(["lave_linge", 1], ["meuble_tv", 1]));
  assert.equal(r.vehicule?.id, "v2", JSON.stringify(r.mesures));
});

test("canapé 3 places + table + 6 chaises → 2 m² ou 4 m², jamais 1 m²", () => {
  const r = reco(inv(["canape_3", 1], ["table", 1], ["chaise", 6]));
  assert.notEqual(r.vehicule?.id, "v1");
  assert.ok(["v2", "v4"].includes(r.vehicule?.id ?? ""));
});

test("objet trop haut ou trop long pour le Kangoo : un matelas sur chant (140 cm de haut, 200 cm de long) part en 2 m²", () => {
  const r = reco(inv(["matelas", 1]));
  assert.equal(r.vehicule?.id, "v2", JSON.stringify(r));
});

test("un frigo de 180 cm ne tient debout dans aucun véhicule de moins de 190 cm de hauteur utile → 4 m² ; l'exploitation pourra le coucher (catalogue)", () => {
  const r = reco(inv(["refrigerateur", 1]));
  assert.equal(r.vehicule?.id, "v4", JSON.stringify(r.mesures));
});

test("charge trop lourde : 20 lave-linge (1 400 kg) dépassent toutes les charges utiles → hors capacité, raison nommée", () => {
  const r = reco(inv(["lave_linge", 20]));
  assert.equal(r.statut, "hors_capacite");
  assert.ok(r.raisons.some((x) => /poids|charge/i.test(x)), r.raisons.join(" | "));
});

test("objet non empilable : 6 canapés 3 places → au-delà de 8 m², hors capacité sans forcer le 8 m²", () => {
  const r = reco(inv(["canape_3", 6]));
  assert.equal(r.statut, "hors_capacite");
  assert.equal(r.vehicule, null);
});

test("dimensions inconnues (Autre objet) → a_verifier, avec une taille tout de même proposée", () => {
  const r = reco(inv(["autre", 2]));
  assert.equal(r.statut, "a_verifier");
  assert.ok(r.vehicule);
  assert.ok(r.incertitudes.some((i) => i.startsWith("dimensions:autre")));
});

test("modification de quantité : plus d'objets → taille égale ou supérieure, jamais inférieure", () => {
  const ids = ["v1", "v2", "v4", "v8"];
  let prev = -1;
  for (const q of [1, 4, 8, 16, 30]) {
    const r = reco(inv(["carton", q], ["chaise", Math.ceil(q / 4)]));
    const rank = r.vehicule ? ids.indexOf(r.vehicule.id) : 99;
    assert.ok(rank >= prev, `q=${q} rang ${rank} < précédent ${prev}`);
    prev = rank;
  }
});

test("l'emprise est longueur × largeur en orientation de transport (frigo debout 0,39 m², matelas sur chant 0,5 m²)", () => {
  assert.equal(Math.round(empriseItem(item("refrigerateur")) * 100) / 100, 0.39);
  assert.equal(Math.round(empriseItem(item("matelas")) * 100) / 100, 0.5);
});

test("le résumé d'inventaire préremplit « Que transportons-nous ? » de façon lisible", () => {
  assert.equal(resumeInventaire(inv(["carton", 3], ["refrigerateur", 1], ["chaise", 0])), "3 carton standard, 1 réfrigérateur");
});

test("le catalogue est sain : ids uniques, emprises positives, un seul objet sans dimensions (Autre)", () => {
  const ids = new Set(CATALOGUE_OBJETS.map((i) => i.id));
  assert.equal(ids.size, CATALOGUE_OBJETS.length);
  for (const it of CATALOGUE_OBJETS) assert.ok(empriseItem(it) > 0, it.id);
  assert.deepEqual(CATALOGUE_OBJETS.filter((i) => !i.longueur_cm).map((i) => i.id), ["autre"]);
  assert.equal(VEHICULES_CAPACITES.length, 4);
});
