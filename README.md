# WANYM SOLUTION — wanymsolution.com

Site vitrine + commande de transport en ligne. Next.js 16 · Supabase · Vercel.
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

Appliquer sur le projet Supabase (SQL editor ou `supabase db push`), puis exécuter le seed.

## Déploiement

Push sur `main` → Vercel déploie en production. Les variables d'environnement se configurent dans Vercel → Settings → Environment Variables.

DNS (Squarespace) : `A @ → 76.76.21.21`, `CNAME www → cname.vercel-dns.com`. Ne pas toucher aux MX (Google Workspace).
