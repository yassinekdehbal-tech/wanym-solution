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
`pricing.*`, `about.*`, `cta.*`, `contact.*`, `legal.*`, `faq` (JSON `[{"q","a"}]`), `order.*` (dont `order.namy_services`), `track.*`, `cgv.body` (markdown).
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

## Tarifs et créneaux (moteur NAMY)

Le site ne porte aucun barème : le prix est calculé par **NAMY** avec la grille assignée au compte client **« WANYM SOLUTION — Site web »** (grille « SITE WANYM », modifiable dans l'écran Grilles de NAMY). Les modes de livraison, options, jours et créneaux viennent du même compte.

| Méthode | Route | Accès | Description |
|---|---|---|---|
| GET | `/api/namy/contexte` | public | `vehicules` (surfaces plancher, « dès X € HT »), modes, options (avec `code`), règles d'étage, jours de service, fermetures |
| GET | `/api/namy/creneaux?date=YYYY-MM-DD` | public | Créneaux proposés pour une date (ou la raison du blocage) |
| POST | `/api/quote` | public | Prix calculé par NAMY pour les saisies du formulaire (rien n'est enregistré) |

Entrée de `/api/quote` : `pickup_address`, `delivery_address`, `wanted_date`, `creneau?`, **`vehicule_id`** (surface plancher = catégorie de véhicule NAMY, obligatoire sur la grille zone), `porte_depart`, `porte_arrivee`, `etage`, `acces_escalier`, `options[]` (ids d'options NAMY ; les options `porte_depart` / `porte_arrivee` / `equipier` sont identifiées par leur `code` dans le contexte), `service_slug?` ; sur une grille poids : `nb_colis`, `poids_total_kg`, `poids_max_colis_kg?`, `nb_colis_lourds`, `longueur_max_cm`, `mode_id?`.
Réponse : `mode: "instant"` avec `price_cents` (HT), `total_cents` (TTC), `prix` (détail itémisé NAMY : `vehicule`, `zone` {forfait, km au-delà, €/km}, options, majorations), `creneaux` ; ou `mode: "quote"` avec `reason` (`service_on_quote`, `hors_grille`, `capacite_depassee`, `date_indisponible`, `adresse_introuvable`, `namy_non_configure`).

La clé de contenu `order.namy_services` (slugs séparés par `|`) liste les prestations vendues en ligne au prix NAMY ; les autres partent en devis.

### Assistant de choix de taille (`/commander`)

Sous les cartes de taille, le lien « Je ne sais pas quelle taille choisir » ouvre un inventaire d'objets ; un moteur local (`src/lib/vehicle-advisor.ts`, testé) suggère la plus petite taille qui passe (surface, volume, longueur, hauteur, charge utile, marge 10 %). Le prix reste celui de NAMY : choisir une suggestion présélectionne `vehicule_id` et déclenche le recalcul habituel. Trois clés de contenu, toutes optionnelles (le code porte les valeurs par défaut) :

| Clé | Contenu |
|---|---|
| `order.exemples_cartes` | JSON `{"1":"un lave-linge et 6 cartons", …}` — l'exemple affiché sous chaque carte, indexé par m². |
| `order.catalogue_objets` | JSON `[{id, nom, categorie, icone, longueur_cm, largeur_cm, hauteur_cm, poids_kg, empilable, supporte_charge, fragile, orientation: "libre"|"debout"|"a_plat", emprise_m2?, a_confirmer?}]` — remplace le catalogue par défaut (`src/lib/catalogue-objets.ts`). |
| `order.vehicules_capacites` | JSON `[{surface_m2, volume_m3, longueur_int_cm, largeur_int_cm, hauteur_int_cm, charge_utile_kg}]` — dimensions intérieures et charge utile par taille. |

La commande garde l'inventaire déclaré dans `orders.options.inventaire` (`{id: quantité}`) et `options.inventaire_autre` ; un résumé lisible (« Inventaire déclaré : 3 carton standard, 1 lave-linge ») est ajouté aux notes transmises à NAMY.

## Commandes

| Méthode | Route | Accès | Description |
|---|---|---|---|
| POST | `/orders` | public (rate-limit, honeypot) | Crée la commande (prix recalculé par NAMY). Réponse `{ id, reference, mode, checkout_url? }` |
| GET | `/orders` | protégé | Liste. Filtres : `status`, `payment_status` (listes CSV), `since`, `until`, `q`, `unsynced=1`, `uninvoiced=1`, `limit`, `offset` |
| GET | `/orders/{id\|reference}` | protégé | Commande + journal d'événements |
| PATCH | `/orders/{id\|reference}` | protégé | Mise à jour exploitation (voir ci-dessous) |
| GET | `/orders/{id}/events` | protégé | Journal complet |
| POST | `/orders/{id}/events` | protégé | Ajoute une note / un échange SAV / une facture |
| POST | `/track` | public | Suivi client `{ reference, email }` → vue limitée |
| POST | `/orders/{id}/invoice` | clé API | Facture Stripe (Invoicing) pour une commande payée sur facture : créée, finalisée, envoyée |
| POST | `/webhooks/stripe` | Stripe | Paiement, échec différé, expiration, facture payée/impayée, remboursement, litige |

### Cycle de vie et répartition des rôles

`status` : `new` → `confirmed` → `in_progress` → `delivered` ; `quoted` ; `cancelled` ; `sav`.
`payment_status` : `not_required` (devis) · `pending` · `paid` · `failed` · `refunded`.

| Événement | Qui prévient le client | Qui prévient l'exploitation | NAMY |
|---|---|---|---|
| Demande de devis (`new`, `not_required`) | le site : accusé de réception « devis sous 24h » | le site : e-mail | non |
| Paiement Stripe réussi (`confirmed`, `paid`) | **NAMY** (confirmation, veille, jour J, fin) | le site : e-mail | **course créée aussitôt** (statut `accepte`, dispatchable) |
| Devis confirmé par l'exploitation (`PATCH status=confirmed`) | **NAMY** | — | **course créée** (ou `devis_attente` si hors grille) |
| Facture, message ponctuel | le site, via `PATCH` ou `POST …/events` avec `notify_customer: true` | — | — |
| Changement de statut dans NAMY (`planifie`, `retire`, `livre`…) | NAMY | — | `POST /webhooks/namy` → suivi du site |

Le site ne double jamais les e-mails de NAMY : aucune confirmation client n'est envoyée pour une commande payée ou confirmée.

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

NAMY est le TMS de WANYM SOLUTION. Le site est l'un de ses canaux : chaque commande devient une **course du compte client « WANYM SOLUTION — Site web »**, au prix de la grille de ce compte, dispatchable comme celles d'un magasin.

### Site → NAMY (`src/lib/namy.ts`)

Toutes les requêtes vont sur `NAMY_WEBHOOK_URL` (Edge Function `creer-commande-publique`) avec l'en-tête `x-wanym-site-key: {NAMY_API_KEY}` et un corps `{ "action": … }` :

| `action` | Quand | Réponse |
|---|---|---|
| `contexte` | chargement du formulaire | modes, options, jours, seuils |
| `creneaux` | changement de date | `{ date_bloquee, creneaux }` |
| `devis` | récapitulatif | `{ prix: {…}, creneaux, geo }` — prix calculé par le moteur NAMY |
| `commande` | paiement reçu, ou devis confirmé par l'exploitation | `{ expedition_id, statut }` — course créée, idempotent sur la référence `WS-…` |

Le payload `commande` reprend les saisies (adresses, date, créneau, mode, colis, poids, longueur, étage, options, contacts, paiement). NAMY **recalcule le prix** ; `expedition_id` est stocké dans `namy_ref`. Échec → événement `namy`, et `GET /api/orders?unsynced=1` liste ce qui reste à transmettre.

### NAMY → site (`POST /api/webhooks/namy`, Bearer = la clé partagée (`NAMY_API_KEY`, ou `NAMY_INBOUND_KEY` si distincte))

Déclenché par le trigger NAMY à chaque changement de statut d'une course du site :

| `event` | Champs | Effet sur le site |
|---|---|---|
| `expedition.statut` | `statut`, `expedition_id`, `motif`, `date_livraison`, `creneau`, `prix_ht`, `prix_ttc` | `planifie`→`confirmed`, `retire`→`in_progress`, `livre`→`delivered`, `echec_*`/`retourne`→`sav`, `annule`→`cancelled` |

Chaque appel ajoute un événement visible par le client sur `/suivi`. Rejouer un événement ne change rien.

### Paiement

Le client est **débité à la commande** (Stripe Checkout). Une annulation après paiement se rembourse depuis Stripe ; l'événement `charge.refunded` met la commande à jour.

## Stripe

Endpoint webhook à déclarer : `https://www.wanymsolution.com/api/webhooks/stripe`, événements `checkout.session.completed`,
`checkout.session.async_payment_succeeded`, `checkout.session.async_payment_failed`, `checkout.session.expired`, `invoice.paid`,
`invoice.payment_failed`, `charge.refunded`, `charge.dispute.created`. Clé API : une **clé restreinte** (`rk_`) suffit, voir `docs/stripe.md`.

### POST /orders/{id}/invoice — Stripe Invoicing

Pour une commande **payée sur facture** (devis confirmé, compte pro) : crée le client Stripe (par e-mail), une facture à l'HT de la commande (`price_cents`), la finalise et l'envoie (page de paiement hébergée + PDF). Corps optionnel : `{ "days_until_due": 30, "memo": "…", "send": true, "author": "…" }`. Refusée si la commande est déjà payée (Checkout a émis sa facture) ou déjà facturée. `invoice.paid` passe ensuite la commande en `paid` / `confirmed` et crée la course dans NAMY.

### Stripe Tax

Par défaut le site encaisse le TTC calculé par NAMY (TVA 20 %). Avec `STRIPE_AUTOMATIC_TAX=1`, Checkout et les factures envoient l'HT (`tax_behavior: exclusive`) et Stripe calcule la TVA d'après l'adresse et le numéro de TVA collecté (`tax_id_collection`) ; le webhook enregistre les montants finaux. **Préalable obligatoire** : adresse du siège et enregistrement FR actifs dans Stripe → Tax, sinon Stripe n'encaisse aucune taxe sans erreur. Détail : `docs/stripe.md`. Renseigner `STRIPE_WEBHOOK_SECRET`.
Sans `STRIPE_SECRET_KEY`, le site fonctionne en mode devis uniquement (le prix reste calculé et stocké).

## Google Ads

`gclid` et `utm_*` sont capturés à l'arrivée sur le site (premier clic, 90 jours) et enregistrés sur la commande (`gclid`, `utm`, `source`).
La conversion est envoyée sur `/commander/merci` avec `transaction_id = référence` et `value = montant TTC`.
