import assert from "node:assert/strict";
import { test } from "node:test";
import { CATALOGUE_OBJETS, VEHICULES_CAPACITES } from "../src/lib/catalogue-objets.ts";
import { recommander } from "../src/lib/vehicle-advisor.ts";

// The example written under each size card must be what the engine itself would suggest:
// a card that promises "2 m² : un canapé 2 places et 10 cartons" while the advisor answers 4 m² contradicts itself.
const VEHICULES = [1, 2, 4, 8].map((m, i) => ({ id: `v${m}`, nom: `${m} m²`, volume: "", surface_m2: m, ordre: i + 1 }));
const ligne = (id: string, quantite: number) => {
  const item = CATALOGUE_OBJETS.find((c) => c.id === id);
  assert.ok(item, `catalogue item ${id}`);
  return { item: item!, quantite };
};
const EXEMPLES: Record<number, [string, number][]> = {
  1: [["lave_linge", 1], ["carton", 6]],
  2: [["canape_2", 1], ["carton", 10]],
  4: [["canape_3", 1], ["table", 1], ["chaise", 6], ["carton", 15]],
};

for (const [m2, lignes] of Object.entries(EXEMPLES)) {
  test(`card example for ${m2} m² is the engine's own suggestion`, () => {
    const r = recommander(lignes.map(([id, q]) => ligne(id, q)), VEHICULES, VEHICULES_CAPACITES);
    assert.equal(r.statut, "suggere", r.raisons.join(" / "));
    assert.equal(r.vehicule?.surface_m2, Number(m2), `${r.vehicule?.nom}: ${r.raisons.join(" / ")}`);
  });
}
