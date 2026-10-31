import type { Metadata } from "next";
import Link from "next/link";
import { ServiceCard } from "@/components/ServiceCard";
import { getContent, getPricingRules, getServices } from "@/lib/supabase/content";

export const metadata: Metadata = { title: "Nos services de transport et livraison", description: "Livraison externalisée pour professionnels, course express à la demande et transport dédié au départ de l'Île-de-France." };

export default async function ServicesPage() {
  const [c, services, rules] = await Promise.all([getContent(), getServices(), getPricingRules()]);
  return (
    <main className="container-x py-12 sm:py-16">
      <h1 className="text-3xl font-extrabold text-brand-800 sm:text-4xl">{c["services.title"]}</h1>
      <p className="mt-3 max-w-2xl text-slate-600">{c["services.lead"]}</p>
      <div className="mt-10 grid gap-6 md:grid-cols-3">
        {services.map((s) => (
          <ServiceCard key={s.slug} service={s} instant={rules.some((r) => r.service_slug === s.slug && r.instant_booking)} />
        ))}
      </div>
      <div className="mt-12 text-center">
        <Link href="/commander" className="btn-primary">{c["hero.cta_primary"]}</Link>
      </div>
    </main>
  );
}
