export type FaqItem = { q: string; a: string };

export function Faq({ items }: { items: FaqItem[] }) {
  if (!items.length) return null;
  return (
    <div className="divide-y divide-slate-200 rounded-2xl border border-slate-200 bg-white">
      {items.map((item) => (
        <details key={item.q} className="group p-5 open:bg-slate-50">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold text-brand-800">
            {item.q}
            <span className="text-xl text-slate-400 transition group-open:rotate-45">+</span>
          </summary>
          <p className="mt-3 text-slate-600">{item.a}</p>
        </details>
      ))}
    </div>
  );
}
