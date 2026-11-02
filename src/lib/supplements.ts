import { sendCustomerUpdate, sendOpsAlert } from "@/lib/email";
import { logEvent, type getOrder } from "@/lib/orders";
import { chargeSupplement } from "@/lib/stripe";
import { formatEuros } from "@/lib/pricing";
import type { Order } from "@/lib/types";

type OrderOf = NonNullable<Awaited<ReturnType<typeof getOrder>>>;

/**
 * Supplément après la course (temps sur place au-delà du temps réservé, étage non déclaré, échec de retrait) :
 * débit sur la carte conservée, sinon facture Stripe, journal public et e-mail de détail au client.
 * Le montant vient toujours de l'exploitation (correction de prix NAMY ou appel API), jamais d'un calcul du site.
 */
export async function applySupplement(order: OrderOf | Order, amountCents: number, label: string, opts: { notify?: boolean; source: string }) {
  if (order.payment_status !== "paid" && order.payment_status !== "authorized") return { ok: false as const, reason: "commande_non_payee" };
  const result = await chargeSupplement(order, amountCents, label);
  const montant = formatEuros(amountCents);
  if (!result.ok) {
    await logEvent(order.id, "payment", `Supplément non facturé (${result.reason}) : ${label} — ${montant} TTC`, { author: opts.source, data: { amount_cents: amountCents, label, reason: result.reason } });
    await sendOpsAlert(order, "Supplément non facturé", `${label} — ${montant} TTC. Raison : ${result.reason}.`);
    return result;
  }
  if (result.mode === "charge") {
    await logEvent(order.id, "payment", `Supplément débité : ${label} (${montant} TTC)`, { author: opts.source, public: true, data: { amount_cents: amountCents, label, payment_intent: result.payment_intent } });
    if (opts.notify !== false) await sendCustomerUpdate(order, "Supplément débité", `Conformément à nos conditions, un supplément a été débité sur votre moyen de paiement :\n\n${label} — ${montant} TTC\n\nLe reçu Stripe vous est envoyé séparément. Une question ? Répondez à cet e-mail.`);
  } else {
    await logEvent(order.id, "payment", `Supplément à régler : ${label} (${montant} TTC) — facture ${result.invoice.number ?? result.invoice.id} envoyée`, { author: opts.source, public: true, data: { amount_cents: amountCents, label, invoice: result.invoice } });
    if (opts.notify !== false) await sendCustomerUpdate(order, "Supplément à régler", `Un supplément est dû sur votre commande :\n\n${label} — ${montant} TTC\n\nLe débit automatique n'a pas pu aboutir : une facture à régler en ligne vous a été envoyée par Stripe${result.invoice.hosted_invoice_url ? ` (${result.invoice.hosted_invoice_url})` : ""}.`);
  }
  return result;
}
