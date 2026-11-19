# Offre « livraison à la demande » — état chiffré au 19/11/2026

> Photo de ce que le site **vend réellement** aujourd'hui : la grille « SITE WANYM » telle qu'elle est en base dans NAMY, les prix que le moteur renvoie sur des courses types (relevés en production le 19/11/2026 sur `POST /api/quote`), ce que les textes du site promettent, et les écarts entre les trois. Sert de base aux décisions de prix ; **aucun prix n'est écrit dans le code du site**, tout se règle dans l'écran Grilles de NAMY (prix) et par l'API de contenu (textes).
>
> Références : `docs/modele-facturation.md` (modèle cible et décisions du 02/11), `docs/benchmark-supervan.md` (relevé concurrent du 02/11), `CLAUDE.md` § Base de données.

## 1. Résumé

| | |
|---|---|
| **Grille** | zone × véhicule : 1 / 2 / 4 / 8 m² = **40 / 80 / 120 / 240 € HT** (48 / 96 / 144 / 288 € TTC) jusqu'à 20 km, puis **2 € HT/km** au-delà, kilomètres simples (pas d'aller-retour). |
| **Options** | porte départ +15, porte arrivée +15, équipier +30, étage sans ascenseur +10/étage à partir du 4e, temps sur place +30 min 10 / +1 h 20 / +2 h 45 (HT). 30 min incluses. |
| **Majorations** | dimanche +50 % (08-12, 14-18), soirée 18-21 h +50 % (lundi → samedi). Samedi au tarif normal. Jours fériés fermés (devis). |
| **Service** | 7 j/7, jour même jusqu'à 12 h, créneaux 08-12 / 13-17 / 08-18 en semaine et samedi. |
| **Annulation / échecs (NAMY)** | gratuite jusqu'à 24 h avant le créneau, 50 % ensuite jusqu'au retrait ; échec de retrait 50 % ; échec de livraison **150 %** (non annoncé sur le site). |
| **Pas de plafond de distance** | un trajet de 135 km est vendu 311 € HT au prix immédiat ; le paramètre « rayon maximal 30 km » du compte n'est pas appliqué au canal site. |
| **Prix « en direct » : 10 à 13 s et 1 devis sur 3 en échec** en rafale (relevé du 19/11). Cause identifiée côté NAMY, corrigeable sans toucher aux prix (§ 5). |
| **Face à Supervan** | compétitif sur le 1 m² et la longue distance ; **30 à 185 % plus cher** sur 2 / 4 / 8 m² à 14 km (relevé du 02/11). |

## 2. La grille en vigueur dans NAMY (« SITE WANYM », compte « WANYM SOLUTION — Site web »)

### 2.1 Forfaits par taille (zone A, ≤ 20 km)

| Taille | Véhicule NAMY | Volume | Exemple affiché sur le site | HT | TTC |
|---|---|---|---|---|---|
| 1 m² | Kangoo | 3 m³ | un lave-linge et 6 cartons | 40 € | **48 €** |
| 2 m² | Jumpy | 6 m³ | un canapé 2 places et 10 cartons | 80 € | **96 €** |
| 4 m² | Master | 12 m³ | un canapé 3 places, une table, 6 chaises et 15 cartons | 120 € | **144 €** |
| 8 m² | Grand volume | 20 m³ | un studio complet | 240 € | **288 €** |

Zone B (> 20 km) : forfait de la zone A + **2 € HT par km au-delà de 20 km**, quelle que soit la taille (champ `prix_km_vehicules` de la ligne de zone). La distance est l'itinéraire routier OSRM aller simple (repli haversine × 1,3).

Champs de la grille **non lus** par le moteur zone, à ne pas confondre dans l'écran Grilles : `prix_km_supp_ht = 1,5`, `rayon_km_inclus = 30`, `majoration_ferie = 20`. Le prix du km vient de la ligne de zone B (2 €), et les fériés sont fermés au niveau du compte (`ouvert_feries = false`).

### 2.2 Options (toutes actives sur la grille)

| Option | Code NAMY | Prix HT | Prix TTC | Déclenchement |
|---|---|---|---|---|
| Prise en charge à la porte (départ) | `porte_depart` | 15 € | 18 € | choix client (jusqu'au 3e étage compris) |
| Livraison à la porte (arrivée) | `porte_arrivee` | 15 € | 18 € | choix client (jusqu'au 3e étage compris) |
| Équipier de manutention | `equipier` | 30 € | 36 € | choix client, **recommandé** par le site au-delà de 30 kg ou 1,50 m |
| Étage sans ascenseur | `etage_sans_ascenseur` | 10 € / étage à partir du 4e | 12 € | automatique sur l'étage déclaré |
| +30 min sur place | `temps_30` | 10 € | 12 € | choix client (30 min incluses) |
| +1 h sur place | `temps_60` | 20 € | 24 € | choix client |
| +2 h sur place | `temps_120` | 45 € | 54 € | choix client |

### 2.3 Jours, créneaux, majorations

| Jour | Créneaux proposés | Majoration |
|---|---|---|
| Lundi → samedi | 08-12 · 13-17 · 08-18 | aucune |
| Lundi → samedi | 18-21 | **+50 %** sur le forfait (« Soirée +50 % ») |
| Dimanche | 08-12 · 14-18 | **+50 %** (« Dimanche +50 % ») |
| Jours fériés | fermé | → demande de devis |
| Jour même | commande acceptée jusqu'à **12 h** ; créneaux restants de la journée | aucune majoration d'urgence |

Les majorations sont des règles « Tarification dynamique » de NAMY ciblées sur le compte site (8 règles, +50 % chacune), pourcentages **provisoires** depuis le 02/11.

### 2.4 Annulation, échecs, suppléments (paramètres du compte dans NAMY)

| Cas | Règle NAMY | Ce que dit le site (CGV, bloc avant paiement, pages) |
|---|---|---|
| Annulation > 24 h avant le créneau | gratuite | gratuite ✔ |
| Annulation < 24 h | 50 % du prix, possible jusqu'au retrait | 50 % ✔ |
| Chauffeur déjà en route / absence au retrait | pas de règle automatique (annulation = 50 %, échec de retrait = 50 %) | **100 %** ✘ |
| Échec de retrait imputable au client | 50 % | 50 % ✔ |
| Échec de livraison (client absent, refus) | **150 %** (retour compris) | **rien** ✘ |
| Dépassement du temps sur place | facturé après la course sur la carte conservée (empreinte Stripe) | annoncé ✔ (tarif du dépassement non chiffré) |
| Étage non déclaré, porte non commandée | facturés après la course | annoncé ✔ |

## 3. Courses types, prix constatés en production (19/11/2026)

Trottoir → trottoir, lundi 23/11, créneau 08-12, 1 colis de 10 kg, départ Enghien-les-Bains. Distances = itinéraire OSRM.

| Destination | Distance | 1 m² | 2 m² | 4 m² | 8 m² |
|---|---|---|---|---|---|
| Argenteuil | 6,6 km | 48 € | 96 € | 144 € | 288 € |
| Paris 4e | 15,3 km | 48 € | 96 € | 144 € | 288 € |
| Saint-Germain-en-Laye | 23,8 km | 57,12 € | 105,12 € | 153,12 € | ≈ 297 € |
| Boissy-Saint-Léger | 39,4 km | 94,56 € | 142,56 € | 190,56 € | ≈ 334 € |
| Meaux | 50,8 km | 121,92 € | 169,92 € | 217,92 € | 361,92 € |
| Rouen (hors IDF) | 135,5 km | — | **373,20 €** (311 € HT) | — | — |

Lecture : jusqu'à 20 km le prix est plat ; au-delà, chaque km ajoute 2,40 € TTC quelle que soit la taille, donc l'écart entre tailles reste constant (48 €) alors qu'un grand camion coûte plus cher au km.

Options sur un 2 m² à 15 km (96 € TTC de base) :

| Ajout | HT | TTC |
|---|---|---|
| Porte au départ | 95 € | 114 € |
| Porte à l'arrivée | 95 € | 114 € |
| Équipier | 110 € | 132 € |
| +1 h sur place | 100 € | 120 € |
| +2 h sur place | 125 € | 150 € |
| Étage 5 sans ascenseur (2 étages facturés) | 100 € | 120 € |
| Tout cumulé : 2 portes + équipier + étage 5 + 1 h | 180 € | 216 € |
| Dimanche 08-12 | 120 € | 144 € |
| Lundi 18-21 | 120 € | 144 € |
| Samedi | 80 € | 96 € |

## 4. Ce que le site promet, ce que NAMY applique : les écarts

| # | Écart | Où | Décision à prendre |
|---|---|---|---|
| 1 | **100 % « chauffeur en route »** annoncé dans les CGV et le bloc avant paiement ; NAMY ne sait facturer que 50 % (annulation) ou 50 % (échec de retrait). | CGV § annulation, `order.cancellation_terms`, 17 pages SEO | soit retirer le palier 100 %, soit l'appliquer à la main par l'API `charge` (empreinte bancaire) |
| 2 | **Échec de livraison à 150 %** paramétré dans NAMY, jamais annoncé au client. | `parametres_entreprise.cout_echec_livraison` | ramener à 100 % ou l'écrire dans les CGV |
| 3 | **Aucun plafond de distance** : « toute l'Île-de-France » sur le site, mais Rouen à 135 km part au prix immédiat ; le « rayon max 30 km » du compte n'est pas lu par le canal site. | Edge `creer-commande-publique`, `rayon_max_km` | fixer un plafond (ex. 80 km) au-delà duquel on passe en devis |
| 4 | **Fériés** : grille à +20 % mais compte fermé les fériés → le client reçoit « devis sous 24 h » un 25/12 au lieu d'un prix. | `ouvert_feries`, `majoration_ferie` | ouvrir les fériés comme un dimanche (+50 %) ou assumer la fermeture |
| 5 | **Étage sans ascenseur facturé même au trottoir** quand l'étage est transmis sans option porte (chemin API ; le formulaire ne pose la question qu'avec la porte). | moteur NAMY | conditionner l'option étage à la remise à la porte |
| 6 | **Dépassement de temps** : « facturé après la course » sans tarif affiché ; NAMY n'a pas de règle de dépassement, c'est un geste manuel de l'exploitation. | CGV, `supplements.ts` | fixer le tarif (ex. 1 €/min comme Supervan) et l'écrire |
| 7 | **Même prix au km pour 1 m² et 8 m²** au-delà de 20 km. | ligne de zone B | garder (simple) ou différencier par véhicule (`prix_km_vehicules` le permet déjà) |

## 5. Le prix « en direct » n'est ni rapide ni fiable aujourd'hui

Relevé du 19/11/2026, 55 appels à `POST /api/quote` :

| Mesure | Valeur |
|---|---|
| Temps de réponse d'un devis | **10,9 à 13,0 s** (le 08/11 : 3 à 7 s) |
| Devis en échec en rafale | **4 sur 11** (« adresse introuvable » alors que la même adresse passait la minute d'avant, ou dépassement des 15 s du site) |
| Temps de la fonction NAMY seule, même sans géocodage (`contexte`) | 10,8 à 14,5 s sur les 24 dernières heures |

Cause : la fonction NAMY `creer-commande-publique` recharge **à chaque appel** le contexte du compte site par **9 requêtes séquentielles** (entreprise, grilles, lignes, modes, options, véhicules, majorations…), sans cache, avant même de géocoder. Les géocodages BAN et l'itinéraire OSRM ont chacun un délai de 5 s sans nouvelle tentative : quand la BAN répond lentement, le devis tombe en « adresse introuvable » et le site affiche « devis sous 24 h » à la place du prix.

Conséquence commerciale : le visiteur attend plus de 10 s pour voir un prix, et une fois sur trois il ne le voit pas du tout. C'est la première chose à corriger, **avant** toute campagne : mettre le contexte en cache 5 min dans la fonction (comme la clé), paralléliser les lectures, retenter le géocodage une fois. Gain attendu : 1 à 2 s par devis, quasi plus d'échecs. Changement dans NAMY uniquement, sans effet sur les prix.

## 6. Face au marché

Les concurrents à prix public affiché sont rares : Trusk vend surtout aux enseignes (prix négociés), Cocolis est une place de marché où le prix se négocie avec le transporteur. Le seul relevé exploitable est **Supervan** (02/11/2026, `docs/benchmark-supervan.md`), prix TTC semaine sans option :

| Trajet | WANYM 2 m² vs Supervan 6 m³ | WANYM 4 m² vs 12 m³ | WANYM 8 m² vs 20 m³ |
|---|---|---|---|
| 3,6 km | 96 € vs 47 € | 144 € vs 79 € | 288 € vs 101 € |
| 14,3 km | 96 € vs 65 € | 144 € vs 101 € | 288 € vs 130 € |
| 72,5 km | 222 € vs 202 € | 270 € vs 241 € | 415 € vs 295 € |

Supervan : base ≈ 39 € + 1,85 €/km dès le premier km, aide du chauffeur +15 €, second homme +30 €, temps 20 min offerts puis 10 / 20 / 50 €, dimanche +50 %, nuit × 2,5, annulation 50 % < 6 h ouvrées et 100 % chauffeur en route. Nos avantages lisibles : le 1 m² à 48 € (ils n'ont rien sous 6 m³), le porte-à-porte jusqu'au 3e inclus dans l'option à 18 €, le détail itémisé du prix, le créneau de 4 h tenu par le dispatch.

## 7. Décisions attendues

Chaque ligne se règle dans NAMY (écran Grilles / Comptes / Tarification dynamique) ou par l'API de contenu du site, sans déploiement.

1. **Forfaits** : garder 48 / 96 / 144 / 288 € TTC, ou resserrer 2 / 4 / 8 m² (piste du 02/11 : ≈ 60 / 90 / 130 € TTC à 14 km) et/ou introduire un palier court (≤ 10 km).
2. **Kilomètre** : 2 € HT/km au-delà de 20 km pour toutes les tailles, ou différencié par véhicule.
3. **Plafond de distance** du prix immédiat (proposition : 80 km, devis au-delà) et périmètre affiché (Île-de-France).
4. **Options** : 15 / 15 / 30 / 10 par étage / 10-20-45 € HT : confirmer, ou vendre « aide du chauffeur » 15 € distincte de « second équipier » 30 €.
5. **Majorations** : dimanche et soirée à +50 % : confirmer ; samedi sans majoration : confirmer ; fériés ouverts +50 % ou fermés ; nuit après 21 h : ouverte ou non.
6. **Annulation** : retirer le palier « 100 % chauffeur en route » des textes, ou le facturer à la main ; aligner le délai (24 h) partout.
7. **Échec de livraison** : 150 % (NAMY) à ramener à 100 % ou à écrire dans les CGV.
8. **Dépassement de temps** : tarif à la minute à fixer et à afficher.
9. **Jour même** : garder sans majoration, ou vendre un « au plus vite » (+9 € chez Supervan).
10. **Vitesse et fiabilité du devis** (§ 5) : feu vert pour le correctif côté NAMY.
