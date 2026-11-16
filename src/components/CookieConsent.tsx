"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CONSENT_EVENT, readConsent, writeConsent } from "@/lib/consent";

/**
 * Bandeau de consentement (CNIL) : refuser est aussi simple qu'accepter, aucun cookie
 * publicitaire avant le choix, choix mémorisé 6 mois, rouvrable depuis le pied de page.
 * N'apparaît que si au moins une balise publicitaire est configurée (`enabled`).
 */
export function CookieConsent({ enabled }: { enabled: boolean }) {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!enabled) return;
    // Read after mount (localStorage is unavailable on the server); deferred so the first paint stays the server one.
    const t = setTimeout(() => setOpen(readConsent() == null), 0);
    const onOpen = () => setOpen(true);
    window.addEventListener(CONSENT_EVENT + ":open", onOpen);
    return () => {
      clearTimeout(t);
      window.removeEventListener(CONSENT_EVENT + ":open", onOpen);
    };
  }, [enabled]);
  if (!enabled || !open) return null;
  const choose = (ads: boolean) => {
    writeConsent(ads);
    setOpen(false);
  };
  return (
    <div role="dialog" aria-modal="false" aria-labelledby="consent-title" className="safe-bottom fixed inset-x-3 bottom-20 z-50 mx-auto max-w-xl rounded-2xl border border-slate-200 bg-white p-4 shadow-float sm:p-5 md:bottom-4">
      <p id="consent-title" className="font-display font-bold text-brand-800">Cookies de mesure publicitaire</p>
      <p className="mt-1 text-sm text-slate-600">
        Avec votre accord, nous utilisons des cookies Google Ads, Meta et LinkedIn pour savoir quelle campagne vous a amené ici. Sans accord, rien n&apos;est déposé et le site fonctionne pareil.{" "}
        <Link href="/mentions-legales#cookies" className="font-semibold text-brand-600 underline">En savoir plus</Link>
      </p>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <button type="button" onClick={() => choose(false)} className="btn-outline btn-sm">Refuser</button>
        <button type="button" onClick={() => choose(true)} className="btn-primary btn-sm">Accepter</button>
      </div>
    </div>
  );
}
