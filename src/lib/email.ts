import { Resend } from "resend";
import { env } from "@/lib/env";
import { formatEuros } from "@/lib/pricing";
import { SLOT_LABELS } from "@/lib/schemas/order";
import { STATUS_LABELS, type Order } from "@/lib/types";

let resend: Resend | null = null;
function client() {
  if (!env.resendApiKey) return null;
  if (!resend) resend = new Resend(env.resendApiKey);
  return resend;
}

function esc(s: string | null | undefined) {
  return (s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);
}

function row(label: string, value: string | null | undefined) {
  if (!value) return "";
  return `<tr><td style="padding:6px 12px 6px 0;color:#64748b;vertical-align:top;white-space:nowrap">${label}</td><td style="padding:6px 0">${esc(value)}</td></tr>`;
}

function layout(title: string, body: string) {
  return `<!doctype html><html lang="fr"><body style="margin:0;background:#f8fafc;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#0f172a">
  <div style="max-width:600px;margin:0 auto;padding:24px">
    <div style="background:#0b1f3a;color:#fff;padding:16px 24px;border-radius:12px 12px 0 0;font-weight:700;letter-spacing:.08em">WANYM SOLUTION</div>
    <div style="background:#fff;padding:24px;border-radius:0 0 12px 12px;border:1px solid #e2e8f0;border-top:0">
      <h1 style="font-size:20px;margin:0 0 16px">${title}</h1>${body}
      <p style="margin:24px 0 0;color:#64748b;font-size:13px">WANYM SOLUTION · 125 rue Diderot, 93700 Drancy · Exploitation 24h/24 : 07 67 16 60 15 · ${esc(env.siteUrl)}</p>
    </div></div></body></html>`;
}

function orderTable(o: Order) {
  const slot = o.wanted_slot ? SLOT_LABELS[o.wanted_slot as keyof typeof SLOT_LABELS] ?? o.wanted_slot : null;
  const opts = Object.entries(o.options ?? {})
    .filter(([, v]) => v)
    .map(([k]) => ({ handling: "manutention / hayon", floor: "étage", fragile: "fragile" })[k] ?? k)
    .join(", ");
  return `<table style="border-collapse:collapse;font-size:14px;width:100%">
    ${row("Référence", o.reference)}
    ${row("Statut", STATUS_LABELS[o.status])}
    ${row("Départ", o.pickup_address)}
    ${row("Contact départ", o.pickup_contact)}
    ${row("Arrivée", o.delivery_address)}
    ${row("Contact arrivée", o.delivery_contact)}
    ${row("Date souhaitée", o.wanted_date ? `${o.wanted_date}${slot ? " · " + slot : ""}` : null)}
    ${row("Marchandise", o.goods_type)}
    ${row("Quantité", o.quantity ? `${o.quantity} ${o.quantity_unit ?? ""}` : null)}
    ${row("Dimensions", o.dimensions)}
    ${row("Poids", o.weight_kg != null ? `${o.weight_kg} kg` : null)}
    ${row("Options", opts || null)}
    ${row("Prix", o.price_cents != null ? `${formatEuros(o.price_cents)} HT · ${formatEuros(o.total_cents)} TTC` : "Sur devis")}
    ${row("Paiement", { not_required: "Non requis (devis)", pending: "En attente", paid: "Payé", failed: "Échoué", refunded: "Remboursé" }[o.payment_status])}
    ${row("Société", o.company)}
    ${row("Contact", `${o.contact_name} · ${o.email} · ${o.phone}`)}
    ${row("Commentaire", o.notes)}
  </table>`;
}

async function send(to: string | string[], subject: string, html: string, replyTo?: string) {
  const r = client();
  if (!r) {
    console.warn("[email] RESEND_API_KEY missing, skipping:", subject);
    return { skipped: true as const };
  }
  const { error } = await r.emails.send({ from: env.emailFrom, to, subject, html, replyTo });
  if (error) {
    console.error("[email] send failed:", error);
    return { error: error.message };
  }
  return { ok: true as const };
}

/** Internal notification: a new order / request is in. */
export function sendInternalNotification(o: Order) {
  if (!env.ordersNotifyEmail) return Promise.resolve({ skipped: true as const });
  const kind = o.pricing_mode === "instant" ? (o.payment_status === "paid" ? "Commande payée" : "Commande en attente de paiement") : "Demande de devis";
  const body = `${orderTable(o)}
    <p style="margin-top:16px"><a href="${esc(env.siteUrl)}/api/orders/${o.id}" style="color:#0b1f3a">Voir dans l'API</a>${o.gclid ? " · Trafic Google Ads" : ""}</p>`;
  return send(env.ordersNotifyEmail, `[${o.reference}] ${kind} — ${o.contact_name}${o.company ? " (" + o.company + ")" : ""}`, layout(kind, body), o.email);
}

/** Customer acknowledgement (after payment, or right away for quotes). */
export function sendCustomerConfirmation(o: Order) {
  const paid = o.payment_status === "paid";
  const title = paid ? "Votre commande est confirmée" : "Votre demande est bien reçue";
  const intro = paid
    ? `<p>Merci ${esc(o.contact_name)}, votre paiement de <strong>${formatEuros(o.total_cents)} TTC</strong> est enregistré. Notre exploitation organise la course et vous contacte au ${esc(o.phone)} si un détail manque.</p>`
    : `<p>Merci ${esc(o.contact_name)}, nous avons bien reçu votre demande. Vous recevrez un chiffrage sous 24h ouvrées, sans engagement.</p>`;
  const body = `${intro}${orderTable(o)}
    <p style="margin-top:16px">Suivre votre commande : <a href="${esc(env.siteUrl)}/suivi?ref=${esc(o.reference)}" style="color:#0b1f3a">${esc(env.siteUrl)}/suivi</a></p>`;
  return send(o.email, `${o.reference} — ${title}`, layout(title, body), env.ordersNotifyEmail || undefined);
}

/** Free-form update sent by the ops team through the API (status change, SAV answer, invoice…). */
export function sendCustomerUpdate(o: Order, subject: string, message: string) {
  const body = `<p style="white-space:pre-wrap">${esc(message)}</p>
    <p style="margin-top:16px;font-size:14px;color:#64748b">Commande ${esc(o.reference)} · statut : ${STATUS_LABELS[o.status]}${o.invoice_url ? ` · <a href="${esc(o.invoice_url)}">Facture ${esc(o.invoice_number ?? "")}</a>` : ""}</p>`;
  return send(o.email, `${o.reference} — ${subject}`, layout(subject, body), env.ordersNotifyEmail || undefined);
}
