import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { pageInputSchema } from "../src/lib/schemas/content.ts";

// supabase/pages.json is what scripts/push-pages.mjs sends to POST /api/pages: it must pass the
// same schema, and every internal link (related slugs, markdown links to /section/slug) must exist.
const pages = JSON.parse(readFileSync(new URL("../supabase/pages.json", import.meta.url), "utf8")) as Record<string, unknown>[];

test("every page passes the API schema", () => {
  for (const p of pages) {
    const r = pageInputSchema.safeParse(p);
    assert.ok(r.success, `${p.section}/${p.slug}: ${r.success ? "" : r.error.issues.map((i) => i.path.join(".") + " " + i.message).join("; ")}`);
  }
});

test("slugs are unique per section and related links resolve", () => {
  const keys = new Set<string>();
  const slugs = new Set(pages.map((p) => p.slug as string));
  for (const p of pages) {
    const k = `${p.section}/${p.slug}`;
    assert.ok(!keys.has(k), `doublon ${k}`);
    keys.add(k);
    for (const r of p.related as string[]) assert.ok(slugs.has(r), `${k}: related « ${r} » n'existe pas`);
    for (const m of String(p.body).matchAll(/\]\(\/(livraison|transport|entreprises)\/([a-z0-9-]+)\)/g)) assert.ok(keys.has(`${m[1]}/${m[2]}`) || slugs.has(m[2]), `${k}: lien interne /${m[1]}/${m[2]} introuvable`);
  }
});

test("titles and meta descriptions fit the SERP", () => {
  for (const p of pages) {
    assert.ok((p.title as string).length <= 70, `${p.slug}: titre > 70 caractères`);
    assert.ok((p.meta_description as string).length >= 70 && (p.meta_description as string).length <= 180, `${p.slug}: meta description hors 70-180`);
    assert.ok((p.faq as unknown[]).length >= 2, `${p.slug}: au moins 2 questions`);
  }
});
