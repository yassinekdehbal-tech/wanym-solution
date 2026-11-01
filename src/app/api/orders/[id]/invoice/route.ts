import { NextResponse } from "next/server";
import { badRequest, isAuthorized, notFound, readJson, serverError, unauthorized } from "@/lib/api";
import { getOrder, logEvent, updateOrder } from "@/lib/orders";
import { createStripeInvoice } from "@/lib/stripe";
import { z } from "zod";

const schema = z.object({
  days_until_due: z.number().int().min(0).max(120).optional(),
  memo: z.string().trim().max(500).optional(),
  send: z.boolean().default(true),
  author: z.string().trim().max(80).optional(),
});

/**
 * POST /api/orders/[id]/invoice — Stripe Invoicing (Bearer CONTENT_API_KEY).
 * Creates, finalizes and (by default) sends a Stripe invoice for an order paid on invoice:
 * ops-confirmed quote, B2B account. The webhook's `invoice.paid` marks the order paid and
 * hands the course to NAMY. Not for orders already paid by Checkout (Stripe issued that invoice).
 */
export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  if (!isAuthorized(req)) return unauthorized();
  const { id } = await ctx.params;
  const order = await getOrder(id);
  if (!order) return notFound();
  const parsed = schema.safeParse((await readJson(req)) ?? {});
  if (!parsed.success) return badRequest(parsed.error);
  if (order.price_cents == null) return badRequest("Cette commande n'a pas de prix : renseignez price_cents (PATCH) avant de facturer.");
  if (order.payment_status === "paid") return badRequest("Commande déjà payée : la facture Stripe a été émise au paiement.");
  if (order.invoice_number) return badRequest(`Facture déjà émise (${order.invoice_number}).`);
  try {
    const inv = await createStripeInvoice(order, { daysUntilDue: parsed.data.days_until_due, memo: parsed.data.memo, send: parsed.data.send });
    if (!inv) return NextResponse.json({ error: "Stripe non configuré (STRIPE_SECRET_KEY)" }, { status: 503 });
    const updated = await updateOrder(order.id, {
      invoice_number: inv.number,
      invoice_url: inv.hosted_invoice_url,
      invoiced_at: new Date().toISOString(),
      payment_status: order.payment_status === "not_required" ? "pending" : order.payment_status,
      status: order.status === "new" ? "quoted" : order.status,
    });
    await logEvent(order.id, "invoice", `Facture Stripe ${inv.number ?? inv.id}${parsed.data.send ? " envoyée au client" : " créée"}`, {
      author: parsed.data.author,
      public: true,
      data: { stripe_invoice_id: inv.id, url: inv.hosted_invoice_url, pdf: inv.invoice_pdf, status: inv.status },
    });
    return NextResponse.json({ order: updated, invoice: inv });
  } catch (e) {
    return serverError(e, "orders.invoice");
  }
}
