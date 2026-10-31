import Link from "next/link";
import type { SiteContent } from "@/lib/types";

export function Footer({ content }: { content: SiteContent }) {
  const year = 2026;
  return (
    <footer className="mt-20 border-t border-slate-200 bg-brand-900 text-slate-300">
      <div className="container-x grid gap-10 py-14 md:grid-cols-4">
        <div className="md:col-span-2">
          <p className="text-lg font-extrabold tracking-wide text-white">{content["site.name"] ?? "WANYM SOLUTION"}</p>
          <p className="mt-3 max-w-md text-sm leading-relaxed">{content["site.tagline"]}</p>
          <p className="mt-4 text-sm">{content["about.figures"]}</p>
        </div>
        <div>
          <p className="font-semibold text-white">Contact</p>
          <ul className="mt-3 space-y-2 text-sm">
            <li>
              <a href={`tel:${content["contact.phone_e164"]}`} className="hover:text-white">
                {content["contact.phone"]}
              </a>{" "}
              <span className="text-slate-500">· {content["contact.hours"]}</span>
            </li>
            <li>
              <a href={`mailto:${content["contact.email"]}`} className="hover:text-white">
                {content["contact.email"]}
              </a>
            </li>
            <li>{content["contact.address"]}</li>
          </ul>
        </div>
        <div>
          <p className="font-semibold text-white">Liens</p>
          <ul className="mt-3 space-y-2 text-sm">
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
        © {year} {content["legal.company"] ?? "WANYM SOLUTION"} · {content["legal.form"]} · Drancy (93)
      </div>
    </footer>
  );
}
