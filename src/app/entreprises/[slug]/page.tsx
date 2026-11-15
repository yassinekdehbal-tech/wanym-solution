import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SeoPage } from "@/components/SeoPage";
import { getContent, getPage, getPages } from "@/lib/supabase/content";

const SECTION = "entreprises" as const;
type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  const pages = await getPages(SECTION);
  // Cache Components needs at least one param at build time; a placeholder that 404s otherwise.
  return pages.length ? pages.map((p) => ({ slug: p.slug })) : [{ slug: "page-indisponible" }];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const page = await getPage(SECTION, (await params).slug);
  if (!page) return {};
  return { title: page.title, description: page.meta_description ?? page.intro ?? undefined, alternates: { canonical: `/${SECTION}/${page.slug}` } };
}

export default async function Page({ params }: Props) {
  const { slug } = await params;
  const [page, c, all] = await Promise.all([getPage(SECTION, slug), getContent(), getPages()]);
  if (!page) notFound();
  const related = page.related.length
    ? page.related.map((s) => all.find((p) => p.slug === s)).filter((p): p is NonNullable<typeof p> => !!p && p.id !== page.id)
    : all.filter((p) => p.section === page.section && p.id !== page.id).slice(0, 4);
  return <SeoPage page={page} c={c} related={related} />;
}
