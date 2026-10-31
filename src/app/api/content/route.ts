import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import { badRequest, isAuthorized, readJson, serverError, unauthorized } from "@/lib/api";
import { contentBulkSchema } from "@/lib/schemas/content";
import { supabaseAdmin } from "@/lib/supabase/client";
import { getContent, TAGS } from "@/lib/supabase/content";

/** GET /api/content — every editable text, as { key: value }. Public. */
export async function GET() {
  return NextResponse.json(await getContent());
}

/** PUT /api/content — bulk upsert { key: value, ... }. Protected. */
export async function PUT(req: Request) {
  if (!isAuthorized(req)) return unauthorized();
  const parsed = contentBulkSchema.safeParse(await readJson(req));
  if (!parsed.success) return badRequest(parsed.error);
  try {
    const rows = Object.entries(parsed.data).map(([key, value]) => ({ key, value }));
    const { error } = await supabaseAdmin().from("site_content").upsert(rows, { onConflict: "key" });
    if (error) throw error;
    revalidateTag(TAGS.content, "max");
    return NextResponse.json({ updated: rows.length });
  } catch (e) {
    return serverError(e, "content.bulk");
  }
}
