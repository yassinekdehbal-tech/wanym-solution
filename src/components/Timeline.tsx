import { Icon } from "@/components/Icon";
import type { OrderStatus } from "@/lib/types";

const STEPS: { key: string; label: string; reached: OrderStatus[] }[] = [
  { key: "recue", label: "Reçue", reached: ["new", "quoted", "confirmed", "in_progress", "delivered", "sav", "cancelled"] },
  { key: "confirmee", label: "Confirmée", reached: ["confirmed", "in_progress", "delivered", "sav"] },
  { key: "en_cours", label: "En cours", reached: ["in_progress", "delivered", "sav"] },
  { key: "livree", label: "Livrée", reached: ["delivered"] },
];

/**
 * Frise d'état d'une commande : Reçue → Confirmée → En cours → Livrée, avec les
 * variantes Annulée (rouge) et Incident / SAV (orange). Les horodatages viennent
 * des événements publics quand ils existent.
 */
export function Timeline({ status, dates }: { status: OrderStatus; dates?: Partial<Record<string, string>> }) {
  const terminalBad = status === "cancelled" ? { label: "Annulée", tone: "danger" } : status === "sav" ? { label: "Incident en cours", tone: "warn" } : null;
  const fmt = (iso?: string) => (iso ? new Date(iso).toLocaleString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : null);
  return (
    <div>
      <ol className="grid grid-cols-4 gap-1 sm:gap-2" aria-label="Avancement de la commande">
        {STEPS.map((s, i) => {
          const done = s.reached.includes(status);
          const current = done && (STEPS[i + 1] ? !STEPS[i + 1].reached.includes(status) : true);
          return (
            <li key={s.key} className="relative text-center">
              {i > 0 && <span className={`absolute left-[-50%] right-1/2 top-4 h-0.5 ${done ? "bg-primary-600" : "bg-slate-200"}`} aria-hidden="true" />}
              <span className={`relative mx-auto grid h-8 w-8 place-items-center rounded-full border-2 ${done ? "border-primary-600 bg-primary-600 text-white" : "border-slate-300 bg-white text-slate-400"} ${current && status !== "delivered" ? "ring-4 ring-primary-500/25" : ""}`} aria-current={current ? "step" : undefined}>
                {done ? <Icon name={s.key === "en_cours" && current ? "truck" : "check"} className="h-4 w-4" /> : <span className="text-xs font-bold">{i + 1}</span>}
              </span>
              <span className={`mt-2 block text-xs font-semibold sm:text-sm ${done ? "text-brand-800" : "text-slate-400"}`}>{s.label}</span>
              {fmt(dates?.[s.key]) && <span className="block text-[11px] text-muted">{fmt(dates?.[s.key])}</span>}
            </li>
          );
        })}
      </ol>
      {terminalBad && (
        <p className={`mt-4 flex items-center gap-2 rounded-xl p-3 text-sm font-semibold ${terminalBad.tone === "danger" ? "bg-danger-50 text-danger-700" : "bg-accent-50 text-accent-700"}`} role="status">
          <Icon name={terminalBad.tone === "danger" ? "close" : "alert"} className="h-4 w-4" /> {terminalBad.label}
        </p>
      )}
    </div>
  );
}
