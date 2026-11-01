import type { Metadata } from "next";
import Link from "next/link";
import { Icon } from "@/components/Icon";
import { getContent } from "@/lib/supabase/content";

export const metadata: Metadata = { title: "Contact", description: "Contactez l'exploitation WANYM SOLUTION, joignable 24h/24 : téléphone, e-mail, adresse à Drancy (93)." };

export default async function ContactPage() {
  const c = await getContent();
  return (
    <main className="container-x max-w-4xl py-10 sm:py-16">
      <p className="eyebrow">Contact</p>
      <h1 className="h1 mt-2 text-brand-800">{c["contact.title"] ?? "Contact"}</h1>
      <p className="lead mt-3 max-w-2xl">{c["contact.lead"]}</p>

      <a href={`tel:${c["contact.phone_e164"]}`} className="card-interactive mt-8 flex items-center gap-4 bg-brand-800 text-white hover:bg-brand-700 sm:gap-6">
        <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-primary-600 text-white sm:h-16 sm:w-16"><Icon name="phone" className="h-7 w-7" /></span>
        <span className="min-w-0">
          <span className="block text-sm font-semibold uppercase tracking-wide text-primary-400">Exploitation · {c["contact.hours"]}</span>
          <span className="block font-display text-3xl font-extrabold sm:text-4xl">{c["contact.phone"]}</span>
          <span className="block text-sm text-slate-300">Appel direct, une personne de l&apos;exploitation vous répond.</span>
        </span>
      </a>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <a href={`mailto:${c["contact.email"]}`} className="card-interactive flex items-start gap-4">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary-50 text-primary-700"><Icon name="mail" /></span>
          <span>
            <span className="block text-sm font-semibold uppercase tracking-wide text-muted">E-mail</span>
            <span className="block font-semibold text-brand-800">{c["contact.email"]}</span>
            <span className="block text-sm text-muted">Devis, factures, questions</span>
          </span>
        </a>
        <a href={`https://maps.google.com/?q=${encodeURIComponent(c["contact.address"] ?? "")}`} target="_blank" rel="noopener" className="card-interactive flex items-start gap-4">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary-50 text-primary-700"><Icon name="pin" /></span>
          <span>
            <span className="block text-sm font-semibold uppercase tracking-wide text-muted">Adresse</span>
            <span className="block font-semibold text-brand-800">{c["contact.address"]}</span>
            <span className="block text-sm text-muted">Aux portes de Paris</span>
          </span>
        </a>
      </div>

      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        <div className="card">
          <p className="font-display text-lg font-bold text-brand-800">Particuliers</p>
          <p className="mt-2 text-sm text-slate-600">Le plus rapide : commandez en ligne, le prix s&apos;affiche avant paiement et la course part à l&apos;exploitation immédiatement.</p>
          <Link href="/commander" className="btn-primary mt-4">{c["hero.cta_primary"]}</Link>
        </div>
        <div className="card">
          <p className="font-display text-lg font-bold text-brand-800">Professionnels</p>
          <p className="mt-2 text-sm text-slate-600">Flux réguliers, livraison externalisée, transport dédié : décrivez vos besoins, nous revenons vers vous sous 24 h avec un chiffrage clair.</p>
          <Link href="/#professionnels" className="btn-outline mt-4">Nos offres pro</Link>
        </div>
      </div>
    </main>
  );
}
