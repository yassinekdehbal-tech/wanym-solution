/**
 * Consentement aux cookies publicitaires (Google Ads, Meta, LinkedIn). Décision binaire,
 * stockée localement, relue par les balises : aucun pixel n'est chargé tant que `ads` n'est pas
 * vrai, et Google Consent Mode reste en « denied ». Module pur : aucune dépendance au DOM en
 * dehors de `readConsent` / `writeConsent`, pour rester testable.
 */
export const CONSENT_KEY = "wanym:consent";
export const CONSENT_EVENT = "wanym:consent";
export const CONSENT_VERSION = 1;
/** Un choix se redemande après 6 mois (recommandation CNIL : 6 mois maximum). */
export const CONSENT_MAX_AGE_MS = 182 * 86_400_000;

export type Consent = { ads: boolean; at: number; v: number };

export function parseConsent(raw: string | null, now = Date.now()): Consent | null {
  if (!raw) return null;
  try {
    const c = JSON.parse(raw) as Partial<Consent>;
    if (typeof c.ads !== "boolean" || typeof c.at !== "number" || c.v !== CONSENT_VERSION) return null;
    if (now - c.at > CONSENT_MAX_AGE_MS) return null;
    return { ads: c.ads, at: c.at, v: CONSENT_VERSION };
  } catch {
    return null;
  }
}

export function serializeConsent(ads: boolean, now = Date.now()): string {
  return JSON.stringify({ ads, at: now, v: CONSENT_VERSION } satisfies Consent);
}

export function readConsent(): Consent | null {
  if (typeof window === "undefined") return null;
  try {
    return parseConsent(localStorage.getItem(CONSENT_KEY));
  } catch {
    return null;
  }
}

export function writeConsent(ads: boolean) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(CONSENT_KEY, serializeConsent(ads));
  } catch {
    /* navigation privée : le choix ne vaut que pour la page */
  }
  window.dispatchEvent(new CustomEvent<{ ads: boolean }>(CONSENT_EVENT, { detail: { ads } }));
}

export function hasAdsConsent(): boolean {
  return readConsent()?.ads === true;
}

/** Rouvre le bandeau (lien « Gérer les cookies » du pied de page). */
export function reopenConsent() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(CONSENT_EVENT + ":open"));
}
