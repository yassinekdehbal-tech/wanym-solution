import Link from "next/link";
import { Icon } from "@/components/Icon";
import { Logo } from "@/components/Logo";
import type { SiteContent } from "@/lib/types";

const nav = [
  { href: "/services", label: "Services" },
  { href: "/#professionnels", label: "Professionnels" },
  { href: "/#camions", label: "Tarifs" },
  { href: "/suivi", label: "Suivi" },
  { href: "/contact", label: "Contact" },
];

/**
 * En-tête : logo, navigation (menu <details> sur mobile, sans JavaScript),
 * téléphone exploitation et « Commander » toujours visible.
 */
export function Header({ content }: { content: SiteContent }) {
  const phone = content["contact.phone"] ?? "07 67 16 60 15";
  const tel = `tel:${content["contact.phone_e164"] ?? "+33767166015"}`;
  const cta = content["hero.cta_primary"] ?? "Commander";
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/85">
      <div className="container-x flex h-16 items-center justify-between gap-3">
        <Link href="/" className="flex shrink-0 items-center rounded-lg focus:outline-none focus-visible:ring-4 focus-visible:ring-primary-500/40" aria-label="WANYM SOLUTION, accueil">
          <Logo className="h-8 w-auto sm:h-9" />
        </Link>

        <nav className="hidden items-center gap-1 lg:flex" aria-label="Navigation principale">
          {nav.map((n) => (
            <Link key={n.href} href={n.href} className="rounded-lg px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 hover:text-brand-800">
              {n.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <a href={tel} className="hidden items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-brand-800 hover:bg-slate-100 md:inline-flex">
            <span className="grid h-8 w-8 place-items-center rounded-full bg-primary-50 text-primary-700"><Icon name="phone" className="h-4 w-4" /></span>
            <span className="leading-tight">
              {phone}
              <span className="block text-[11px] font-medium text-muted">Exploitation 24h/24</span>
            </span>
          </a>
          <Link href="/commander" className="btn-primary btn-sm">
            <span className="sm:hidden">Commander</span>
            <span className="hidden sm:inline">{cta}</span>
            <Icon name="arrow" className="hidden h-4 w-4 sm:block" />
          </Link>

          <details className="group relative lg:hidden">
            <summary className="grid h-11 w-11 cursor-pointer list-none place-items-center rounded-lg text-brand-800 hover:bg-slate-100 focus:outline-none focus-visible:ring-4 focus-visible:ring-primary-500/40 [&::-webkit-details-marker]:hidden" aria-label="Ouvrir le menu">
              <Icon name="menu" className="h-6 w-6 group-open:hidden" />
              <Icon name="close" className="hidden h-6 w-6 group-open:block" />
            </summary>
            <nav className="absolute right-0 top-full mt-2 w-64 overflow-hidden rounded-2xl border border-slate-200 bg-white p-2 shadow-float" aria-label="Menu mobile">
              {nav.map((n) => (
                <Link key={n.href} href={n.href} className="flex min-h-11 items-center justify-between rounded-xl px-3 py-2 text-base font-medium text-slate-800 hover:bg-slate-100">
                  {n.label}
                  <Icon name="chevron" className="h-4 w-4 text-slate-400" />
                </Link>
              ))}
              <a href={tel} className="mt-1 flex min-h-11 items-center gap-2 rounded-xl bg-primary-50 px-3 py-2 text-base font-semibold text-primary-800">
                <Icon name="phone" className="h-4 w-4" /> {phone}
              </a>
            </nav>
          </details>
        </div>
      </div>
    </header>
  );
}
