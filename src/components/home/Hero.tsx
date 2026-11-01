import Link from "next/link";
import { RouteSearch } from "@/components/RouteSearch";
import { Icon } from "@/components/Icon";
import { TruckIcon } from "@/components/TruckIcon";
import type { SiteContent } from "@/lib/types";

/**
 * Hero : titre et sous-titre éditables, widget d'adresses visible sans défilement
 * à 390 px (le visuel passe sous le formulaire sur mobile, à droite sur desktop).
 * L'emplacement « photo » est un panneau illustré tant que la photo officielle
 * n'est pas fournie (docs/refonte-da.md §6).
 */
export function Hero({ c }: { c: SiteContent }) {
  return (
    <section className="relative overflow-hidden bg-brand-800 text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_60%_at_80%_20%,rgba(0,166,126,0.25),transparent)]" aria-hidden="true" />
      <div className="container-x relative grid gap-6 py-8 sm:py-12 lg:grid-cols-[1.1fr_1fr] lg:items-center lg:gap-12 lg:py-20">
        <div>
          <p className="chip bg-white/10 text-white ring-1 ring-white/15">
            <Icon name="pin" className="h-3.5 w-3.5 text-primary-400" /> Depuis 2016 à Drancy (93)
          </p>
          <h1 className="h1 mt-4 text-white">{c["hero.title"]}</h1>
          <p className="lead mt-4 max-w-xl text-slate-200">{c["hero.subtitle"]}</p>

          <div className="mt-5 flex gap-2 text-sm">
            <Link href="/commander" className="btn-light btn-sm"><Icon name="user" className="h-4 w-4" /> Particulier</Link>
            <Link href="/#professionnels" className="btn-sm inline-flex min-h-11 items-center gap-2 rounded-xl border border-white/25 px-4 text-sm font-semibold text-white hover:bg-white/10"><Icon name="building" className="h-4 w-4" /> Professionnel</Link>
          </div>

          <div className="mt-5 lg:mt-8">
            <RouteSearch labels={{ title: c["hero.route_title"], from: c["hero.route_from"] ?? "Adresse de départ", to: c["hero.route_to"] ?? "Adresse d'arrivée", button: c["hero.route_button"] ?? "Voir le prix" }} />
          </div>
        </div>

        <div className="hidden lg:block" aria-hidden="true">
          <div className="relative mx-auto aspect-[4/3] w-full max-w-lg overflow-hidden rounded-3xl bg-gradient-to-br from-brand-700 to-brand-900 p-8 ring-1 ring-white/10">
            <div className="absolute inset-x-8 bottom-8 h-px bg-white/15" />
            <TruckIcon size={3} className="absolute bottom-8 left-8 h-40 w-auto" color="#ffffff" />
            <div className="absolute right-8 top-8 space-y-2 text-right">
              {[["1 m²", "3 m³"], ["2 m²", "6 m³"], ["4 m²", "12 m³"], ["8 m²", "20 m³"]].map(([m, v]) => (
                <div key={m} className="rounded-xl bg-white/10 px-3 py-1.5 text-sm font-semibold backdrop-blur">
                  {m} <span className="font-normal text-slate-300">· {v}</span>
                </div>
              ))}
            </div>
            <p className="absolute bottom-10 right-8 max-w-[11rem] text-right text-sm text-slate-300">Un chauffeur, le bon utilitaire, le prix affiché avant de payer.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
