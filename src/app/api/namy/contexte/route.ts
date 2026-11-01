import { NextResponse } from "next/server";
import { getNamyContexte } from "@/lib/namy";

/** GET /api/namy/contexte — form metadata from NAMY (delivery modes, options, service days). Public. */
export async function GET() {
  const r = await getNamyContexte();
  if ("ok" in r && r.ok === false) return NextResponse.json({ ok: false, error: r.error }, { status: 503, headers: { "cache-control": "no-store" } });
  return NextResponse.json(r, { headers: { "cache-control": "public, max-age=60, s-maxage=300" } });
}
