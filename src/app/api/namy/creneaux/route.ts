import { NextResponse } from "next/server";
import { getNamyCreneaux } from "@/lib/namy";

/** GET /api/namy/creneaux?date=YYYY-MM-DD — time slots NAMY offers for a date. Public. */
export async function GET(req: Request) {
  const date = new URL(req.url).searchParams.get("date") ?? "";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return NextResponse.json({ ok: false, error: "date_invalide" }, { status: 400 });
  const r = await getNamyCreneaux(date);
  if (!r.ok) return NextResponse.json({ ok: false, error: r.error }, { status: r.status === 503 || r.status === 0 ? 503 : 400 });
  return NextResponse.json(r, { headers: { "cache-control": "no-store" } });
}
