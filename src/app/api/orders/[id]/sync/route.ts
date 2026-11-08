import { NextResponse } from "next/server";
import { isAuthorized, notFound, serverError, unauthorized } from "@/lib/api";
import { getOrder, getOrderEvents, syncOrderToNamy } from "@/lib/orders";

type Ctx = { params: Promise<{ id: string }> };

/**
 * POST /api/orders/[id]/sync — send a confirmed or paid order to NAMY again.
 * Idempotent on the site reference (NAMY answers `deja_recue` when the course exists).
 * For orders listed by GET /api/orders?unsynced=1 after a NAMY outage or a refused payload.
 */
export async function POST(req: Request, { params }: Ctx) {
  if (!isAuthorized(req)) return unauthorized();
  const { id } = await params;
  const order = await getOrder(id);
  if (!order) return notFound();
  if (order.status !== "confirmed" && order.payment_status !== "paid") {
    return NextResponse.json({ error: "order_not_confirmed", status: order.status, payment_status: order.payment_status }, { status: 409 });
  }
  try {
    const synced = await syncOrderToNamy(order);
    const events = await getOrderEvents(synced.id);
    return NextResponse.json({ ...synced, synced: !!synced.namy_synced_at, events }, { status: synced.namy_synced_at ? 200 : 502 });
  } catch (e) {
    return serverError(e, "orders.sync");
  }
}
