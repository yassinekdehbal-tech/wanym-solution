# WANYM SOLUTION — site web

Site vitrine + landing de conversion pour WANYM SOLUTION, commissionnaire de transport (groupe WANYM, Île-de-France).
Domaine : wanymsolution.com (DNS chez Squarespace, MX Google à ne jamais modifier).

## Contexte existant
Un premier site statique (HTML/CSS) existe dans le dépôt `yassinekdehbal-tech/wanym-solution` (juillet 2026). Son contenu — positionnement « dernier kilomètre sans engagement », 3 offres (externalisation pro, express à la demande, transport dédié), FAQ, page tarifs, à-propos (FISSA LIV → WANYM SOLUTION, Drancy, depuis 2016) — est repris dans `supabase/seed.sql`. Réutiliser ces textes et le JSON-LD (LocalBusiness, FAQPage) plutôt que réécrire. Coordonnées : exploitation 07 67 16 60 15, 125 rue Diderot 93700 Drancy. **Vérifier l'email de contact** : l'ancien site utilise contact@wanym-solution.com (avec tiret), le domaine actuel est wanymsolution.com (sans tiret).

## Objectifs
1. Présenter l'entreprise et ses services (crédibilité B2B).
2. Convertir : trafic Google Ads → page "Commander un transport" → formulaire → commande enregistrée + mail.
3. Contenu modifiable après lancement **par API, sans redéploiement**.

## Stack
- Next.js 16 (lire `AGENTS.md` et `node_modules/next/dist/docs/` : API différentes de Next 14/15), App Router, TypeScript, `src/` dir, Tailwind.
- Supabase (Postgres) : contenu éditable + commandes. Client serveur uniquement (`@supabase/supabase-js`), jamais la clé service côté client.
- Resend pour les mails transactionnels (notification interne + accusé client).
- Déploiement Vercel, branche `main` = production. Preview sur chaque PR.
- Google Tag (gtag.js) chargé via `next/script`, événement `conversion` déclenché à la soumission réussie du formulaire.

## Pages
- `/` — hero + CTA "Commander un transport", réassurance, services (depuis la base), références, CTA final.
- `/services` et `/services/[slug]` — contenu depuis la base.
- `/commander` — formulaire de commande. Champs : adresse enlèvement, adresse livraison, type de marchandise, palettes/colis + dimensions/poids, date souhaitée, société, nom, email, téléphone, commentaire. Validation zod. Soumission → `POST /api/orders`.
- `/contact`, `/mentions-legales`, `/cgv` — obligatoires (Google Ads exige mentions légales et CGV visibles).

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
RLS activé sur toutes les tables. Lecture publique de `services` (published = true) et `site_content`. Écriture uniquement via les routes API avec la clé service.

## API
Toutes les routes d'écriture exigent le header `Authorization: Bearer ${CONTENT_API_KEY}`.
- `GET /api/content` — tout `site_content`.
- `PUT /api/content/[key]` — met à jour une valeur.
- `GET /api/services`, `POST /api/services`, `PUT /api/services/[slug]`, `DELETE /api/services/[slug]`.
- `POST /api/orders` — public, rate-limité, honeypot anti-spam. Insère la commande, envoie 2 mails via Resend, renvoie `{ id }`.
- `GET /api/orders` — protégé, liste des commandes (pour intégration future avec NAMY).
Après chaque écriture de contenu : `revalidatePath` des pages concernées (ISR), pas de rebuild.

## Variables d'environnement
```
NEXT_PUBLIC_SUPABASE_URL=https://ksdzzcqcrtluamdkddzf.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_bIJp6VW5CStygDa29M7Tjw_zoXjT_2g
SUPABASE_SERVICE_ROLE_KEY=    # Supabase dashboard → Settings → API Keys (secret), jamais côté client
RESEND_API_KEY=
ORDERS_NOTIFY_EMAIL=          # adresse @wanymsolution.com qui reçoit les commandes
CONTENT_API_KEY=              # clé longue aléatoire pour l'API de contenu
NEXT_PUBLIC_GTAG_ID=          # AW-XXXXXXXXX
NEXT_PUBLIC_GTAG_CONVERSION_LABEL=
```

## Conventions
- Langue du site : français. Code et commits en anglais.
- Composants dans `src/components`, accès données dans `src/lib/supabase`, schémas zod dans `src/lib/schemas`.
- Pas de contenu en dur dans les pages : tout texte éditable passe par `site_content`, tout service par `services`. Seed initial dans `supabase/seed.sql`.
- Mobile first, Lighthouse ≥ 90 sur mobile (le trafic Ads est majoritairement mobile).
- Ne jamais committer de clé. `.env.local` est ignoré.

## Ordre de travail suggéré
1. Scaffold + layout (header, footer, CTA sticky mobile).
2. Client Supabase (`src/lib/supabase`) — le schéma et le seed sont déjà en base.
3. Page `/commander` + `POST /api/orders` + mails. C'est la page qui rapporte, elle passe en premier.
4. Accueil et services.
5. API de contenu + tag Google + pages légales.
