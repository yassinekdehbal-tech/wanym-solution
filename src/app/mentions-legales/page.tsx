import type { Metadata } from "next";
import { getContent } from "@/lib/supabase/content";

export const metadata: Metadata = { title: "Mentions légales", robots: { index: false } };

export default async function LegalPage() {
  const c = await getContent();
  const rows = [
    ["Raison sociale", c["legal.company"]],
    ["Forme juridique", c["legal.form"]],
    ["SIREN", c["legal.siren"]],
    ["RCS", c["legal.rcs"]],
    ["TVA intracommunautaire", c["legal.tva"]],
    ["Siège social", c["contact.address"]],
    ["Téléphone", c["contact.phone"]],
    ["E-mail", c["contact.email"]],
    ["Directeur de la publication", c["legal.director"]],
    ["Hébergeur", c["legal.host"]],
  ];
  return (
    <main className="container-x max-w-3xl py-12 sm:py-16">
      <h1 className="text-3xl font-extrabold text-brand-800">Mentions légales</h1>
      <dl className="mt-8 divide-y divide-slate-200 rounded-2xl border border-slate-200">
        {rows.map(([k, v]) => (
          <div key={k} className="grid gap-1 p-4 sm:grid-cols-[220px_1fr]">
            <dt className="text-sm font-semibold text-slate-500">{k}</dt>
            <dd className="text-slate-900">{v || "—"}</dd>
          </div>
        ))}
      </dl>
      <section className="prose prose-slate mt-10 max-w-none">
        <h2>Données personnelles</h2>
        <p>
          Les informations saisies dans le formulaire de commande (coordonnées, adresses, description de la marchandise) sont nécessaires à l&apos;exécution de la prestation de transport et à la relation client. Elles sont conservées pendant la durée légale de conservation des documents commerciaux et ne sont transmises qu&apos;aux prestataires nécessaires à l&apos;exécution : hébergement (Vercel), base de données (Supabase, Union européenne), e-mails transactionnels (Resend), paiement (Stripe) et notre outil d&apos;exploitation.
        </p>
        <p>
          Conformément au RGPD, vous disposez d&apos;un droit d&apos;accès, de rectification, d&apos;effacement et d&apos;opposition. Pour l&apos;exercer : {c["contact.email"]}.
        </p>
        <h2>Cookies et mesure d&apos;audience</h2>
        <p>
          Le site utilise la balise Google (Google Ads) afin de mesurer les conversions issues de nos campagnes publicitaires. Aucune donnée nominative n&apos;est transmise à Google par cette balise.
        </p>
      </section>
    </main>
  );
}
