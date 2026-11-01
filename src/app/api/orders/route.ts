import { NextResponse } from "next/server";
import { after } from "next/server";
import { badRequest, clientIp, isAuthorized, readJson, serverError, unauthorized } from "@/lib/api";
import { createOrder, dispatchOrder, logEvent, updateOrder } from "@/lib/orders";
import { rateLimit } from "@/lib/ratelimit";
import { orderInputSchema } from "@/lib/schemas/order";
import { createCheckoutSession } from "@/lib/stripe";
import { supabaseAdmin } from "@/lib/supabase/client";
import { ORDER_STATUSES, PAYMENT_STATUSES } from "@/lib/types";

/**
 * POST /api/orders — public. Validates, prices and stores the order.
 * Instant bookings get a Stripe Checkout URL; quotes are dispatched right away.
 */
export async function POST(req: Request) {
  const ip = clientIp(req);
  if (!rateLimit(`orders:${ip}`, 5, 10 * 60_000)) {
    return NextResponse.json({ error: "Trop de demandes, réessayez dans quelques minutes." }, { status: 429 });
  }
  const body = await readJson<Record<string, unknown>>(req);
  if (!body) return badRequest("Corps JSON attendu");
  if (typeof body.website === "string" && body.website.length > 0) {
    // honeypot filled by a bot: pretend success
    return NextResponse.json({ id: "ok", reference: "WS-0000-00000" }, { status: 201 });
  }
  const parsed = orderInputSchema.safeParse(body);
  if (!parsed.success) return badRequest(parsed.error);

  try {
    const { order } = await createOrder(parsed.data, ip);

    if (order.pricing_mode === "instant") {
      const session = await createCheckoutSession(order);
      if (session?.url) {
        await updateOrder(order.id, { stripe_session_id: session.id });
        await logEvent(order.id, "payment", "Session de paiement Stripe créée", { data: { session: session.id } });
        return NextResponse.json(
          { id: order.id, reference: order.reference, mode: "instant", total_cents: order.total_cents, checkout_url: session.url },
          { status: 201 },
        );
      }
      // Stripe not configured: keep NAMY's price, treat as a quote to confirm by phone
      const fallback = await updateOrder(order.id, { payment_status: "not_required" });
      await logEvent(order.id, "note", "Prix calculé, confirmation par notre exploitation (paiement en ligne indisponible)", { public: true });
      after(() => dispatchOrder(fallback));
      return NextResponse.json({ id: order.id, reference: order.reference, mode: "quote", total_cents: order.total_cents }, { status: 201 });
    }

    after(() => dispatchOrder(order));
    return NextResponse.json({ id: order.id, reference: order.reference, mode: "quote" }, { status: 201 });
  } catch (e) {
    return serverError(e, "orders.create");
  }
}

/**
 * GET /api/orders — protected. Filters: status, payment_status, since (ISO), until (ISO),
 * q (reference/email/company search), limit (≤200), offset.
 */
export async function GET(req: Request) {
  if (!isAuthorized(req)) return unauthorized();
  const p = new URL(req.url).searchParams;
  const limit = Math.min(Number(p.get("limit") ?? 50) || 50, 200);
  const offset = Math.max(Number(p.get("offset") ?? 0) || 0, 0);
  let q = supabaseAdmin().from("orders").select("*", { count: "exact" }).order("created_at", { ascending: false }).range(offset, offset + limit - 1);
  const status = p.get("status");
  if (status) q = q.in("status", status.split(",").filter((s) => (ORDER_STATUSES as readonly string[]).includes(s)));
  const pay = p.get("payment_status");
  if (pay) q = q.in("payment_status", pay.split(",").filter((s) => (PAYMENT_STATUSES as readonly string[]).includes(s)));
  if (p.get("since")) q = q.gte("created_at", p.get("since")!);
  if (p.get("until")) q = q.lte("created_at", p.get("until")!);
  if (p.get("unsynced") === "1") q = q.is("namy_synced_at", null);
  if (p.get("uninvoiced") === "1") q = q.is("invoice_number", null).eq("status", "delivered");
  const search = p.get("q")?.trim();
  if (search) {
    const like = `%${search.replace(/[%_]/g, "")}%`;
    q = q.or(`reference.ilike.${like},email.ilike.${like},company.ilike.${like},contact_name.ilike.${like}`);
  }
  const { data, error, count } = await q;
  if (error) return serverError(error, "orders.list");
  return NextResponse.json({ orders: data, total: count ?? data?.length ?? 0, limit, offset });
}
