import { NextResponse } from "next/server";
import { getPricingRules } from "@/lib/supabase/content";

/** GET /api/pricing — active pricing rules (public: prices are displayed on the site). */
export async function GET() {
  return NextResponse.json(await getPricingRules());
}
