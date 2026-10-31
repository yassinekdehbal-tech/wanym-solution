import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import { badRequest, isAuthorized, notFound, readJson, serverError, unauthorized } from "@/lib/api";
import { pricingRuleSchema } from "@/lib/schemas/content";
import { supabaseAdmin } from "@/lib/supabase/client";
import { TAGS } from "@/lib/supabase/content";

type Ctx = { params: Promise<{ slug: string }> };

/** PUT /api/pricing/[slug] — upsert the pricing rule of a service. Protected. */
export async function PUT(req: Request, { params }: Ctx) {
  if (!isAuthorized(req)) return unauthorized();
  const { slug } = await params;
  const parsed = pricingRuleSchema.safeParse(await readJson(req));
  if (!parsed.success) return badRequest(parsed.error);
  try {
    const { data: existing } = await supabaseAdmin().from("pricing_rules").select("service_slug").eq("service_slug", slug).maybeSingle();
    if (!existing && !parsed.data.label) return badRequest("label is required to create a pricing rule");
    const { data, error } = await supabaseAdmin()
      .from("pricing_rules")
      .upsert({ service_slug: slug, ...parsed.data }, { onConflict: "service_slug" })
      .select("*")
      .single();
    if (error) {
      if (error.code === "23503") return notFound(`No service with slug "${slug}"`);
      throw error;
    }
    revalidateTag(TAGS.pricing, "max");
    return NextResponse.json(data);
  } catch (e) {
    return serverError(e, "pricing.put");
  }
}
