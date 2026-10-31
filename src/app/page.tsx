import Link from "next/link";
import { Faq, type FaqItem } from "@/components/Faq";
import { Icon } from "@/components/Icon";
import { RouteSearch } from "@/components/RouteSearch";
import { ServiceCard } from "@/components/ServiceCard";
import { getContent, getPricingRules, getServices, parseJson, splitList } from "@/lib/supabase/content";

export default async function Home() {
  const [c, services, rules] = await Promise.all([getContent(), getServices(), getPricingRules()]);
  const badges = splitList(c["badges"]);
  const included = splitList(c["included.items"]);
  const faq = parseJson<FaqItem[]>(c["faq"], []);
  const faqLd = faq.length
    ? {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: faq.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
      }
    : null;

  return (
    <main>
      {/* Hero */}
      <section className="bg-brand-800 text-white">
        <div className="container-x grid gap-10 py-14 md:grid-cols-2 md:items-center md:py-20">
          <div>
            <h1 className="text-3xl font-extrabold leading-tight sm:text-4xl lg:text-5xl">{c["hero.title"]}</h1>
            <p className="mt-5 max-w-xl text-lg text-slate-200">{c["hero.subtitle"]}</p>
            <ul className="mt-6 flex flex-wrap gap-2">
              {badges.map((b) => (
                <li key={b} className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-sm">{b}</li>
              ))}
            </ul>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/commander" className="btn-primary">{c["hero.cta_primary"]}</Link>
              <a href={`tel:${c["contact.phone_e164"]}`} className="btn border-2 border-white/30 text-white hover:bg-white/10">
                <Icon name="phone" className="h-5 w-5" /> {c["hero.cta_secondary"]}
              </a>
            </div>
          </div>
          <RouteSearch labels={{ title: c["hero.route_title"] ?? "Où devons-nous livrer ?", from: c["hero.route_from"] ?? "Adresse de départ", to: c["hero.route_to"] ?? "Adresse d'arrivée", button: c["hero.route_button"] ?? "Obtenir un prix" }} />
        </div>
      </section>

      {/* Services */}
      <section className="container-x py-16" id="services">
        <h2 className="text-2xl font-extrabold text-brand-800 sm:text-3xl">{c["services.title"]}</h2>
        <p className="mt-3 max-w-2xl text-slate-600">{c["services.lead"]}</p>
        <div className="mt-8 grid gap-6 md:grid-cols-3">
          {services.map((s) => (
            <ServiceCard key={s.slug} service={s} instant={rules.some((r) => r.service_slug === s.slug && r.instant_booking)} />
          ))}
        </div>
      </section>

      {/* Included */}
      <section className="bg-slate-50 py-16">
        <div className="container-x grid gap-10 md:grid-cols-2 md:items-center">
          <div>
            <h2 className="text-2xl font-extrabold text-brand-800 sm:text-3xl">{c["included.title"]}</h2>
            <ul className="mt-6 space-y-3">
              {included.map((item) => (
                <li key={item} className="flex items-start gap-3 text-slate-700">
                  <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-accent-500 text-brand-900"><Icon name="check" className="h-4 w-4" /></span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="card" id="tarifs">
            <h3 className="text-xl font-bold text-brand-800">{c["pricing.title"]}</h3>
            <p className="mt-2 text-slate-600">{c["pricing.lead"]}</p>
            <p className="mt-4 text-sm text-slate-600">{c["pricing.how"]}</p>
            <Link href="/commander" className="btn-dark mt-6">Obtenir un prix</Link>
          </div>
        </div>
      </section>

      {/* About */}
      <section className="container-x grid gap-8 py-16 md:grid-cols-[2fr_1fr] md:items-start">
        <div>
          <h2 className="text-2xl font-extrabold text-brand-800 sm:text-3xl">{c["about.title"]}</h2>
          <p className="mt-4 leading-relaxed text-slate-700">{c["about.body"]}</p>
        </div>
        <div className="rounded-2xl bg-brand-50 p-6 text-sm leading-relaxed text-brand-800">{c["about.figures"]}</div>
      </section>

      {/* FAQ */}
      {faq.length > 0 && (
        <section className="container-x py-8">
          <h2 className="mb-6 text-2xl font-extrabold text-brand-800 sm:text-3xl">Questions fréquentes</h2>
          <Faq items={faq} />
          {faqLd && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />}
        </section>
      )}

      {/* Final CTA */}
      <section className="container-x py-16">
        <div className="rounded-3xl bg-brand-800 px-6 py-12 text-center text-white sm:px-12">
          <h2 className="text-2xl font-extrabold sm:text-3xl">{c["cta.final_title"]}</h2>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link href="/commander" className="btn-primary">{c["cta.final_button"]}</Link>
            <a href={`tel:${c["contact.phone_e164"]}`} className="btn border-2 border-white/30 text-white hover:bg-white/10">{c["contact.phone"]}</a>
          </div>
        </div>
      </section>
    </main>
  );
}
