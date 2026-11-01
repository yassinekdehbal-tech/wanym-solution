import type { NamyPrix } from "@/lib/namy";
import { formatEuros } from "@/lib/pricing";

/** Détail itémisé du prix NAMY (HT, options, TVA). Même composant dans le bloc 6 et dans la barre mobile. */
export function PriceDetail({ prix, className = "" }: { prix: NamyPrix; className?: string }) {
  const e = (n: number) => formatEuros(Math.round(n * 100));
  return (
    <ul className={`space-y-1.5 text-sm text-slate-700 ${className}`}>
      <li className="flex justify-between gap-3">
        <span>{prix.vehicule ? `${prix.vehicule.nom}${prix.vehicule.surface_m2 != null ? ` · ${prix.vehicule.surface_m2} m²` : ""}${prix.zone?.rayon_km ? ` · ${prix.zone.rayon_km} km inclus` : ""}` : `Prise en charge${prix.mode ? ` (${prix.mode.libelle})` : ""}`}</span>
        <span className="tabular-nums">{e(prix.zone?.forfait_ht ?? prix.base_ht)}</span>
      </li>
      {prix.zone && prix.zone.extra_km > 0 && (
        <li className="flex justify-between gap-3"><span>{prix.zone.extra_km} km au-delà × {e(prix.zone.prix_km_ht)}</span><span className="tabular-nums">{e(prix.zone.extra_km * prix.zone.prix_km_ht)}</span></li>
      )}
      {prix.supplement_distance_ht > 0 && <li className="flex justify-between gap-3"><span>Distance au-delà du rayon inclus</span><span className="tabular-nums">{e(prix.supplement_distance_ht)}</span></li>}
      {prix.supplement_lourd_ht > 0 && <li className="flex justify-between gap-3"><span>Colis lourds</span><span className="tabular-nums">{e(prix.supplement_lourd_ht)}</span></li>}
      {prix.options.map((o) => (
        <li key={o.libelle} className="flex justify-between gap-3"><span>{o.libelle}</span><span className="tabular-nums">{e(o.prix_ht)}</span></li>
      ))}
      {prix.majoration_creneau?.delta_pct ? <li className="flex justify-between gap-3"><span>{prix.majoration_creneau.libelle_court || "Créneau"}</span><span>{prix.majoration_creneau.delta_pct > 0 ? "+" : ""}{prix.majoration_creneau.delta_pct} %</span></li> : null}
      {prix.remise?.delta_pct ? <li className="flex justify-between gap-3"><span>{prix.remise.libelles.join(", ") || "Tarif dynamique"}</span><span>{prix.remise.delta_pct > 0 ? "+" : ""}{prix.remise.delta_pct} %</span></li> : null}
      <li className="flex justify-between gap-3 border-t border-slate-200 pt-1.5 font-semibold text-brand-800"><span>Total HT</span><span className="tabular-nums">{e(prix.ht)}</span></li>
      <li className="flex justify-between gap-3"><span>TVA 20 %</span><span className="tabular-nums">{e(prix.tva)}</span></li>
      <li className="flex justify-between gap-3 text-base font-extrabold text-brand-800"><span>Total TTC</span><span className="tabular-nums">{e(prix.ttc)}</span></li>
    </ul>
  );
}
