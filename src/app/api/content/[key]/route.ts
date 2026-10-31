import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import { badRequest, isAuthorized, notFound, readJson, serverError, unauthorized } from "@/lib/api";
import { contentValueSchema } from "@/lib/schemas/content";
import { supabaseAdmin } from "@/lib/supabase/client";
import { getContent, TAGS } from "@/lib/supabase/content";

type Ctx = { params: Promise<{ key: string }> };

/** GET /api/content/[key] */
export async function GET(_req: Request, { params }: Ctx) {
  const { key } = await params;
  const content = await getContent();
  if (!(key in content)) return notFound(`Unknown key "${key}"`);
  return NextResponse.json({ key, value: content[key] });
}

/** PUT /api/content/[key] — body { value }. Creates the key if missing. */
export async function PUT(req: Request, { params }: Ctx) {
  if (!isAuthorized(req)) return unauthorized();
  const { key } = await params;
  const parsed = contentValueSchema.safeParse(await readJson(req));
  if (!parsed.success) return badRequest(parsed.error);
  try {
    const { error } = await supabaseAdmin().from("site_content").upsert({ key, value: parsed.data.value }, { onConflict: "key" });
    if (error) throw error;
    revalidateTag(TAGS.content, "max");
    return NextResponse.json({ key, value: parsed.data.value });
  } catch (e) {
    return serverError(e, "content.put");
  }
}

/** DELETE /api/content/[key] */
export async function DELETE(req: Request, { params }: Ctx) {
  if (!isAuthorized(req)) return unauthorized();
  const { key } = await params;
  try {
    const { error } = await supabaseAdmin().from("site_content").delete().eq("key", key);
    if (error) throw error;
    revalidateTag(TAGS.content, "max");
    return NextResponse.json({ deleted: key });
  } catch (e) {
    return serverError(e, "content.delete");
  }
}
