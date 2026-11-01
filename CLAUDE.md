# WANYM SOLUTION — site web

Site vitrine + landing de conversion pour WANYM SOLUTION, commissionnaire de transport (groupe WANYM, Île-de-France).
Domaine : wanymsolution.com, enregistré chez OVH (juillet 2026), DNS gérés chez OVH. Mails sur Google Workspace : MX/SPF Google à ne jamais modifier. wanym-solution.com (avec tiret) n'est PAS enregistré — ne pas l'utiliser dans les textes.

## Contexte existant
Un premier site statique (HTML/CSS) existe dans le dépôt `yassinekdehbal-tech/wanym-solution` (juillet 2026). Son contenu — positionnement « dernier kilomètre sans engagement », 3 offres (externalisation pro, express à la demande, transport dédié), FAQ, page tarifs, à-propos (FISSA LIV → WANYM SOLUTION, Drancy, depuis 2016) — est repris dans `supabase/seed.sql`. Réutiliser ces textes et le JSON-LD (LocalBusiness, FAQPage) plutôt que réécrire. Coordonnées : exploitation 07 67 16 60 15, 125 rue Diderot 93700 Drancy. **Vérifier l'email de contact** : l'ancien site utilise contact@wanym-solution.com (avec tiret), le domaine actuel est wanymsolution.com (sans tiret).

## Objectifs
1. Présenter l'entreprise et ses services (crédibilité B2B).
2. Convertir : trafic Google Ads → hero « départ > arrivée » → `/commander` (4 étapes, mêmes champs que le formulaire vendeur NAMY) → prix calculé par **le moteur NAMY** sur la grille du compte « WANYM SOLUTION — Site web » + paiement Stripe, ou devis sous 24h hors barème → course créée dans NAMY, dispatchable immédiatement.
3. Contenu, services et tarifs modifiables après lancement **par API, sans redéploiement** (`docs/API.md`).
4. API de suivi des commandes, SAV (journal d'événements, messages client) et facturation, consommée par NAMY.
5. Dépôt indépendant de NAMY et FISSA STOCK ; seul le projet Supabase « Agent Secretaire » est partagé.

## Stack
- Next.js 16 (lire `AGENTS.md` et `node_modules/next/dist/docs/` : API différentes de Next 14/15), App Router, TypeScript, `src/` dir, Tailwind.
- Supabase (Postgres) : contenu éditable + commandes. Client serveur uniquement (`@supabase/supabase-js`), jamais la clé service côté client.
- Resend pour les mails transactionnels (notification interne + accusé client + mises à jour SAV).
- Stripe Checkout pour le paiement des courses à prix immédiat ; webhook `/api/webhooks/stripe`.
- NAMY (dépôt `yassinekdehbal-tech/NAM-Y`, Supabase `gwbvfohizdxwhmcoqvgh`) : **aucun barème côté site**. `src/lib/namy.ts` appelle `POST {NAMY_WEBHOOK_URL}` (Edge `creer-commande-publique`, en-tête `x-wanym-site-key`) avec `action` = `contexte` (modes, options, jours), `creneaux` (date), `devis` (prix du moteur NAMY sur la grille « SITE WANYM » du compte client « WANYM SOLUTION — Site web ») et `commande` (crée la **course** `expeditions` statut `accepte`, canal `site`, idempotent sur `WS-…`) dès que la commande est payée ou confirmée par l'exploitation (`syncOrderToNamy`). NAMY renvoie chaque statut sur `POST /api/webhooks/namy`. Les saisies NAMY (mode, options, étage, colis max…) sont stockées dans `orders.options` (jsonb). Contrat : `docs/API.md`.
- Stripe : **débit immédiat** à la commande (la course est dispatchable dès sa création). Remboursement depuis Stripe si annulation.
- **Répartition des e-mails client** : NAMY envoie confirmation, suivi et message de fin pour toute commande qu'il reçoit ; le site n'envoie au client que l'accusé de réception d'une demande de devis, et les messages/factures déclenchés par l'API (`notify_customer: true`). L'exploitation reçoit un e-mail du site à chaque commande ou devis.
- Cache Components (`cacheComponents: true`) : toutes les lectures Supabase passent par `"use cache"` + `cacheTag` dans `src/lib/supabase/content.ts` ; les routes d'écriture appellent `revalidateTag(tag, "max")`. Ne pas lire `headers()`/`cookies()` dans une fonction cachée.
- Déploiement Vercel, branche `main` = production. Preview sur chaque PR.
- Google Tag (gtag.js) chargé via `next/script`, événement `conversion` déclenché à la soumission réussie du formulaire.

## Pages
- `/` — refonte DA « Tech Logistics Premium » (01/11/2026, `docs/refonte-da.md`) : hero avec widget d'adresses (`RouteSearch`), bandeau `reassurance.items`, 4 cartes de camions au prix d'appel NAMY (`getVehiculesVitrine`, `"use cache"` minutes, masquées sans NAMY ; clic → `/commander?vehicule=`), `how.steps`, services, `pro.*`, à-propos + `references.items`, FAQ, CTA final. Composants dans `src/components/home/`. Tokens dans `globals.css` (vert `primary` = actions, orange `accent` = avertissements seulement), polices Inter/Manrope via `next/font`, logo provisoire `Logo.tsx`.
- `/services` et `/services/[slug]` — contenu depuis la base.
- `/commander` — page unique à révélation progressive dans `src/components/OrderForm.tsx` : trajet → taille du véhicule (cartes m² avec camion, `TruckIcon`) → remise porte/trottoir à chaque bout (+ étage/ascenseur), équipier → date/créneau (date bloquée avancée automatiquement au prochain jour ouvré) → coordonnées → prix NAMY itémisé + paiement. Pré-rempli par `?from=&to=&service=`. Assistant de choix de taille (`src/components/SizeAdvisor.tsx` + moteur pur `src/lib/vehicle-advisor.ts`, catalogue `src/lib/catalogue-objets.ts`, clés `order.exemples_cartes` / `order.catalogue_objets` / `order.vehicules_capacites`, cadrage `docs/assistant-taille.md`) : il présélectionne `vehicule_id`, le prix reste NAMY ; l'inventaire est stocké dans `orders.options.inventaire` et résumé dans les notes NAMY. Sans véhicule servi par NAMY (grille poids), les champs colis/poids/longueur s'affichent à la place. Validation zod (`src/lib/schemas/order.ts`). `POST /api/quote` pour l'estimation, `POST /api/orders` pour la soumission ; si `checkout_url` est renvoyée → redirection Stripe, sinon → `/commander/merci?ref=`.
- `/commander/merci` — deux variantes (commande confirmée / demande de devis reçue, `order.quote_received_*`), frise `Timeline`, conversion Google Ads (`Conversion.tsx`) uniquement pour une commande payée. Barre de prix mobile `PriceBar` (6 états) et détail `PriceDetail` ; le bouton payer reste verrouillé tant que le devis NAMY n'est pas « frais » pour les saisies courantes (`pricingKey`). Événements `src/lib/analytics.ts` (`track()`, sans donnée personnelle).
- `/suivi` — suivi client par référence + e-mail (`POST /api/track`), frise Reçue → Confirmée → En cours → Livrée (+ Annulée / Incident) dans `Timeline.tsx`.
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
Migrations `20261101000000_orders_pipeline.sql` (additive, appliquée) et `20261101000001_status_lifecycle.sql` (contraintes `status` / `payment_status`, à passer dans le SQL editor) : `orders` étendue (`reference` WS-AAAA-NNNNN, `service_slug`, `options`, `distance_km`, `pricing_mode`, `price_cents` HT / `total_cents` TTC, `payment_status` (`not_required|pending|authorized|paid|failed|refunded`), `stripe_*`, `namy_ref`, `invoice_*`, `utm`), statuts `new|quoted|confirmed|in_progress|delivered|cancelled|sav`, table `order_events` (journal : payment, status, note, sav, invoice, namy, email ; `public` = visible client) et table `pricing_rules` (**obsolète** : le prix vient de NAMY ; à supprimer via `20261101000001_status_lifecycle.sql`). Les prestations vendues en ligne sont listées dans la clé de contenu `order.namy_services`. **Grille au m²** (01/11/2026) : la grille « SITE WANYM » de NAMY est de type zone × véhicule (1/2/4/8 m² = 40/80/120/240 € HT ≤ 20 km, 2 €/km au-delà, options porte départ/arrivée +15, équipier +30, étage sans ascenseur +10/étage dès le 4e, échec de retrait 50 %) ; `orders.options` porte `vehicule_id`, `porte_depart`, `porte_arrivee`.
RLS activé sur toutes les tables. Lecture publique de `services` (published = true), `site_content` et `pricing_rules` (active). Écriture uniquement via les routes API avec la clé service. Types TypeScript dans `src/lib/types.ts`.

## API
Référence complète : `docs/API.md`. Toutes les routes d'écriture exigent `Authorization: Bearer ${CONTENT_API_KEY}` (`src/lib/api.ts`).
- Contenu : `GET /api/content`, `PUT /api/content` (bulk), `GET|PUT|DELETE /api/content/[key]`.
- Services : `GET|POST /api/services`, `GET|PUT|DELETE /api/services/[slug]`.
- Tarifs NAMY : `GET /api/namy/contexte`, `GET /api/namy/creneaux?date=`, `POST /api/quote` (public, prix calculé par NAMY).
- Commandes : `POST /api/orders` (public, rate-limité, honeypot), `GET /api/orders` (filtres status, payment_status, since, q, unsynced, uninvoiced), `GET|PATCH /api/orders/[id]` (id ou référence), `GET|POST /api/orders/[id]/events`, `POST /api/track` (public), `POST /api/webhooks/stripe`, `POST /api/webhooks/namy` (NAMY → site).
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
Fait (en production le 01/11/2026) : layout, accueil, services, tunnel `/commander` aligné sur le formulaire NAMY (prix, créneaux, options servis par NAMY), Stripe Checkout + Invoicing + Tax optionnelle (`docs/stripe.md`), mails, création de la course dans NAMY + retour des statuts (testé de bout en bout : WS-2026-00002 → course NAMY 11588 → planifié → annulé), API contenu/services/commandes/SAV, suivi client, pages légales, sitemap, JSON-LD. Secrets NAMY posés (clé partagée générée dans le vault NAMY, `NAMY_API_KEY` sur Vercel), `CONTENT_API_KEY` régénérée le 01/11, `pricing_rules` supprimée, webhook Stripe sandbox créé (secret sur Vercel).
Reste : `STRIPE_SECRET_KEY` (clé du sandbox à coller une fois sur Vercel, puis redéployer), vérifier le domaine d'envoi sur Resend (DNS OVH), Google Ads (`NEXT_PUBLIC_GTAG_*`, plan dans `docs/google-ads.md`), compléter `legal.siren/rcs/tva/director` via l'API, ajuster la grille « SITE WANYM » dans l'écran Grilles de NAMY, passage Stripe en live (clé restreinte + webhook live + Stripe Tax si souhaité).
