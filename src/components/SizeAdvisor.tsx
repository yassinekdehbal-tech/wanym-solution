"use client";

import { useMemo, useState } from "react";
import { Icon } from "@/components/Icon";
import { TruckIcon } from "@/components/TruckIcon";
import { recommander, resumeInventaire, type AdvisorResult, type CatalogueItem, type InventaireLigne, type VehiculeCapacite, type VehiculeOption } from "@/lib/vehicle-advisor";

export type Inventaire = Record<string, number>;

/**
 * « Je ne sais pas quelle taille choisir » — the user ticks what travels, the
 * engine suggests a size, the user decides. Pure UI: the maths lives in
 * `vehicle-advisor.ts`, the price stays NAMY's (the parent re-quotes on choice).
 */
export function SizeAdvisor({
  catalogue,
  capacites,
  vehicules,
  inventaire,
  autreTexte,
  onInventaire,
  onAutreTexte,
  onChoose,
  onClose,
}: {
  catalogue: CatalogueItem[];
  capacites: VehiculeCapacite[];
  vehicules: VehiculeOption[];
  inventaire: Inventaire;
  autreTexte: string;
  onInventaire: (next: Inventaire) => void;
  onAutreTexte: (v: string) => void;
  onChoose: (vehiculeId: string, resume: string) => void;
  onClose: () => void;
}) {
  const [search, setSearch] = useState("");
  const lignes: InventaireLigne[] = useMemo(
    () => catalogue.map((item) => ({ item, quantite: inventaire[item.id] ?? 0 })).filter((l) => l.quantite > 0),
    [catalogue, inventaire],
  );
  const result: AdvisorResult = useMemo(() => recommander(lignes, vehicules, capacites), [lignes, vehicules, capacites]);
  const total = lignes.reduce((n, l) => n + l.quantite, 0);
  const visible = catalogue.filter((i) => !search.trim() || i.nom.toLowerCase().includes(search.trim().toLowerCase()));
  const setQty = (id: string, q: number) => onInventaire({ ...inventaire, [id]: Math.max(0, Math.min(99, q)) });
  const resume = [resumeInventaire(lignes), inventaire.autre && autreTexte.trim() ? autreTexte.trim() : null].filter(Boolean).join(", ");

  return (
    <div className="mt-4 rounded-2xl border border-brand-100 bg-white p-4 shadow-sm motion-safe:animate-[fadeIn_200ms_ease-out]" role="region" aria-label="Aide au choix de la taille">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold text-brand-800">Qu&apos;est-ce qu&apos;on transporte ?</p>
          <p className="text-sm text-slate-600">Ajoutez vos objets, nous vous suggérons une taille. Vous gardez le dernier mot.</p>
        </div>
        <button type="button" onClick={onClose} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100" aria-label="Fermer l'aide au choix">✕</button>
      </div>

      {catalogue.length > 12 && (
        <input className="field mt-3" placeholder="Rechercher un objet (canapé, carton, vélo…)" value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Rechercher un objet" />
      )}

      <ul className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
        {visible.map((item) => {
          const q = inventaire[item.id] ?? 0;
          return (
            <li key={item.id} className={`flex items-center justify-between gap-2 rounded-xl border p-2 ${q > 0 ? "border-brand-800 bg-brand-50" : "border-slate-200"}`}>
              <span className="flex min-w-0 items-center gap-2 text-sm">
                <Icon name={item.icone ?? "box"} className="h-5 w-5 shrink-0 text-brand-600" />
                <span className="truncate font-medium text-slate-800">{item.nom}</span>
              </span>
              <span className="flex shrink-0 items-center">
                <button type="button" className="h-11 w-11 rounded-lg text-xl font-bold text-brand-800 hover:bg-white disabled:opacity-30" onClick={() => setQty(item.id, q - 1)} disabled={q === 0} aria-label={`Retirer ${item.nom}`}>−</button>
                <span className="w-6 text-center text-sm font-semibold tabular-nums" aria-live="polite">{q}</span>
                <button type="button" className="h-11 w-11 rounded-lg text-xl font-bold text-brand-800 hover:bg-white" onClick={() => setQty(item.id, q + 1)} aria-label={`Ajouter ${item.nom}`}>+</button>
              </span>
            </li>
          );
        })}
      </ul>
      {(inventaire.autre ?? 0) > 0 && (
        <input className="field mt-3" placeholder="Décrivez cet objet (ex. : piano droit, table de billard…)" value={autreTexte} onChange={(e) => onAutreTexte(e.target.value)} aria-label="Autre objet" />
      )}
      <p className="mt-2 text-xs text-slate-500">{total ? `${total} objet${total > 1 ? "s" : ""} sélectionné${total > 1 ? "s" : ""}` : "Aucun objet sélectionné"}{catalogue.some((c) => c.id === "autre") ? " · Vous ne trouvez pas votre objet ? Ajoutez « Autre objet »." : ""}</p>

      <div className={`mt-4 rounded-xl p-4 ${result.statut === "hors_capacite" ? "bg-amber-50" : result.statut === "vide" ? "bg-slate-50" : "bg-brand-50"}`} aria-live="polite">
        {result.statut === "vide" && <p className="text-sm text-slate-600">Ajoutez au moins un objet pour obtenir une suggestion.</p>}
        {result.statut === "hors_capacite" && (
          <>
            <p className="font-semibold text-amber-900">Ce chargement dépasse nos véhicules standard</p>
            <ul className="mt-1 list-disc pl-5 text-sm text-amber-900">{result.raisons.map((r) => <li key={r}>{r}</li>)}</ul>
            <p className="mt-2 text-sm text-amber-900">Choisissez tout de même une taille pour une demande de devis, ou appelez l&apos;exploitation au 07 67 16 60 15.</p>
          </>
        )}
        {(result.statut === "suggere" || result.statut === "a_verifier") && result.vehicule && (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <TruckIcon size={(Math.min(4, Math.max(1, result.vehicule.ordre ?? 1)) as 1 | 2 | 3 | 4)} className="h-14 w-32 shrink-0 text-brand-800" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold uppercase tracking-wide text-brand-600">{result.statut === "suggere" ? "Nous vous suggérons" : "Taille probable, à vérifier"}</p>
              <p className="text-xl font-extrabold text-brand-800">
                {result.vehicule.nom}{result.vehicule.surface_m2 != null ? ` — ${result.vehicule.surface_m2} m²` : ""}{result.vehicule.volume ? ` / ${result.vehicule.volume}` : ""}
              </p>
              <p className="text-sm text-slate-600">{result.raisons.join(" ")}</p>
            </div>
            <div className="flex shrink-0 flex-col gap-2">
              <button type="button" className="btn-primary justify-center" onClick={() => onChoose(result.vehicule!.id, resume)}>Choisir ce camion</button>
              <button type="button" className="text-sm font-medium text-brand-600 underline" onClick={onClose}>Voir une autre taille</button>
            </div>
          </div>
        )}
      </div>
      <p className="mt-2 text-xs text-slate-500">Suggestion indicative d&apos;après les objets déclarés ; le chauffeur confirme au chargement.</p>
    </div>
  );
}
