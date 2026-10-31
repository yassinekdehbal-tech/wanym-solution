import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import { badRequest, isAuthorized, readJson, serverError, unauthorized } from "@/lib/api";
import { serviceInputSchema } from "@/lib/schemas/content";
import { supabaseAdmin } from "@/lib/supabase/client";
import { getServices, TAGS } from "@/lib/supabase/content";

/** GET /api/services — published services (public). With a valid key: all services, drafts included. */
export async function GET(req: Request) {
  if (isAuthorized(req)) {
    const { data, error } = await supabaseAdmin().from("services").select("*").order("sort_order");
    if (error) return serverError(error, "services.list");
    return NextResponse.json(data);
  }
  return NextResponse.json(await getServices());
}

/** POST /api/services — create. Protected. */
export async function POST(req: Request) {
  if (!isAuthorized(req)) return unauthorized();
  const parsed = serviceInputSchema.safeParse(await readJson(req));
  if (!parsed.success) return badRequest(parsed.error);
  try {
    const { data, error } = await supabaseAdmin().from("services").insert(parsed.data).select("*").single();
    if (error) {
      if (error.code === "23505") return badRequest("Ce slug existe déjà");
      throw error;
    }
    revalidateTag(TAGS.services, "max");
    return NextResponse.json(data, { status: 201 });
  } catch (e) {
    return serverError(e, "services.create");
  }
}
