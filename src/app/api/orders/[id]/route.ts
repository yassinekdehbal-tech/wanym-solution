import { NextResponse } from "next/server";
import { badRequest, isAuthorized, notFound, readJson, serverError, unauthorized } from "@/lib/api";
import { sendCustomerUpdate } from "@/lib/email";
import { getOrder, getOrderEvents, logEvent, syncOrderToNamy, updateOrder } from "@/lib/orders";
import { orderPatchSchema } from "@/lib/schemas/order";
import { STATUS_LABELS, type Order } from "@/lib/types";

type Ctx = { params: Promise<{ id: string }> };

/** GET /api/orders/[id] — id or reference (WS-2026-00001). Returns the order and its event log. */
export async function GET(req: Request, { params }: Ctx) {
  if (!isAuthorized(req)) return unauthorized();
  const { id } = await params;
  const order = await getOrder(id);
  if (!order) return notFound();
  return NextResponse.json({ ...order, events: await getOrderEvents(order.id) });
}

/**
 * PATCH /api/orders/[id] — ops updates: status, price, NAMY ref, invoice, notes.
 * Optional `message` is logged (and e-mailed when notify_customer is true).
 */
export async function PATCH(req: Request, { params }: Ctx) {
  if (!isAuthorized(req)) return unauthorized();
  const { id } = await params;
  const order = await getOrder(id);
  if (!order) return notFound();
  const parsed = orderPatchSchema.safeParse(await readJson(req));
  if (!parsed.success) return badRequest(parsed.error);
  const { message, notify_customer, author, ...fields } = parsed.data;

  try {
    const patch: Partial<Order> = { ...fields } as Partial<Order>;
    if (fields.invoice_number && !order.invoiced_at) patch.invoiced_at = new Date().toISOString();
    if (fields.payment_status === "paid" && !order.paid_at) patch.paid_at = new Date().toISOString();
    if (fields.namy_ref && !order.namy_synced_at) patch.namy_synced_at = new Date().toISOString();
    if (fields.status === "quoted" && order.status === "new" && fields.price_cents != null && fields.total_cents == null) {
      patch.total_cents = Math.round(fields.price_cents * (1 + order.vat_rate / 100));
    }
    let updated = Object.keys(patch).length ? await updateOrder(order.id, patch) : order;
    // A quote confirmed by ops becomes a real order: hand it to NAMY like a paid one.
    if (fields.status === "confirmed" && order.status !== "confirmed") updated = await syncOrderToNamy(updated);

    if (fields.status && fields.status !== order.status) {
      await logEvent(order.id, "status", `Statut : ${STATUS_LABELS[fields.status]}`, { author, public: true, data: { from: order.status, to: fields.status } });
    }
    if (fields.invoice_number && fields.invoice_number !== order.invoice_number) {
      await logEvent(order.id, "invoice", `Facture ${fields.invoice_number}`, { author, public: true, data: { url: fields.invoice_url ?? null } });
    }
    if (fields.namy_ref && fields.namy_ref !== order.namy_ref) {
      await logEvent(order.id, "namy", `Référence NAMY : ${fields.namy_ref}`, { author });
    }
    if (message) {
      await logEvent(order.id, fields.status === "sav" || order.status === "sav" ? "sav" : "note", message, { author, public: notify_customer });
      if (notify_customer) {
        const subject = fields.status ? STATUS_LABELS[fields.status] : fields.invoice_number ? "Votre facture est disponible" : "Mise à jour de votre commande";
        await sendCustomerUpdate(updated, subject, message);
        await logEvent(order.id, "email", `E-mail envoyé au client : ${subject}`, { author });
      }
    }
    return NextResponse.json({ ...updated, events: await getOrderEvents(order.id) });
  } catch (e) {
    return serverError(e, "orders.patch");
  }
}
