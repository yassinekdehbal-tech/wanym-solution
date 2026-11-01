import Link from "next/link";
import { Icon } from "@/components/Icon";
import type { Service } from "@/lib/types";

export function ServiceCard({ service, instant }: { service: Service; instant?: boolean }) {
  return (
    <Link href={`/services/${service.slug}`} className="card-interactive group flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <span className="grid h-12 w-12 place-items-center rounded-xl bg-brand-50 text-brand-800">
          <Icon name={service.icon ?? "box"} />
        </span>
        {instant && <span className="chip-primary">Prix immédiat</span>}
      </div>
      <h3 className="font-display text-lg font-bold text-brand-800">{service.title}</h3>
      <p className="text-sm leading-relaxed text-slate-600">{service.summary}</p>
      <span className="mt-auto inline-flex items-center gap-1 text-sm font-semibold text-brand-600 group-hover:gap-2">
        En savoir plus <Icon name="arrow" className="h-4 w-4" />
      </span>
    </Link>
  );
}
