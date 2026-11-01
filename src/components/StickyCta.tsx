"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "@/components/Icon";
import type { SiteContent } from "@/lib/types";

/**
 * Barre mobile « Appeler / Commander ». Masquée sur /commander, qui porte sa
 * propre barre de prix : deux barres fixes se recouvriraient.
 */
export function StickyCta({ content }: { content: SiteContent }) {
  const pathname = usePathname();
  if (pathname?.startsWith("/commander")) return null;
  return (
    <div className="safe-bottom fixed inset-x-0 bottom-0 z-40 grid grid-cols-[1fr_1.4fr] gap-2 border-t border-slate-200 bg-white/95 px-3 pt-2 backdrop-blur md:hidden">
      <a href={`tel:${content["contact.phone_e164"] ?? "+33767166015"}`} className="btn-outline btn-sm">
        <Icon name="phone" className="h-4 w-4" />
        Appeler
      </a>
      <Link href="/commander" className="btn-primary btn-sm">
        Commander <Icon name="arrow" className="h-4 w-4" />
      </Link>
    </div>
  );
}
