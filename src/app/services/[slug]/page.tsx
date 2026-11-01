import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Icon } from "@/components/Icon";
import { Markdown } from "@/components/Markdown";
import { getContent, getService, getServices, splitList } from "@/lib/supabase/content";

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  const services = await getServices();
  // Cache Components requires at least one param at build time; before the
  // database is configured we prerender a single placeholder that 404s.
  return services.length ? services.map((s) => ({ slug: s.slug })) : [{ slug: "service-indisponible" }];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const service = await getService((await params).slug);
  if (!service) return {};
  return { title: service.title, description: service.summary ?? undefined };
}

/** Gabarit éditorial (300 à 1 500 mots) : hiérarchie de titres, encadrés, CTA contextuels, aside collante. */
export default async function ServicePage({ params }: Props) {
  const { slug } = await params;
  const [service, c, all] = await Promise.all([getService(slug), getContent(), getServices()]);
  if (!service) notFound();
  const others = all.filter((s) => s.slug !== slug);
  const instant = splitList(c["order.namy_services"]).includes(slug);
  return (
    <main>
      <section className="bg-brand-800 text-white">
        <div className="container-x py-10 sm:py-16">
          <Link href="/services" className="inline-flex min-h-11 items-center gap-1 text-sm text-slate-300 hover:text-white"><Icon name="chevron" className="h-4 w-4 rotate-180" /> Tous les services</Link>
          <div className="mt-4 flex items-center gap-4">
            <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-white/10 text-primary-400"><Icon name={service.icon ?? "box"} className="h-7 w-7" /></span>
            <h1 className="h1 text-white">{service.title}</h1>
          </div>
          <p className="lead mt-5 max-w-2xl text-slate-200">{service.summary}</p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link href={`/commander?service=${service.slug}`} className="btn-primary">{instant ? "Voir le prix" : "Demander un devis"} <Icon name="arrow" className="h-4 w-4" /></Link>
            {instant && <span className="chip bg-white/10 text-white ring-1 ring-white/15">Prix immédiat en ligne</span>}
          </div>
        </div>
      </section>
      <section className="container-x grid gap-10 py-10 sm:py-14 lg:grid-cols-[minmax(0,1fr)_320px]">
        <article>
          <Markdown className="prose-lg prose-h2:mt-10 prose-h2:font-display prose-h3:font-display prose-li:marker:text-primary-600">{service.body ?? ""}</Markdown>
          <div className="mt-10 rounded-2xl bg-primary-50 p-6 ring-1 ring-primary-100">
            <p className="font-display text-lg font-bold text-brand-800">{c["cta.final_title"]}</p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Link href={`/commander?service=${service.slug}`} className="btn-primary">{c["cta.final_button"]}</Link>
              <a href={`tel:${c["contact.phone_e164"]}`} className="btn-outline"><Icon name="phone" className="h-4 w-4" />{c["contact.phone"]}</a>
            </div>
          </div>
        </article>
        <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
          <div className="card">
            <p className="eyebrow">Exploitation 24h/24</p>
            <p className="mt-2 font-display text-xl font-bold text-brand-800">{c["contact.phone"]}</p>
            <p className="text-sm text-muted">{c["contact.hours"]}</p>
            <Link href={`/commander?service=${service.slug}`} className="btn-primary mt-4 w-full">{c["cta.final_button"]}</Link>
            <a href={`tel:${c["contact.phone_e164"]}`} className="btn-outline mt-2 w-full"><Icon name="phone" className="h-4 w-4" /> Appeler</a>
          </div>
          {others.length > 0 && (
            <div className="card">
              <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted">Autres services</p>
              <ul className="space-y-1">
                {others.map((o) => (
                  <li key={o.slug}><Link href={`/services/${o.slug}`} className="flex min-h-11 items-center justify-between gap-2 rounded-lg px-2 font-medium text-brand-800 hover:bg-surface">{o.title} <Icon name="chevron" className="h-4 w-4 text-slate-400" /></Link></li>
                ))}
              </ul>
            </div>
          )}
        </aside>
      </section>
    </main>
  );
}
