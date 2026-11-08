import Image from "next/image";

/**
 * Logo officiel WANYM SOLUTION (08/11/2026) : W vert + wordmark + « solution de
 * transport ». Deux rendus du même fichier source : lettres blanches pour les
 * fonds sombres (`dark`), lettres bleu nuit pour les fonds clairs. Un seul
 * endroit à changer si le logo évolue. PNG servis tels quels (`unoptimized`) :
 * l'optimiseur rend un JPEG sans transparence aux navigateurs sans WebP. Les icônes (`src/app/icon.png`,
 * `apple-icon.png`) sont dérivées du W.
 */
const SRC = { light: "/images/logo/wanym-logo-on-light.png", dark: "/images/logo/wanym-logo-on-dark.png" } as const;
const RATIO = 480 / 120;

export function Logo({ className = "h-8 w-auto", dark = false, priority = false }: { className?: string; dark?: boolean; priority?: boolean }) {
  return (
    <Image
      src={dark ? SRC.dark : SRC.light}
      alt="WANYM SOLUTION, solution de transport"
      width={480}
      height={120}
      priority={priority}
      unoptimized
      className={className}
      style={{ aspectRatio: RATIO }}
    />
  );
}
