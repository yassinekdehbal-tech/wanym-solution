import { NextResponse } from "next/server";
import { badRequest, isAuthorized, notFound, readJson, serverError, unauthorized } from "@/lib/api";
import { sendCustomerUpdate } from "@/lib/email";
import { getOrder, getOrderEvents, logEvent } from "@/lib/orders";
import { orderEventInputSchema } from "@/lib/schemas/order";

type Ctx = { params: Promise<{ id: string }> };

/** GET /api/orders/[id]/events — full event log (SAV thread, payments, NAMY sync…). */
export async function GET(req: Request, { params }: Ctx) {
  if (!isAuthorized(req)) return unauthorized();
  const { id } = await params;
  const order = await getOrder(id);
  if (!order) return notFound();
  return NextResponse.json(await getOrderEvents(order.id));
}

/** POST /api/orders/[id]/events — add a note / SAV message / invoice event. */
export async function POST(req: Request, { params }: Ctx) {
  if (!isAuthorized(req)) return unauthorized();
  const { id } = await params;
  const order = await getOrder(id);
  if (!order) return notFound();
  const parsed = orderEventInputSchema.safeParse(await readJson(req));
  if (!parsed.success) return badRequest(parsed.error);
  const { type, message, data, author, notify_customer } = parsed.data;
  try {
    await logEvent(order.id, type, message, { data, author, public: parsed.data.public || notify_customer });
    if (notify_customer) {
      const subject = type === "sav" ? "Réponse de notre service client" : type === "invoice" ? "Votre facture" : "Mise à jour de votre commande";
      await sendCustomerUpdate(order, subject, message);
      await logEvent(order.id, "email", `E-mail envoyé au client : ${subject}`, { author });
    }
    return NextResponse.json(await getOrderEvents(order.id), { status: 201 });
  } catch (e) {
    return serverError(e, "orders.events");
  }
}
