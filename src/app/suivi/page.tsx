import type { Metadata } from "next";
import { Suspense } from "react";
import { TrackForm } from "@/components/TrackForm";
import { getContent } from "@/lib/supabase/content";

export const metadata: Metadata = { title: "Suivre ma commande", robots: { index: false } };

export default async function TrackPage() {
  const c = await getContent();
  return (
    <main className="container-x max-w-3xl py-10 sm:py-16">
      <p className="eyebrow">Suivi</p>
      <h1 className="h1 mt-2 text-brand-800">{c["track.title"] ?? "Suivre ma commande"}</h1>
      <p className="lead mt-3">{c["track.lead"]}</p>
      <div className="mt-8">
        <Suspense fallback={<div className="card h-32 animate-pulse" />}>
          <TrackForm />
        </Suspense>
      </div>
    </main>
  );
}
