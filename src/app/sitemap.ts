import type { MetadataRoute } from "next";
import { env } from "@/lib/env";
import { getServices } from "@/lib/supabase/content";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const services = await getServices();
  const base = env.siteUrl;
  return [
    { url: base, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/commander`, changeFrequency: "monthly", priority: 0.9 },
    { url: `${base}/services`, changeFrequency: "monthly", priority: 0.8 },
    ...services.map((s) => ({ url: `${base}/services/${s.slug}`, lastModified: new Date(s.updated_at), changeFrequency: "monthly" as const, priority: 0.7 })),
    { url: `${base}/contact`, changeFrequency: "yearly", priority: 0.5 },
    { url: `${base}/mentions-legales`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${base}/cgv`, changeFrequency: "yearly", priority: 0.2 },
  ];
}
