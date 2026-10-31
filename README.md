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

Déjà appliqués sur le projet Supabase « Agent Secretaire » (`ksdzzcqcrtluamdkddzf`). Pour rejouer : SQL editor ou `supabase db push`.

## Déploiement

Push sur `main` → Vercel déploie en production. Les variables d'environnement se configurent dans Vercel → Settings → Environment Variables.

DNS (OVH → Zone DNS) : `A @ → 76.76.21.21`, `CNAME www → cname.vercel-dns.com`. Ne pas toucher aux MX (Google Workspace).
