import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "WANYM SOLUTION — Livraison dernier kilomètre sans engagement",
  description:
    "Externalisez vos livraisons du dernier kilomètre sans engagement : pros, express et transport dédié au départ de l'Île-de-France. Devis gratuit sous 24h.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://wanymsolution.com"),
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className="min-h-screen bg-white text-neutral-900 antialiased">{children}</body>
    </html>
  );
}
