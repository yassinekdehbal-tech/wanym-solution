"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Icon } from "@/components/Icon";

type Suggestion = { label: string; cp: string | null; ville: string | null };

/**
 * Address field with Base Adresse Nationale suggestions (api-adresse.data.gouv.fr,
 * free, no key) — the same source NAMY uses, so the geocoding matches.
 */
export function AddressInput({
  id,
  value,
  onChange,
  placeholder,
  required,
  accent,
  invalid,
  describedBy,
}: {
  id?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  required?: boolean;
  accent?: boolean;
  invalid?: boolean;
  describedBy?: string;
}) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const [items, setItems] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [status, setStatus] = useState<"idle" | "loading" | "empty">("idle");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const ctrl = useRef<AbortController | null>(null);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
      ctrl.current?.abort();
    },
    [],
  );

  const search = (q: string) => {
    if (timer.current) clearTimeout(timer.current);
    ctrl.current?.abort();
    if (q.trim().length < 4) {
      setItems([]);
      setStatus("idle");
      return;
    }
    const ac = new AbortController();
    ctrl.current = ac;
    setStatus("loading");
    timer.current = setTimeout(async () => {
      try {
        const res = await fetch(`https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(q.trim())}&limit=5&autocomplete=1`, { signal: ac.signal });
        if (!res.ok) {
          setStatus("idle");
          return;
        }
        const json = (await res.json()) as { features?: { properties?: { label?: string; postcode?: string; city?: string } }[] };
        const next = (json.features ?? []).map((f) => ({ label: f.properties?.label ?? "", cp: f.properties?.postcode ?? null, ville: f.properties?.city ?? null })).filter((s) => s.label);
        setItems(next);
        setStatus(next.length ? "idle" : "empty");
        setOpen(true);
        setActive(-1);
      } catch {
        /* offline or aborted: the typed address is still usable */
        if (!ac.signal.aborted) setStatus("idle");
      }
    }, 250);
  };

  const pick = (s: Suggestion) => {
    onChange(s.label);
    setItems([]);
    setStatus("idle");
    setOpen(false);
  };

  return (
    <div className="relative">
      <Icon name="pin" className={`pointer-events-none absolute left-3 top-[1.1rem] h-5 w-5 ${accent ? "text-primary-600" : "text-brand-800"}`} />
      <input
        id={inputId}
        className="field pl-10"
        placeholder={placeholder}
        value={value}
        required={required}
        autoComplete="off"
        inputMode="text"
        aria-invalid={invalid || undefined}
        aria-describedby={describedBy}
        aria-busy={status === "loading" || undefined}
        role="combobox"
        aria-expanded={open && items.length > 0}
        aria-controls={`${inputId}-list`}
        onChange={(e) => {
          onChange(e.target.value);
          search(e.target.value);
        }}
        onFocus={() => items.length && setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        onKeyDown={(e) => {
          if (!open || !items.length) return;
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setActive((a) => Math.min(items.length - 1, a + 1));
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setActive((a) => Math.max(0, a - 1));
          } else if (e.key === "Enter" && active >= 0) {
            e.preventDefault();
            pick(items[active]);
          } else if (e.key === "Escape") setOpen(false);
        }}
      />
      {status === "loading" && <span className="pointer-events-none absolute right-3 top-[0.95rem] inline-block h-4 w-4 animate-spin rounded-full border-2 border-primary-600 border-t-transparent" aria-hidden="true" />}
      {open && status === "empty" && items.length === 0 && (
        <p className="absolute z-30 mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-muted shadow-lg" role="status">Aucune adresse trouvée : vérifiez l&apos;orthographe ou gardez votre saisie, elle sera vérifiée par l&apos;exploitation.</p>
      )}
      {open && items.length > 0 && (
        <ul id={`${inputId}-list`} role="listbox" className="absolute z-30 mt-1 w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
          {items.map((s, i) => (
            <li key={s.label} role="option" aria-selected={i === active}>
              <button
                type="button"
                className={`block min-h-11 w-full px-4 py-2 text-left text-sm hover:bg-primary-50 ${i === active ? "bg-primary-50" : ""}`}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => pick(s)}
              >
                {s.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
