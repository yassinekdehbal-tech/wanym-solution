# Stripe — plan d'intégration et revue (Payments, Invoicing, Tax)

Contexte : WANYM SOLUTION vend des livraisons ponctuelles à des particuliers et des professionnels en Île-de-France. Le prix vient du moteur NAMY ; Stripe encaisse, facture et peut calculer la TVA. Revue faite le 01/11/2026 contre le skill officiel `stripe-best-practices` (API `2026-10-28.endive`, SDK Node 23).

## 1. Ce qui est en place et conforme

| Règle Stripe | Site |
|---|---|
| Checkout Sessions pour le paiement unique, hébergé | `createCheckoutSession` (`src/lib/stripe.ts`) |
| `StripeClient` instancié, jamais la clé globale | `getStripe()` |
| Pas de `payment_method_types` (méthodes dynamiques : CB, Apple/Google Pay, Link…) | oui |
| `integration_identifier` avec suffixe aléatoire (API ≥ 2026-03-25) | `wanym_site_checkout_xxxxxxxx` |
| Exécution pilotée par le webhook, jamais par la page de succès | `/api/webhooks/stripe` → `dispatchOrder` |
| `checkout.session.completed` **et** `async_payment_succeeded`, filtrés sur `payment_status = paid` | oui |
| Signature vérifiée (`STRIPE_WEBHOOK_SECRET`) | oui |
| Idempotence (une commande payée n'est pas retraitée) | oui |
| Facture émise à chaque paiement Checkout | `invoice_creation` |
| Client Stripe créé à chaque paiement (base pour Invoicing) | `customer_creation: always` |

## 2. Ajouts de cette revue

- **Échec de paiement différé** (`checkout.session.async_payment_failed`) : commande `failed`, exploitation prévenue, rien n'est transmis à NAMY.
- **Litige bancaire** (`charge.dispute.created`) : commande en `sav`, alerte avec le motif et l'échéance de réponse.
- **Stripe Invoicing** : `POST /api/orders/{id}/invoice` pour les commandes payées sur facture (devis confirmés, comptes pro). Facture finalisée et envoyée par Stripe, page de paiement hébergée ; `invoice.paid` déclenche la course dans NAMY, `invoice.payment_failed` alerte l'exploitation.
- **Stripe Tax** derrière `STRIPE_AUTOMATIC_TAX=1` : lignes en HT exclusif, TVA calculée par Stripe, numéro de TVA collecté (autoliquidation B2B hors France), montants finaux recopiés sur la commande.
- **Remboursement** : helper `refundOrder` (remboursement total du PaymentIntent) ; `charge.refunded` met la commande à jour.

## 3. Mise en service, dans l'ordre

1. **Sandbox d'abord** : créer un sandbox dédié (Dashboard → Sandboxes) plutôt que le mode test partagé. Y faire tout le parcours avec les cartes de test, puis seulement passer en live.
2. **Clé API restreinte** (`rk_`, jamais `sk_`) nommée « wanymsolution.com (Vercel) », permissions en écriture : Checkout Sessions, Customers, Invoices, PaymentIntents, Refunds ; lecture : Charges, Disputes, Tax calculations (si Tax). Valeur dans Vercel → `STRIPE_SECRET_KEY` (sensitive), environnements Production et Preview séparés (clé sandbox en Preview).
3. **Webhook** : Dashboard → Développeurs → Webhooks → `https://www.wanymsolution.com/api/webhooks/stripe`, les 8 événements listés dans `docs/API.md`. Secret de signature dans Vercel → `STRIPE_WEBHOOK_SECRET`. Un second endpoint sur l'URL de preview avec le secret du sandbox.
4. **Facturation** : Dashboard → Paramètres → Facturation : raison sociale, SIREN, numéro de TVA, adresse 125 rue Diderot 93700 Drancy, mentions légales de pied de facture (CGV, pénalités de retard, indemnité forfaitaire 40 €), numérotation séquentielle, langue français, envoi des reçus. Ces réglages s'appliquent aux factures Checkout et Invoicing.
5. **Stripe Tax**, seulement si vous voulez que Stripe calcule la TVA (utile dès qu'un client pro hors France paie) :
   - Tax → Paramètres : adresse du siège (statut doit passer à `active`), code produit par défaut choisi dans la [liste officielle des codes](https://docs.stripe.com/tax/tax-codes) pour un service de transport de marchandises, à confirmer avec l'expert-comptable, puis `STRIPE_TAX_CODE` ;
   - Tax → Enregistrements : ajouter la France (numéro de TVA intracommunautaire). Sans enregistrement actif, Stripe encaisse **0 €** de taxe sans erreur ;
   - vérifier avec un paiement sandbox que `total_details.amount_tax` vaut 20 % pour une adresse française ;
   - puis `STRIPE_AUTOMATIC_TAX=1` sur Vercel.
   Tant que ce n'est pas fait, laisser la variable vide : le site encaisse le TTC de NAMY, correct pour une clientèle française.
6. **Go live** : repasser la [checklist officielle](https://docs.stripe.com/get-started/checklist/go-live.md), activer les e-mails de reçu, régler le délai de paiement des factures (`STRIPE_INVOICE_DAYS_DUE`, 30 jours par défaut).

## 4. Parcours cibles

| Cas | Parcours |
|---|---|
| Particulier ou pro, prix immédiat | Checkout → `checkout.session.completed` → course NAMY, facture Stripe jointe au reçu |
| Devis hors barème accepté | `PATCH /api/orders/{id}` (prix) → `POST /api/orders/{id}/invoice` → le client paie la facture → `invoice.paid` → course NAMY |
| Compte pro en compte | même voie Invoicing, délai 30 jours ; regroupement mensuel possible plus tard (une facture, plusieurs lignes) |
| Annulation après paiement | `refundOrder` ou Dashboard → `charge.refunded` → commande `refunded` |
| Contestation | `charge.dispute.created` → `sav` + alerte, réponse dans le Dashboard |

## 5. Hors périmètre pour l'instant

Abonnements (Billing), Connect (pas de reversement à des tiers), Terminal, Payment Element embarqué (Checkout hébergé convertit mieux pour ce volume et évite le PCI).
