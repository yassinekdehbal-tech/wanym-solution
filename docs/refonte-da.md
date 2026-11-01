# Refonte DA & UX — audit, écarts, plan par lots

> Réponse au brief « WANYM SOLUTION — Brief d'intégration DA & UX v1.0 » (Tech Logistics Premium). Audit fait le 01/11/2026 sur le site en production. Mis à jour à la fin de chaque lot (section 7).

## 1. Architecture actuelle

| Couche | État |
|---|---|
| Framework | Next.js 16.4 App Router, React 19, TypeScript, `src/`, Cache Components (`"use cache"` + `cacheTag`, `cacheLife("max")`), Tailwind 4 (`@theme` dans `globals.css`), plugin typography. Aucune bibliothèque UI tierce. |
| Routes vitrines | `/`, `/services`, `/services/[slug]`, `/contact`, `/mentions-legales`, `/cgv`, `/suivi`, `/commander`, `/commander/merci`, `not-found`, `sitemap`. |
| Routes API | contenu (`/api/content*`), services, NAMY (`contexte`, `creneaux`, `quote`), commandes (+ events, invoice), `track`, webhooks Stripe et NAMY. Contrat : `docs/API.md`. |
| Données | Supabase « Agent Secretaire » : `site_content` (clé/valeur, 50 clés seedées), `services`, `orders`, `order_events`. Lecture via `getContent()` / `getServices()` cachées par tag, écriture par l'API avec `revalidateTag`. |
| Prix | 100 % NAMY (`src/lib/namy.ts` → Edge `creer-commande-publique`) : contexte (4 véhicules m² avec `prix_base_ht`, options codées, règles), créneaux, devis, commande. Aucun barème côté site. |
| Paiement | Stripe Checkout (débit immédiat) + Invoicing + Tax optionnelle, webhook 8 événements (`docs/stripe.md`). |
| Mesure | gtag.js chargé `afterInteractive` si `NEXT_PUBLIC_GTAG_ID` ; **un seul événement de conversion** (`/commander/merci`, dédoublonné par référence) + 3 événements assistant (`assistant_taille_*`). Attribution `utm`/`gclid` capturée (`AttributionCapture`) et stockée sur la commande. Pas de pixel Meta, pas de bandeau de consentement. |
| Tests | `node --test tests/*.test.ts` (moteur de l'assistant + exemples des cartes, 18 cas). Pas de test E2E en CI ; vérifications Playwright manuelles en prod. |

## 2. Composants réutilisables

| Composant | Verdict |
|---|---|
| `Header`, `Footer`, `StickyCta` | **Adapter** : nouvelle palette, menu mobile (absent aujourd'hui), `StickyCta` masqué sur `/commander` (doublon avec la barre de prix). |
| `RouteSearch` (widget adresses) | **Conserver / restyler** : déjà « départ → arrivée → /commander ». Réutilisé dans le CTA final. |
| `AddressInput` (autocomplétion BAN) | **Conserver** ; ajouter les états « recherche », « aucun résultat ». |
| `OrderForm` (6 blocs progressifs, `Section`, `Remise`) | **Conserver la logique**, restyler : bloc actif, récapitulatif des blocs terminés, barre de prix mobile à états, variante devis. L'ordre des blocs et le câblage NAMY ne bougent pas. |
| `SizeAdvisor`, `TruckIcon`, `vehicle-advisor.ts`, `catalogue-objets.ts` | **Conserver** ; `TruckIcon` devient l'illustration des 4 cartes (silhouettes distinctes par taille), restylé. |
| `ServiceCard`, `Faq`, `Markdown`, `Icon` | **Conserver / restyler**. `Icon` s'enrichit (horloge, bouclier, euro, cadenas…). |
| `TrackForm` | **Refondre l'affichage** (frise d'états) en gardant `POST /api/track`. |
| `Conversion`, `GoogleTag`, `AttributionCapture` | **Conserver** ; ajouter un helper `track()` unique (`src/lib/analytics.ts`). |
| Classes `btn-*`, `field`, `label`, `card`, `container-x` | **Refondre** en tokens (lot 1). |

## 3. Écarts entre le site et la DA cible

| Sujet | Aujourd'hui | Cible | Lot |
|---|---|---|---|
| Palette | CTA **orange** `#f5a524`, bleu nuit `#0b1f3a`, gris slate. | CTA/sélection **vert `#00A67E`**, orange réservé aux avertissements, fond `#F4F6F8`, texte secondaire `#526174`. | 1 |
| Typographie | police système. | Inter (interface) + Manrope (titres) via `next/font`, 2 familles max, échelle responsive. | 1 |
| Composants | styles ad hoc par page, boutons 44 px. | tokens, boutons/champs ≥ 48 px, états complets (focus, désactivé, chargement, erreur, succès). | 1 |
| Header mobile | pas de menu (nav masquée), CTA seul. | navigation compacte + « Commander » accessible. | 1 |
| Hero mobile | H1 + sous-titre + badges + 2 boutons **avant** le widget : formulaire sous la ligne de flottaison à 390 px. | formulaire visible sans défilement ; desktop avec photo. | 2 |
| Réassurance | badges dans le hero. | bandeau compact 6 items (prix ferme, 24h/24, depuis 2016, suivi, sans engagement, paiement sécurisé). | 2 |
| 4 camions sur l'accueil | absents (l'accueil montre les services). | 4 cartes (illustration, m², modèle/volume, exemple, « dès X € TTC » NAMY), clic → `/commander?vehicule=`. | 2 |
| Ordre des sections | Hero → services → inclus/tarifs → à propos → FAQ → CTA. | Hero → réassurance → camions → comment ça marche → services → professionnels → références → FAQ → CTA avec widget. | 2 |
| `/commander` | sections à révélation, total mobile fixe minimal. | bloc actif identifiable, récap des blocs faits, barre de prix à 6 états, bouton payer désactivé tant que le prix n'est pas confirmé, variante devis. | 3 |
| `?vehicule=` | non lu. | présélection depuis les cartes de l'accueil. | 2 |
| `/commander/merci` | une seule variante. | « commande confirmée » vs « demande de devis reçue ». | 4 |
| `/suivi` | liste d'événements. | frise Reçue → Confirmée → Planifiée → En cours → Livrée (+ Annulée / Incident), horodatages, messages d'exploitation, états vides. | 4 |
| `/services/[slug]` | gabarit court. | éditorial 300–1 500 mots, hiérarchie, encadrés, CTA contextuels. | 4 |
| Mesure | 1 conversion + 3 événements assistant. | 9 événements du brief, sans donnée personnelle, conversion = commande payée. | 3 / 5 |
| Images | aucune (SVG seulement). | photo hero desktop, illustrations véhicules et emprise au sol. **Assets non fournis** (§6). | 2 |

## 4. Risques techniques

- **Cache Components** : l'accueil est statique et caché ; les prix d'appel NAMY passent par une fonction `"use cache"` à durée courte (`cacheLife("minutes")`) et tolèrent l'absence de NAMY (cartes sans prix, jamais de prix en dur).
- **`next/font`** télécharge Inter/Manrope au build : OK sur Vercel ; hors ligne le build échoue → repli `display: swap` + pile système.
- **Barre de prix mobile** : clavier virtuel et `position: fixed` (iOS). La barre ne recouvre jamais une erreur (`scroll-margin-bottom`) et n'affiche jamais un ancien montant comme confirmé pendant un recalcul.
- **Deux barres fixes** sur `/commander` (StickyCta globale + total) : résolu au lot 1.
- **Régression métier** : payloads de `POST /api/quote` et `POST /api/orders`, schémas zod, Stripe et NAMY inchangés ; vérification Playwright en prod après chaque lot (devis 1 m² Drancy → Paris 4e = 48 € TTC, assistant, variante devis).
- **Lighthouse** : aucune bibliothèque ajoutée ; illustrations en SVG inline ou `next/image` dimensionnées ; `prefers-reduced-motion` respecté.

## 5. Plan de modifications fichier par fichier

**Lot 1 — Fondations** : `src/app/globals.css` (tokens vert/bleu nuit/orange/surface, échelle typo, `btn-*`/`field`/`card` ≥ 48 px, états, reduced-motion), `src/app/layout.tsx` (`next/font` Inter + Manrope, fond surface), `src/components/Header.tsx` (menu mobile accessible sans JS, CTA vert), `Footer.tsx`, `StickyCta.tsx` (masqué sur `/commander`), `Icon.tsx` (icônes manquantes), `Logo.tsx` (nouveau).

**Lot 2 — Conversion (accueil)** : `src/app/page.tsx` (nouvel ordre), composants `Hero`, `Reassurance`, `VehicleCards` (serveur, prix NAMY), `HowItWorks`, `ProSection`, `References` (rendue seulement si contenu), `FinalCta` (widget adresses) ; `src/lib/namy.ts` → `getVehiculesVitrine()` ; `OrderForm.tsx` lit `?vehicule=` ; nouvelles clés `site_content` (`reassurance.items`, `how.*`, `pro.*`, `references.items`) seedées et posées en base.

**Lot 3 — Configurateur** : `OrderForm.tsx` (`Section` actif / terminé avec récap et « Modifier », `PriceBar` à 6 états avec détail dépliable, bouton payer verrouillé tant que le prix n'est pas confirmé pour le payload courant, variante devis, événements), `AddressInput.tsx` (états), `src/lib/analytics.ts`.

**Lot 4 — Pages secondaires** : `commander/merci` (2 variantes), `TrackForm.tsx` + `Timeline.tsx`, `services/[slug]` (gabarit éditorial), `contact`, `mentions-legales`, `cgv`, `not-found`.

**Lot 5 — Qualité** : Playwright responsive 320 → 1440 sur l'accueil et `/commander`, contrastes, Lighthouse mobile, non-régression du tunnel (devis, paiement sandbox), `docs/API.md` / `CLAUDE.md`.

## 6. Informations métier manquantes (le site tourne sans)

| Besoin | Pourquoi | En attendant |
|---|---|---|
| **Logo officiel** (SVG) | en-tête, pied de page, OpenGraph | logotype SVG « chevrons verts + WANYM SOLUTION » dans `Logo.tsx` |
| **Photo hero desktop** et **illustrations des 4 véhicules** | cartes et hero de la maquette | silhouettes SVG (`TruckIcon`), hero typographique ; emplacement `next/image` prêt |
| **Prix d'appel** : la maquette affiche 49 / 69 / 99 / 149 € TTC, NAMY calcule 48 / 96 / 144 / 288 € TTC (grille 40 / 80 / 120 / 240 € **HT**) | les cartes affichent le prix NAMY ; si les montants de la maquette sont les bons, régler la grille « SITE WANYM » dans NAMY | prix NAMY |
| Textes « Comment ça marche », « Professionnels », références / avis **validés** | sections de l'accueil | textes neutres seedés, modifiables par l'API ; références masquées tant que la clé est vide |
| Identifiants **Google Ads** et éventuel **pixel Meta** | mesure | événements envoyés à `gtag` si présent ; Meta non branché |
| Politique de **consentement** (CMP) | gtag est chargé sans bandeau | à trancher avant les campagnes ; `track()` permet de conditionner l'envoi |
| Horaires d'exploitation exacts, e-mail de contact confirmé | contact / pied de page | valeurs actuelles de `site_content` |

## 7. Journal des lots

_(complété à chaque lot : modifications, tests exécutés, limites)_
