import Link from "next/link";
import { Icon } from "@/components/Icon";
import { TruckIcon } from "@/components/TruckIcon";
import type { NamyContexte } from "@/lib/namy";
import { formatEuros } from "@/lib/pricing";

const TVA = 1.2;
type Veh = NamyContexte["vehicules"][number];

/**
 * Les 4 tailles : illustration, m², modèle · volume, exemple concret, prix d'appel
 * NAMY (« dès X € TTC ») quand il est connu. Le clic présélectionne le véhicule.
 */
export function VehicleCard({ veh, index, exemple, href }: { veh: Veh; index: number; exemple?: string; href: string }) {
  const size = Math.min(4, Math.max(1, veh.ordre ?? index + 1)) as 1 | 2 | 3 | 4;
  return (
    <Link href={href} className="card-interactive group flex flex-col p-4 sm:p-5" aria-label={`${veh.nom}, ${veh.surface_m2 ?? ""} m², commander`}>
      <div className="flex h-24 items-end justify-center rounded-xl bg-surface px-3 pb-2 transition group-hover:bg-primary-50">
        <TruckIcon size={size} className="h-16 w-full max-w-[9rem]" color="#0b1f3a" />
      </div>
      <p className="mt-3 font-display text-2xl font-extrabold text-brand-800">{veh.surface_m2 != null ? `${veh.surface_m2} m²` : veh.nom}</p>
      <p className="text-sm font-medium text-muted">{veh.nom}{veh.volume ? ` · ${veh.volume}` : ""}</p>
      {exemple && <p className="mt-2 text-sm text-slate-600">ex. {exemple}</p>}
      <div className="mt-auto flex items-end justify-between gap-2 pt-4">
        {veh.prix_base_ht != null ? (
          <span>
            <span className="block text-xs text-muted">dès</span>
            <span className="font-display text-xl font-extrabold text-brand-800">{formatEuros(Math.round(veh.prix_base_ht * TVA * 100))}</span>
            <span className="ml-1 text-xs font-semibold text-muted">TTC</span>
          </span>
        ) : (
          <span className="text-sm text-muted">Prix calculé en ligne</span>
        )}
        <span className="grid h-10 w-10 place-items-center rounded-full bg-primary-600 text-white transition group-hover:bg-primary-700"><Icon name="arrow" className="h-5 w-5" /></span>
      </div>
    </Link>
  );
}

export function VehicleCards({ vehicules, exemples, title, lead, rayonKm }: { vehicules: Veh[]; exemples: Record<string, string>; title: string; lead?: string; rayonKm?: number | null }) {
  if (!vehicules.length) return null;
  return (
    <section className="section container-x" id="camions">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Quatre tailles, un prix affiché</p>
          <h2 className="h2 mt-2">{title}</h2>
          {lead && <p className="lead mt-3 max-w-2xl">{lead}</p>}
        </div>
        <p className="text-sm text-muted">Chauffeur et {rayonKm ?? 20} km inclus · au-delà, le kilomètre est affiché avant paiement.</p>
      </div>
      <div className="mt-8 grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
        {vehicules.map((veh, i) => (
          <VehicleCard key={veh.id} veh={veh} index={i} exemple={veh.surface_m2 != null ? exemples[String(veh.surface_m2)] : undefined} href={`/commander?vehicule=${encodeURIComponent(veh.id)}`} />
        ))}
      </div>
    </section>
  );
}
