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
}: {
  id?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  required?: boolean;
  accent?: boolean;
}) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const [items, setItems] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
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
      return;
    }
    const ac = new AbortController();
    ctrl.current = ac;
    timer.current = setTimeout(async () => {
      try {
        const res = await fetch(`https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(q.trim())}&limit=5&autocomplete=1`, { signal: ac.signal });
        if (!res.ok) return;
        const json = (await res.json()) as { features?: { properties?: { label?: string; postcode?: string; city?: string } }[] };
        setItems((json.features ?? []).map((f) => ({ label: f.properties?.label ?? "", cp: f.properties?.postcode ?? null, ville: f.properties?.city ?? null })).filter((s) => s.label));
        setOpen(true);
        setActive(-1);
      } catch {
        /* offline or aborted: the typed address is still usable */
      }
    }, 250);
  };

  const pick = (s: Suggestion) => {
    onChange(s.label);
    setItems([]);
    setOpen(false);
  };

  return (
    <div className="relative">
      <Icon name="pin" className={`pointer-events-none absolute left-3 top-[1.1rem] h-5 w-5 ${accent ? "text-primary-600" : "text-slate-400"}`} />
      <input
        id={inputId}
        className="field pl-10"
        placeholder={placeholder}
        value={value}
        required={required}
        autoComplete="off"
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
      {open && items.length > 0 && (
        <ul id={`${inputId}-list`} role="listbox" className="absolute z-30 mt-1 w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
          {items.map((s, i) => (
            <li key={s.label} role="option" aria-selected={i === active}>
              <button
                type="button"
                className={`block w-full px-4 py-2 text-left text-sm hover:bg-brand-50 ${i === active ? "bg-brand-50" : ""}`}
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
