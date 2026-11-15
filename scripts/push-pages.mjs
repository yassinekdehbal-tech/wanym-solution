// Pushes supabase/pages.json to the live site through the content API (upsert on section + slug).
// Usage: CONTENT_API_KEY=… node scripts/push-pages.mjs [https://www.wanymsolution.com]
import { readFile } from "node:fs/promises";
const base = (process.argv[2] ?? "https://www.wanymsolution.com").replace(/\/$/, "");
const key = process.env.CONTENT_API_KEY;
if (!key) { console.error("CONTENT_API_KEY manquante"); process.exit(1); }
const pages = JSON.parse(await readFile(new URL("../supabase/pages.json", import.meta.url), "utf8"));
let ok = 0;
for (const p of pages) {
  const r = await fetch(`${base}/api/pages`, { method: "POST", headers: { authorization: `Bearer ${key}`, "content-type": "application/json" }, body: JSON.stringify(p) });
  if (r.ok) ok++; else console.error(p.section, p.slug, r.status, (await r.text()).slice(0, 200));
}
console.log(`${ok}/${pages.length} pages poussées`);
