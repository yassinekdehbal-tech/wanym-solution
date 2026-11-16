import type { Metadata } from "next";
import { getContent } from "@/lib/supabase/content";

export const metadata: Metadata = { title: "Mentions légales", robots: { index: false } };

export default async function LegalPage() {
  const c = await getContent();
  const rows = [
    ["Raison sociale", c["legal.company"]],
    ["Forme juridique", c["legal.form"]],
    ["SIREN", c["legal.siren"]],
    ["SIRET du siège", c["legal.siret"]],
    ["RCS", c["legal.rcs"]],
    ["TVA intracommunautaire", c["legal.tva"]],
    ["Activité (NAF)", c["legal.naf"]],
    ["Siège social", c["legal.address"] ?? c["contact.address"]],
    ["Téléphone", c["contact.phone"]],
    ["E-mail", c["contact.email"]],
    ["Directeur de la publication", c["legal.director"]],
    ["Hébergeur", c["legal.host"]],
  ];
  return (
    <main className="container-x max-w-3xl py-10 sm:py-16">
      <p className="eyebrow">Informations légales</p>
      <h1 className="h1 mt-2 text-brand-800">Mentions légales</h1>
      <dl className="mt-8 divide-y divide-slate-200 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card">
        {rows.map(([k, v]) => (
          <div key={k} className="grid gap-1 p-4 sm:grid-cols-[220px_1fr]">
            <dt className="text-sm font-semibold text-muted">{k}</dt>
            <dd className="text-brand-900">{v || "—"}</dd>
          </div>
        ))}
      </dl>
      <section className="prose prose-slate mt-10 max-w-none prose-headings:font-display prose-headings:text-brand-800">
        <h2>Données personnelles</h2>
        <p>
          Les informations saisies dans le formulaire de commande (coordonnées, adresses, description de la marchandise) sont nécessaires à l&apos;exécution de la prestation de transport et à la relation client. Elles sont conservées pendant la durée légale de conservation des documents commerciaux et ne sont transmises qu&apos;aux prestataires nécessaires à l&apos;exécution : hébergement (Vercel), base de données (Supabase, Union européenne), e-mails transactionnels (Resend), paiement (Stripe) et notre outil d&apos;exploitation.
        </p>
        <p>
          Conformément au RGPD, vous disposez d&apos;un droit d&apos;accès, de rectification, d&apos;effacement et d&apos;opposition. Pour l&apos;exercer : {c["contact.email"]}.
        </p>
        <h2 id="cookies">Cookies et mesure publicitaire</h2>
        <p>
          Le site fonctionne sans cookie publicitaire. Avec votre accord, donné dans le bandeau affiché à la première visite et modifiable à tout moment via « Gérer les cookies » en pied de page, nous utilisons trois balises de mesure : Google Ads (balise Google, mode consentement v2), le pixel Meta (Facebook, Instagram) et le LinkedIn Insight Tag. Elles servent uniquement à savoir quelle campagne a conduit à une commande ou à une demande de devis. Sans accord, elles ne sont pas chargées et Google Ads ne dépose aucun cookie.
        </p>
        <p>
          Votre choix est conservé six mois sur votre appareil. Les seules données techniques indispensables au fonctionnement (préférences du formulaire, attribution de la commande à la campagne d&apos;origine) sont stockées localement et ne sont transmises à aucun tiers publicitaire.
        </p>
      </section>
    </main>
  );
}
