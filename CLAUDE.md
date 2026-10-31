# WANYM SOLUTION — site web

Site vitrine + landing de conversion pour WANYM SOLUTION, commissionnaire de transport (groupe WANYM, Île-de-France).
Domaine : wanymsolution.com, enregistré chez OVH (juillet 2026), DNS gérés chez OVH. Mails sur Google Workspace : MX/SPF Google à ne jamais modifier. wanym-solution.com (avec tiret) n'est PAS enregistré — ne pas l'utiliser dans les textes.

## Contexte existant
Un premier site statique (HTML/CSS) existe dans le dépôt `yassinekdehbal-tech/wanym-solution` (juillet 2026). Son contenu — positionnement « dernier kilomètre sans engagement », 3 offres (externalisation pro, express à la demande, transport dédié), FAQ, page tarifs, à-propos (FISSA LIV → WANYM SOLUTION, Drancy, depuis 2016) — est repris dans `supabase/seed.sql`. Réutiliser ces textes et le JSON-LD (LocalBusiness, FAQPage) plutôt que réécrire. Coordonnées : exploitation 07 67 16 60 15, 125 rue Diderot 93700 Drancy. **Vérifier l'email de contact** : l'ancien site utilise contact@wanym-solution.com (avec tiret), le domaine actuel est wanymsolution.com (sans tiret).

## Objectifs
1. Présenter l'entreprise et ses services (crédibilité B2B).
2. Convertir : trafic Google Ads → hero « départ > arrivée » → `/commander` (4 étapes) → prix immédiat + paiement Stripe (express IDF) ou devis sous 24h → commande enregistrée, mails, transmission automatique à NAMY.
3. Contenu, services et tarifs modifiables après lancement **par API, sans redéploiement** (`docs/API.md`).
4. API de suivi des commandes, SAV (journal d'événements, messages client) et facturation, consommée par NAMY.
5. Dépôt indépendant de NAMY et FISSA STOCK ; seul le projet Supabase « Agent Secretaire » est partagé.

## Stack
- Next.js 16 (lire `AGENTS.md` et `node_modules/next/dist/docs/` : API différentes de Next 14/15), App Router, TypeScript, `src/` dir, Tailwind.
- Supabase (Postgres) : contenu éditable + commandes. Client serveur uniquement (`@supabase/supabase-js`), jamais la clé service côté client.
- Resend pour les mails transactionnels (notification interne + accusé client + mises à jour SAV).
- Stripe Checkout pour le paiement des courses à prix immédiat ; webhook `/api/webhooks/stripe`.
- NAMY : webhook sortant `NAMY_WEBHOOK_URL` dès qu'une commande est **confirmée** (payée en ligne, ou devis confirmé par l'exploitation via `PATCH status=confirmed`), `src/lib/namy.ts` / `syncOrderToNamy`. En retour NAMY pilote la commande via `PATCH /api/orders/[id]`.
- **Répartition des e-mails client** : NAMY envoie confirmation, suivi et message de fin pour toute commande qu'il reçoit ; le site n'envoie au client que l'accusé de réception d'une demande de devis, et les messages/factures déclenchés par l'API (`notify_customer: true`). L'exploitation reçoit un e-mail du site à chaque commande ou devis.
- Cache Components (`cacheComponents: true`) : toutes les lectures Supabase passent par `"use cache"` + `cacheTag` dans `src/lib/supabase/content.ts` ; les routes d'écriture appellent `revalidateTag(tag, "max")`. Ne pas lire `headers()`/`cookies()` dans une fonction cachée.
- Déploiement Vercel, branche `main` = production. Preview sur chaque PR.
- Google Tag (gtag.js) chargé via `next/script`, événement `conversion` déclenché à la soumission réussie du formulaire.

## Pages
- `/` — hero + CTA "Commander un transport", réassurance, services (depuis la base), références, CTA final.
- `/services` et `/services/[slug]` — contenu depuis la base.
- `/commander` — tunnel en 4 étapes (trajet, marchandise, coordonnées, récapitulatif + prix) dans `src/components/OrderForm.tsx`. Pré-rempli par `?from=&to=&service=`. Validation zod (`src/lib/schemas/order.ts`). `POST /api/quote` pour l'estimation, `POST /api/orders` pour la soumission ; si `checkout_url` est renvoyée → redirection Stripe, sinon → `/commander/merci?ref=`.
- `/commander/merci` — confirmation + événement de conversion Google Ads (`src/components/Conversion.tsx`).
- `/suivi` — suivi client par référence + e-mail (`POST /api/track`).
- `/contact`, `/mentions-legales`, `/cgv` — obligatoires (Google Ads exige mentions légales et CGV visibles). CGV en markdown dans `site_content.cgv.body`.

## Base de données (Supabase)
Projet Supabase : **« Agent Secretaire »** (ref `ksdzzcqcrtluamdkddzf`, eu-central-1, org FISSA LIV), réutilisé pour ce site. Il contient d'autres tables (organizations, entities, invoices…) d'un projet en pause : **ne pas y toucher**. Le schéma ci-dessous est déjà appliqué (migration `wanym_site_init`) et le seed est chargé. Fichiers de référence : `supabase/migrations/`, `supabase/seed.sql`.
```sql
create table services (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  summary text,
  body text,            -- markdown
  icon text,
  sort_order int default 0,
  published boolean default true,
  updated_at timestamptz default now()
);

create table site_content (       -- textes éditables clé/valeur
  key text primary key,            -- ex: hero.title, hero.subtitle, footer.phone
  value text not null,
  updated_at timestamptz default now()
);

create table orders (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  status text default 'new',       -- new | quoted | confirmed | cancelled
  pickup_address text not null,
  delivery_address text not null,
  goods_type text,
  quantity text,
  dimensions text,
  weight_kg numeric,
  wanted_date date,
  company text,
  contact_name text not null,
  email text not null,
  phone text not null,
  notes text,
  source text,                     -- utm_source / gclid pour attribuer les pubs
  gclid text
);
```
Migration `20261101000000_orders_pipeline.sql` : `orders` étendue (`reference` WS-AAAA-NNNNN, `service_slug`, `options`, `distance_km`, `pricing_mode`, `price_cents` HT / `total_cents` TTC, `payment_status`, `stripe_*`, `namy_ref`, `invoice_*`, `utm`), statuts `new|quoted|confirmed|in_progress|delivered|cancelled|sav`, table `order_events` (journal : payment, status, note, sav, invoice, namy, email ; `public` = visible client) et table `pricing_rules` (règle de prix par service, `instant_booking` = prix immédiat + Stripe).
RLS activé sur toutes les tables. Lecture publique de `services` (published = true), `site_content` et `pricing_rules` (active). Écriture uniquement via les routes API avec la clé service. Types TypeScript dans `src/lib/types.ts`.

## API
Référence complète : `docs/API.md`. Toutes les routes d'écriture exigent `Authorization: Bearer ${CONTENT_API_KEY}` (`src/lib/api.ts`).
- Contenu : `GET /api/content`, `PUT /api/content` (bulk), `GET|PUT|DELETE /api/content/[key]`.
- Services : `GET|POST /api/services`, `GET|PUT|DELETE /api/services/[slug]`.
- Tarifs : `GET /api/pricing`, `PUT /api/pricing/[slug]`, `POST /api/quote` (public).
- Commandes : `POST /api/orders` (public, rate-limité, honeypot), `GET /api/orders` (filtres status, payment_status, since, q, unsynced, uninvoiced), `GET|PATCH /api/orders/[id]` (id ou référence), `GET|POST /api/orders/[id]/events`, `POST /api/track` (public), `POST /api/webhooks/stripe`.
Après chaque écriture : `revalidateTag(TAGS.x, "max")`, pas de rebuild.

## Variables d'environnement
```
NEXT_PUBLIC_SUPABASE_URL=https://ksdzzcqcrtluamdkddzf.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_bIJp6VW5CStygDa29M7Tjw_zoXjT_2g
SUPABASE_SERVICE_ROLE_KEY=    # Supabase dashboard → Settings → API Keys (secret), jamais côté client
RESEND_API_KEY=
EMAIL_FROM=                   # "WANYM SOLUTION <commandes@wanymsolution.com>"
ORDERS_NOTIFY_EMAIL=          # adresse @wanymsolution.com qui reçoit les commandes
CONTENT_API_KEY=              # clé longue aléatoire pour l'API de contenu
STRIPE_SECRET_KEY=            # sans clé : mode devis uniquement
STRIPE_WEBHOOK_SECRET=
NAMY_WEBHOOK_URL=             # sans URL : pas de transmission, GET /api/orders?unsynced=1 pour rattraper
NAMY_API_KEY=
GOOGLE_MAPS_API_KEY=          # optionnel : distance exacte, sinon estimation par zones IDF
NEXT_PUBLIC_GTAG_ID=          # AW-XXXXXXXXX
NEXT_PUBLIC_GTAG_CONVERSION_LABEL=
```
Modèle complet dans `.env.example`.

## Conventions
- Langue du site : français. Code et commits en anglais.
- Composants dans `src/components`, accès données dans `src/lib/supabase`, schémas zod dans `src/lib/schemas`.
- Pas de contenu en dur dans les pages : tout texte éditable passe par `site_content`, tout service par `services`. Seed initial dans `supabase/seed.sql`.
- Mobile first, Lighthouse ≥ 90 sur mobile (le trafic Ads est majoritairement mobile).
- Ne jamais committer de clé. `.env.local` est ignoré.

## État et reste à faire
Fait : layout, accueil, services, tunnel `/commander`, Stripe, mails, NAMY (webhook sortant), API contenu/services/tarifs/commandes/SAV, suivi client, pages légales, sitemap, JSON-LD.
Reste : renseigner les variables sur Vercel (Resend, Stripe, NAMY, Google Ads, clé API), vérifier le domaine d'envoi sur Resend, brancher l'endpoint réel de NAMY (format d'entrée à confirmer côté NAMY), compléter `legal.siren/rcs/tva/director` via l'API, affiner les tarifs `pricing_rules`, autocomplétion d'adresse (Google Places) si besoin.
