# WANYM SOLUTION — wanymsolution.com

Site vitrine + commande de transport en ligne (prix immédiat, paiement Stripe, transmission à NAMY) + API de pilotage du contenu et des commandes.
Next.js 16 · Supabase · Resend · Stripe · Vercel. Documentation de l'API : `docs/API.md`.
Les règles du projet pour Claude Code sont dans `CLAUDE.md`.

## Démarrer

```bash
npm install
cp .env.example .env.local   # puis remplir les clés
npm run dev
```

## Base de données

- Schéma : `supabase/migrations/`
- Contenu initial : `supabase/seed.sql`

Projet Supabase « Agent Secretaire » (`ksdzzcqcrtluamdkddzf`), partagé avec un autre projet en pause : seules les tables `services`, `site_content`, `orders`, `order_events`, `pricing_rules` appartiennent au site. Pour (re)jouer : SQL editor ou `supabase db push`, puis le seed.

## Services externes à configurer

| Service | Rôle | Variables |
|---|---|---|
| Supabase | contenu + commandes | `SUPABASE_SERVICE_ROLE_KEY` |
| Resend | e-mails (exploitation + client), domaine `wanymsolution.com` à vérifier | `RESEND_API_KEY`, `EMAIL_FROM`, `ORDERS_NOTIFY_EMAIL` |
| Stripe | paiement des courses à prix immédiat, webhook `/api/webhooks/stripe` | `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` |
| NAMY | réception automatique des commandes | `NAMY_WEBHOOK_URL`, `NAMY_API_KEY` |
| Google Ads | balise + conversion | `NEXT_PUBLIC_GTAG_ID`, `NEXT_PUBLIC_GTAG_CONVERSION_LABEL` |
| Google Maps (optionnel) | distance exacte pour le prix | `GOOGLE_MAPS_API_KEY` |
| API du site | clé des routes d'écriture | `CONTENT_API_KEY` |

## Déploiement

Push sur `main` → Vercel déploie en production. Les variables d'environnement se configurent dans Vercel → Settings → Environment Variables, ou en une commande avec la CLI Vercel :

```bash
./scripts/vercel-env.sh
```

Le script écrit les valeurs publiques, génère `CONTENT_API_KEY` et demande les secrets un par un (saisie masquée).

DNS (OVH → Zone DNS) : `A @ → 76.76.21.21`, `CNAME www → cname.vercel-dns.com`. Ne pas toucher aux MX (Google Workspace).
