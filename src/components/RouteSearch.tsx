"use client";

import { useRouter } from "next/navigation";
import { useId, useState } from "react";
import { AddressInput } from "@/components/AddressInput";
import { Icon } from "@/components/Icon";
import { track } from "@/lib/analytics";

/**
 * Widget « départ → arrivée → Voir le prix » : pousse vers /commander avec les
 * adresses préremplies, même incomplètes (le formulaire les complète).
 */
export function RouteSearch({ labels, compact = false }: { labels: { title?: string; from: string; to: string; button: string }; compact?: boolean }) {
  const router = useRouter();
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const uid = useId();
  const fromId = `route-from-${uid}`;
  const toId = `route-to-${uid}`;
  return (
    <form
      className={compact ? "rounded-2xl bg-white p-3 shadow-float ring-1 ring-black/5 sm:p-4" : "rounded-2xl bg-white p-4 shadow-float ring-1 ring-black/5 sm:p-5"}
      onSubmit={(e) => {
        e.preventDefault();
        const q = new URLSearchParams();
        if (from.trim()) q.set("from", from.trim());
        if (to.trim()) q.set("to", to.trim());
        track("voir_prix_click", { from_filled: Boolean(from.trim()), to_filled: Boolean(to.trim()) });
        router.push(`/commander${q.size ? "?" + q.toString() : ""}`);
      }}
    >
      {labels.title && !compact && <p className="mb-3 text-sm font-semibold text-brand-800">{labels.title}</p>}
      <div className="grid gap-2.5 sm:grid-cols-[1fr_auto_1fr_auto] sm:items-center">
        <div>
          <label className="sr-only" htmlFor={fromId}>{labels.from}</label>
          <AddressInput id={fromId} value={from} onChange={setFrom} placeholder={labels.from} />
        </div>
        <Icon name="arrow" className="hidden h-5 w-5 text-slate-400 sm:block" />
        <div>
          <label className="sr-only" htmlFor={toId}>{labels.to}</label>
          <AddressInput id={toId} value={to} onChange={setTo} placeholder={labels.to} accent />
        </div>
        <button type="submit" className="btn-primary">
          {labels.button} <Icon name="arrow" className="h-4 w-4" />
        </button>
      </div>
    </form>
  );
}
