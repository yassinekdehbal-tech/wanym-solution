import { NextResponse } from "next/server";
import { badRequest, clientIp, readJson, serverError } from "@/lib/api";
import { computeQuote } from "@/lib/pricing";
import { rateLimit } from "@/lib/ratelimit";
import { quoteInputSchema } from "@/lib/schemas/order";
import { getPricingRules } from "@/lib/supabase/content";

/** POST /api/quote — price estimate for the order form. Public, nothing stored. */
export async function POST(req: Request) {
  if (!rateLimit(`quote:${clientIp(req)}`, 60, 10 * 60_000)) {
    return NextResponse.json({ error: "Trop de requêtes" }, { status: 429 });
  }
  const parsed = quoteInputSchema.safeParse(await readJson(req));
  if (!parsed.success) return badRequest(parsed.error);
  try {
    return NextResponse.json(await computeQuote(parsed.data, await getPricingRules()));
  } catch (e) {
    return serverError(e, "quote");
  }
}
