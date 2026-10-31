# API wanymsolution.com

Base : `https://wanymsolution.com/api`. Toutes les routes répondent en JSON.
Les routes **protégées** exigent `Authorization: Bearer <CONTENT_API_KEY>` (ou `x-api-key`).

## Contenu éditable (sans redéploiement)

| Méthode | Route | Accès | Description |
|---|---|---|---|
| GET | `/content` | public | Tous les textes `{ clé: valeur }` |
| GET | `/content/{key}` | public | Une clé |
| PUT | `/content/{key}` | protégé | `{ "value": "…" }` — crée la clé si absente |
| PUT | `/content` | protégé | Mise à jour groupée `{ "hero.title": "…", "faq": "[…]" }` |
| DELETE | `/content/{key}` | protégé | Supprime une clé |

```bash
curl -X PUT https://wanymsolution.com/api/content/hero.title \
  -H "Authorization: Bearer $CONTENT_API_KEY" -H "content-type: application/json" \
  -d '{"value":"Le dernier kilomètre, sans engagement"}'
```

Clés notables : `hero.*`, `badges` (séparées par `|`), `services.title/lead`, `included.items` (`|`),
`pricing.*`, `about.*`, `cta.*`, `contact.*`, `legal.*`, `faq` (JSON `[{"q","a"}]`), `order.*`, `track.*`, `cgv.body` (markdown).
La page se met à jour en arrière-plan dès l'appel (revalidation par tag).

## Services

| Méthode | Route | Accès | Description |
|---|---|---|---|
| GET | `/services` | public | Services publiés (avec clé : tous, brouillons inclus) |
| POST | `/services` | protégé | `{ slug, title, summary?, body? (markdown), icon?, sort_order?, published? }` |
| GET | `/services/{slug}` | public | Un service |
| PUT | `/services/{slug}` | protégé | Mise à jour partielle (mêmes champs) |
| DELETE | `/services/{slug}` | protégé | Suppression |

Icônes disponibles : `store`, `zap`, `truck`, `box`, `clock`, `shield`, `euro`, `pin`.

## Tarifs

| Méthode | Route | Accès | Description |
|---|---|---|---|
| GET | `/pricing` | public | Règles de prix actives |
| PUT | `/pricing/{service_slug}` | protégé | Upsert d'une règle |
| POST | `/quote` | public | Estimation sans enregistrement (utilisée par le formulaire) |

Règle : `{ label, instant_booking, base_cents, per_km_cents, per_unit_cents, min_cents, max_km, max_units, vat_rate, surcharges: { handling, floor, urgent_pct }, active }`.
Prix HT = base + km × per_km + (quantité − 1) × per_unit + options, minimum `min_cents`, arrondi à l'euro ; TTC = HT × (1 + TVA).
`instant_booking: true` → prix affiché et paiement Stripe. Sinon, ou si la distance est inconnue / trop grande → mode devis.
Distance : Google Distance Matrix si `GOOGLE_MAPS_API_KEY` est renseignée, sinon estimation par zones à partir des codes postaux (IDF uniquement).

## Commandes

| Méthode | Route | Accès | Description |
|---|---|---|---|
| POST | `/orders` | public (rate-limit, honeypot) | Crée la commande. Réponse `{ id, reference, mode, checkout_url? }` |
| GET | `/orders` | protégé | Liste. Filtres : `status`, `payment_status` (listes CSV), `since`, `until`, `q`, `unsynced=1`, `uninvoiced=1`, `limit`, `offset` |
| GET | `/orders/{id\|reference}` | protégé | Commande + journal d'événements |
| PATCH | `/orders/{id\|reference}` | protégé | Mise à jour exploitation (voir ci-dessous) |
| GET | `/orders/{id}/events` | protégé | Journal complet |
| POST | `/orders/{id}/events` | protégé | Ajoute une note / un échange SAV / une facture |
| POST | `/track` | public | Suivi client `{ reference, email }` → vue limitée |
| POST | `/webhooks/stripe` | Stripe | Confirmation de paiement, expiration, remboursement |

### Cycle de vie

`status` : `new` → `quoted` → `confirmed` → `in_progress` → `delivered` ; `cancelled` ; `sav`.
`payment_status` : `not_required` (devis) · `pending` · `paid` · `failed` · `refunded`.

- Express avec prix immédiat : création (`new`/`pending`) → Stripe Checkout → webhook `checkout.session.completed` → `confirmed`/`paid` → e-mails + transmission NAMY.
- Devis : création (`new`/`not_required`) → e-mails + transmission NAMY immédiats → l'exploitation passe en `quoted` avec `price_cents`, puis `confirmed`.

### PATCH /orders/{id}

```json
{
  "status": "in_progress",
  "price_cents": 12000,
  "namy_ref": "NAMY-4821",
  "invoice_number": "F-2026-0042",
  "invoice_url": "https://…/F-2026-0042.pdf",
  "message": "Votre chauffeur est en route, arrivée estimée 14h30.",
  "notify_customer": true,
  "author": "namy"
}
```

Tout champ est optionnel. `message` est journalisé (type `note`, ou `sav` si la commande est en SAV) et envoyé par e-mail au client si `notify_customer` est vrai.
Un changement de `status` ou de `invoice_number` crée un événement visible par le client sur `/suivi`.

### SAV

```bash
curl -X POST https://wanymsolution.com/api/orders/WS-2026-00012/events \
  -H "Authorization: Bearer $CONTENT_API_KEY" -H "content-type: application/json" \
  -d '{"type":"sav","message":"Nous avons bien reçu votre réclamation, retour sous 24h.","notify_customer":true}'
```

### Facturation

- Paiement en ligne : Stripe génère la facture (option `invoice_creation`) ; `stripe_payment_intent` est stocké sur la commande.
- Facturation depuis NAMY / votre outil : `PATCH` avec `invoice_number` + `invoice_url` (journalisé, visible par le client).
- `GET /orders?status=delivered&uninvoiced=1` liste ce qui reste à facturer.

## Intégration NAMY

À chaque commande actionnable (payée, ou devis reçu), le site envoie `POST NAMY_WEBHOOK_URL` avec
`Authorization: Bearer NAMY_API_KEY`, en-têtes `x-wanym-event: order.created`, `x-wanym-order: <référence>`, et le corps :

```json
{ "event": "order.created", "source": "wanymsolution.com", "order": { …toutes les colonnes de la commande… } }
```

Si NAMY répond `{ "reference": "…" }` (ou `id`/`ref`), la valeur est stockée dans `namy_ref`. Les échecs sont journalisés (`type: namy`) et
`GET /orders?unsynced=1` permet à NAMY de rattraper les commandes non transmises. NAMY peut aussi tout piloter en retour via `PATCH /orders/{id}`.

## Stripe

Endpoint webhook à déclarer : `https://wanymsolution.com/api/webhooks/stripe`, événements `checkout.session.completed`,
`checkout.session.async_payment_succeeded`, `checkout.session.expired`, `charge.refunded`. Renseigner `STRIPE_WEBHOOK_SECRET`.
Sans `STRIPE_SECRET_KEY`, le site fonctionne en mode devis uniquement (le prix reste calculé et stocké).

## Google Ads

`gclid` et `utm_*` sont capturés à l'arrivée sur le site (premier clic, 90 jours) et enregistrés sur la commande (`gclid`, `utm`, `source`).
La conversion est envoyée sur `/commander/merci` avec `transaction_id = référence` et `value = montant TTC`.
