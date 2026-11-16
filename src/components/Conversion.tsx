"use client";

import { useEffect } from "react";

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

/** Fires the paid-order conversion once per order (Google Ads, Meta Purchase, LinkedIn), guarded with sessionStorage. */
export function Conversion({ reference, valueCents, sendTo, email }: { reference: string; valueCents: number | null; sendTo: string; email?: string | null }) {
  useEffect(() => {
    if (!reference) return;
    const key = `conv:${reference}`;
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, "1");
    } catch {
      /* private mode */
    }
    const value = valueCents != null ? valueCents / 100 : undefined;
    const fire = () => {
      // Conversions améliorées : l'e-mail est haché par gtag et n'est envoyé que si ad_user_data est « granted » (Consent Mode).
      if (sendTo && email) window.gtag?.("set", "user_data", { email });
      if (sendTo) window.gtag?.("event", "conversion", { send_to: sendTo, value, currency: "EUR", transaction_id: reference });
      // Meta / LinkedIn only exist once the visitor accepted the ad cookies (AdTags).
      window.fbq?.("track", "Purchase", { value: value ?? 0, currency: "EUR", content_ids: [reference] });
      if (window.lintrk && process.env.NEXT_PUBLIC_LINKEDIN_CONVERSION_ID) window.lintrk("track", { conversion_id: process.env.NEXT_PUBLIC_LINKEDIN_CONVERSION_ID });
    };
    if (window.gtag || window.fbq) fire();
    else setTimeout(fire, 1500);
  }, [reference, valueCents, sendTo, email]);
  return null;
}
