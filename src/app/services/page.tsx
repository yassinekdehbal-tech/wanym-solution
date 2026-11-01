import type { Metadata } from "next";
import Link from "next/link";
import { Icon } from "@/components/Icon";
import { ServiceCard } from "@/components/ServiceCard";
import { getContent, getServices, splitList } from "@/lib/supabase/content";

export const metadata: Metadata = { title: "Nos services de transport et livraison", description: "Livraison externalisée pour professionnels, course express à la demande et transport dédié au départ de l'Île-de-France." };

export default async function ServicesPage() {
  const [c, services] = await Promise.all([getContent(), getServices()]);
  const namySlugs = splitList(c["order.namy_services"]);
  return (
    <main className="container-x py-10 sm:py-16">
      <p className="eyebrow">Services</p>
      <h1 className="h1 mt-2 text-brand-800">{c["services.title"]}</h1>
      <p className="lead mt-3 max-w-2xl">{c["services.lead"]}</p>
      <div className="mt-10 grid gap-5 md:grid-cols-3">
        {services.map((s) => (
          <ServiceCard key={s.slug} service={s} instant={namySlugs.includes(s.slug)} />
        ))}
      </div>
      <div className="mt-12 flex flex-wrap items-center justify-center gap-3 rounded-3xl bg-brand-800 px-6 py-10 text-center text-white">
        <p className="w-full font-display text-xl font-bold">{c["cta.final_title"]}</p>
        <Link href="/commander" className="btn-primary">{c["hero.cta_primary"]} <Icon name="arrow" className="h-4 w-4" /></Link>
        <Link href="/contact" className="btn-sm inline-flex min-h-12 items-center gap-2 rounded-xl border border-white/25 px-5 font-semibold text-white hover:bg-white/10">Nous contacter</Link>
      </div>
    </main>
  );
}
