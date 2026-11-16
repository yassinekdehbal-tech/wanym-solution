/**
 * Événements de mesure (Google Ads / gtag). Un seul point d'envoi, jamais de
 * donnée personnelle dans les paramètres (pas d'adresse, d'e-mail, de téléphone).
 * Sans balise configurée, l'appel est silencieux.
 */
export type TrackEvent =
  | "voir_prix_click"
  | "commander_vue"
  | "camion_selectionne"
  | "assistant_taille_ouvert"
  | "assistant_taille_accepte"
  | "assistant_taille_change"
  | "prix_confirme"
  | "paiement_debut"
  | "devis_envoye";

/** Événements standard Meta déclenchés en miroir (le pixel n'existe qu'après consentement). */
const META_EVENTS: Partial<Record<TrackEvent, string>> = { prix_confirme: "ViewContent", paiement_debut: "InitiateCheckout", devis_envoye: "Lead" };

export function track(name: TrackEvent, params: Record<string, string | number | boolean | undefined> = {}) {
  if (typeof window === "undefined") return;
  try {
    window.gtag?.("event", name, params);
    if (name === "prix_confirme") fireLeadConversion();
    const meta = META_EVENTS[name];
    if (meta) window.fbq?.("track", meta, typeof params.value === "number" ? { value: params.value, currency: "EUR" } : {});
    if (name === "devis_envoye" && window.lintrk && process.env.NEXT_PUBLIC_LINKEDIN_CONVERSION_ID) window.lintrk("track", { conversion_id: process.env.NEXT_PUBLIC_LINKEDIN_CONVERSION_ID });
  } catch {
    /* la mesure n'est jamais bloquante */
  }
}

/** Conversion secondaire Google Ads « Prix affiché » : une fois par session, sans valeur (comptage « une »). */
function fireLeadConversion() {
  const id = process.env.NEXT_PUBLIC_GTAG_ID;
  const label = process.env.NEXT_PUBLIC_GTAG_LEAD_LABEL;
  if (!id || !label) return;
  try {
    if (sessionStorage.getItem("conv:lead")) return;
    sessionStorage.setItem("conv:lead", "1");
  } catch {
    /* navigation privée : on envoie quand même, Google dédoublonne au comptage « une » */
  }
  window.gtag?.("event", "conversion", { send_to: `${id}/${label}` });
}
