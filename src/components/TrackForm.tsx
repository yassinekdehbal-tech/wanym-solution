"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { formatEuros } from "@/lib/pricing";

type Tracked = {
  reference: string;
  created_at: string;
  status_label: string;
  pickup_address: string;
  delivery_address: string;
  wanted_date: string | null;
  total_cents: number | null;
  payment_status: string;
  invoice_number: string | null;
  invoice_url: string | null;
  events: { at: string; type: string; message: string | null }[];
};

export function TrackForm() {
  const params = useSearchParams();
  const [reference, setReference] = useState(params.get("ref") ?? "");
  const [email, setEmail] = useState("");
  const [result, setResult] = useState<Tracked | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  return (
    <div className="space-y-6">
      <form
        className="card grid gap-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end"
        onSubmit={async (e) => {
          e.preventDefault();
          setLoading(true);
          setError(null);
          setResult(null);
          try {
            const res = await fetch("/api/track", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ reference, email }) });
            const json = await res.json();
            if (!res.ok) setError(json.error ?? json.fields?.reference ?? "Commande introuvable.");
            else setResult(json as Tracked);
          } catch {
            setError("Connexion impossible.");
          } finally {
            setLoading(false);
          }
        }}
      >
        <div>
          <label className="label" htmlFor="ref">Numéro de commande</label>
          <input id="ref" className="field uppercase" placeholder="WS-2026-00001" value={reference} onChange={(e) => setReference(e.target.value)} required />
        </div>
        <div>
          <label className="label" htmlFor="track-email">E-mail de commande</label>
          <input id="track-email" type="email" className="field" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <button className="btn-dark" disabled={loading}>{loading ? "Recherche…" : "Suivre"}</button>
      </form>
      {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      {result && (
        <div className="card space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-xl font-bold text-brand-800">{result.reference}</h2>
            <span className="rounded-full bg-brand-50 px-3 py-1 text-sm font-semibold text-brand-800">{result.status_label}</span>
          </div>
          <p className="text-sm text-slate-600">
            {result.pickup_address} → {result.delivery_address}
            {result.wanted_date && ` · ${result.wanted_date}`}
          </p>
          {result.total_cents != null && (
            <p className="text-sm text-slate-600">
              Montant : {formatEuros(result.total_cents)} TTC · {({ paid: "payé", authorized: "empreinte bancaire enregistrée", pending: "paiement en attente", not_required: "sur devis", failed: "paiement non abouti", refunded: "remboursé / relâché" } as Record<string, string>)[result.payment_status]}
            </p>
          )}
          {result.invoice_number && (
            <p className="text-sm">
              Facture {result.invoice_number}
              {result.invoice_url && (
                <>
                  {" · "}
                  <a className="font-semibold text-brand-600 underline" href={result.invoice_url} target="_blank" rel="noopener">Télécharger</a>
                </>
              )}
            </p>
          )}
          <ol className="relative space-y-4 border-l-2 border-slate-200 pl-5">
            {result.events.map((e, i) => (
              <li key={i} className="text-sm">
                <span className="absolute -left-[7px] mt-1 h-3 w-3 rounded-full bg-accent-500" />
                <p className="font-medium text-slate-900">{e.message}</p>
                <p className="text-xs text-slate-500">{new Date(e.at).toLocaleString("fr-FR")}</p>
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}
