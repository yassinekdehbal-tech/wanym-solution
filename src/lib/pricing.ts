/** Prices are computed by NAMY (grid of the "WANYM SOLUTION — Site web" account). The site only formats. */
export function formatEuros(cents: number | null | undefined): string {
  if (cents == null) return "—";
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(cents / 100);
}

export function eurosToCents(euros: number | null | undefined): number | null {
  if (euros == null || Number.isNaN(Number(euros))) return null;
  return Math.round(Number(euros) * 100);
}
