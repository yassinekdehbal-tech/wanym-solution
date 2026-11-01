import { Faq, type FaqItem } from "@/components/Faq";
import { Hero } from "@/components/home/Hero";
import { Reassurance } from "@/components/home/Reassurance";
import { FinalCta, HowItWorks, ProSection, References, type Reference, type Step } from "@/components/home/Sections";
import { VehicleCards } from "@/components/home/VehicleCards";
import { ServiceCard } from "@/components/ServiceCard";
import { getVehiculesVitrine } from "@/lib/namy";
import { getContent, getServices, parseJson, splitList } from "@/lib/supabase/content";

export default async function Home() {
  const [c, services, vehicules] = await Promise.all([getContent(), getServices(), getVehiculesVitrine()]);
  const namySlugs = splitList(c["order.namy_services"]);
  const faq = parseJson<FaqItem[]>(c["faq"], []);
  const faqLd = faq.length
    ? { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: faq.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) }
    : null;

  return (
    <main>
      <Hero c={c} />
      <Reassurance items={splitList(c["reassurance.items"])} />
      <VehicleCards vehicules={vehicules} exemples={parseJson<Record<string, string>>(c["order.exemples_cartes"], {})} title={c["vehicles.title"] ?? "Quelle place vous faut-il ?"} lead={c["vehicles.lead"]} rayonKm={vehicules[0]?.rayon_km} />
      <HowItWorks title={c["how.title"] ?? "Réservez en trois minutes"} steps={parseJson<Step[]>(c["how.steps"], [])} />

      <section className="section container-x" id="services">
        <p className="eyebrow">Services</p>
        <h2 className="h2 mt-2">{c["services.title"]}</h2>
        <p className="lead mt-3 max-w-2xl">{c["services.lead"]}</p>
        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {services.map((s) => (
            <ServiceCard key={s.slug} service={s} instant={namySlugs.includes(s.slug)} />
          ))}
        </div>
      </section>

      <ProSection c={c} items={splitList(c["pro.items"])} />
      <References c={c} refs={parseJson<Reference[]>(c["references.items"], []).filter((r) => r && r.name && r.text)} />

      {faq.length > 0 && (
        <section className="section container-x">
          <p className="eyebrow">FAQ</p>
          <h2 className="h2 mb-6 mt-2">Questions fréquentes</h2>
          <Faq items={faq} />
          {faqLd && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />}
        </section>
      )}

      <FinalCta c={c} />
    </main>
  );
}
