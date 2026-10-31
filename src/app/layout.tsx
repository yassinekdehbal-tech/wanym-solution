import type { Metadata, Viewport } from "next";
import { AttributionCapture } from "@/components/AttributionCapture";
import { Footer } from "@/components/Footer";
import { GoogleTag } from "@/components/GoogleTag";
import { Header } from "@/components/Header";
import { StickyCta } from "@/components/StickyCta";
import { env } from "@/lib/env";
import { getContent } from "@/lib/supabase/content";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const c = await getContent();
  const title = c["site.name"] ?? "WANYM SOLUTION";
  return {
    metadataBase: new URL(env.siteUrl),
    title: { default: `${title} — ${c["site.tagline"] ?? "Transport et livraison dernier kilomètre"}`, template: `%s · ${title}` },
    description: c["site.description"],
    openGraph: { type: "website", locale: "fr_FR", siteName: title },
    robots: { index: true, follow: true },
  };
}

export const viewport: Viewport = { themeColor: "#0b1f3a", width: "device-width", initialScale: 1 };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const content = await getContent();
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "@id": `${env.siteUrl}/#organization`,
    name: content["legal.company"] ?? "WANYM SOLUTION",
    url: env.siteUrl,
    telephone: content["contact.phone_e164"],
    email: content["contact.email"],
    description: content["site.description"],
    address: { "@type": "PostalAddress", streetAddress: "125 rue Diderot", postalCode: "93700", addressLocality: "Drancy", addressCountry: "FR" },
    areaServed: ["Île-de-France", "France", "Europe"],
    openingHours: "Mo-Su 00:00-23:59",
    foundingDate: "2016",
  };
  return (
    <html lang="fr">
      <body className="min-h-screen bg-white pb-16 text-slate-900 antialiased md:pb-0">
        <Header content={content} />
        {children}
        <Footer content={content} />
        <StickyCta content={content} />
        <AttributionCapture />
        <GoogleTag />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      </body>
    </html>
  );
}
