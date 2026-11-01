import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import { badRequest, isAuthorized, notFound, readJson, serverError, unauthorized } from "@/lib/api";
import { servicePatchSchema } from "@/lib/schemas/content";
import { supabaseAdmin } from "@/lib/supabase/client";
import { getService, TAGS } from "@/lib/supabase/content";

type Ctx = { params: Promise<{ slug: string }> };

export async function GET(req: Request, { params }: Ctx) {
  const { slug } = await params;
  if (isAuthorized(req)) {
    const { data } = await supabaseAdmin().from("services").select("*").eq("slug", slug).maybeSingle();
    return data ? NextResponse.json(data) : notFound();
  }
  const service = await getService(slug);
  return service ? NextResponse.json(service) : notFound();
}

/** PUT /api/services/[slug] — partial update (title, summary, body, icon, sort_order, published, slug). */
export async function PUT(req: Request, { params }: Ctx) {
  if (!isAuthorized(req)) return unauthorized();
  const { slug } = await params;
  const parsed = servicePatchSchema.safeParse(await readJson(req));
  if (!parsed.success) return badRequest(parsed.error);
  try {
    const { data, error } = await supabaseAdmin().from("services").update(parsed.data).eq("slug", slug).select("*").maybeSingle();
    if (error) throw error;
    if (!data) return notFound();
    revalidateTag(TAGS.services, "max");
    return NextResponse.json(data);
  } catch (e) {
    return serverError(e, "services.update");
  }
}

export const PATCH = PUT;

export async function DELETE(req: Request, { params }: Ctx) {
  if (!isAuthorized(req)) return unauthorized();
  const { slug } = await params;
  try {
    const { data, error } = await supabaseAdmin().from("services").delete().eq("slug", slug).select("slug").maybeSingle();
    if (error) throw error;
    if (!data) return notFound();
    revalidateTag(TAGS.services, "max");
    return NextResponse.json({ deleted: slug });
  } catch (e) {
    return serverError(e, "services.delete");
  }
}
