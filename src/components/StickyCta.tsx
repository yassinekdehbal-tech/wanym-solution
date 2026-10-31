import Link from "next/link";
import { Icon } from "@/components/Icon";
import type { SiteContent } from "@/lib/types";

/** Mobile-only bottom bar: call + order. Ads traffic is mostly mobile. */
export function StickyCta({ content }: { content: SiteContent }) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-2 gap-2 border-t border-slate-200 bg-white/95 p-2 backdrop-blur md:hidden" style={{ paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))" }}>
      <a href={`tel:${content["contact.phone_e164"] ?? "+33767166015"}`} className="btn-outline py-2.5 text-sm">
        <Icon name="phone" className="h-4 w-4" />
        Appeler
      </a>
      <Link href="/commander" className="btn-primary py-2.5 text-sm">
        Commander
      </Link>
    </div>
  );
}
