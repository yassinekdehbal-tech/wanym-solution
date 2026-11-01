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

export function track(name: TrackEvent, params: Record<string, string | number | boolean | undefined> = {}) {
  if (typeof window === "undefined") return;
  try {
    window.gtag?.("event", name, params);
  } catch {
    /* la mesure n'est jamais bloquante */
  }
}
