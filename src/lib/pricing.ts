import { env } from "@/lib/env";
import type { QuoteInput } from "@/lib/schemas/order";
import type { PricingRule } from "@/lib/types";

export type Quote =
  | {
      mode: "instant";
      service_slug: string;
      distance_km: number;
      price_cents: number; // HT
      vat_rate: number;
      total_cents: number; // TTC
      breakdown: { label: string; cents: number }[];
    }
  | { mode: "quote"; service_slug: string; distance_km: number | null; reason: string };

const IDF = new Set(["75", "77", "78", "91", "92", "93", "94", "95"]);
const PETITE_COURONNE = new Set(["75", "92", "93", "94"]);

export function extractPostalCode(address: string): string | null {
  const m = address.match(/\b(\d{5})\b/);
  return m ? m[1] : null;
}

/** Google Distance Matrix when a key is configured, otherwise a conservative zone estimate. */
export async function estimateDistanceKm(from: string, to: string): Promise<number | null> {
  if (env.googleMapsApiKey) {
    try {
      const url = new URL("https://maps.googleapis.com/maps/api/distancematrix/json");
      url.searchParams.set("origins", from);
      url.searchParams.set("destinations", to);
      url.searchParams.set("region", "fr");
      url.searchParams.set("key", env.googleMapsApiKey);
      const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
      const json = (await res.json()) as {
        rows?: { elements?: { status: string; distance?: { value: number } }[] }[];
      };
      const el = json.rows?.[0]?.elements?.[0];
      if (el?.status === "OK" && el.distance) return Math.round(el.distance.value / 100) / 10;
    } catch (e) {
      console.warn("[pricing] distance matrix failed, falling back to zones:", e);
    }
  }
  const a = extractPostalCode(from)?.slice(0, 2);
  const b = extractPostalCode(to)?.slice(0, 2);
  if (!a || !b) return null;
  if (a === b) return a === "75" ? 8 : 15;
  if (PETITE_COURONNE.has(a) && PETITE_COURONNE.has(b)) return 18;
  if (IDF.has(a) && IDF.has(b)) return 35;
  return null; // outside Île-de-France: needs a real distance → quote
}

export async function computeQuote(input: QuoteInput, rules: PricingRule[]): Promise<Quote> {
  const rule = rules.find((r) => r.service_slug === input.service_slug && r.active);
  const base = { service_slug: input.service_slug };
  if (!rule || !rule.instant_booking) {
    return { mode: "quote", ...base, distance_km: null, reason: "service_on_quote" };
  }
  const distance = await estimateDistanceKm(input.pickup_address, input.delivery_address);
  if (distance == null) return { mode: "quote", ...base, distance_km: null, reason: "distance_unknown" };
  if (rule.max_km != null && distance > rule.max_km) {
    return { mode: "quote", ...base, distance_km: distance, reason: "too_far" };
  }
  if (rule.max_units != null && input.quantity > rule.max_units) {
    return { mode: "quote", ...base, distance_km: distance, reason: "too_many_units" };
  }

  const breakdown: { label: string; cents: number }[] = [];
  let cents = rule.base_cents;
  breakdown.push({ label: "Prise en charge", cents: rule.base_cents });
  const km = Math.round(distance * rule.per_km_cents);
  if (km) breakdown.push({ label: `Distance (${distance} km)`, cents: km });
  cents += km;
  const extraUnits = Math.max(0, input.quantity - 1) * rule.per_unit_cents;
  if (extraUnits) breakdown.push({ label: `${input.quantity - 1} unité(s) supplémentaire(s)`, cents: extraUnits });
  cents += extraUnits;
  const s = rule.surcharges ?? {};
  if (input.options.handling && s.handling) {
    breakdown.push({ label: "Manutention / hayon", cents: s.handling });
    cents += s.handling;
  }
  if (input.options.floor && s.floor) {
    breakdown.push({ label: "Livraison à l'étage", cents: s.floor });
    cents += s.floor;
  }
  if (input.wanted_slot === "urgent" && s.urgent_pct) {
    const urgent = Math.round((cents * s.urgent_pct) / 100);
    breakdown.push({ label: `Urgence (+${s.urgent_pct} %)`, cents: urgent });
    cents += urgent;
  }
  if (cents < rule.min_cents) {
    breakdown.push({ label: "Minimum de facturation", cents: rule.min_cents - cents });
    cents = rule.min_cents;
  }
  const price_cents = Math.round(cents / 100) * 100; // round to the euro
  const total_cents = Math.round(price_cents * (1 + rule.vat_rate / 100));
  return { mode: "instant", ...base, distance_km: distance, price_cents, vat_rate: rule.vat_rate, total_cents, breakdown };
}

export function formatEuros(cents: number | null | undefined): string {
  if (cents == null) return "—";
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(cents / 100);
}
