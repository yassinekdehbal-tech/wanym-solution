import type { Metadata } from "next";
import { Suspense } from "react";
import { Icon } from "@/components/Icon";
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
    exemples: parseJson<Record<string, string>>(c["order.exemples_cartes"], { "1": "un lave-linge et 6 cartons", "2": "un canapé 2 places et 10 cartons", "4": "un canapé 3 places, une table, 6 chaises et 15 cartons", "8": "un studio complet" }),
  };
  return (
    <main>
      <div className="container-x max-w-4xl py-6 sm:py-12">
        <h1 className="h1 text-brand-800">{c["order.title"] ?? "Commander un transport"}</h1>
        <p className="lead mt-2 sm:mt-3">{c["order.lead"]}</p>
        <ul className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-xs font-medium text-muted sm:text-sm" aria-label="Garanties">
          <li className="inline-flex items-center gap-1"><Icon name="euro" className="h-3.5 w-3.5 text-primary-700" /> Prix ferme avant paiement</li>
          <li className="inline-flex items-center gap-1"><Icon name="lock" className="h-3.5 w-3.5 text-primary-700" /> Paiement sécurisé Stripe</li>
          <li className="inline-flex items-center gap-1"><Icon name="clock" className="h-3.5 w-3.5 text-primary-700" /> Exploitation 24h/24</li>
          <li className="inline-flex items-center gap-1"><Icon name="handshake" className="h-3.5 w-3.5 text-primary-700" /> Sans engagement</li>
        </ul>
        <div className="mt-6 sm:mt-8">
          <Suspense fallback={<div className="card h-96 animate-pulse" />}>
            <OrderForm services={services} namySlugs={namySlugs} copy={{ quoteNotice: c["order.quote_notice"] ?? "", cancelledBody: c["order.cancelled_body"] ?? "" }} advisor={advisor} />
          </Suspense>
        </div>
      </div>
    </main>
  );
}
