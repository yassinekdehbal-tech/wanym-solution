import Image from "next/image";
import { TruckIcon } from "@/components/TruckIcon";

/** Les rendus des 4 utilitaires (livraison du 02/11/2026, 900 px), indexés par m² ; repli sur la silhouette vectorielle. */
const RENDUS: Record<number, { src: string; w: number; h: number }> = {
  1: { src: "/images/camions/camion-1m2.webp", w: 900, h: 553 },
  2: { src: "/images/camions/camion-2m2.webp", w: 900, h: 506 },
  4: { src: "/images/camions/camion-4m2.webp", w: 900, h: 579 },
  8: { src: "/images/camions/camion-8m2.webp", w: 900, h: 588 },
};
export const CHARGES: Record<number, { src: string; w: number; h: number }> = {
  1: { src: "/images/charges/charge-1m2.webp", w: 800, h: 531 },
  2: { src: "/images/charges/charge-2m2.webp", w: 800, h: 466 },
  4: { src: "/images/charges/charge-4m2.webp", w: 800, h: 446 },
  8: { src: "/images/charges/charge-8m2.webp", w: 800, h: 435 },
};

export function VehicleImage({ surfaceM2, ordre, className = "", sizes = "(min-width: 1024px) 260px, 45vw", priority = false }: { surfaceM2: number | null | undefined; ordre?: number | null; className?: string; sizes?: string; priority?: boolean }) {
  const r = surfaceM2 != null ? RENDUS[surfaceM2] : undefined;
  if (!r) return <TruckIcon size={Math.min(4, Math.max(1, ordre ?? 1)) as 1 | 2 | 3 | 4} className={className} color="#0b1f3a" />;
  return <Image src={r.src} alt="" width={r.w} height={r.h} sizes={sizes} priority={priority} className={`h-full w-auto object-contain ${className}`} />;
}

export function ChargeImage({ surfaceM2, className = "" }: { surfaceM2: number | null | undefined; className?: string }) {
  const c = surfaceM2 != null ? CHARGES[surfaceM2] : undefined;
  if (!c) return null;
  return <Image src={c.src} alt="" width={c.w} height={c.h} sizes="(min-width: 1024px) 220px, 40vw" className={`h-full w-auto object-contain ${className}`} />;
}
