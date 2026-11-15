import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import { badRequest, isAuthorized, notFound, readJson, serverError, unauthorized } from "@/lib/api";
import { pagePatchSchema } from "@/lib/schemas/content";
import { supabaseAdmin } from "@/lib/supabase/client";
import { getPage, TAGS } from "@/lib/supabase/content";
import { PAGE_SECTIONS, type PageSection } from "@/lib/types";

type Ctx = { params: Promise<{ section: string; slug: string }> };
const validSection = (s: string): s is PageSection => PAGE_SECTIONS.includes(s as PageSection);

export async function GET(req: Request, { params }: Ctx) {
  const { section, slug } = await params;
  if (!validSection(section)) return notFound();
  if (isAuthorized(req)) {
    const { data } = await supabaseAdmin().from("pages").select("*").eq("section", section).eq("slug", slug).maybeSingle();
    return data ? NextResponse.json(data) : notFound();
  }
  const page = await getPage(section, slug);
  return page ? NextResponse.json(page) : notFound();
}

/** PUT /api/pages/[section]/[slug] — partial update. Protected. */
export async function PUT(req: Request, { params }: Ctx) {
  if (!isAuthorized(req)) return unauthorized();
  const { section, slug } = await params;
  if (!validSection(section)) return notFound();
  const parsed = pagePatchSchema.safeParse(await readJson(req));
  if (!parsed.success) return badRequest(parsed.error);
  try {
    const { data, error } = await supabaseAdmin().from("pages").update(parsed.data).eq("section", section).eq("slug", slug).select("*").maybeSingle();
    if (error) throw error;
    if (!data) return notFound();
    revalidateTag(TAGS.pages, "max");
    return NextResponse.json(data);
  } catch (e) {
    return serverError(e, "pages.update");
  }
}

export const PATCH = PUT;

export async function DELETE(req: Request, { params }: Ctx) {
  if (!isAuthorized(req)) return unauthorized();
  const { section, slug } = await params;
  if (!validSection(section)) return notFound();
  try {
    const { data, error } = await supabaseAdmin().from("pages").delete().eq("section", section).eq("slug", slug).select("slug").maybeSingle();
    if (error) throw error;
    if (!data) return notFound();
    revalidateTag(TAGS.pages, "max");
    return NextResponse.json({ deleted: `${section}/${slug}` });
  } catch (e) {
    return serverError(e, "pages.delete");
  }
}
