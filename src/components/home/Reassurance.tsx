import { Icon } from "@/components/Icon";

/** Bandeau de réassurance : `reassurance.items` = "icone:Titre:Sous-titre|…". */
export function Reassurance({ items }: { items: string[] }) {
  const rows = items.map((raw) => {
    const [icon, title, sub] = raw.split(":").map((s) => s.trim());
    return { icon: icon || "check", title: title ?? raw, sub };
  });
  if (!rows.length) return null;
  return (
    <section className="border-b border-slate-200 bg-white" aria-label="Nos engagements">
      <ul className="container-x grid grid-cols-2 gap-x-4 gap-y-4 py-5 sm:grid-cols-3 lg:grid-cols-6 lg:py-6">
        {rows.map((r) => (
          <li key={r.title} className="flex items-center gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary-50 text-primary-700"><Icon name={r.icon} className="h-5 w-5" /></span>
            <span className="min-w-0 leading-tight">
              <span className="block text-sm font-bold text-brand-800">{r.title}</span>
              {r.sub && <span className="block text-xs text-muted">{r.sub}</span>}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
