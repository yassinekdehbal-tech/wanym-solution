"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Icon } from "@/components/Icon";

/** Hero widget: "départ > arrivée" → /commander with both addresses pre-filled. */
export function RouteSearch({ labels }: { labels: { title: string; from: string; to: string; button: string } }) {
  const router = useRouter();
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  return (
    <form
      className="rounded-2xl bg-white p-4 shadow-xl ring-1 ring-black/5 sm:p-5"
      onSubmit={(e) => {
        e.preventDefault();
        const q = new URLSearchParams();
        if (from.trim()) q.set("from", from.trim());
        if (to.trim()) q.set("to", to.trim());
        router.push(`/commander${q.size ? "?" + q.toString() : ""}`);
      }}
    >
      <p className="mb-3 text-sm font-semibold text-brand-800">{labels.title}</p>
      <div className="grid gap-3 sm:grid-cols-[1fr_auto_1fr_auto] sm:items-center">
        <label className="sr-only" htmlFor="route-from">{labels.from}</label>
        <div className="relative">
          <Icon name="pin" className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
          <input id="route-from" className="field pl-10" placeholder={labels.from} value={from} onChange={(e) => setFrom(e.target.value)} autoComplete="street-address" />
        </div>
        <Icon name="arrow" className="hidden h-5 w-5 text-slate-400 sm:block" />
        <label className="sr-only" htmlFor="route-to">{labels.to}</label>
        <div className="relative">
          <Icon name="pin" className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-primary-600" />
          <input id="route-to" className="field pl-10" placeholder={labels.to} value={to} onChange={(e) => setTo(e.target.value)} autoComplete="street-address" />
        </div>
        <button type="submit" className="btn-primary">
          {labels.button}
        </button>
      </div>
    </form>
  );
}
