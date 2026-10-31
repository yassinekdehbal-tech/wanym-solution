"use client";

import { useEffect } from "react";

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

/** Fires the Google Ads conversion once per order (guarded with sessionStorage). */
export function Conversion({ reference, valueCents, sendTo }: { reference: string; valueCents: number | null; sendTo: string }) {
  useEffect(() => {
    if (!sendTo || !reference) return;
    const key = `conv:${reference}`;
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, "1");
    } catch {
      /* private mode */
    }
    const fire = () =>
      window.gtag?.("event", "conversion", {
        send_to: sendTo,
        value: valueCents != null ? valueCents / 100 : undefined,
        currency: "EUR",
        transaction_id: reference,
      });
    if (window.gtag) fire();
    else setTimeout(fire, 1500);
  }, [reference, valueCents, sendTo]);
  return null;
}
