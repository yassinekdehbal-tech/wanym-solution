import { NextResponse } from "next/server";
import { z } from "zod";
import { badRequest, isAuthorized, notFound, readJson, serverError, unauthorized } from "@/lib/api";
import { getOrder } from "@/lib/orders";
import { applySupplement } from "@/lib/supplements";

const schema = z.object({
  amount_cents: z.number().int().min(100).max(200_000),
  label: z.string().trim().min(3).max(200),
  notify_customer: z.boolean().default(true),
});

/**
 * POST /api/orders/[id]/charge — débite un supplément constaté après la course (temps sur place au-delà du
 * temps réservé, étage non déclaré, échec de retrait) sur la carte conservée à la commande ; facture Stripe en repli.
 * Protégé (Bearer CONTENT_API_KEY). Le montant est TTC, décidé par l'exploitation.
 */
export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  if (!isAuthorized(req)) return unauthorized();
  const parsed = schema.safeParse(await readJson(req));
  if (!parsed.success) return badRequest(parsed.error);
  const { id } = await ctx.params;
  const order = await getOrder(id);
  if (!order) return notFound("Commande introuvable");
  try {
    const r = await applySupplement(order, parsed.data.amount_cents, parsed.data.label, { notify: parsed.data.notify_customer, source: "api" });
    return NextResponse.json(r, { status: r.ok ? 200 : 409 });
  } catch (e) {
    return serverError(e, "orders.charge");
  }
}
