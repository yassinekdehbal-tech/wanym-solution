import Link from "next/link";
import { Icon } from "@/components/Icon";
import { Logo } from "@/components/Logo";
import type { SiteContent } from "@/lib/types";

export function Footer({ content }: { content: SiteContent }) {
  const year = 2026;
  return (
    <footer className="mt-16 bg-brand-900 text-slate-300 sm:mt-24">
      <div className="container-x grid gap-10 py-14 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <Logo className="h-9 w-auto" dark />
          <p className="mt-4 max-w-md text-sm leading-relaxed">{content["site.tagline"]}</p>
          <p className="mt-3 text-sm text-slate-400">{content["about.figures"]}</p>
          <Link href="/commander" className="btn-primary btn-sm mt-6">
            {content["hero.cta_primary"] ?? "Commander un transport"} <Icon name="arrow" className="h-4 w-4" />
          </Link>
        </div>
        <div>
          <p className="font-display font-bold text-white">Exploitation</p>
          <ul className="mt-3 space-y-2.5 text-sm">
            <li className="flex items-start gap-2">
              <Icon name="phone" className="mt-0.5 h-4 w-4 shrink-0 text-primary-400" />
              <span>
                <a href={`tel:${content["contact.phone_e164"]}`} className="font-semibold text-white hover:underline">{content["contact.phone"]}</a>
                <span className="block text-slate-400">{content["contact.hours"]}</span>
              </span>
            </li>
            <li className="flex items-start gap-2">
              <Icon name="mail" className="mt-0.5 h-4 w-4 shrink-0 text-primary-400" />
              <a href={`mailto:${content["contact.email"]}`} className="hover:text-white">{content["contact.email"]}</a>
            </li>
            <li className="flex items-start gap-2">
              <Icon name="pin" className="mt-0.5 h-4 w-4 shrink-0 text-primary-400" />
              <span>{content["contact.address"]}</span>
            </li>
          </ul>
        </div>
        <div>
          <p className="font-display font-bold text-white">Le site</p>
          <ul className="mt-3 space-y-2.5 text-sm">
            <li><Link href="/services" className="hover:text-white">Nos services</Link></li>
            <li><Link href="/commander" className="hover:text-white">Commander un transport</Link></li>
            <li><Link href="/suivi" className="hover:text-white">Suivre ma commande</Link></li>
            <li><Link href="/contact" className="hover:text-white">Contact</Link></li>
            <li><Link href="/mentions-legales" className="hover:text-white">Mentions légales</Link></li>
            <li><Link href="/cgv" className="hover:text-white">Conditions générales de vente</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10 py-5 text-center text-xs text-slate-500">
        © {year} {content["legal.company"] ?? "WANYM SOLUTION"} · {content["legal.form"]} · Drancy (93) · Paiement sécurisé par Stripe
      </div>
    </footer>
  );
}
