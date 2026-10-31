import { cacheLife, cacheTag } from "next/cache";
import { supabasePublic } from "@/lib/supabase/client";
import type { PricingRule, Service, SiteContent } from "@/lib/types";

export const TAGS = { content: "site-content", services: "services", pricing: "pricing" } as const;

/** All editable copy as a key/value map. Cached until PUT /api/content revalidates it. */
export async function getContent(): Promise<SiteContent> {
  "use cache";
  cacheTag(TAGS.content);
  cacheLife("max");
  const db = supabasePublic();
  if (!db) return {};
  const { data, error } = await db.from("site_content").select("key,value");
  if (error) {
    console.error("[content] fetch failed:", error.message);
    return {};
  }
  return Object.fromEntries((data ?? []).map((row) => [row.key, row.value]));
}

export async function getServices(): Promise<Service[]> {
  "use cache";
  cacheTag(TAGS.services);
  cacheLife("max");
  const db = supabasePublic();
  if (!db) return [];
  const { data, error } = await db
    .from("services")
    .select("*")
    .eq("published", true)
    .order("sort_order", { ascending: true });
  if (error) {
    console.error("[services] fetch failed:", error.message);
    return [];
  }
  return (data ?? []) as Service[];
}

export async function getService(slug: string): Promise<Service | null> {
  "use cache";
  cacheTag(TAGS.services);
  cacheLife("max");
  const db = supabasePublic();
  if (!db) return null;
  const { data } = await db
    .from("services")
    .select("*")
    .eq("slug", slug)
    .eq("published", true)
    .maybeSingle();
  return (data as Service | null) ?? null;
}

export async function getPricingRules(): Promise<PricingRule[]> {
  "use cache";
  cacheTag(TAGS.pricing);
  cacheLife("max");
  const db = supabasePublic();
  if (!db) return [];
  const { data, error } = await db.from("pricing_rules").select("*").eq("active", true);
  if (error) {
    console.error("[pricing] fetch failed:", error.message);
    return [];
  }
  return (data ?? []) as PricingRule[];
}

/** Helpers for list-like content stored as "a|b|c". */
export function splitList(value: string | undefined): string[] {
  return (value ?? "")
    .split("|")
    .map((s) => s.trim())
    .filter(Boolean);
}

export function parseJson<T>(value: string | undefined, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}
