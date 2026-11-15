import Link from "next/link";
import { Faq } from "@/components/Faq";
import { Icon } from "@/components/Icon";
import { Markdown } from "@/components/Markdown";
import { RouteSearch } from "@/components/RouteSearch";
import { env } from "@/lib/env";
import type { Page, PageSection, SiteContent } from "@/lib/types";

export const SECTION_META: Record<PageSection, { label: string; eyebrow: string; title: string; lead: string; description: string }> = {
  livraison: {
    label: "Livraison",
    eyebrow: "Livraison à la demande",
    title: "Ce que nous livrons, et comment",
    lead: "Un objet, une occasion, une ville : chaque page dit ce qui est inclus, le prix d'appel et le délai. Le prix exact s'affiche en 30 secondes avec vos deux adresses.",
    description: "Livraison de meubles, électroménager, cartons et objets volumineux en Île-de-France : prix affiché avant paiement, chauffeur dédié, commande en quelques clics.",
  },
  transport: {
    label: "Transport",
    eyebrow: "Transport avec chauffeur",
    title: "Un camion et un chauffeur, par ville et par besoin",
    lead: "Camionnette avec chauffeur, petit déménagement, transport urgent : nos pages par zone et par usage, avec le rayon inclus depuis notre base.",
    description: "Transport avec chauffeur en Île-de-France : camionnette, petit déménagement, course urgente. Prix calculé en ligne, paiement sécurisé.",
  },
  entreprises: {
    label: "Entreprises",
    eyebrow: "Livraison externalisée",
    title: "Vos livraisons, prises en charge et pilotées",
    lead: "Enseignes, jardineries, e-commerçants, ateliers : comment nous livrons vos clients, ce que vous voyez dans NAMY, et comment on démarre sans engagement.",
    description: "Externalisation de livraisons pour enseignes et entreprises en Île-de-France : dernier kilomètre, tournées dédiées, suivi et preuve de livraison dans NAMY.",
  },
};

export function pageHref(p: Pick<Page, "section" | "slug">) {
  return `/${p.section}/${p.slug}`;
}

export function SeoPage({ page, c, related }: { page: Page; c: SiteContent; related: Page[] }) {
  const meta = SECTION_META[page.section];
  const pro = page.section === "entreprises";
  const prefill = page.order_prefill ?? {};
  const orderHref = `/commander?${new URLSearchParams(Object.entries(prefill).filter(([, v]) => !!v) as [string, string][]).toString()}`;
  const faqLd = page.faq?.length
    ? { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: page.faq.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) }
    : null;
  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Accueil", item: env.siteUrl },
      { "@type": "ListItem", position: 2, name: meta.label, item: `${env.siteUrl}/${page.section}` },
      { "@type": "ListItem", position: 3, name: page.title, item: `${env.siteUrl}${pageHref(page)}` },
    ],
  };
  return (
    <main>
      <section className="bg-brand-800 text-white">
        <div className="container-x py-10 sm:py-14">
          <nav aria-label="Fil d'Ariane" className="text-sm text-slate-300">
            <Link href="/" className="hover:text-white">Accueil</Link> <span aria-hidden="true">›</span>{" "}
            <Link href={`/${page.section}`} className="hover:text-white">{meta.label}</Link>
          </nav>
          <p className="eyebrow mt-4 text-primary-400">{meta.eyebrow}</p>
          <h1 className="h1 mt-2 text-white">{page.title}</h1>
          {page.intro && <p className="lead mt-4 max-w-2xl text-slate-200">{page.intro}</p>}
          <div className="mt-6 max-w-3xl">
            {pro ? (
              <div className="flex flex-wrap gap-3">
                <Link href="/contact" className="btn-primary">Parler à l&apos;exploitation <Icon name="arrow" className="h-4 w-4" /></Link>
                <Link href={orderHref} className="btn-light">Commander une course ponctuelle</Link>
              </div>
            ) : (
              <RouteSearch compact labels={{ from: c["hero.route_from"] ?? "Adresse de départ", to: c["hero.route_to"] ?? "Adresse d'arrivée", button: c["hero.route_button"] ?? "Voir le prix" }} initial={{ from: prefill.from, to: prefill.to }} extraQuery={{ service: prefill.service, vehicule: prefill.vehicule }} />
            )}
          </div>
        </div>
      </section>

      <section className="container-x grid gap-10 py-10 sm:py-14 lg:grid-cols-[minmax(0,1fr)_320px]">
        <article>
          <Markdown className="prose-lg prose-h2:mt-10 prose-h2:font-display prose-h3:font-display prose-li:marker:text-primary-600">{page.body ?? ""}</Markdown>
          {page.faq?.length > 0 && (
            <section className="mt-12">
              <h2 className="h2 mb-6">Questions fréquentes</h2>
              <Faq items={page.faq} />
            </section>
          )}
          <div className="mt-10 rounded-2xl bg-primary-50 p-6 ring-1 ring-primary-100">
            <p className="font-display text-lg font-bold text-brand-800">{pro ? (c["cta.final_title"] ?? "") : "Votre prix en 30 secondes, votre livraison en quelques clics."}</p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Link href={pro ? "/contact" : orderHref} className="btn-primary">{pro ? "Demander un devis" : (c["cta.final_button"] ?? "Commander une livraison")}</Link>
              <a href={`tel:${c["contact.phone_e164"]}`} className="btn-outline"><Icon name="phone" className="h-4 w-4" />{c["contact.phone"]}</a>
            </div>
          </div>
        </article>
        <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
          <div className="card">
            <p className="eyebrow">Exploitation 24h/24</p>
            <p className="mt-2 font-display text-xl font-bold text-brand-800">{c["contact.phone"]}</p>
            <p className="text-sm text-muted">{c["contact.hours"]}</p>
            <Link href={pro ? "/contact" : orderHref} className="btn-primary mt-4 w-full">{pro ? "Demander un devis" : "Commander une livraison"}</Link>
          </div>
          {related.length > 0 && (
            <div className="card">
              <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted">À lire aussi</p>
              <ul className="space-y-1">
                {related.map((r) => (
                  <li key={r.id}><Link href={pageHref(r)} className="flex min-h-11 items-center justify-between gap-2 rounded-lg px-2 font-medium text-brand-800 hover:bg-surface">{r.title} <Icon name="chevron" className="h-4 w-4 shrink-0 text-slate-400" /></Link></li>
                ))}
              </ul>
            </div>
          )}
          <div className="card">
            <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted">Nos services</p>
            <ul className="space-y-1 text-sm">
              <li><Link href="/livraison" className="block min-h-11 rounded-lg px-2 py-2.5 font-medium text-brand-800 hover:bg-surface">Livraison à la demande</Link></li>
              <li><Link href="/transport" className="block min-h-11 rounded-lg px-2 py-2.5 font-medium text-brand-800 hover:bg-surface">Transport avec chauffeur</Link></li>
              <li><Link href="/entreprises" className="block min-h-11 rounded-lg px-2 py-2.5 font-medium text-brand-800 hover:bg-surface">Livraison externalisée</Link></li>
            </ul>
          </div>
        </aside>
      </section>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      {faqLd && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />}
    </main>
  );
}

export function SeoHub({ section, pages, c }: { section: PageSection; pages: Page[]; c: SiteContent }) {
  const meta = SECTION_META[section];
  const pro = section === "entreprises";
  return (
    <main className="container-x py-10 sm:py-16">
      <p className="eyebrow">{meta.eyebrow}</p>
      <h1 className="h1 mt-2 text-brand-800">{meta.title}</h1>
      <p className="lead mt-3 max-w-2xl">{meta.lead}</p>
      {!pro && (
        <div className="mt-8 max-w-3xl">
          <RouteSearch compact labels={{ from: c["hero.route_from"] ?? "Adresse de départ", to: c["hero.route_to"] ?? "Adresse d'arrivée", button: c["hero.route_button"] ?? "Voir le prix" }} />
        </div>
      )}
      <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {pages.map((p) => (
          <li key={p.id}>
            <Link href={pageHref(p)} className="card-interactive flex h-full flex-col gap-3">
              <h2 className="font-display text-lg font-bold text-brand-800">{p.title}</h2>
              {p.intro && <p className="text-sm leading-relaxed text-slate-600">{p.intro}</p>}
              <span className="mt-auto inline-flex items-center gap-1 text-sm font-semibold text-brand-600">Lire <Icon name="arrow" className="h-4 w-4" /></span>
            </Link>
          </li>
        ))}
      </ul>
      {pages.length === 0 && <p className="mt-10 text-muted">Pages en préparation.</p>}
      <div className="mt-12 flex flex-wrap items-center justify-center gap-3 rounded-3xl bg-brand-800 px-6 py-10 text-center text-white">
        <p className="w-full font-display text-xl font-bold">{pro ? (c["cta.final_title"] ?? "") : "Votre prix en 30 secondes, votre livraison en quelques clics."}</p>
        <Link href={pro ? "/contact" : "/commander"} className="btn-primary">{pro ? "Parler à l'exploitation" : (c["hero.cta_primary"] ?? "Commander une livraison")} <Icon name="arrow" className="h-4 w-4" /></Link>
      </div>
    </main>
  );
}
