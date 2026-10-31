import type { Metadata } from "next";
import { Suspense } from "react";
import { OrderForm } from "@/components/OrderForm";
import { getContent, getPricingRules, getServices } from "@/lib/supabase/content";

export const metadata: Metadata = { title: "Commander un transport", description: "Commandez un transport en quelques minutes : prix immédiat et paiement en ligne pour l'express en Île-de-France, devis sous 24h pour le reste." };

export default async function OrderPage() {
  const [c, services, rules] = await Promise.all([getContent(), getServices(), getPricingRules()]);
  return (
    <main className="bg-slate-50">
      <div className="container-x max-w-4xl py-10 sm:py-14">
        <h1 className="text-3xl font-extrabold text-brand-800 sm:text-4xl">{c["order.title"] ?? "Commander un transport"}</h1>
        <p className="mt-3 text-slate-600">{c["order.lead"]}</p>
        <div className="mt-8">
          <Suspense fallback={<div className="card h-96 animate-pulse" />}>
            <OrderForm services={services} rules={rules} copy={{ quoteNotice: c["order.quote_notice"] ?? "", cancelledBody: c["order.cancelled_body"] ?? "" }} />
          </Suspense>
        </div>
      </div>
    </main>
  );
}
