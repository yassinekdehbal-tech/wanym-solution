"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AddressInput } from "@/components/AddressInput";
import { readAttribution } from "@/components/AttributionCapture";
import { Icon } from "@/components/Icon";
import type { NamyContexte, NamyPrix } from "@/lib/namy";
import { formatEuros } from "@/lib/pricing";
import type { Service } from "@/lib/types";

type Values = {
  service_slug: string;
  pickup_address: string;
  pickup_contact: string;
  pickup_phone: string;
  delivery_address: string;
  delivery_contact: string;
  delivery_phone: string;
  delivery_email: string;
  delivery_instructions: string;
  wanted_date: string;
  creneau: string;
  mode_id: string;
  nb_colis: string;
  poids_total_kg: string;
  poids_max_colis_kg: string;
  nb_colis_lourds: string;
  longueur_max_cm: string;
  etage: string;
  acces_escalier: boolean;
  options: string[];
  goods_type: string;
  notes: string;
  company: string;
  contact_name: string;
  email: string;
  phone: string;
  accept_terms: boolean;
  website: string; // honeypot
};

type QuoteResponse = {
  mode: "instant" | "quote";
  reason?: string;
  price_cents?: number;
  total_cents?: number;
  distance_km?: number;
  creneaux?: { value: string; label: string }[];
  date_bloquee?: string | null;
  prix?: NamyPrix | null;
  champs?: string[] | null;
  error?: string;
  fields?: Record<string, string>;
};

const STEPS = ["Trajet", "Marchandise", "Coordonnées", "Récapitulatif"] as const;
const DRAFT_KEY = "wanym:order-draft:v2";
const JOURS = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"];

function todayIso() {
  const d = new Date();
  return new Date(d.getTime() - d.getTimezoneOffset() * 60_000).toISOString().slice(0, 10);
}

const initial = (service: string): Values => ({
  service_slug: service,
  pickup_address: "",
  pickup_contact: "",
  pickup_phone: "",
  delivery_address: "",
  delivery_contact: "",
  delivery_phone: "",
  delivery_email: "",
  delivery_instructions: "",
  wanted_date: todayIso(),
  creneau: "",
  mode_id: "",
  nb_colis: "1",
  poids_total_kg: "",
  poids_max_colis_kg: "",
  nb_colis_lourds: "0",
  longueur_max_cm: "",
  etage: "0",
  acces_escalier: false,
  options: [],
  goods_type: "",
  notes: "",
  company: "",
  contact_name: "",
  email: "",
  phone: "",
  accept_terms: false,
  website: "",
});

const QUOTE_REASONS: Record<string, string> = {
  service_on_quote: "Cette prestation est chiffrée sur mesure par notre exploitation.",
  hors_grille: "Ce transport sort de notre barème standard (poids, dimensions ou distance) : nous vous envoyons un devis.",
  capacite_depassee: "Ce transport dépasse la capacité d'un véhicule standard : nous vous envoyons un devis adapté.",
  date_indisponible: "La date choisie n'est pas disponible : revenez à l'étape Trajet pour en choisir une autre.",
  adresse_introuvable: "Une des adresses n'a pas été reconnue : vérifiez-la à l'étape Trajet.",
  namy_non_configure: "Le calcul en ligne est momentanément indisponible, nous vous envoyons un devis.",
};

export function OrderForm({
  services,
  namySlugs,
  copy,
}: {
  services: Service[];
  namySlugs: string[];
  copy: { quoteNotice: string; cancelledBody: string };
}) {
  const router = useRouter();
  const params = useSearchParams();
  const defaultService = useMemo(() => services.find((s) => namySlugs.includes(s.slug))?.slug ?? services[0]?.slug ?? "", [services, namySlugs]);
  const [v, setV] = useState<Values>(() => initial(defaultService));
  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [ctx, setCtx] = useState<NamyContexte | null>(null);
  const [ctxError, setCtxError] = useState(false);
  const [creneaux, setCreneaux] = useState<{ value: string; label: string }[]>([]);
  const [dateBloquee, setDateBloquee] = useState<string | null>(null);
  const [quote, setQuote] = useState<QuoteResponse | null>(null);
  const [quoting, setQuoting] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const topRef = useRef<HTMLDivElement>(null);
  const cancelled = params.get("cancelled") === "1";
  const sellsOnline = namySlugs.length === 0 || namySlugs.includes(v.service_slug);

  // NAMY form metadata (delivery modes, options, service days)
  useEffect(() => {
    let alive = true;
    fetch("/api/namy/contexte")
      .then(async (r) => (r.ok ? ((await r.json()) as NamyContexte) : null))
      .then((c) => {
        if (!alive) return;
        if (c) setCtx(c);
        else setCtxError(true);
      })
      .catch(() => alive && setCtxError(true));
    return () => {
      alive = false;
    };
  }, []);

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

  // Time slots of the chosen date come from NAMY (the account's slots, closures, same-day cut-off).
  useEffect(() => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(v.wanted_date)) return;
    let alive = true;
    fetch(`/api/namy/creneaux?date=${v.wanted_date}`)
      .then(async (r) => (r.ok ? ((await r.json()) as { date_bloquee: string | null; creneaux: { value: string; label: string }[] }) : null))
      .then((r) => {
        if (!alive) return;
        setDateBloquee(r ? r.date_bloquee : null);
        setCreneaux(r?.creneaux ?? []);
        setV((cur) => (r && r.creneaux.some((c) => c.value === cur.creneau) ? cur : { ...cur, creneau: r?.creneaux?.[0]?.value ?? "" }));
      })
      .catch(() => alive && setCreneaux([]));
    return () => {
      alive = false;
    };
  }, [v.wanted_date]);

  const set = <K extends keyof Values>(k: K, val: Values[K]) => setV((s) => ({ ...s, [k]: val }));
  const modes = ctx?.modes ?? [];
  const optionsChoix = ctx?.options ?? [];
  const minDate = todayIso();

  const dayAllowed = (iso: string) => {
    if (!ctx) return true;
    const d = new Date(iso + "T12:00:00");
    if (!ctx.jours_service.includes(JOURS[d.getDay()])) return false;
    return !ctx.fermetures.some((f) => f.date === iso);
  };

  const validateStep = (s: number): Record<string, string> => {
    const e: Record<string, string> = {};
    if (s === 0) {
      if (v.pickup_address.trim().length < 5) e.pickup_address = "Indiquez l'adresse complète d'enlèvement.";
      if (v.delivery_address.trim().length < 5) e.delivery_address = "Indiquez l'adresse complète de livraison.";
      if (!v.wanted_date || v.wanted_date < minDate) e.wanted_date = "Choisissez une date à partir d'aujourd'hui.";
      else if (dateBloquee) e.wanted_date = dateBloquee;
      else if (!dayAllowed(v.wanted_date)) e.wanted_date = "Nous ne livrons pas ce jour-là.";
      if (!v.creneau) e.creneau = "Choisissez un créneau.";
      if (v.delivery_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.delivery_email.trim())) e.delivery_email = "E-mail invalide.";
    }
    if (s === 1) {
      if (!v.service_slug) e.service_slug = "Choisissez un type de prestation.";
      if (!(Number(v.nb_colis) >= 1)) e.nb_colis = "Au moins 1 colis.";
      if (!(Number(v.poids_total_kg) > 0)) e.poids_total_kg = "Indiquez le poids total.";
      if (v.poids_max_colis_kg !== "" && !(Number(v.poids_max_colis_kg) > 0)) e.poids_max_colis_kg = "Poids invalide.";
      if (Number(v.poids_max_colis_kg) > Number(v.poids_total_kg)) e.poids_max_colis_kg = "Le colis le plus lourd ne peut pas peser plus que le total.";
      if (!(Number(v.longueur_max_cm) > 0)) e.longueur_max_cm = "Indiquez la plus grande longueur.";
      if (v.goods_type.trim().length < 2) e.goods_type = "Décrivez la marchandise.";
      if (modes.length && !v.mode_id) e.mode_id = "Choisissez un mode de livraison.";
    }
    if (s === 2) {
      if (v.contact_name.trim().length < 2) e.contact_name = "Votre nom est requis.";
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.email.trim())) e.email = "E-mail invalide.";
      if (!/^(\+?\d[\d\s.-]{7,18})$/.test(v.phone.trim())) e.phone = "Téléphone invalide.";
    }
    if (s === 3 && !v.accept_terms) e.accept_terms = "Merci d'accepter les CGV.";
    return e;
  };

  const payload = useCallback(
    () => ({
      service_slug: v.service_slug,
      pickup_address: v.pickup_address,
      pickup_contact: v.pickup_contact,
      pickup_phone: v.pickup_phone,
      delivery_address: v.delivery_address,
      delivery_contact: v.delivery_contact,
      delivery_phone: v.delivery_phone,
      delivery_email: v.delivery_email,
      delivery_instructions: v.delivery_instructions,
      wanted_date: v.wanted_date,
      creneau: v.creneau,
      mode_id: v.mode_id,
      nb_colis: Number(v.nb_colis) || 1,
      poids_total_kg: Number(v.poids_total_kg) || 0,
      poids_max_colis_kg: v.poids_max_colis_kg === "" ? "" : Number(v.poids_max_colis_kg),
      nb_colis_lourds: Number(v.nb_colis_lourds) || 0,
      longueur_max_cm: Number(v.longueur_max_cm) || 0,
      etage: Number(v.etage) || 0,
      acces_escalier: v.acces_escalier,
      options: v.options,
    }),
    [v],
  );

  const fetchQuote = useCallback(async () => {
    setQuoting(true);
    try {
      const res = await fetch("/api/quote", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload()) });
      const json = (await res.json()) as QuoteResponse;
      setQuote(res.ok ? json : { mode: "quote", reason: json.error ?? "erreur", fields: json.fields });
    } catch {
      setQuote({ mode: "quote", reason: "namy_non_configure" });
    } finally {
      setQuoting(false);
    }
  }, [payload]);

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
        body: JSON.stringify({
          ...payload(),
          goods_type: v.goods_type,
          notes: v.notes,
          company: v.company,
          contact_name: v.contact_name,
          email: v.email,
          phone: v.phone,
          accept_terms: v.accept_terms,
          website: v.website,
          ...readAttribution(),
        }),
      });
      const json = (await res.json()) as { error?: string; fields?: Record<string, string>; reference?: string; checkout_url?: string; mode?: string };
      if (!res.ok) {
        if (json.fields) {
          setErrors(json.fields);
          const first = Object.keys(json.fields)[0] ?? "";
          setStep(/^(pickup|delivery|wanted_date|creneau)/.test(first) ? 0 : /^(contact_name|email|phone)/.test(first) ? 2 : 1);
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
  const prix = quote?.prix ?? null;

  return (
    <div ref={topRef} className="scroll-mt-24">
      {cancelled && (
        <div className="mb-6 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
          {copy.cancelledBody} {params.get("ref") && <strong>Référence : {params.get("ref")}</strong>}
        </div>
      )}
      {ctxError && (
        <div className="mb-6 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
          Le calcul de prix en ligne est momentanément indisponible : votre demande sera chiffrée par notre exploitation sous 24h.
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
        <div className="hidden" aria-hidden="true">
          <label htmlFor="website">Site web</label>
          <input id="website" name="website" tabIndex={-1} autoComplete="off" value={v.website} onChange={(e) => set("website", e.target.value)} />
        </div>

        {step === 0 && (
          <fieldset className="space-y-6">
            <legend className="text-xl font-bold text-brand-800">Où et quand ?</legend>
            <div className="grid gap-5 md:grid-cols-2">
              <div className="space-y-2">
                <label className="label" htmlFor="pickup_address">Adresse d&apos;enlèvement *</label>
                <AddressInput id="pickup_address" value={v.pickup_address} onChange={(x) => set("pickup_address", x)} placeholder="12 rue de la Paix, 75002 Paris" required />
                {err("pickup_address")}
                <div className="grid grid-cols-2 gap-2">
                  <input className="field" placeholder="Contact sur place" value={v.pickup_contact} onChange={(e) => set("pickup_contact", e.target.value)} />
                  <input className="field" type="tel" placeholder="Téléphone sur place" value={v.pickup_phone} onChange={(e) => set("pickup_phone", e.target.value)} />
                </div>
              </div>
              <div className="space-y-2">
                <label className="label" htmlFor="delivery_address">Adresse de livraison *</label>
                <AddressInput id="delivery_address" value={v.delivery_address} onChange={(x) => set("delivery_address", x)} placeholder="125 rue Diderot, 93700 Drancy" required accent />
                {err("delivery_address")}
                <div className="grid grid-cols-2 gap-2">
                  <input className="field" placeholder="Destinataire (nom)" value={v.delivery_contact} onChange={(e) => set("delivery_contact", e.target.value)} />
                  <input className="field" type="tel" placeholder="Téléphone destinataire" value={v.delivery_phone} onChange={(e) => set("delivery_phone", e.target.value)} />
                </div>
                <input className="field" type="email" placeholder="E-mail du destinataire (suivi de livraison) — optionnel" value={v.delivery_email} onChange={(e) => set("delivery_email", e.target.value)} />
                {err("delivery_email")}
                <input className="field" placeholder="Accès, digicode, étage, consignes — optionnel" value={v.delivery_instructions} onChange={(e) => set("delivery_instructions", e.target.value)} />
              </div>
              <div>
                <label className="label" htmlFor="wanted_date">Date de livraison *</label>
                <input id="wanted_date" type="date" className="field" min={minDate} value={v.wanted_date} onChange={(e) => set("wanted_date", e.target.value)} required />
                {err("wanted_date")}
                {ctx && <p className="mt-1 text-xs text-slate-500">Jours de livraison : {ctx.jours_service.join(", ")}.</p>}
              </div>
              <div>
                <label className="label" htmlFor="creneau">Créneau *</label>
                <select id="creneau" className="field" value={v.creneau} onChange={(e) => set("creneau", e.target.value)} disabled={!creneaux.length}>
                  {!creneaux.length && <option value="">{dateBloquee ?? "Aucun créneau pour cette date"}</option>}
                  {creneaux.map((c) => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
                {err("creneau")}
              </div>
            </div>
          </fieldset>
        )}

        {step === 1 && (
          <fieldset className="space-y-6">
            <legend className="text-xl font-bold text-brand-800">Que transportons-nous ?</legend>
            <div>
              <p className="label">Type de prestation *</p>
              <div className="grid gap-3 sm:grid-cols-3">
                {services.map((s) => {
                  const online = namySlugs.length === 0 || namySlugs.includes(s.slug);
                  const active = v.service_slug === s.slug;
                  return (
                    <label key={s.slug} className={`cursor-pointer rounded-xl border-2 p-4 transition ${active ? "border-brand-800 bg-brand-50" : "border-slate-200 hover:border-slate-300"}`}>
                      <input type="radio" name="service_slug" className="sr-only" value={s.slug} checked={active} onChange={() => set("service_slug", s.slug)} />
                      <span className="flex items-center gap-2 font-semibold text-brand-800">
                        <Icon name={s.icon ?? "box"} className="h-5 w-5" />
                        {s.title}
                      </span>
                      <span className="mt-1 block text-xs text-slate-500">{online ? "Prix immédiat · paiement en ligne" : "Chiffrage sous 24h"}</span>
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
              <div>
                <label className="label" htmlFor="nb_colis">Nombre de colis *</label>
                <input id="nb_colis" type="number" min={1} max={999} className="field" value={v.nb_colis} onChange={(e) => set("nb_colis", e.target.value)} required />
                {err("nb_colis")}
              </div>
              <div>
                <label className="label" htmlFor="poids_total_kg">Poids total (kg) *</label>
                <input id="poids_total_kg" type="number" min={0.1} step="0.1" className="field" placeholder="ex. 45" value={v.poids_total_kg} onChange={(e) => set("poids_total_kg", e.target.value)} required />
                {err("poids_total_kg")}
              </div>
              <div>
                <label className="label" htmlFor="poids_max_colis_kg">Poids du colis le plus lourd (kg)</label>
                <input id="poids_max_colis_kg" type="number" min={0.1} step="0.1" className="field" placeholder="laisser vide si colis identiques" value={v.poids_max_colis_kg} onChange={(e) => set("poids_max_colis_kg", e.target.value)} />
                {err("poids_max_colis_kg")}
              </div>
              <div>
                <label className="label" htmlFor="longueur_max_cm">Plus grande longueur (cm) *</label>
                <input id="longueur_max_cm" type="number" min={1} className="field" placeholder="ex. 120" value={v.longueur_max_cm} onChange={(e) => set("longueur_max_cm", e.target.value)} required />
                {err("longueur_max_cm")}
              </div>
              <div>
                <label className="label" htmlFor="nb_colis_lourds">Colis de plus de 70 kg</label>
                <input id="nb_colis_lourds" type="number" min={0} max={999} className="field" value={v.nb_colis_lourds} onChange={(e) => set("nb_colis_lourds", e.target.value)} />
                <p className="mt-1 text-xs text-slate-500">Nombre de colis nécessitant deux personnes.</p>
              </div>
              <div className="grid grid-cols-[1fr_auto] items-end gap-3">
                <div>
                  <label className="label" htmlFor="etage">Étage de livraison</label>
                  <input id="etage" type="number" min={0} max={60} className="field" value={v.etage} onChange={(e) => set("etage", e.target.value)} />
                </div>
                <label className="flex items-center gap-2 pb-3 text-sm text-slate-700">
                  <input type="checkbox" className="h-4 w-4" checked={v.acces_escalier} onChange={(e) => set("acces_escalier", e.target.checked)} />
                  Sans ascenseur
                </label>
              </div>
            </div>

            {modes.length > 0 && (
              <div>
                <p className="label">Mode de livraison *</p>
                <div className="flex flex-wrap gap-3">
                  {modes.map((m) => (
                    <label key={m.id} className={`cursor-pointer rounded-full border px-4 py-2 text-sm font-medium ${v.mode_id === m.id ? "border-brand-800 bg-brand-800 text-white" : "border-slate-300 text-slate-700"}`}>
                      <input type="radio" name="mode_id" className="sr-only" checked={v.mode_id === m.id} onChange={() => set("mode_id", m.id)} />
                      {m.libelle}
                    </label>
                  ))}
                </div>
                {err("mode_id")}
              </div>
            )}

            {optionsChoix.length > 0 && (
              <div>
                <p className="label">Options</p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {optionsChoix.map((o) => {
                    const on = v.options.includes(o.id);
                    return (
                      <label key={o.id} className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 text-sm ${on ? "border-brand-800 bg-brand-50" : "border-slate-200"}`}>
                        <input type="checkbox" className="mt-1 h-4 w-4" checked={on} onChange={(e) => set("options", e.target.checked ? [...v.options, o.id] : v.options.filter((x) => x !== o.id))} />
                        <span>
                          <span className="font-medium text-slate-900">{o.icone ? o.icone + " " : ""}{o.nom}</span>
                          {o.prix != null && <span className="text-slate-500"> · {formatEuros(Math.round(o.prix * 100))} HT{o.unite_label ? ` / ${o.unite_label}` : ""}</span>}
                          {o.description && <span className="block text-xs text-slate-500">{o.description}</span>}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}

            <div>
              <label className="label" htmlFor="notes">Consignes particulières</label>
              <textarea id="notes" className="field min-h-24" placeholder="Horaires d'ouverture, matériel nécessaire, précisions…" value={v.notes} onChange={(e) => set("notes", e.target.value)} />
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
              <Row k="Enlèvement" val={v.pickup_address} />
              <Row k="Livraison" val={v.delivery_address} />
              <Row k="Date" val={`${new Date(v.wanted_date + "T00:00:00").toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })} · ${v.creneau}`} />
              <Row k="Prestation" val={services.find((s) => s.slug === v.service_slug)?.title ?? v.service_slug} />
              <Row k="Marchandise" val={`${v.goods_type} · ${v.nb_colis} colis · ${v.poids_total_kg} kg · ${v.longueur_max_cm} cm${v.poids_max_colis_kg ? ` · colis max ${v.poids_max_colis_kg} kg` : ""}`} />
              <Row k="Livraison" val={[modes.find((m) => m.id === v.mode_id)?.libelle, v.etage !== "0" ? `étage ${v.etage}${v.acces_escalier ? " sans ascenseur" : ""}` : null, ...optionsChoix.filter((o) => v.options.includes(o.id)).map((o) => o.nom)].filter(Boolean).join(", ") || "standard"} />
              <Row k="Contact" val={`${v.contact_name}${v.company ? " (" + v.company + ")" : ""} · ${v.email} · ${v.phone}`} />
            </dl>

            <div className="rounded-xl bg-brand-50 p-5">
              {quoting ? (
                <p className="text-brand-800">Calcul du prix…</p>
              ) : quote?.mode === "instant" && prix ? (
                <>
                  <p className="text-sm font-semibold uppercase tracking-wide text-brand-600">Prix ferme</p>
                  <p className="mt-1 text-3xl font-extrabold text-brand-800">
                    {formatEuros(quote.total_cents ?? 0)} <span className="text-base font-semibold text-slate-500">TTC</span>
                  </p>
                  <p className="text-sm text-slate-600">soit {formatEuros(quote.price_cents ?? 0)} HT · {prix.distance_km} km</p>
                  <ul className="mt-3 space-y-1 text-sm text-slate-600">
                    <li className="flex justify-between"><span>Prise en charge{prix.mode ? ` (${prix.mode.libelle})` : ""}</span><span>{formatEuros(Math.round(prix.base_ht * 100))}</span></li>
                    {prix.supplement_distance_ht > 0 && <li className="flex justify-between"><span>Distance au-delà du rayon inclus</span><span>{formatEuros(Math.round(prix.supplement_distance_ht * 100))}</span></li>}
                    {prix.supplement_lourd_ht > 0 && <li className="flex justify-between"><span>Colis lourds</span><span>{formatEuros(Math.round(prix.supplement_lourd_ht * 100))}</span></li>}
                    {prix.options.map((o) => (
                      <li key={o.libelle} className="flex justify-between"><span>{o.libelle}</span><span>{formatEuros(Math.round(o.prix_ht * 100))}</span></li>
                    ))}
                    {prix.majoration_creneau?.delta_pct ? <li className="flex justify-between"><span>{prix.majoration_creneau.libelle_court || "Créneau"}</span><span>{prix.majoration_creneau.delta_pct > 0 ? "+" : ""}{prix.majoration_creneau.delta_pct} %</span></li> : null}
                    {prix.remise?.delta_pct ? <li className="flex justify-between"><span>{prix.remise.libelles.join(", ") || "Tarif dynamique"}</span><span>{prix.remise.delta_pct > 0 ? "+" : ""}{prix.remise.delta_pct} %</span></li> : null}
                    <li className="flex justify-between font-semibold text-slate-800"><span>Total HT</span><span>{formatEuros(Math.round(prix.ht * 100))}</span></li>
                    <li className="flex justify-between"><span>TVA 20 %</span><span>{formatEuros(Math.round(prix.tva * 100))}</span></li>
                  </ul>
                  <p className="mt-3 flex items-center gap-2 text-sm text-slate-600">
                    <Icon name="shield" className="h-4 w-4" /> Paiement sécurisé par Stripe à l&apos;étape suivante.
                  </p>
                </>
              ) : (
                <>
                  <p className="text-sm font-semibold uppercase tracking-wide text-brand-600">Sur devis</p>
                  <p className="mt-1 text-slate-700">{copy.quoteNotice}</p>
                  {quote?.reason && sellsOnline && <p className="mt-2 text-sm text-slate-500">{QUOTE_REASONS[quote.reason] ?? quote.reason}</p>}
                  {quote?.prix?.motifs?.length ? <p className="mt-1 text-xs text-slate-500">{quote.prix.motifs.join(" · ")}</p> : null}
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
              {submitting ? "Envoi…" : quote?.mode === "instant" ? `Payer ${formatEuros(quote.total_cents ?? 0)}` : "Envoyer ma demande"}
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
