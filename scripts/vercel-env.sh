#!/usr/bin/env bash
# Configure every environment variable of wanymsolution.com on Vercel in one go.
#
# Usage (from the repository root, after `npm i -g vercel` and `vercel login`):
#   ./scripts/vercel-env.sh            # production + preview
#   ./scripts/vercel-env.sh production # production only
#
# Public values are written directly. Secrets are prompted (input hidden) and
# can be skipped by pressing Enter; re-run the script later to add them.
set -euo pipefail

TARGETS=("${1:-production}")
[[ $# -eq 0 ]] && TARGETS=(production preview)

command -v vercel >/dev/null || { echo "Install the Vercel CLI first: npm i -g vercel && vercel login"; exit 1; }
[[ -f .vercel/project.json ]] || vercel link

set_var() { # name value
  local name=$1 value=$2
  for t in "${TARGETS[@]}"; do
    vercel env rm "$name" "$t" --yes >/dev/null 2>&1 || true
    printf '%s' "$value" | vercel env add "$name" "$t" >/dev/null && echo "  ✓ $name ($t)"
  done
}

ask_secret() { # name hint
  local name=$1 hint=$2 value
  read -r -s -p "  $name — $hint (Enter pour ignorer) : " value; echo
  [[ -n "$value" ]] && set_var "$name" "$value" || echo "  · $name ignoré"
}

echo "Variables publiques"
set_var NEXT_PUBLIC_SITE_URL "https://wanymsolution.com"
set_var NEXT_PUBLIC_SUPABASE_URL "https://ksdzzcqcrtluamdkddzf.supabase.co"
set_var NEXT_PUBLIC_SUPABASE_ANON_KEY "sb_publishable_bIJp6VW5CStygDa29M7Tjw_zoXjT_2g"
set_var EMAIL_FROM "WANYM SOLUTION <commandes@wanymsolution.com>"

echo "Clé de l'API du site"
if [[ -z "${CONTENT_API_KEY:-}" ]]; then
  CONTENT_API_KEY=$(openssl rand -hex 32)
  echo "  Clé générée (à conserver, elle ne sera plus affichée) : $CONTENT_API_KEY"
fi
set_var CONTENT_API_KEY "$CONTENT_API_KEY"

echo "Secrets (saisie masquée)"
ask_secret SUPABASE_SERVICE_ROLE_KEY "Supabase → Settings → API Keys → secret"
ask_secret ORDERS_NOTIFY_EMAIL "boîte qui reçoit les commandes (saisie visible normalement, mais masquée ici)"
ask_secret RESEND_API_KEY "Resend → API Keys"
ask_secret STRIPE_SECRET_KEY "Stripe → Developers → API keys (sk_live_… ou sk_test_…)"
ask_secret STRIPE_WEBHOOK_SECRET "Stripe → Webhooks → endpoint /api/webhooks/stripe (whsec_…)"
ask_secret NAMY_WEBHOOK_URL "URL d'entrée NAMY"
ask_secret NAMY_API_KEY "clé NAMY"
ask_secret GOOGLE_MAPS_API_KEY "optionnel, Distance Matrix"
ask_secret NEXT_PUBLIC_GTAG_ID "Google Ads, AW-XXXXXXXXX"
ask_secret NEXT_PUBLIC_GTAG_CONVERSION_LABEL "Google Ads, libellé de conversion"

echo
echo "Terminé. Redéployez pour appliquer : vercel --prod"
