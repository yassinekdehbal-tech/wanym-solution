"use client";

import { reopenConsent } from "@/lib/consent";

export function ManageCookies({ className = "" }: { className?: string }) {
  return (
    <button type="button" onClick={reopenConsent} className={className}>Gérer les cookies</button>
  );
}
