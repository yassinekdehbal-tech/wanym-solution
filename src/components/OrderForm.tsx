"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AddressInput } from "@/components/AddressInput";
import { readAttribution } from "@/components/AttributionCapture";
import { Icon } from "@/components/Icon";
import { SizeAdvisor, type Inventaire } from "@/components/SizeAdvisor";
import { TruckIcon } from "@/components/TruckIcon";
import type { NamyContexte, NamyPrix } from "@/lib/namy";
import type { CatalogueItem, VehiculeCapacite } from "@/lib/vehicle-advisor";
import { formatEuros } from "@/lib/pricing";
import type { Service } from "@/lib/types";

/**
 * Order funnel, one page that unfolds as it is filled in:
 *   trajet → taille du véhicule (m² plancher) → remise porte / trottoir → date → coordonnées → prix + paiement.
 * Everything that prices (vehicles, options, slots, the price itself) comes from NAMY.
 */

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
  vehicule_id: string;
  porte_depart: boolean;
  porte_arrivee: boolean;
  etage_depart: string;
  ascenseur_depart: boolean;
  etage_arrivee: string;
  ascenseur_arrivee: boolean;
  equipier: boolean;
  options: string[]; // other manual options (ids)
  inventaire: Inventaire; // size advisor: catalogue item id → quantity
  autre_texte: string;
  // legacy weight-grid fields (shown only when NAMY serves no vehicle)
  nb_colis: string;
  poids_total_kg: string;
  longueur_max_cm: string;
  wanted_date: string;
  creneau: string;
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
  date_bloquee?: string | null;
  prix?: NamyPrix | null;
  error?: string;
  fields?: Record<string, string>;
};

const DRAFT_KEY = "wanym:order-draft:v3";
const TVA = 1.2;

function todayIso(offset = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60_000).toISOString().slice(0, 10);
}
function addDays(iso: string, n: number) {
  const d = new Date(iso + "T12:00:00");
  d.setDate(d.getDate() + n);
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
  vehicule_id: "",
  porte_depart: false,
  porte_arrivee: false,
  etage_depart: "0",
  ascenseur_depart: true,
  etage_arrivee: "0",
  ascenseur_arrivee: true,
  equipier: false,
  options: [],
  inventaire: {},
  autre_texte: "",
  nb_colis: "1",
  poids_total_kg: "",
  longueur_max_cm: "",
  wanted_date: todayIso(),
  creneau: "",
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
  hors_grille: "Ce transport sort de notre barème standard : nous vous envoyons un devis.",
  capacite_depassee: "Ce transport dépasse la capacité d'un véhicule standard : nous vous envoyons un devis adapté.",
  date_indisponible: "La date choisie n'est pas disponible : choisissez-en une autre.",
  adresse_introuvable: "Une des adresses n'a pas été reconnue : vérifiez-la.",
  vehicule_invalide: "Choisissez une taille de véhicule.",
  namy_non_configure: "Le calcul en ligne est momentanément indisponible, nous vous envoyons un devis.",
};

export type AdvisorConfig = { catalogue: CatalogueItem[]; capacites: VehiculeCapacite[]; exemples: Record<string, string> };

export function OrderForm({ services, namySlugs, copy, advisor }: { services: Service[]; namySlugs: string[]; copy: { quoteNotice: string; cancelledBody: string }; advisor: AdvisorConfig }) {
  const router = useRouter();
  const params = useSearchParams();
  const defaultService = useMemo(() => services.find((s) => namySlugs.includes(s.slug))?.slug ?? services[0]?.slug ?? "", [services, namySlugs]);
  const [v, setV] = useState<Values>(() => initial(defaultService));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [ctx, setCtx] = useState<NamyContexte | null>(null);
  const [ctxError, setCtxError] = useState(false);
  const [creneaux, setCreneaux] = useState<{ value: string; label: string }[]>([]);
  const [dateBloquee, setDateBloquee] = useState<string | null>(null);
  const [dateTouched, setDateTouched] = useState(false);
  const [quote, setQuote] = useState<QuoteResponse | null>(null);
  const [quoting, setQuoting] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [advisorOpen, setAdvisorOpen] = useState(false);
  const quoteSeq = useRef(0);
  const track = (name: string, params: Record<string, unknown> = {}) => {
    try {
      window.gtag?.("event", name, params);
    } catch {
      /* analytics is optional */
    }
  };
  const cancelled = params.get("cancelled") === "1";
  const sellsOnline = namySlugs.length === 0 || namySlugs.includes(v.service_slug);

  // ── NAMY context: vehicles, options, service days ──
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

  // ── Prefill (hero addresses) + draft restore ──
  useEffect(() => {
    let draft: Partial<Values> | null = null;
    try {
      draft = JSON.parse(sessionStorage.getItem(DRAFT_KEY) ?? "null");
    } catch {
      /* ignore */
    }
    // Restoring a draft / URL params is a post-mount sync with an external store.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setV((cur) => ({
      ...cur,
      ...(draft ?? {}),
      pickup_address: params.get("from") ?? draft?.pickup_address ?? cur.pickup_address,
      delivery_address: params.get("to") ?? draft?.delivery_address ?? cur.delivery_address,
      service_slug: params.get("service") ?? draft?.service_slug ?? cur.service_slug,
      vehicule_id: params.get("vehicule") ?? draft?.vehicule_id ?? cur.vehicule_id,
      wanted_date: draft?.wanted_date && draft.wanted_date >= todayIso() ? draft.wanted_date : todayIso(),
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

  // ── Slots of the chosen date, from NAMY. A blocked default date (Sunday, closure, past cut-off) moves to the next open day. ──
  useEffect(() => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(v.wanted_date)) return;
    let alive = true;
    fetch(`/api/namy/creneaux?date=${v.wanted_date}`)
      .then(async (r) => (r.ok ? ((await r.json()) as { date_bloquee: string | null; creneaux: { value: string; label: string }[] }) : null))
      .then((r) => {
        if (!alive) return;
        const blocked = r?.date_bloquee ?? null;
        const list = r?.creneaux ?? [];
        if ((blocked || !list.length) && !dateTouched && r && v.wanted_date < todayIso(10)) {
          // Untouched date and no slot: try the next day (bounded to 10 days).
          setV((cur) => ({ ...cur, wanted_date: addDays(cur.wanted_date, 1) }));
          return;
        }
        setDateBloquee(blocked);
        setCreneaux(list);
        setV((cur) => (list.some((c) => c.value === cur.creneau) ? cur : { ...cur, creneau: list[0]?.value ?? "" }));
      })
      .catch(() => alive && setCreneaux([]));
    return () => {
      alive = false;
    };
  }, [v.wanted_date, dateTouched]);

  const set = <K extends keyof Values>(k: K, val: Values[K]) => setV((s) => ({ ...s, [k]: val }));

  const vehicules = useMemo(() => (ctx?.vehicules ?? []).slice().sort((a, b) => (a.ordre ?? 0) - (b.ordre ?? 0)), [ctx]);
  const zoneMode = vehicules.length > 0;
  const optionByCode = (code: string) => ctx?.options.find((o) => o.code === code) ?? null;
  const codedIds = useMemo(() => new Set((ctx?.options ?? []).filter((o) => o.code && ["porte_depart", "porte_arrivee", "equipier"].includes(o.code)).map((o) => o.id)), [ctx]);
  const otherOptions = (ctx?.options ?? []).filter((o) => !codedIds.has(o.id));
  const regleEtage = ctx?.regles?.find((r) => r.champ === "nb_etages") ?? null;
  const modeFor = (porteArrivee: boolean) => ctx?.modes.find((m) => m.code === (porteArrivee ? "piece_choix" : "pied_camion"))?.id ?? ctx?.modes[0]?.id ?? "";

  /** The option ids sent to NAMY: coded toggles + the rest. */
  const selectedOptionIds = useCallback(() => {
    const ids = new Set(v.options);
    const add = (code: string, on: boolean) => {
      const o = optionByCode(code);
      if (o) {
        if (on) ids.add(o.id);
        else ids.delete(o.id);
      }
    };
    add("porte_depart", v.porte_depart);
    add("porte_arrivee", v.porte_arrivee);
    add("equipier", v.equipier);
    return [...ids];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [v.options, v.porte_depart, v.porte_arrivee, v.equipier, ctx]);

  /** NAMY has one floor field: the highest floor reached without a lift, on either end with door service. */
  const floors = () => {
    const d = v.porte_depart && !v.ascenseur_depart ? Number(v.etage_depart) || 0 : 0;
    const a = v.porte_arrivee && !v.ascenseur_arrivee ? Number(v.etage_arrivee) || 0 : 0;
    const etage = Math.max(d, a);
    return { etage, acces_escalier: etage > 0 };
  };

  const payload = useCallback(() => {
    const f = floors();
    return {
      service_slug: v.service_slug,
      pickup_address: v.pickup_address,
      pickup_contact: v.pickup_contact,
      pickup_phone: v.pickup_phone,
      delivery_address: v.delivery_address,
      delivery_contact: v.delivery_contact,
      delivery_phone: v.delivery_phone,
      delivery_email: v.delivery_email,
      delivery_instructions: [v.delivery_instructions, v.porte_depart && Number(v.etage_depart) > 0 ? `Départ : étage ${v.etage_depart}${v.ascenseur_depart ? " (ascenseur)" : " sans ascenseur"}` : null, v.porte_arrivee && Number(v.etage_arrivee) > 0 ? `Arrivée : étage ${v.etage_arrivee}${v.ascenseur_arrivee ? " (ascenseur)" : " sans ascenseur"}` : null].filter(Boolean).join(" · "),
      wanted_date: v.wanted_date,
      creneau: v.creneau,
      mode_id: modeFor(v.porte_arrivee),
      vehicule_id: v.vehicule_id,
      porte_depart: v.porte_depart,
      porte_arrivee: v.porte_arrivee,
      nb_colis: Number(v.nb_colis) || 1,
      poids_total_kg: zoneMode ? 0 : Number(v.poids_total_kg) || 0,
      nb_colis_lourds: 0,
      longueur_max_cm: zoneMode ? 0 : Number(v.longueur_max_cm) || 0,
      etage: f.etage,
      acces_escalier: f.acces_escalier,
      options: selectedOptionIds(),
      inventaire: Object.fromEntries(Object.entries(v.inventaire).filter(([, q]) => q > 0)),
      inventaire_autre: (v.inventaire.autre ?? 0) > 0 ? v.autre_texte : "",
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [v, ctx, zoneMode, selectedOptionIds]);

  // ── Section completeness (what unfolds next) ──
  const okTrajet = v.pickup_address.trim().length >= 5 && v.delivery_address.trim().length >= 5;
  const okTaille = zoneMode ? !!v.vehicule_id : Number(v.poids_total_kg) > 0 && Number(v.longueur_max_cm) > 0;
  const okDate = /^\d{4}-\d{2}-\d{2}$/.test(v.wanted_date) && !dateBloquee && !!v.creneau;
  const okContact = v.contact_name.trim().length >= 2 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.email.trim()) && /^(\+?\d[\d\s.-]{7,18})$/.test(v.phone.trim());
  const showTaille = okTrajet;
  const showRemise = showTaille && okTaille;
  const showDate = showRemise;
  const showContact = showDate && okDate;
  const showPrix = showContact;

  // ── Live price from NAMY as soon as the pricing inputs are there (debounced) ──
  useEffect(() => {
    if (!okTrajet || !okTaille || !/^\d{4}-\d{2}-\d{2}$/.test(v.wanted_date)) return;
    const seq = ++quoteSeq.current;
    const t = setTimeout(async () => {
      setQuoting(true);
      try {
        const res = await fetch("/api/quote", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload()) });
        const json = (await res.json()) as QuoteResponse;
        if (seq !== quoteSeq.current) return;
        setQuote(res.ok ? json : { mode: "quote", reason: json.error ?? "erreur", fields: json.fields });
      } catch {
        if (seq === quoteSeq.current) setQuote({ mode: "quote", reason: "namy_non_configure" });
      } finally {
        if (seq === quoteSeq.current) setQuoting(false);
      }
    }, 500);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [okTrajet, okTaille, v.pickup_address, v.delivery_address, v.vehicule_id, v.porte_depart, v.porte_arrivee, v.etage_depart, v.etage_arrivee, v.ascenseur_depart, v.ascenseur_arrivee, v.equipier, v.options, v.wanted_date, v.creneau, v.poids_total_kg, v.longueur_max_cm, v.nb_colis, v.service_slug]);

  const validate = (): Record<string, string> => {
    const e: Record<string, string> = {};
    if (v.pickup_address.trim().length < 5) e.pickup_address = "Indiquez l'adresse complète de départ.";
    if (v.delivery_address.trim().length < 5) e.delivery_address = "Indiquez l'adresse complète d'arrivée.";
    if (zoneMode && !v.vehicule_id) e.vehicule_id = "Choisissez la taille du véhicule.";
    if (!zoneMode && !(Number(v.poids_total_kg) > 0)) e.poids_total_kg = "Indiquez le poids total.";
    if (!zoneMode && !(Number(v.longueur_max_cm) > 0)) e.longueur_max_cm = "Indiquez la plus grande longueur.";
    if (!v.wanted_date || v.wanted_date < todayIso()) e.wanted_date = "Choisissez une date à partir d'aujourd'hui.";
    else if (dateBloquee) e.wanted_date = dateBloquee;
    if (!v.creneau) e.creneau = "Choisissez un créneau.";
    if (v.goods_type.trim().length < 2) e.goods_type = "Dites-nous ce que nous transportons.";
    if (v.contact_name.trim().length < 2) e.contact_name = "Votre nom est requis.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.email.trim())) e.email = "E-mail invalide.";
    if (!/^(\+?\d[\d\s.-]{7,18})$/.test(v.phone.trim())) e.phone = "Téléphone invalide.";
    if (v.delivery_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.delivery_email.trim())) e.delivery_email = "E-mail invalide.";
    if (!v.accept_terms) e.accept_terms = "Merci d'accepter les CGV.";
    return e;
  };

  const submit = async () => {
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length) {
      document.getElementById(`f-${Object.keys(e)[0]}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    setSubmitting(true);
    setServerError(null);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...payload(), goods_type: v.goods_type, notes: v.notes, company: v.company, contact_name: v.contact_name, email: v.email, phone: v.phone, accept_terms: v.accept_terms, website: v.website, ...readAttribution() }),
      });
      const json = (await res.json()) as { error?: string; fields?: Record<string, string>; reference?: string; checkout_url?: string };
      if (!res.ok) {
        if (json.fields) setErrors(json.fields);
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
  const instant = quote?.mode === "instant" && !!prix;
  const vehiculeChoisi = vehicules.find((x) => x.id === v.vehicule_id) ?? null;
  const prixOption = (code: string) => {
    const o = optionByCode(code);
    return o?.prix != null ? formatEuros(Math.round(o.prix * TVA * 100)) : null;
  };

  return (
    <div className="space-y-6">
      {cancelled && (
        <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
          {copy.cancelledBody} {params.get("ref") && <strong>Référence : {params.get("ref")}</strong>}
        </div>
      )}
      {ctxError && <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">Le calcul de prix en ligne est momentanément indisponible : votre demande sera chiffrée par notre exploitation sous 24h.</div>}
      {!sellsOnline && <div className="rounded-xl border border-brand-100 bg-brand-50 p-4 text-sm text-brand-800">{QUOTE_REASONS.service_on_quote} Décrivez votre besoin, nous revenons vers vous sous 24h.</div>}

      <form
        className="space-y-6"
        onSubmit={(e) => {
          e.preventDefault();
          void submit();
        }}
        noValidate
      >
        <div className="hidden" aria-hidden="true">
          <label htmlFor="website">Site web</label>
          <input id="website" name="website" tabIndex={-1} autoComplete="off" value={v.website} onChange={(e) => set("website", e.target.value)} />
        </div>

        {/* 1 · Trajet */}
        <Section n={1} title="Votre trajet" done={okTrajet}>
          <div className="grid gap-4 md:grid-cols-2">
            <div id="f-pickup_address">
              <label className="label" htmlFor="pickup_address">Adresse de départ *</label>
              <AddressInput id="pickup_address" value={v.pickup_address} onChange={(x) => set("pickup_address", x)} placeholder="12 rue de la Paix, 75002 Paris" required />
              {err("pickup_address")}
            </div>
            <div id="f-delivery_address">
              <label className="label" htmlFor="delivery_address">Adresse d&apos;arrivée *</label>
              <AddressInput id="delivery_address" value={v.delivery_address} onChange={(x) => set("delivery_address", x)} placeholder="125 rue Diderot, 93700 Drancy" required accent />
              {err("delivery_address")}
            </div>
          </div>
          {okTrajet && prix?.distance_km != null && <p className="mt-3 text-sm text-slate-500">Distance estimée : {prix.distance_km} km{prix.zone?.rayon_km ? ` · ${prix.zone.rayon_km} km inclus dans le forfait` : ""}</p>}
        </Section>

        {/* 2 · Taille du véhicule */}
        {showTaille && (
          <Section n={2} title={zoneMode ? "Quelle place vous faut-il ?" : "Que transportons-nous ?"} done={okTaille}>
            {zoneMode ? (
              <div id="f-vehicule_id">
                <p className="mb-3 text-sm text-slate-600">Choisissez la surface au sol dont vous avez besoin. Le prix comprend le chauffeur et {vehicules[0]?.rayon_km ?? 20} km.</p>
                <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                  {vehicules.map((veh, i) => {
                    const active = v.vehicule_id === veh.id;
                    const size = (Math.min(4, Math.max(1, (veh.ordre ?? i + 1))) as 1 | 2 | 3 | 4);
                    return (
                      <label key={veh.id} className={`flex cursor-pointer flex-col items-center rounded-2xl border-2 p-4 text-center transition ${active ? "border-brand-800 bg-brand-50 shadow-md" : "border-slate-200 bg-white hover:border-slate-300"}`}>
                        <input type="radio" name="vehicule_id" className="sr-only" value={veh.id} checked={active} onChange={() => set("vehicule_id", veh.id)} />
                        <TruckIcon size={size} className="h-16 w-full" color={active ? "#0b1f3a" : "#475569"} />
                        <span className="mt-2 text-2xl font-extrabold text-brand-800">{veh.surface_m2 != null ? `${veh.surface_m2} m²` : veh.nom}</span>
                        <span className="text-xs font-medium uppercase tracking-wide text-slate-500">{veh.nom}{veh.volume ? ` · ${veh.volume}` : ""}</span>
                        {veh.prix_base_ht != null && (
                          <span className="mt-2 rounded-full bg-primary-500/15 px-3 py-1 text-sm font-semibold text-primary-700">
                            dès {formatEuros(Math.round(veh.prix_base_ht * TVA * 100))} <span className="font-normal text-slate-500">TTC</span>
                          </span>
                        )}
                        {veh.surface_m2 != null && advisor.exemples[String(veh.surface_m2)] && (
                          <span className="mt-2 text-xs leading-snug text-slate-500">ex. {advisor.exemples[String(veh.surface_m2)]}</span>
                        )}
                      </label>
                    );
                  })}
                </div>
                {err("vehicule_id")}
                <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
                  <p>Au-delà des {vehicules[0]?.rayon_km ?? 20} km inclus, {prix?.zone?.prix_km_ht ? formatEuros(Math.round(prix.zone.prix_km_ht * TVA * 100)) : "2,40 €"} TTC par km supplémentaire.</p>
                  {advisor.catalogue.length > 0 && !advisorOpen && (
                    <button
                      type="button"
                      className="text-sm font-semibold text-brand-600 underline"
                      onClick={() => {
                        setAdvisorOpen(true);
                        track("assistant_taille_ouvert");
                      }}
                    >
                      Je ne sais pas quelle taille choisir
                    </button>
                  )}
                </div>
                {advisorOpen && (
                  <SizeAdvisor
                    catalogue={advisor.catalogue}
                    capacites={advisor.capacites}
                    vehicules={vehicules}
                    inventaire={v.inventaire}
                    autreTexte={v.autre_texte}
                    onInventaire={(inv) => set("inventaire", inv)}
                    onAutreTexte={(t) => set("autre_texte", t)}
                    onClose={() => setAdvisorOpen(false)}
                    onChoose={(id, resume) => {
                      const changed = v.vehicule_id && v.vehicule_id !== id;
                      setV((cur) => ({ ...cur, vehicule_id: id, goods_type: cur.goods_type.trim() ? cur.goods_type : resume }));
                      setAdvisorOpen(false);
                      track(changed ? "assistant_taille_change" : "assistant_taille_accepte", { vehicule_id: id });
                      document.getElementById("f-vehicule_id")?.scrollIntoView({ behavior: "smooth", block: "start" });
                    }}
                  />
                )}
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-3">
                <div id="f-nb_colis">
                  <label className="label" htmlFor="nb_colis">Nombre de colis</label>
                  <input id="nb_colis" type="number" min={1} className="field" value={v.nb_colis} onChange={(e) => set("nb_colis", e.target.value)} />
                </div>
                <div id="f-poids_total_kg">
                  <label className="label" htmlFor="poids_total_kg">Poids total (kg) *</label>
                  <input id="poids_total_kg" type="number" min={0.1} step="0.1" className="field" value={v.poids_total_kg} onChange={(e) => set("poids_total_kg", e.target.value)} />
                  {err("poids_total_kg")}
                </div>
                <div id="f-longueur_max_cm">
                  <label className="label" htmlFor="longueur_max_cm">Plus grande longueur (cm) *</label>
                  <input id="longueur_max_cm" type="number" min={1} className="field" value={v.longueur_max_cm} onChange={(e) => set("longueur_max_cm", e.target.value)} />
                  {err("longueur_max_cm")}
                </div>
              </div>
            )}
          </Section>
        )}

        {/* 3 · Remise porte / trottoir + options */}
        {showRemise && (
          <Section n={3} title="Comment on vous livre" done>
            <div className="grid gap-4 md:grid-cols-2">
              <Remise
                titre="Au départ"
                porte={v.porte_depart}
                onPorte={(p) => set("porte_depart", p)}
                etage={v.etage_depart}
                onEtage={(x) => set("etage_depart", x)}
                ascenseur={v.ascenseur_depart}
                onAscenseur={(a) => set("ascenseur_depart", a)}
                prix={prixOption("porte_depart")}
                regle={regleEtage}
              />
              <Remise
                titre="À l'arrivée"
                porte={v.porte_arrivee}
                onPorte={(p) => set("porte_arrivee", p)}
                etage={v.etage_arrivee}
                onEtage={(x) => set("etage_arrivee", x)}
                ascenseur={v.ascenseur_arrivee}
                onAscenseur={(a) => set("ascenseur_arrivee", a)}
                prix={prixOption("porte_arrivee")}
                regle={regleEtage}
              />
            </div>
            {optionByCode("equipier") && (
              <label className={`mt-4 flex cursor-pointer items-start gap-3 rounded-xl border p-3 text-sm ${v.equipier ? "border-brand-800 bg-brand-50" : "border-slate-200"}`}>
                <input type="checkbox" className="mt-1 h-4 w-4" checked={v.equipier} onChange={(e) => set("equipier", e.target.checked)} />
                <span>
                  <span className="font-medium text-slate-900">💪 {optionByCode("equipier")?.nom}</span>
                  {prixOption("equipier") && <span className="text-slate-500"> · +{prixOption("equipier")} TTC</span>}
                  <span className="block text-xs text-slate-500">{optionByCode("equipier")?.description ?? "Un second homme pour charger et décharger les objets lourds ou encombrants."}</span>
                </span>
              </label>
            )}
            {otherOptions.length > 0 && (
              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                {otherOptions.map((o) => {
                  const on = v.options.includes(o.id);
                  return (
                    <label key={o.id} className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 text-sm ${on ? "border-brand-800 bg-brand-50" : "border-slate-200"}`}>
                      <input type="checkbox" className="mt-1 h-4 w-4" checked={on} onChange={(e) => set("options", e.target.checked ? [...v.options, o.id] : v.options.filter((x) => x !== o.id))} />
                      <span>
                        <span className="font-medium text-slate-900">{o.icone ? o.icone + " " : ""}{o.nom}</span>
                        {o.prix != null && <span className="text-slate-500"> · +{formatEuros(Math.round(o.prix * TVA * 100))} TTC{o.unite_label ? ` / ${o.unite_label}` : ""}</span>}
                        {o.description && <span className="block text-xs text-slate-500">{o.description}</span>}
                      </span>
                    </label>
                  );
                })}
              </div>
            )}
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div id="f-goods_type">
                <label className="label" htmlFor="goods_type">Que transportons-nous ? *</label>
                <input id="goods_type" className="field" placeholder="Ex. : un canapé 3 places, 6 cartons, une machine à laver…" value={v.goods_type} onChange={(e) => set("goods_type", e.target.value)} />
                {err("goods_type")}
              </div>
              <div>
                <label className="label" htmlFor="notes">Précisions</label>
                <input id="notes" className="field" placeholder="Horaires, digicode, objet fragile…" value={v.notes} onChange={(e) => set("notes", e.target.value)} />
              </div>
            </div>
          </Section>
        )}

        {/* 4 · Date */}
        {showDate && (
          <Section n={4} title="Quand ?" done={okDate}>
            <div className="grid gap-4 md:grid-cols-2">
              <div id="f-wanted_date">
                <label className="label" htmlFor="wanted_date">Date *</label>
                <input
                  id="wanted_date"
                  type="date"
                  className="field"
                  min={todayIso()}
                  value={v.wanted_date}
                  onChange={(e) => {
                    setDateTouched(true);
                    set("wanted_date", e.target.value);
                  }}
                  required
                />
                {err("wanted_date")}
                {!errors.wanted_date && dateBloquee && <p className="mt-1 text-sm text-amber-700">{dateBloquee} : choisissez une autre date.</p>}
                {ctx && <p className="mt-1 text-xs text-slate-500">Jours de livraison : {ctx.jours_service.join(", ")}{ctx.commande_jour_j ? ` · le jour même jusqu'à ${ctx.heure_limite_jour_j}` : ""}.</p>}
              </div>
              <div id="f-creneau">
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
          </Section>
        )}

        {/* 5 · Coordonnées */}
        {showContact && (
          <Section n={5} title="Vos coordonnées" done={okContact}>
            <div className="grid gap-4 md:grid-cols-2">
              <div id="f-contact_name">
                <label className="label" htmlFor="contact_name">Nom et prénom *</label>
                <input id="contact_name" className="field" value={v.contact_name} onChange={(e) => set("contact_name", e.target.value)} autoComplete="name" />
                {err("contact_name")}
              </div>
              <div>
                <label className="label" htmlFor="company">Société (si professionnel)</label>
                <input id="company" className="field" value={v.company} onChange={(e) => set("company", e.target.value)} autoComplete="organization" />
              </div>
              <div id="f-email">
                <label className="label" htmlFor="email">E-mail *</label>
                <input id="email" type="email" className="field" value={v.email} onChange={(e) => set("email", e.target.value)} autoComplete="email" inputMode="email" />
                {err("email")}
              </div>
              <div id="f-phone">
                <label className="label" htmlFor="phone">Téléphone *</label>
                <input id="phone" type="tel" className="field" value={v.phone} onChange={(e) => set("phone", e.target.value)} autoComplete="tel" inputMode="tel" />
                {err("phone")}
              </div>
            </div>
            <details className="mt-4 rounded-xl border border-slate-200 p-3 text-sm">
              <summary className="cursor-pointer font-medium text-brand-800">Quelqu&apos;un d&apos;autre sur place au départ ou à l&apos;arrivée ?</summary>
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                <input className="field" placeholder="Contact au départ (nom)" value={v.pickup_contact} onChange={(e) => set("pickup_contact", e.target.value)} />
                <input className="field" type="tel" placeholder="Téléphone au départ" value={v.pickup_phone} onChange={(e) => set("pickup_phone", e.target.value)} />
                <input className="field" placeholder="Destinataire (nom)" value={v.delivery_contact} onChange={(e) => set("delivery_contact", e.target.value)} />
                <input className="field" type="tel" placeholder="Téléphone du destinataire" value={v.delivery_phone} onChange={(e) => set("delivery_phone", e.target.value)} />
                <input className="field md:col-span-2" type="email" placeholder="E-mail du destinataire (il reçoit le suivi)" value={v.delivery_email} onChange={(e) => set("delivery_email", e.target.value)} />
                {err("delivery_email")}
                <input className="field md:col-span-2" placeholder="Consignes d'accès (digicode, interphone…)" value={v.delivery_instructions} onChange={(e) => set("delivery_instructions", e.target.value)} />
              </div>
            </details>
          </Section>
        )}

        {/* 6 · Prix + paiement */}
        {showPrix && (
          <Section n={6} title="Votre prix" done={false}>
            <div className="rounded-2xl bg-brand-50 p-5">
              {quoting && !quote ? (
                <p className="text-brand-800">Calcul du prix…</p>
              ) : instant && prix ? (
                <>
                  <div className="flex flex-wrap items-end justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold uppercase tracking-wide text-brand-600">Prix ferme{quoting ? " · mise à jour…" : ""}</p>
                      <p className="mt-1 text-4xl font-extrabold text-brand-800">
                        {formatEuros(quote?.total_cents ?? 0)} <span className="text-base font-semibold text-slate-500">TTC</span>
                      </p>
                      <p className="text-sm text-slate-600">soit {formatEuros(quote?.price_cents ?? 0)} HT · {prix.distance_km} km</p>
                    </div>
                    {vehiculeChoisi && <TruckIcon size={(Math.min(4, Math.max(1, vehiculeChoisi.ordre ?? 1)) as 1 | 2 | 3 | 4)} className="h-12 w-28 text-brand-800" />}
                  </div>
                  <ul className="mt-4 space-y-1 text-sm text-slate-600">
                    <li className="flex justify-between"><span>{prix.vehicule ? `${prix.vehicule.nom}${prix.vehicule.surface_m2 != null ? ` · ${prix.vehicule.surface_m2} m²` : ""}${prix.zone?.rayon_km ? ` · ${prix.zone.rayon_km} km inclus` : ""}` : `Prise en charge${prix.mode ? ` (${prix.mode.libelle})` : ""}`}</span><span>{formatEuros(Math.round((prix.zone?.forfait_ht ?? prix.base_ht) * 100))}</span></li>
                    {prix.zone && prix.zone.extra_km > 0 && <li className="flex justify-between"><span>{prix.zone.extra_km} km au-delà × {formatEuros(Math.round(prix.zone.prix_km_ht * 100))}</span><span>{formatEuros(Math.round(prix.zone.extra_km * prix.zone.prix_km_ht * 100))}</span></li>}
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
                    <Icon name="shield" className="h-4 w-4" /> Paiement sécurisé par Stripe. Annulation possible, échec de retrait facturé 50 %.
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

            <label id="f-accept_terms" className="mt-4 flex items-start gap-3 text-sm text-slate-700">
              <input type="checkbox" className="mt-1 h-4 w-4" checked={v.accept_terms} onChange={(e) => set("accept_terms", e.target.checked)} />
              <span>
                J&apos;accepte les{" "}
                <Link href="/cgv" className="font-semibold text-brand-600 underline" target="_blank">conditions générales de vente</Link>{" "}
                et le traitement de mes données pour l&apos;exécution de la prestation. *
              </span>
            </label>
            {err("accept_terms")}
            {serverError && <p className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">{serverError}</p>}
            <button type="submit" className="btn-primary mt-5 w-full justify-center py-4 text-lg sm:w-auto" disabled={submitting || quoting}>
              {submitting ? "Envoi…" : instant ? `Payer ${formatEuros(quote?.total_cents ?? 0)} et réserver` : "Envoyer ma demande de devis"}
            </button>
            <p className="mt-3 text-center text-xs text-slate-500 sm:text-left">Sans engagement · Exploitation joignable 24h/24 au 07 67 16 60 15</p>
          </Section>
        )}
      </form>

      {/* Sticky total on mobile while the form unfolds */}
      {instant && showPrix && (
        <div className="fixed inset-x-0 bottom-0 z-20 border-t border-slate-200 bg-white/95 p-3 backdrop-blur sm:hidden">
          <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-1">
            <span className="text-sm text-slate-600">Total TTC</span>
            <span className="text-xl font-extrabold text-brand-800">{formatEuros(quote?.total_cents ?? 0)}</span>
          </div>
        </div>
      )}
    </div>
  );
}

function Section({ n, title, done, children }: { n: number; title: string; done: boolean; children: React.ReactNode }) {
  return (
    <section className="card scroll-mt-24">
      <h2 className="mb-4 flex items-center gap-3 text-lg font-bold text-brand-800">
        <span className={`flex h-7 w-7 items-center justify-center rounded-full text-sm font-bold ${done ? "bg-primary-500 text-white" : "bg-brand-800 text-white"}`}>{done ? <Icon name="check" className="h-4 w-4" /> : n}</span>
        {title}
      </h2>
      {children}
    </section>
  );
}

function Remise({ titre, porte, onPorte, etage, onEtage, ascenseur, onAscenseur, prix, regle }: {
  titre: string;
  porte: boolean;
  onPorte: (p: boolean) => void;
  etage: string;
  onEtage: (x: string) => void;
  ascenseur: boolean;
  onAscenseur: (a: boolean) => void;
  prix: string | null;
  regle: { seuil: number | null; prix: number | null; nom: string } | null;
}) {
  const seuil = regle?.seuil ?? 3;
  return (
    <div className="rounded-xl border border-slate-200 p-3">
      <p className="label">{titre}</p>
      <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label={titre}>
        <button type="button" role="radio" aria-checked={!porte} onClick={() => onPorte(false)} className={`rounded-lg border px-3 py-2 text-sm font-medium ${!porte ? "border-brand-800 bg-brand-800 text-white" : "border-slate-300 text-slate-700"}`}>
          Au trottoir<span className="block text-xs font-normal opacity-80">inclus</span>
        </button>
        <button type="button" role="radio" aria-checked={porte} onClick={() => onPorte(true)} className={`rounded-lg border px-3 py-2 text-sm font-medium ${porte ? "border-brand-800 bg-brand-800 text-white" : "border-slate-300 text-slate-700"}`}>
          À la porte<span className="block text-xs font-normal opacity-80">{prix ? `+${prix} TTC` : "en option"}</span>
        </button>
      </div>
      {porte && (
        <div className="mt-3 grid grid-cols-[1fr_auto] items-end gap-3">
          <div>
            <label className="label">Étage</label>
            <input type="number" min={0} max={60} className="field" value={etage} onChange={(e) => onEtage(e.target.value)} />
          </div>
          <label className="flex items-center gap-2 pb-3 text-sm text-slate-700">
            <input type="checkbox" className="h-4 w-4" checked={ascenseur} onChange={(e) => onAscenseur(e.target.checked)} />
            Ascenseur
          </label>
          <p className="col-span-2 text-xs text-slate-500">
            {seuil} étages compris.{regle?.prix != null ? ` Sans ascenseur, +${formatEuros(Math.round(regle.prix * TVA * 100))} TTC par étage à partir du ${seuil + 1}e.` : ""}
          </p>
        </div>
      )}
    </div>
  );
}
