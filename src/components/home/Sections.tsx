import Link from "next/link";
import { Icon } from "@/components/Icon";
import { RouteSearch } from "@/components/RouteSearch";
import type { SiteContent } from "@/lib/types";

export type Step = { t: string; d: string; icon?: string };

export function HowItWorks({ title, steps }: { title: string; steps: Step[] }) {
  if (!steps.length) return null;
  return (
    <section className="section bg-white">
      <div className="container-x">
        <p className="eyebrow">Comment ça marche</p>
        <h2 className="h2 mt-2">{title}</h2>
        <ol className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((s, i) => (
            <li key={s.t} className="relative rounded-2xl border border-slate-200 bg-surface p-5">
              <span className="absolute -top-3 left-5 grid h-7 w-7 place-items-center rounded-full bg-primary-600 text-xs font-bold text-white">{i + 1}</span>
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-white text-brand-800 shadow-sm"><Icon name={s.icon ?? "check"} className="h-5 w-5" /></span>
              <p className="mt-3 font-display text-lg font-bold text-brand-800">{s.t}</p>
              <p className="mt-1 text-sm text-slate-600">{s.d}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

export function ProSection({ c, items }: { c: SiteContent; items: string[] }) {
  return (
    <section className="section container-x" id="professionnels">
      <div className="grid gap-8 rounded-3xl bg-brand-800 p-6 text-white sm:p-10 lg:grid-cols-[1.2fr_1fr] lg:items-center">
        <div>
          <p className="eyebrow text-primary-400">Professionnels</p>
          <h2 className="h2 mt-2 text-white">{c["pro.title"]}</h2>
          <p className="mt-4 text-slate-200">{c["pro.body"]}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/contact" className="btn-primary">Parler à l&apos;exploitation <Icon name="arrow" className="h-4 w-4" /></Link>
            <Link href="/services" className="btn-sm inline-flex min-h-12 items-center gap-2 rounded-xl border border-white/25 px-5 font-semibold text-white hover:bg-white/10">Nos services</Link>
          </div>
        </div>
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
          {items.map((it) => (
            <li key={it} className="flex items-start gap-3 rounded-xl bg-white/10 p-3 text-sm">
              <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-primary-500 text-white"><Icon name="check" className="h-3 w-3" /></span>
              {it}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export type Reference = { name: string; text: string; role?: string };

/** Références et avis : rendu seulement si `references.items` porte du contenu validé. */
export function References({ c, refs }: { c: SiteContent; refs: Reference[] }) {
  return (
    <section className="section bg-white">
      <div className="container-x grid gap-10 lg:grid-cols-[1fr_1.2fr] lg:items-start">
        <div>
          <p className="eyebrow">Qui sommes-nous</p>
          <h2 className="h2 mt-2">{c["about.title"]}</h2>
          <p className="mt-4 leading-relaxed text-slate-700">{c["about.body"]}</p>
          <p className="mt-4 rounded-2xl bg-surface p-4 text-sm leading-relaxed text-brand-800">{c["about.figures"]}</p>
        </div>
        {refs.length > 0 && (
          <ul className="grid gap-4 sm:grid-cols-2">
            {refs.map((r) => (
              <li key={r.name + r.text} className="card flex flex-col gap-3">
                <span className="flex gap-0.5 text-accent-500" aria-label="5 sur 5">{[0, 1, 2, 3, 4].map((i) => <Icon key={i} name="star" className="h-4 w-4 fill-current" />)}</span>
                <p className="text-sm text-slate-700">« {r.text} »</p>
                <p className="mt-auto text-sm font-semibold text-brand-800">{r.name}{r.role && <span className="font-normal text-muted"> · {r.role}</span>}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

export function FinalCta({ c }: { c: SiteContent }) {
  return (
    <section className="container-x pb-4 pt-8 sm:pb-8">
      <div className="rounded-3xl bg-gradient-to-br from-brand-800 to-brand-900 px-5 py-10 text-white sm:px-12 sm:py-14">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="h2 text-white">{c["cta.final_title"]}</h2>
          <p className="mt-3 text-slate-300">Prix calculé en ligne, chauffeur dédié, paiement sécurisé.</p>
        </div>
        <div className="mx-auto mt-8 max-w-3xl">
          <RouteSearch compact labels={{ from: c["hero.route_from"] ?? "Adresse de départ", to: c["hero.route_to"] ?? "Adresse d'arrivée", button: c["hero.route_button"] ?? "Voir le prix" }} />
        </div>
        <p className="mt-6 text-center text-sm text-slate-300">
          Ou appelez l&apos;exploitation : <a href={`tel:${c["contact.phone_e164"]}`} className="font-semibold text-white underline">{c["contact.phone"]}</a>
        </p>
      </div>
    </section>
  );
}
