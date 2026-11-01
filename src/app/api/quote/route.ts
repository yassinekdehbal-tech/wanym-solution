import { NextResponse } from "next/server";
import { badRequest, clientIp, readJson, serverError } from "@/lib/api";
import { quoteWithNamy } from "@/lib/orders";
import { rateLimit } from "@/lib/ratelimit";
import { quoteInputSchema } from "@/lib/schemas/order";

/** POST /api/quote — price estimate computed by NAMY's engine. Public, nothing stored. */
export async function POST(req: Request) {
  if (!rateLimit(`quote:${clientIp(req)}`, 60, 10 * 60_000)) {
    return NextResponse.json({ error: "Trop de requêtes" }, { status: 429 });
  }
  const parsed = quoteInputSchema.safeParse(await readJson(req));
  if (!parsed.success) return badRequest(parsed.error);
  try {
    const q = await quoteWithNamy(parsed.data);
    if (q.mode === "instant") {
      return NextResponse.json({ mode: "instant", price_cents: q.price_cents, total_cents: q.total_cents, distance_km: q.distance_km, creneaux: q.devis.creneaux, date_bloquee: q.devis.date_bloquee, prix: q.devis.prix, geo: q.devis.geo });
    }
    return NextResponse.json({
      mode: "quote",
      reason: q.reason,
      creneaux: q.devis?.creneaux ?? [],
      date_bloquee: q.devis?.date_bloquee ?? null,
      prix: q.devis?.prix ?? null,
      champs: q.error?.champs ?? null,
      detail: q.error?.detail ?? null,
    });
  } catch (e) {
    return serverError(e, "quote");
  }
}
