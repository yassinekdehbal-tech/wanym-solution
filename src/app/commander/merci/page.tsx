import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Conversion } from "@/components/Conversion";
import { Icon } from "@/components/Icon";
import { env } from "@/lib/env";
import { getOrder } from "@/lib/orders";
import { formatEuros } from "@/lib/pricing";
import { getContent } from "@/lib/supabase/content";

export const metadata: Metadata = { title: "Commande enregistrée", robots: { index: false } };

type Props = { searchParams: Promise<{ ref?: string; session_id?: string }> };

async function Summary({ searchParams }: Props) {
  const { ref } = await searchParams;
  const order = ref && env.supabaseServiceKey ? await getOrder(ref) : null;
  const sendTo = env.gtagId && env.gtagConversionLabel ? `${env.gtagId}/${env.gtagConversionLabel}` : "";
  return (
    <>
      {ref && (
        <p className="mt-6 inline-block rounded-xl bg-brand-50 px-5 py-3 text-lg font-bold text-brand-800">
          Référence : {ref}
        </p>
      )}
      {order && (
        <dl className="mx-auto mt-6 max-w-md space-y-1 text-left text-sm text-slate-700">
          <div className="flex justify-between gap-4"><dt className="text-slate-500">Trajet</dt><dd className="text-right">{order.pickup_address} → {order.delivery_address}</dd></div>
          {order.wanted_date && <div className="flex justify-between gap-4"><dt className="text-slate-500">Date</dt><dd>{order.wanted_date}</dd></div>}
          {order.total_cents != null && (
            <div className="flex justify-between gap-4"><dt className="text-slate-500">Montant</dt><dd>{formatEuros(order.total_cents)} TTC{order.payment_status === "paid" ? " · payé" : order.payment_status === "authorized" ? " · empreinte bancaire enregistrée, débit à la prise en charge" : order.payment_status === "pending" ? " · paiement en cours de confirmation" : ""}</dd></div>
          )}
        </dl>
      )}
      {ref && <Conversion reference={ref} valueCents={order?.total_cents ?? null} sendTo={sendTo} />}
    </>
  );
}

export default async function ThankYouPage(props: Props) {
  const c = await getContent();
  return (
    <main className="container-x max-w-2xl py-16 text-center sm:py-24">
      <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-primary-500 text-brand-900"><Icon name="check" className="h-8 w-8" /></span>
      <h1 className="mt-6 text-3xl font-extrabold text-brand-800">{c["order.success_title"]}</h1>
      <p className="mt-3 text-slate-600">{c["order.success_body"]}</p>
      <Suspense fallback={null}>
        <Summary searchParams={props.searchParams} />
      </Suspense>
      <div className="mt-10 flex flex-wrap justify-center gap-3">
        <Link href="/suivi" className="btn-dark">Suivre ma commande</Link>
        <Link href="/" className="btn-ghost">Retour à l&apos;accueil</Link>
      </div>
      <p className="mt-8 text-sm text-slate-500">Une question ? {c["contact.phone"]} · {c["contact.email"]}</p>
    </main>
  );
}
