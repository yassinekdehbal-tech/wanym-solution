/**
 * Logotype WANYM SOLUTION : chevrons verts + wordmark. Placeholder vectoriel en
 * attendant le fichier officiel (à remplacer ici, un seul endroit).
 */
export function Logo({ className = "h-8", dark = false }: { className?: string; dark?: boolean }) {
  const ink = dark ? "#ffffff" : "#0b1f3a";
  return (
    <svg viewBox="0 0 232 48" className={className} role="img" aria-label="WANYM SOLUTION">
      <g fill="#00a67e">
        <path d="M2 6h14l12 36H14z" />
        <path d="M22 6h14l12 36H34z" opacity="0.85" />
      </g>
      <text x="56" y="30" fontFamily="var(--font-display), Manrope, Inter, system-ui, sans-serif" fontWeight="800" fontSize="27" letterSpacing="-0.5" fill={ink}>
        WANYM
      </text>
      <text x="57" y="43" fontFamily="var(--font-sans), Inter, system-ui, sans-serif" fontWeight="600" fontSize="10.5" letterSpacing="3.1" fill={dark ? "#9adfc6" : "#00875f"}>
        SOLUTION
      </text>
    </svg>
  );
}
