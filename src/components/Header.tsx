import Link from "next/link";
import type { SiteContent } from "@/lib/types";
import { Icon } from "@/components/Icon";

const nav = [
  { href: "/services", label: "Services" },
  { href: "/#tarifs", label: "Tarifs" },
  { href: "/suivi", label: "Suivi" },
  { href: "/contact", label: "Contact" },
];

export function Header({ content }: { content: SiteContent }) {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="container-x flex h-16 items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2 font-extrabold tracking-wide text-brand-800">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-brand-800 text-accent-500">
            <Icon name="truck" className="h-5 w-5" />
          </span>
          <span className="text-sm sm:text-base">{content["site.name"] ?? "WANYM SOLUTION"}</span>
        </Link>
        <nav className="hidden items-center gap-6 text-sm font-medium text-slate-700 md:flex" aria-label="Navigation principale">
          {nav.map((n) => (
            <Link key={n.href} href={n.href} className="hover:text-brand-800">
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <a href={`tel:${content["contact.phone_e164"] ?? "+33767166015"}`} className="btn-ghost hidden px-3 py-2 text-sm lg:inline-flex">
            <Icon name="phone" className="h-4 w-4" />
            {content["contact.phone"] ?? "07 67 16 60 15"}
          </a>
          <Link href="/commander" className="btn-primary px-4 py-2 text-sm">
            {content["hero.cta_primary"] ?? "Commander un transport"}
          </Link>
        </div>
      </div>
    </header>
  );
}
