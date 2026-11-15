import type { Metadata } from "next";
import { SECTION_META, SeoHub } from "@/components/SeoPage";
import { getContent, getPages } from "@/lib/supabase/content";

const SECTION = "livraison" as const;
export const metadata: Metadata = { title: SECTION_META[SECTION].title, description: SECTION_META[SECTION].description };

export default async function Hub() {
  const [c, pages] = await Promise.all([getContent(), getPages(SECTION)]);
  return <SeoHub section={SECTION} pages={pages} c={c} />;
}
