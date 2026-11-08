import assert from "node:assert/strict";
import { test } from "node:test";
import { orderToNamyInput } from "../src/lib/namy-input.ts";

// A paid order must reach NAMY with every field the zone grid validates (WS-2026-00006 was refused: vehicule_id missing).
const base = {
  id: "o1", reference: "WS-2026-00006", created_at: "", status: "confirmed", payment_status: "paid",
  pickup_address: "121 B avenue de la Division Leclerc, 95880 Enghien-les-Bains", delivery_address: "10 rue de Rivoli, 75004 Paris",
  goods_type: "2 cartons", quantity: "2", dimensions: null, weight_kg: 20, wanted_date: "2026-11-09", wanted_slot: "13:00-17:00",
  company: null, contact_name: "Test", email: "t@example.com", phone: "0767166015", notes: "Code 12A", pickup_contact: null, delivery_contact: null,
  stripe_payment_intent: "pi_1", total_cents: 4800,
  options: { vehicule_id: "5173e000-0000-4000-8000-000000000021", porte_depart: true, porte_arrivee: false, option_ids: ["opt1"], inventaire: { carton: 2 }, inventaire_autre: "piano droit", aide_client: true, etage: 3, acces_escalier: true, longueur_max_cm: 60 },
} as unknown as Parameters<typeof orderToNamyInput>[0];

test("zone-grid fields come out of orders.options", () => {
  const n = orderToNamyInput(base);
  assert.equal(n.vehicule_id, "5173e000-0000-4000-8000-000000000021");
  assert.equal(n.porte_depart, true);
  assert.equal(n.porte_arrivee, false);
  assert.deepEqual(n.options, ["opt1"]);
  assert.equal(n.etage, 3);
  assert.equal(n.acces_escalier, true);
  assert.equal(n.reference, "WS-2026-00006");
  assert.equal(n.creneau, "13:00-17:00");
  assert.equal(n.payment?.status, "paid");
});

test("dispatch notes carry the customer notes, the inventory and the self-help flag", () => {
  const n = orderToNamyInput(base);
  assert.match(n.notes ?? "", /^Code 12A\n/);
  assert.match(n.notes ?? "", /Inventaire déclaré : 2 carton standard, autre : piano droit/);
  assert.match(n.notes ?? "", /aidera le chauffeur/);
});

test("missing options never produce undefined strings", () => {
  const n = orderToNamyInput({ ...base, options: null, notes: null } as unknown as Parameters<typeof orderToNamyInput>[0]);
  assert.equal(n.vehicule_id, null);
  assert.equal(n.porte_depart, false);
  assert.equal(n.notes, null);
  assert.deepEqual(n.options, []);
});
