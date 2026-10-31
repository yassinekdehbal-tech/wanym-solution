"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { readAttribution } from "@/components/AttributionCapture";
import { Icon } from "@/components/Icon";
import { formatEuros, type Quote } from "@/lib/pricing";
import { SLOT_LABELS, SLOTS, UNITS } from "@/lib/schemas/order";
import type { PricingRule, Service } from "@/lib/types";

type Values = {
  service_slug: string;
  pickup_address: string;
  pickup_contact: string;
  delivery_address: string;
  delivery_contact: string;
  wanted_date: string;
  wanted_slot: (typeof SLOTS)[number];
  goods_type: string;
  quantity: number;
  quantity_unit: (typeof UNITS)[number];
  dimensions: string;
  weight_kg: string;
  options: { handling: boolean; floor: boolean; fragile: boolean };
  company: string;
  contact_name: string;
  email: string;
  phone: string;
  notes: string;
  accept_terms: boolean;
  website: string; // honeypot
};

const STEPS = ["Trajet", "Marchandise", "Coordonnées", "Récapitulatif"] as const;
const DRAFT_KEY = "wanym:order-draft";

function todayIso() {
  const d = new Date();
  return new Date(d.getTime() - d.getTimezoneOffset() * 60_000).toISOString().slice(0, 10);
}

const initial = (service: string): Values => ({
  service_slug: service,
  pickup_address: "",
  pickup_contact: "",
  delivery_address: "",
  delivery_contact: "",
  wanted_date: todayIso(),
  wanted_slot: "day",
  goods_type: "",
  quantity: 1,
  quantity_unit: "colis",
  dimensions: "",
  weight_kg: "",
  options: { handling: false, floor: false, fragile: false },
  company: "",
  contact_name: "",
  email: "",
  phone: "",
  notes: "",
  accept_terms: false,
  website: "",
});

export function OrderForm({
  services,
  rules,
  copy,
}: {
  services: Service[];
  rules: PricingRule[];
  copy: { quoteNotice: string; cancelledBody: string };
}) {
  const router = useRouter();
  const params = useSearchParams();
  const defaultService = useMemo(
    () => rules.find((r) => r.instant_booking)?.service_slug ?? services[0]?.slug ?? "",
    [rules, services],
  );
  const [v, setV] = useState<Values>(() => initial(defaultService));
  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [quote, setQuote] = useState<Quote | null>(null);
  const [quoting, setQuoting] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const topRef = useRef<HTMLDivElement>(null);
  const cancelled = params.get("cancelled") === "1";

  // Prefill from ?from=&to=&service= and restore a draft (after a cancelled payment, for instance).
  useEffect(() => {
    let draft: Partial<Values> | null = null;
    try {
      draft = JSON.parse(sessionStorage.getItem(DRAFT_KEY) ?? "null");
    } catch {
      /* ignore */
    }
    // Restoring a draft from sessionStorage / URL is a post-mount sync with an external store.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setV((cur) => ({
      ...cur,
      ...(draft ?? {}),
      pickup_address: params.get("from") ?? draft?.pickup_address ?? cur.pickup_address,
      delivery_address: params.get("to") ?? draft?.delivery_address ?? cur.delivery_address,
      service_slug: params.get("service") ?? draft?.service_slug ?? cur.service_slug,
      accept_terms: false,
    }));
  }, [params]);

  useEffect(() => {
    try {
      sessionStorage.setItem(DRAFT_KEY, JSON.stringify({ ...v, accept_terms: false }));
    } catch {
      /* ignore */
    }
  }, [v]);

  const set = <K extends keyof Values>(k: K, val: Values[K]) => setV((s) => ({ ...s, [k]: val }));
  const instantRule = rules.find((r) => r.service_slug === v.service_slug && r.instant_booking);

  const validateStep = (s: number): Record<string, string> => {
    const e: Record<string, string> = {};
    if (s === 0) {
      if (v.pickup_address.trim().length < 5) e.pickup_address = "Indiquez l'adresse complète de départ (avec code postal).";
      if (v.delivery_address.trim().length < 5) e.delivery_address = "Indiquez l'adresse complète d'arrivée (avec code postal).";
      if (!v.wanted_date || v.wanted_date < todayIso()) e.wanted_date = "Choisissez une date à partir d'aujourd'hui.";
    }
    if (s === 1) {
      if (!v.service_slug) e.service_slug = "Choisissez un type de transport.";
      if (v.goods_type.trim().length < 2) e.goods_type = "Décrivez la marchandise.";
      if (!(v.quantity >= 1)) e.quantity = "Quantité minimale : 1.";
    }
    if (s === 2) {
      if (v.contact_name.trim().length < 2) e.contact_name = "Votre nom est requis.";
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.email.trim())) e.email = "E-mail invalide.";
      if (!/^(\+?\d[\d\s.-]{7,18})$/.test(v.phone.trim())) e.phone = "Téléphone invalide.";
    }
    if (s === 3 && !v.accept_terms) e.accept_terms = "Merci d'accepter les CGV.";
    return e;
  };

  const fetchQuote = useCallback(async () => {
    setQuoting(true);
    try {
      const res = await fetch("/api/quote", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          service_slug: v.service_slug,
          pickup_address: v.pickup_address,
          delivery_address: v.delivery_address,
          quantity: v.quantity,
          quantity_unit: v.quantity_unit,
          wanted_slot: v.wanted_slot,
          options: v.options,
        }),
      });
      setQuote(res.ok ? ((await res.json()) as Quote) : null);
    } catch {
      setQuote(null);
    } finally {
      setQuoting(false);
    }
  }, [v.service_slug, v.pickup_address, v.delivery_address, v.quantity, v.quantity_unit, v.wanted_slot, v.options]);

  const next = () => {
    const e = validateStep(step);
    setErrors(e);
    if (Object.keys(e).length) return;
    const n = step + 1;
    if (n === 3) void fetchQuote();
    setStep(n);
    topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };
  const back = () => {
    setErrors({});
    setStep((s) => Math.max(0, s - 1));
  };

  const submit = async () => {
    const e = validateStep(3);
    setErrors(e);
    if (Object.keys(e).length) return;
    setSubmitting(true);
    setServerError(null);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...v, weight_kg: v.weight_kg === "" ? "" : Number(v.weight_kg), ...readAttribution() }),
      });
      const json = (await res.json()) as { error?: string; fields?: Record<string, string>; reference?: string; checkout_url?: string; mode?: string };
      if (!res.ok) {
        if (json.fields) {
          setErrors(json.fields);
          const firstField = Object.keys(json.fields)[0];
          setStep(["pickup_address", "delivery_address", "wanted_date"].includes(firstField) ? 0 : ["contact_name", "email", "phone"].includes(firstField) ? 2 : 1);
        }
        setServerError(json.error ?? "Une erreur est survenue, réessayez ou appelez-nous.");
        return;
      }
      try {
        sessionStorage.removeItem(DRAFT_KEY);
      } catch {
        /* ignore */
      }
      if (json.checkout_url) {
        window.location.assign(json.checkout_url);
        return;
      }
      router.push(`/commander/merci?ref=${json.reference}`);
    } catch {
      setServerError("Connexion impossible. Vérifiez votre réseau ou appelez-nous.");
    } finally {
      setSubmitting(false);
    }
  };

  const err = (k: string) => (errors[k] ? <p className="mt-1 text-sm text-red-600">{errors[k]}</p> : null);

  return (
    <div ref={topRef} className="scroll-mt-24">
      {cancelled && (
        <div className="mb-6 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
          {copy.cancelledBody} {params.get("ref") && <strong>Référence : {params.get("ref")}</strong>}
        </div>
      )}

      <ol className="mb-8 grid grid-cols-4 gap-2 text-center text-xs font-semibold sm:text-sm" aria-label="Étapes">
        {STEPS.map((label, i) => (
          <li key={label} className={`border-b-4 pb-2 ${i <= step ? "border-accent-500 text-brand-800" : "border-slate-200 text-slate-400"}`} aria-current={i === step ? "step" : undefined}>
            <span className="hidden sm:inline">{i + 1}. </span>
            {label}
          </li>
        ))}
      </ol>

      <form
        className="card space-y-6"
        onSubmit={(e) => {
          e.preventDefault();
          if (step < 3) next();
          else void submit();
        }}
        noValidate
      >
        {/* honeypot */}
        <div className="hidden" aria-hidden="true">
          <label htmlFor="website">Site web</label>
          <input id="website" name="website" tabIndex={-1} autoComplete="off" value={v.website} onChange={(e) => set("website", e.target.value)} />
        </div>

        {step === 0 && (
          <fieldset className="space-y-5">
            <legend className="text-xl font-bold text-brand-800">Où et quand ?</legend>
            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <label className="label" htmlFor="pickup_address">Adresse de départ *</label>
                <input id="pickup_address" className="field" placeholder="12 rue de la Paix, 75002 Paris" value={v.pickup_address} onChange={(e) => set("pickup_address", e.target.value)} autoComplete="street-address" required />
                {err("pickup_address")}
                <input className="field mt-2" placeholder="Contact sur place (nom, téléphone) — optionnel" value={v.pickup_contact} onChange={(e) => set("pickup_contact", e.target.value)} />
              </div>
              <div>
                <label className="label" htmlFor="delivery_address">Adresse d&apos;arrivée *</label>
                <input id="delivery_address" className="field" placeholder="125 rue Diderot, 93700 Drancy" value={v.delivery_address} onChange={(e) => set("delivery_address", e.target.value)} autoComplete="street-address" required />
                {err("delivery_address")}
                <input className="field mt-2" placeholder="Contact à la livraison (nom, téléphone) — optionnel" value={v.delivery_contact} onChange={(e) => set("delivery_contact", e.target.value)} />
              </div>
              <div>
                <label className="label" htmlFor="wanted_date">Date souhaitée *</label>
                <input id="wanted_date" type="date" className="field" min={todayIso()} value={v.wanted_date} onChange={(e) => set("wanted_date", e.target.value)} required />
                {err("wanted_date")}
              </div>
              <div>
                <label className="label" htmlFor="wanted_slot">Créneau</label>
                <select id="wanted_slot" className="field" value={v.wanted_slot} onChange={(e) => set("wanted_slot", e.target.value as Values["wanted_slot"])}>
                  {SLOTS.map((s) => (
                    <option key={s} value={s}>{SLOT_LABELS[s]}</option>
                  ))}
                </select>
              </div>
            </div>
          </fieldset>
        )}

        {step === 1 && (
          <fieldset className="space-y-5">
            <legend className="text-xl font-bold text-brand-800">Que transportons-nous ?</legend>
            <div>
              <p className="label">Type de transport *</p>
              <div className="grid gap-3 sm:grid-cols-3">
                {services.map((s) => {
                  const instant = rules.some((r) => r.service_slug === s.slug && r.instant_booking);
                  const active = v.service_slug === s.slug;
                  return (
                    <label key={s.slug} className={`cursor-pointer rounded-xl border-2 p-4 transition ${active ? "border-brand-800 bg-brand-50" : "border-slate-200 hover:border-slate-300"}`}>
                      <input type="radio" name="service_slug" className="sr-only" value={s.slug} checked={active} onChange={() => set("service_slug", s.slug)} />
                      <span className="flex items-center gap-2 font-semibold text-brand-800">
                        <Icon name={s.icon ?? "box"} className="h-5 w-5" />
                        {s.title}
                      </span>
                      <span className="mt-1 block text-xs text-slate-500">{instant ? "Prix immédiat · paiement en ligne" : "Chiffrage sous 24h"}</span>
                    </label>
                  );
                })}
              </div>
              {err("service_slug")}
            </div>
            <div className="grid gap-5 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="label" htmlFor="goods_type">Nature de la marchandise *</label>
                <input id="goods_type" className="field" placeholder="Ex. : cartons de pièces détachées, mobilier, plantes…" value={v.goods_type} onChange={(e) => set("goods_type", e.target.value)} required />
                {err("goods_type")}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label" htmlFor="quantity">Quantité *</label>
                  <input id="quantity" type="number" min={1} max={999} className="field" value={v.quantity} onChange={(e) => set("quantity", Number(e.target.value))} required />
                  {err("quantity")}
                </div>
                <div>
                  <label className="label" htmlFor="quantity_unit">Unité</label>
                  <select id="quantity_unit" className="field" value={v.quantity_unit} onChange={(e) => set("quantity_unit", e.target.value as Values["quantity_unit"])}>
                    {UNITS.map((u) => (
                      <option key={u} value={u}>{u}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label" htmlFor="dimensions">Dimensions</label>
                  <input id="dimensions" className="field" placeholder="L × l × h (cm)" value={v.dimensions} onChange={(e) => set("dimensions", e.target.value)} />
                </div>
                <div>
                  <label className="label" htmlFor="weight_kg">Poids total (kg)</label>
                  <input id="weight_kg" type="number" min={0} step="0.1" className="field" value={v.weight_kg} onChange={(e) => set("weight_kg", e.target.value)} />
                </div>
              </div>
            </div>
            <div>
              <p className="label">Options</p>
              <div className="flex flex-wrap gap-3">
                {(
                  [
                    ["handling", "Manutention / hayon"],
                    ["floor", "Livraison à l'étage"],
                    ["fragile", "Marchandise fragile"],
                  ] as const
                ).map(([k, label]) => (
                  <label key={k} className={`cursor-pointer rounded-full border px-4 py-2 text-sm font-medium ${v.options[k] ? "border-brand-800 bg-brand-800 text-white" : "border-slate-300 text-slate-700"}`}>
                    <input type="checkbox" className="sr-only" checked={v.options[k]} onChange={(e) => set("options", { ...v.options, [k]: e.target.checked })} />
                    {label}
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label className="label" htmlFor="notes">Consignes particulières</label>
              <textarea id="notes" className="field min-h-24" placeholder="Accès, horaires d'ouverture, digicode, matériel nécessaire…" value={v.notes} onChange={(e) => set("notes", e.target.value)} />
            </div>
          </fieldset>
        )}

        {step === 2 && (
          <fieldset className="space-y-5">
            <legend className="text-xl font-bold text-brand-800">Vos coordonnées</legend>
            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <label className="label" htmlFor="company">Société</label>
                <input id="company" className="field" value={v.company} onChange={(e) => set("company", e.target.value)} autoComplete="organization" />
              </div>
              <div>
                <label className="label" htmlFor="contact_name">Nom et prénom *</label>
                <input id="contact_name" className="field" value={v.contact_name} onChange={(e) => set("contact_name", e.target.value)} autoComplete="name" required />
                {err("contact_name")}
              </div>
              <div>
                <label className="label" htmlFor="email">E-mail *</label>
                <input id="email" type="email" className="field" value={v.email} onChange={(e) => set("email", e.target.value)} autoComplete="email" inputMode="email" required />
                {err("email")}
              </div>
              <div>
                <label className="label" htmlFor="phone">Téléphone *</label>
                <input id="phone" type="tel" className="field" value={v.phone} onChange={(e) => set("phone", e.target.value)} autoComplete="tel" inputMode="tel" required />
                {err("phone")}
              </div>
            </div>
          </fieldset>
        )}

        {step === 3 && (
          <fieldset className="space-y-6">
            <legend className="text-xl font-bold text-brand-800">Récapitulatif</legend>
            <dl className="grid gap-x-8 gap-y-3 text-sm sm:grid-cols-2">
              <Row k="Départ" val={v.pickup_address} />
              <Row k="Arrivée" val={v.delivery_address} />
              <Row k="Date" val={`${new Date(v.wanted_date + "T00:00:00").toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })} · ${SLOT_LABELS[v.wanted_slot]}`} />
              <Row k="Transport" val={services.find((s) => s.slug === v.service_slug)?.title ?? v.service_slug} />
              <Row k="Marchandise" val={`${v.goods_type} · ${v.quantity} ${v.quantity_unit}${v.dimensions ? " · " + v.dimensions : ""}${v.weight_kg ? " · " + v.weight_kg + " kg" : ""}`} />
              <Row k="Options" val={[v.options.handling && "manutention / hayon", v.options.floor && "étage", v.options.fragile && "fragile"].filter(Boolean).join(", ") || "aucune"} />
              <Row k="Contact" val={`${v.contact_name}${v.company ? " (" + v.company + ")" : ""} · ${v.email} · ${v.phone}`} />
            </dl>

            <div className="rounded-xl bg-brand-50 p-5">
              {quoting ? (
                <p className="text-brand-800">Calcul du prix…</p>
              ) : quote?.mode === "instant" ? (
                <>
                  <p className="text-sm font-semibold uppercase tracking-wide text-brand-600">Prix ferme</p>
                  <p className="mt-1 text-3xl font-extrabold text-brand-800">
                    {formatEuros(quote.total_cents)} <span className="text-base font-semibold text-slate-500">TTC</span>
                  </p>
                  <p className="text-sm text-slate-600">soit {formatEuros(quote.price_cents)} HT · distance estimée {quote.distance_km} km</p>
                  <ul className="mt-3 space-y-1 text-sm text-slate-600">
                    {quote.breakdown.map((b) => (
                      <li key={b.label} className="flex justify-between">
                        <span>{b.label}</span>
                        <span>{formatEuros(b.cents)}</span>
                      </li>
                    ))}
                  </ul>
                  <p className="mt-3 flex items-center gap-2 text-sm text-slate-600">
                    <Icon name="shield" className="h-4 w-4" /> Paiement sécurisé par Stripe à l&apos;étape suivante.
                  </p>
                </>
              ) : (
                <>
                  <p className="text-sm font-semibold uppercase tracking-wide text-brand-600">Sur devis</p>
                  <p className="mt-1 text-slate-700">{copy.quoteNotice}</p>
                  {instantRule && quote?.mode === "quote" && (
                    <p className="mt-2 text-sm text-slate-500">
                      {quote.reason === "too_far" ? "Trajet hors zone de prix immédiat." : quote.reason === "too_many_units" ? "Volume supérieur au prix immédiat." : "Distance non calculable automatiquement (vérifiez les codes postaux)."}
                    </p>
                  )}
                </>
              )}
            </div>

            <label className="flex items-start gap-3 text-sm text-slate-700">
              <input type="checkbox" className="mt-1 h-4 w-4" checked={v.accept_terms} onChange={(e) => set("accept_terms", e.target.checked)} />
              <span>
                J&apos;accepte les{" "}
                <Link href="/cgv" className="font-semibold text-brand-600 underline" target="_blank">
                  conditions générales de vente
                </Link>{" "}
                et le traitement de mes données pour l&apos;exécution de la prestation. *
              </span>
            </label>
            {err("accept_terms")}
            {serverError && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{serverError}</p>}
          </fieldset>
        )}

        <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:items-center sm:justify-between">
          {step > 0 ? (
            <button type="button" onClick={back} className="btn-ghost">
              ← Retour
            </button>
          ) : (
            <span />
          )}
          {step < 3 ? (
            <button type="submit" className="btn-primary">
              Continuer <Icon name="arrow" className="h-4 w-4" />
            </button>
          ) : (
            <button type="submit" className="btn-primary" disabled={submitting || quoting}>
              {submitting ? "Envoi…" : quote?.mode === "instant" ? `Payer ${formatEuros(quote.total_cents)}` : "Envoyer ma demande"}
            </button>
          )}
        </div>
        <p className="text-center text-xs text-slate-500">Sans engagement · Exploitation joignable 24h/24 au 07 67 16 60 15</p>
      </form>
    </div>
  );
}

function Row({ k, val }: { k: string; val: string }) {
  return (
    <div>
      <dt className="text-slate-500">{k}</dt>
      <dd className="font-medium text-slate-900">{val}</dd>
    </div>
  );
}
