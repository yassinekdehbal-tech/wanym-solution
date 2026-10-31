import { NextResponse } from "next/server";
import { badRequest, clientIp, readJson } from "@/lib/api";
import { getOrder, getOrderEvents } from "@/lib/orders";
import { rateLimit } from "@/lib/ratelimit";
import { trackInputSchema } from "@/lib/schemas/order";
import { STATUS_LABELS } from "@/lib/types";

/** POST /api/track — customer-facing tracking: reference + e-mail → limited view. */
export async function POST(req: Request) {
  if (!rateLimit(`track:${clientIp(req)}`, 20, 10 * 60_000)) {
    return NextResponse.json({ error: "Trop de requêtes" }, { status: 429 });
  }
  const parsed = trackInputSchema.safeParse(await readJson(req));
  if (!parsed.success) return badRequest(parsed.error);
  const order = await getOrder(parsed.data.reference);
  if (!order || order.email.toLowerCase() !== parsed.data.email) {
    return NextResponse.json({ error: "Aucune commande ne correspond à cette référence et cet e-mail." }, { status: 404 });
  }
  const events = await getOrderEvents(order.id, true);
  return NextResponse.json({
    reference: order.reference,
    created_at: order.created_at,
    status: order.status,
    status_label: STATUS_LABELS[order.status],
    pickup_address: order.pickup_address,
    delivery_address: order.delivery_address,
    wanted_date: order.wanted_date,
    wanted_slot: order.wanted_slot,
    pricing_mode: order.pricing_mode,
    total_cents: order.total_cents,
    payment_status: order.payment_status,
    invoice_number: order.invoice_number,
    invoice_url: order.invoice_url,
    events: events.map((e) => ({ at: e.created_at, type: e.type, message: e.message })),
  });
}
