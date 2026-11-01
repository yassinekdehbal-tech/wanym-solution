import type { Metadata } from "next";
import { Suspense } from "react";
import { OrderForm } from "@/components/OrderForm";
import { CATALOGUE_OBJETS, VEHICULES_CAPACITES } from "@/lib/catalogue-objets";
import { getContent, getServices, parseJson, splitList } from "@/lib/supabase/content";
import type { CatalogueItem, VehiculeCapacite } from "@/lib/vehicle-advisor";

export const metadata: Metadata = { title: "Commander un transport", description: "Commandez un transport en quelques minutes : prix immédiat et paiement en ligne pour l'express en Île-de-France, devis sous 24h pour le reste." };

export default async function OrderPage() {
  const [c, services] = await Promise.all([getContent(), getServices()]);
  const namySlugs = splitList(c["order.namy_services"]);
  // Size advisor: catalogue, capacities and card examples are editable through the content API; the code holds the defaults.
  const advisor = {
    catalogue: parseJson<CatalogueItem[]>(c["order.catalogue_objets"], CATALOGUE_OBJETS).filter((i) => i && i.id && i.nom),
    capacites: parseJson<VehiculeCapacite[]>(c["order.vehicules_capacites"], VEHICULES_CAPACITES),
    exemples: parseJson<Record<string, string>>(c["order.exemples_cartes"], { "1": "un lave-linge et 6 cartons", "2": "un canapé 2 places, un matelas et 10 cartons", "4": "un canapé 3 places, une table, 6 chaises et 15 cartons", "8": "un studio complet" }),
  };
  return (
    <main className="bg-slate-50">
      <div className="container-x max-w-4xl py-10 sm:py-14">
        <h1 className="text-3xl font-extrabold text-brand-800 sm:text-4xl">{c["order.title"] ?? "Commander un transport"}</h1>
        <p className="mt-3 text-slate-600">{c["order.lead"]}</p>
        <div className="mt-8">
          <Suspense fallback={<div className="card h-96 animate-pulse" />}>
            <OrderForm services={services} namySlugs={namySlugs} copy={{ quoteNotice: c["order.quote_notice"] ?? "", cancelledBody: c["order.cancelled_body"] ?? "" }} advisor={advisor} />
          </Suspense>
        </div>
      </div>
    </main>
  );
}
