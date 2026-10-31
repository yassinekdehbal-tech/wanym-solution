"use client";

import { useEffect } from "react";

export const ATTRIBUTION_KEY = "wanym:attribution";

/** Remembers gclid / utm_* from the landing URL so the order can be attributed to the ad. */
export function AttributionCapture() {
  useEffect(() => {
    try {
      const p = new URLSearchParams(window.location.search);
      const utm: Record<string, string> = {};
      for (const [k, v] of p) if (k.startsWith("utm_")) utm[k] = v.slice(0, 200);
      const gclid = p.get("gclid");
      if (!gclid && !Object.keys(utm).length) return;
      const existing = JSON.parse(localStorage.getItem(ATTRIBUTION_KEY) ?? "null");
      if (existing && Date.now() - existing.at < 90 * 86_400_000 && existing.gclid) return; // keep first click
      localStorage.setItem(ATTRIBUTION_KEY, JSON.stringify({ gclid, utm, at: Date.now(), landing: window.location.pathname }));
    } catch {
      /* ignore */
    }
  }, []);
  return null;
}

export function readAttribution(): { gclid?: string; utm?: Record<string, string> } {
  try {
    const a = JSON.parse(localStorage.getItem(ATTRIBUTION_KEY) ?? "null");
    if (!a) return {};
    return { gclid: a.gclid ?? undefined, utm: a.utm ?? undefined };
  } catch {
    return {};
  }
}
