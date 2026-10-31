import type { Metadata } from "next";
import Link from "next/link";
import { Icon } from "@/components/Icon";
import { getContent } from "@/lib/supabase/content";

export const metadata: Metadata = { title: "Contact", description: "Contactez l'exploitation WANYM SOLUTION, joignable 24h/24 : téléphone, e-mail, adresse à Drancy (93)." };

export default async function ContactPage() {
  const c = await getContent();
  const items = [
    { icon: "phone", label: "Téléphone", value: c["contact.phone"], href: `tel:${c["contact.phone_e164"]}`, note: c["contact.hours"] },
    { icon: "mail", label: "E-mail", value: c["contact.email"], href: `mailto:${c["contact.email"]}` },
    { icon: "pin", label: "Adresse", value: c["contact.address"], href: `https://maps.google.com/?q=${encodeURIComponent(c["contact.address"] ?? "")}` },
  ];
  return (
    <main className="container-x max-w-4xl py-12 sm:py-16">
      <h1 className="text-3xl font-extrabold text-brand-800 sm:text-4xl">{c["contact.title"] ?? "Contact"}</h1>
      <p className="mt-3 max-w-2xl text-slate-600">{c["contact.lead"]}</p>
      <div className="mt-10 grid gap-6 sm:grid-cols-3">
        {items.map((it) => (
          <a key={it.label} href={it.href} className="card flex flex-col gap-3 hover:shadow-md" target={it.href.startsWith("http") ? "_blank" : undefined} rel="noopener">
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-brand-50 text-brand-800"><Icon name={it.icon} /></span>
            <span className="text-sm font-semibold uppercase tracking-wide text-slate-500">{it.label}</span>
            <span className="font-semibold text-brand-800">{it.value}</span>
            {it.note && <span className="text-sm text-slate-500">{it.note}</span>}
          </a>
        ))}
      </div>
      <div className="mt-12 rounded-3xl bg-brand-800 p-8 text-white">
        <h2 className="text-xl font-bold">Besoin d&apos;un transport ?</h2>
        <p className="mt-2 text-slate-200">Le plus rapide reste de passer commande en ligne : prix immédiat pour l&apos;express en Île-de-France, devis sous 24h pour le reste.</p>
        <Link href="/commander" className="btn-primary mt-5">{c["hero.cta_primary"]}</Link>
      </div>
    </main>
  );
}
