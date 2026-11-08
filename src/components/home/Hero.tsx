import Image from "next/image";
import Link from "next/link";
import { RouteSearch } from "@/components/RouteSearch";
import { Icon } from "@/components/Icon";
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
            <Icon name="pin" className="h-3.5 w-3.5 text-primary-400" /> {c["hero.badge"] ?? "Transporteur en Île-de-France depuis 2016"}
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

        <div className="relative hidden lg:block">
          <div className="relative aspect-[4/3] w-full overflow-hidden rounded-3xl shadow-float ring-1 ring-white/10">
            <Image src="/images/hero/hero-livraison.jpg" alt={c["hero.image_alt"] ?? "Deux livreurs WANYM SOLUTION chargent un canapé emballé dans un utilitaire blanc à bande verte"} fill priority sizes="(min-width: 1024px) 560px, 0px" className="object-cover" />
            <div className="absolute inset-x-0 bottom-0 flex flex-wrap gap-2 bg-gradient-to-t from-brand-900/80 to-transparent p-5 pt-12">
              {[["1 m²", "3 m³"], ["2 m²", "6 m³"], ["4 m²", "12 m³"], ["8 m²", "20 m³"]].map(([m, v]) => (
                <span key={m} className="rounded-lg bg-white/15 px-2.5 py-1 text-sm font-semibold backdrop-blur">{m} <span className="font-normal text-slate-200">· {v}</span></span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
