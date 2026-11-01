"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { Icon } from "@/components/Icon";
import { Timeline } from "@/components/Timeline";
import { formatEuros } from "@/lib/pricing";
import type { OrderStatus } from "@/lib/types";

type Tracked = {
  reference: string;
  created_at: string;
  status: OrderStatus;
  status_label: string;
  pickup_address: string;
  delivery_address: string;
  wanted_date: string | null;
  wanted_slot: string | null;
  pricing_mode: "instant" | "quote";
  total_cents: number | null;
  payment_status: string;
  invoice_number: string | null;
  invoice_url: string | null;
  events: { at: string; type: string; message: string | null }[];
};

const PAYMENT: Record<string, string> = { paid: "payé", authorized: "empreinte bancaire enregistrée", pending: "paiement en attente", not_required: "sur devis", failed: "paiement non abouti", refunded: "remboursé" };

export function TrackForm() {
  const params = useSearchParams();
  const [reference, setReference] = useState(params.get("ref") ?? "");
  const [email, setEmail] = useState("");
  const [result, setResult] = useState<Tracked | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Horodatage de chaque étape, déduit du journal public (le premier événement "status" qui l'atteint).
  const dates = result
    ? {
        recue: result.created_at,
        confirmee: result.events.find((e) => e.type === "status" && /confirm|planifi/i.test(e.message ?? ""))?.at,
        en_cours: result.events.find((e) => e.type === "status" && /en cours|retir|prise en charge/i.test(e.message ?? ""))?.at,
        livree: result.events.find((e) => e.type === "status" && /livr/i.test(e.message ?? ""))?.at,
      }
    : undefined;

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
            const res = await fetch("/api/track", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ reference: reference.trim().toUpperCase(), email: email.trim().toLowerCase() }) });
            const json = await res.json();
            if (!res.ok) setError(json.error ?? json.fields?.reference ?? "Commande introuvable.");
            else setResult(json as Tracked);
          } catch {
            setError("Connexion impossible. Vérifiez votre réseau puis réessayez.");
          } finally {
            setLoading(false);
          }
        }}
      >
        <div>
          <label className="label" htmlFor="ref">Numéro de commande</label>
          <input id="ref" className="field uppercase" placeholder="WS-2026-00001" value={reference} onChange={(e) => setReference(e.target.value)} required autoComplete="off" aria-invalid={!!error || undefined} />
        </div>
        <div>
          <label className="label" htmlFor="track-email">E-mail de commande</label>
          <input id="track-email" type="email" inputMode="email" autoComplete="email" className="field" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <button className="btn-primary" disabled={loading} aria-busy={loading || undefined}>{loading ? "Recherche…" : "Suivre"}</button>
      </form>

      {error && (
        <div className="alert-error flex items-start gap-2" role="alert">
          <Icon name="alert" className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error} Besoin d&apos;aide ? Appelez l&apos;exploitation au <a className="font-semibold underline" href="tel:+33767166015">07 67 16 60 15</a>.</span>
        </div>
      )}

      {result && (
        <div className="card space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="eyebrow">Commande</p>
              <h2 className="font-display text-2xl font-extrabold text-brand-800">{result.reference}</h2>
            </div>
            <span className={`chip ${result.status === "cancelled" ? "bg-danger-50 text-danger-700" : result.status === "sav" ? "bg-accent-50 text-accent-700" : "bg-primary-50 text-primary-700"}`}>{result.status_label}</span>
          </div>

          <Timeline status={result.status} dates={dates} />

          <dl className="grid gap-3 rounded-xl bg-surface p-4 text-sm sm:grid-cols-2">
            <div><dt className="text-muted">Départ</dt><dd className="font-medium text-brand-900">{result.pickup_address}</dd></div>
            <div><dt className="text-muted">Arrivée</dt><dd className="font-medium text-brand-900">{result.delivery_address}</dd></div>
            {result.wanted_date && <div><dt className="text-muted">Date</dt><dd className="font-medium text-brand-900">{new Date(result.wanted_date + "T12:00:00").toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}{result.wanted_slot ? ` · ${result.wanted_slot}` : ""}</dd></div>}
            {result.total_cents != null ? (
              <div><dt className="text-muted">Montant</dt><dd className="font-medium text-brand-900">{formatEuros(result.total_cents)} TTC · {PAYMENT[result.payment_status] ?? result.payment_status}</dd></div>
            ) : (
              <div><dt className="text-muted">Montant</dt><dd className="font-medium text-brand-900">Devis en préparation</dd></div>
            )}
            {result.invoice_number && (
              <div className="sm:col-span-2">
                <dt className="text-muted">Facture</dt>
                <dd className="font-medium text-brand-900">
                  {result.invoice_number}
                  {result.invoice_url && <> · <a className="font-semibold text-primary-700 underline" href={result.invoice_url} target="_blank" rel="noopener">Télécharger</a></>}
                </dd>
              </div>
            )}
          </dl>

          <div>
            <p className="mb-3 font-display font-bold text-brand-800">Messages de l&apos;exploitation</p>
            {result.events.length === 0 ? (
              <p className="rounded-xl border border-dashed border-slate-300 p-4 text-sm text-muted">Aucune mise à jour pour le moment : vous serez prévenu par e-mail à chaque étape.</p>
            ) : (
              <ol className="relative space-y-4 border-l-2 border-slate-200 pl-5">
                {result.events.map((e, i) => (
                  <li key={i} className="text-sm">
                    <span className={`absolute -left-[7px] mt-1 h-3 w-3 rounded-full ${i === result.events.length - 1 ? "bg-primary-600" : "bg-slate-300"}`} />
                    <p className="font-medium text-brand-900">{e.message}</p>
                    <p className="text-xs text-muted">{new Date(e.at).toLocaleString("fr-FR", { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" })}</p>
                  </li>
                ))}
              </ol>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
