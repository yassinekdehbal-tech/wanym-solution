import type { Metadata } from "next";
import { Markdown } from "@/components/Markdown";
import { getContent } from "@/lib/supabase/content";

export const metadata: Metadata = { title: "Conditions générales de vente", robots: { index: false } };

export default async function CgvPage() {
  const c = await getContent();
  return (
    <main className="container-x max-w-3xl py-10 sm:py-16">
      <p className="eyebrow">Informations légales</p>
      <h1 className="h1 mt-2 text-brand-800">Conditions générales de vente</h1>
      <p className="mt-2 text-sm text-muted">{c["legal.company"]} · {c["contact.address"]}</p>
      <div className="card mt-8">
        <Markdown>{c["cgv.body"] ?? "Conditions générales de vente en cours de rédaction. Contactez-nous pour en obtenir une copie."}</Markdown>
      </div>
    </main>
  );
}
