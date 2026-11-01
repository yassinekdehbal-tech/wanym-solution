"use client";

import { useState } from "react";
import { Icon } from "@/components/Icon";
import { formatEuros } from "@/lib/pricing";

export type PriceBarState = "indisponible" | "calcul" | "calcule" | "recalcul" | "devis" | "erreur";

/**
 * Barre de prix mobile, fixée en bas : l'état du tarif, l'action contextuelle et
 * le détail dépliable. Un montant n'est affiché comme confirmé que lorsqu'il l'est ;
 * pendant un recalcul, l'ancien montant est grisé et barré, jamais « ferme ».
 */
export function PriceBar({
  state,
  totalCents,
  previousCents,
  action,
  onAction,
  actionDisabled,
  busy,
  detail,
  hidden,
}: {
  state: PriceBarState;
  totalCents?: number | null;
  previousCents?: number | null;
  action: string;
  onAction: () => void;
  actionDisabled?: boolean;
  busy?: boolean;
  detail?: React.ReactNode;
  hidden?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const label = {
    indisponible: "Prix calculé après la taille",
    calcul: "Calcul du prix…",
    calcule: "Prix ferme TTC",
    recalcul: "Mise à jour du prix…",
    devis: "Sur devis",
    erreur: "Prix indisponible",
  }[state];
  return (
    <div
      className={`safe-bottom fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 px-3 pt-2 shadow-[0_-8px_30px_-12px_rgba(11,31,58,0.25)] backdrop-blur transition-transform sm:hidden ${hidden ? "translate-y-full" : ""}`}
      aria-live="polite"
      aria-hidden={hidden || undefined}
    >
      {open && detail && (
        <div className="mb-2 max-h-[45vh] overflow-auto rounded-xl bg-surface p-3">
          {detail}
        </div>
      )}
      <div className="flex items-center justify-between gap-3">
        <button type="button" className="flex min-h-11 min-w-0 flex-1 items-center gap-2 text-left" onClick={() => detail && setOpen((o) => !o)} aria-expanded={detail ? open : undefined} disabled={!detail}>
          <span className="min-w-0">
            <span className={`block text-[11px] font-semibold uppercase tracking-wide ${state === "erreur" ? "text-danger-700" : state === "calcule" ? "text-primary-700" : "text-muted"}`}>{label}</span>
            <span className="flex items-baseline gap-2">
              {state === "calcule" && totalCents != null && <span className="font-display text-2xl font-extrabold leading-none text-brand-800">{formatEuros(totalCents)}</span>}
              {state === "recalcul" && previousCents != null && <span className="font-display text-xl font-bold leading-none text-slate-400 line-through">{formatEuros(previousCents)}</span>}
              {state === "recalcul" && <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-primary-600 border-t-transparent" aria-hidden="true" />}
              {state === "calcul" && <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-primary-600 border-t-transparent" aria-hidden="true" />}
              {state === "devis" && <span className="text-sm text-slate-700">Réponse sous 24 h</span>}
              {state === "indisponible" && <span className="text-sm text-slate-500">dès que la taille est choisie</span>}
              {state === "erreur" && <span className="text-sm text-slate-700">Demandez un devis</span>}
            </span>
          </span>
          {detail && <Icon name="chevron" className={`h-4 w-4 shrink-0 text-slate-400 transition ${open ? "-rotate-90" : "rotate-90"}`} />}
        </button>
        <button type="button" className="btn-primary btn-sm shrink-0" onClick={onAction} disabled={actionDisabled} aria-busy={busy || undefined}>
          {busy ? "Envoi…" : action} {!busy && <Icon name="arrow" className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}
