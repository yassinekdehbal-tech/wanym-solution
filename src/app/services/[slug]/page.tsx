import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Icon } from "@/components/Icon";
import { Markdown } from "@/components/Markdown";
import { getContent, getService, getServices } from "@/lib/supabase/content";

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

export default async function ServicePage({ params }: Props) {
  const { slug } = await params;
  const [service, c, all] = await Promise.all([getService(slug), getContent(), getServices()]);
  if (!service) notFound();
  const others = all.filter((s) => s.slug !== slug);
  return (
    <main>
      <section className="bg-brand-800 text-white">
        <div className="container-x py-12 sm:py-16">
          <Link href="/services" className="text-sm text-slate-300 hover:text-white">← Tous les services</Link>
          <div className="mt-4 flex items-center gap-4">
            <span className="grid h-14 w-14 place-items-center rounded-2xl bg-white/10 text-primary-500"><Icon name={service.icon ?? "box"} className="h-7 w-7" /></span>
            <h1 className="text-3xl font-extrabold sm:text-4xl">{service.title}</h1>
          </div>
          <p className="mt-5 max-w-2xl text-lg text-slate-200">{service.summary}</p>
          <Link href={`/commander?service=${service.slug}`} className="btn-primary mt-8">{c["hero.cta_primary"]}</Link>
        </div>
      </section>
      <section className="container-x grid gap-12 py-12 lg:grid-cols-[1fr_320px]">
        <Markdown>{service.body ?? ""}</Markdown>
        <aside className="space-y-6">
          <div className="card">
            <p className="font-bold text-brand-800">{c["cta.final_title"]}</p>
            <Link href={`/commander?service=${service.slug}`} className="btn-dark mt-4 w-full">{c["cta.final_button"]}</Link>
            <a href={`tel:${c["contact.phone_e164"]}`} className="btn-outline mt-2 w-full"><Icon name="phone" className="h-4 w-4" />{c["contact.phone"]}</a>
          </div>
          {others.length > 0 && (
            <div>
              <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">Autres services</p>
              <ul className="space-y-2">
                {others.map((o) => (
                  <li key={o.slug}><Link href={`/services/${o.slug}`} className="font-medium text-brand-600 hover:underline">{o.title}</Link></li>
                ))}
              </ul>
            </div>
          )}
        </aside>
      </section>
    </main>
  );
}
