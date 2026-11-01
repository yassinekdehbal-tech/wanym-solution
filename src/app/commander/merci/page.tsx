import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Conversion } from "@/components/Conversion";
import { Icon } from "@/components/Icon";
import { Timeline } from "@/components/Timeline";
import { env } from "@/lib/env";
import { getOrder } from "@/lib/orders";
import { formatEuros } from "@/lib/pricing";
import { getContent } from "@/lib/supabase/content";
import type { SiteContent } from "@/lib/types";

export const metadata: Metadata = { title: "Commande enregistrée", robots: { index: false } };

type Props = { searchParams: Promise<{ ref?: string; session_id?: string }> };

/**
 * Deux variantes : commande confirmée (payée ou en confirmation) et demande de
 * devis reçue. La conversion Google Ads ne part que pour une commande payée.
 */
async function Summary({ searchParams, c }: Props & { c: SiteContent }) {
  const { ref } = await searchParams;
  const order = ref && env.supabaseServiceKey ? await getOrder(ref) : null;
  const sendTo = env.gtagId && env.gtagConversionLabel ? `${env.gtagId}/${env.gtagConversionLabel}` : "";
  const paid = order?.payment_status === "paid" || order?.payment_status === "authorized";
  const quoteMode = order ? order.pricing_mode === "quote" || order.payment_status === "not_required" : false;
  const title = quoteMode ? (c["order.quote_received_title"] ?? "Demande de devis reçue") : (c["order.success_title"] ?? "Commande confirmée");
  const body = quoteMode ? (c["order.quote_received_body"] ?? "Notre exploitation chiffre votre transport et vous répond sous 24 h par e-mail.") : c["order.success_body"];
  return (
    <>
      <span className={`mx-auto grid h-16 w-16 place-items-center rounded-full ${quoteMode ? "bg-brand-50 text-brand-800" : "bg-primary-600 text-white"}`}>
        <Icon name={quoteMode ? "mail" : "check"} className="h-8 w-8" />
      </span>
      <h1 className="h1 mt-6 text-brand-800">{title}</h1>
      <p className="lead mt-3">{body}</p>
      {ref && (
        <p className="mt-6 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 font-display text-lg font-bold text-brand-800 shadow-card">
          Référence <span className="font-mono">{ref}</span>
        </p>
      )}
      {order && (
        <div className="card mx-auto mt-6 max-w-lg text-left">
          {!quoteMode && <Timeline status={order.status} dates={{ recue: order.created_at }} />}
          <dl className={`space-y-2 text-sm text-slate-700 ${quoteMode ? "" : "mt-6"}`}>
            <div className="flex justify-between gap-4"><dt className="text-muted">Trajet</dt><dd className="text-right font-medium">{order.pickup_address} → {order.delivery_address}</dd></div>
            {order.wanted_date && <div className="flex justify-between gap-4"><dt className="text-muted">Date</dt><dd className="font-medium">{new Date(order.wanted_date + "T12:00:00").toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}{order.wanted_slot ? ` · ${order.wanted_slot}` : ""}</dd></div>}
            {order.total_cents != null && !quoteMode && (
              <div className="flex justify-between gap-4"><dt className="text-muted">Montant</dt><dd className="font-medium">{formatEuros(order.total_cents)} TTC{paid ? " · payé" : order.payment_status === "pending" ? " · paiement en cours de confirmation" : ""}</dd></div>
            )}
          </dl>
          <p className="mt-4 flex items-start gap-2 rounded-xl bg-surface p-3 text-sm text-slate-700">
            <Icon name="mail" className="mt-0.5 h-4 w-4 shrink-0 text-primary-700" />
            {quoteMode ? "Vous recevez un accusé de réception maintenant, puis le devis par e-mail." : "Un e-mail de confirmation vous est envoyé, puis un rappel la veille et le jour du transport avec le lien de suivi."}
          </p>
        </div>
      )}
      {ref && paid && <Conversion reference={ref} valueCents={order?.total_cents ?? null} sendTo={sendTo} />}
      {ref && !order && <Conversion reference={ref} valueCents={null} sendTo={sendTo} />}
    </>
  );
}

export default async function ThankYouPage(props: Props) {
  const c = await getContent();
  return (
    <main className="container-x max-w-2xl py-14 text-center sm:py-24">
      <Suspense fallback={<div className="card mx-auto h-40 max-w-lg animate-pulse" />}>
        <Summary searchParams={props.searchParams} c={c} />
      </Suspense>
      <div className="mt-10 flex flex-wrap justify-center gap-3">
        <Link href="/suivi" className="btn-dark">Suivre ma commande</Link>
        <Link href="/commander" className="btn-outline">Nouveau transport</Link>
      </div>
      <p className="mt-8 text-sm text-muted">Une question ? <a className="font-semibold text-brand-800" href={`tel:${c["contact.phone_e164"]}`}>{c["contact.phone"]}</a> · {c["contact.email"]}</p>
    </main>
  );
}
