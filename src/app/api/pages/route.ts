import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import { badRequest, isAuthorized, readJson, serverError, unauthorized } from "@/lib/api";
import { pageInputSchema } from "@/lib/schemas/content";
import { supabaseAdmin } from "@/lib/supabase/client";
import { getPages, TAGS } from "@/lib/supabase/content";
import { PAGE_SECTIONS, type PageSection } from "@/lib/types";

/** GET /api/pages[?section=] — published SEO pages (public). With a valid key: all pages, drafts included. */
export async function GET(req: Request) {
  const section = new URL(req.url).searchParams.get("section");
  const sec = PAGE_SECTIONS.includes(section as PageSection) ? (section as PageSection) : undefined;
  if (isAuthorized(req)) {
    let q = supabaseAdmin().from("pages").select("*").order("section").order("sort_order").order("title");
    if (sec) q = q.eq("section", sec);
    const { data, error } = await q;
    if (error) return serverError(error, "pages.list");
    return NextResponse.json(data);
  }
  return NextResponse.json(await getPages(sec));
}

/** POST /api/pages — create or replace (upsert on section + slug). Protected. */
export async function POST(req: Request) {
  if (!isAuthorized(req)) return unauthorized();
  const parsed = pageInputSchema.safeParse(await readJson(req));
  if (!parsed.success) return badRequest(parsed.error);
  try {
    const { data, error } = await supabaseAdmin().from("pages").upsert(parsed.data, { onConflict: "section,slug" }).select("*").single();
    if (error) throw error;
    revalidateTag(TAGS.pages, "max");
    return NextResponse.json(data, { status: 201 });
  } catch (e) {
    return serverError(e, "pages.create");
  }
}
