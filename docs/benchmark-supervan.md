# Benchmark — tunnel de réservation Supervan (relevé du 02/11/2026)

> Relevé fait sur `supervan.fr/v2/reserver` avec un navigateur automatisé, trajet 15 rue Fessart (Paris 19e) → 125 rue Diderot (Drancy), 14,3 km. Prix observés sur le tunnel public et sur son service de tarification (`/v1/quote`), sans compte ni paiement. Les montants sont **TTC** tels qu'affichés au client ; Supervan indique le HT = TTC / 1,2. Captures : `docs/benchmark/supervan-*.png`.

## 1. Structure du tunnel

Une seule page, quatre blocs en accordéon, un récapitulatif collant à droite avec la carte, le prix TTC et « Confirmer et payer (Sécurisé avec Stripe) ».

| Bloc | Contenu |
|---|---|
| **Trajet** | départ, arrivée, « + Ajouter une étape » (multi-stop). Date : 7 pastilles jour (le dimanche porte un badge **+50 %**) + « Autre jour ». Heure au chargement **± 15 min** : « Au plus vite avant HH:MM **+9 €** » ou heure + minute (pas de créneau de 4 h). |
| **Camion** | 4 cartes 6 / 9 / 12 / 20 m³ avec le dessin coté (L × l × h), « Chargez 700 / 800 / 900 / 500 kg », **prix en delta** par rapport au camion sélectionné (« −36 € », « +29 € »), badge « Le plus choisi ». 12 m³ : choix de charge 900 / 1 200 (+2 €) / 1 400 kg (+4 €). 20 m³ : option hayon (+5 €, 500 kg max). Avertissement « accès parkings souterrains impossible ». Lien « Aide choix camion » (modale statique : cartons et m² habitables par taille). |
| **Services** | Manutention : « Transport uniquement » / « Aide du chauffeur » **+15 €** (max 1,5 m ou 30 kg par objet) / « Chauffeur + 1 aide » **+30 €** (max 90 kg). Temps cumulé chargement + déchargement : 20 min offert / 40 min +10 € / 1 h +20 € / 2 h +50 €, « non remboursable, 1 €/min en cas de dépassement ». Assurance ad valorem : 1 000 € +19 / 3 000 € +29 / 5 000 € +49 / 10 000 € +99 / 20 000 € +199 (complète la responsabilité légale 33 €/kg). Champ « Marchandises » (objet et valeur), lien produits interdits. |
| **Informations** | prénom, nom, e-mail, téléphone, « Facturation société », passagers dans le camion 0 / 1 / 2 (gratuit, indisponible en 6 m³), « Qui sera sur place ? » au départ et à l'arrivée (Moi / Autre), instructions chauffeur, pièces jointes (50 Mo, transmises au chauffeur), **conditions d'annulation** affichées dans le formulaire. CGU à cocher. |

Pas de question étage / ascenseur, pas de remise « à la porte » ou « au trottoir » : la manutention est vendue au **nombre de bras** et au **temps**, pas à l'accès. Pas d'assistant par objets : une modale d'aide statique.

## 2. Ce qui est facturé — relevé

### Base (6 m³, mardi 10 h, sans option)

| Distance | Durée estimée | Prix TTC |
|---|---|---|
| 3,6 km | 26 min | 47 € |
| 14,3 km | 33 min | 65 € |
| 26 km | 45 min | 86 € |
| 30,6 km | 67 min | 101 € |
| 72,5 km | 96 min | 172 € |

Lecture : environ **39 € de base + 1,85 €/km**, avec une composante temps (à distance égale, un itinéraire plus lent coûte plus cher ; le calcul utilise l'heure de départ, la distance renvoyée change selon l'heure). Le prix est renvoyé en **une seule ligne « Prestation »** : le client ne voit pas le détail km / temps, seulement les deltas des options.

### Taille du véhicule (même trajet)

| | 6 m³ | 9 m³ | 12 m³ | 20 m³ |
|---|---|---|---|---|
| 3,6 km | 47 € | 61 € | 79 € | 101 € |
| 14,3 km | 65 € | 82 € | 101 € | 130 € |
| 72,5 km | 172 € | 202 € | 241 € | 295 € |
| Charge utile annoncée | 700 kg | 800 kg | 900 kg | 500 kg |
| Dimensions utiles | 2,00 × 1,25 × 1,55 m | 2,50 × 1,70 × 1,65 m | 3,00 × 1,70 × 1,70 m | 4,00 × 2,00 × 2,10 m |
| Équipiers max | 1 | 2 | 2 | 2 |

L'écart entre tailles n'est pas un simple coefficient : +17 / +36 / +65 € à 14 km, +30 / +69 / +123 € à 72 km.

### Majorations horaires et calendaires

| Cas | Prix (6 m³, 14,3 km) | Règle déduite |
|---|---|---|
| Semaine 6 h → 20 h | 63–66 € | tarif normal (variations dues au trafic) |
| **21 h → 6 h** | 156–161 € | **≈ × 2,5** (« transport de nuit ») |
| Samedi | 65 € | normal |
| **Dimanche et jours fériés** (11/11) | 95 € | **+50 %** (annoncé sur la pastille) |
| Dimanche 22 h | 239 € | cumul nuit × dimanche |
| « Au plus vite » | +9 € | forfait express ; délai minimum 60 min à Paris |

### Options

| Option | Prix TTC |
|---|---|
| Aide du chauffeur | +15 € |
| Chauffeur + 1 aide | +30 € |
| Temps de manutention 40 min / 1 h / 2 h | +10 / +20 / +50 € (20 min offerts), dépassement 1 €/min |
| Assurance 1 k / 3 k / 5 k / 10 k / 20 k € | +19 / +29 / +49 / +99 / +199 € |
| Hayon (20 m³) | +5 € |
| Charge 1 200 / 1 400 kg (12 m³) | +2 / +4 € |
| Passagers (1 ou 2) | gratuit |
| Étape supplémentaire | pas de forfait : chaque tronçon est tarifé comme une course (Paris 19e → Hôtel de Ville → Drancy = 126 € contre 65 € en direct) |

### Conditions

- Annulation : **50 % si moins de 6 h ouvrées** avant le chargement, **100 % si le chauffeur est en route**.
- Service client 7 j/7 : 6 h–20 h en semaine, 8 h–20 h le samedi, 9 h–20 h le dimanche.
- Paiement Stripe à la commande, montant TTC dominant, HT en petit.
- Réassurance : « Noté 4,9/5 par 3 000+ avis » (Google), « 100 % chauffeurs professionnels », « Service client 7/7 jusqu'à 20 h », un avis client défilant daté (« il y a 2 h »).

## 3. Face à la grille WANYM (prix TTC, semaine, sans option)

Grille « SITE WANYM » : 1 / 2 / 4 / 8 m² = 48 / 96 / 144 / 288 € TTC jusqu'à 20 km, puis 2,40 €/km TTC. Correspondance de volume : 1 m² ≈ 3 m³ (plus petit que leur 6 m³), 2 m² ≈ 6 m³, 4 m² ≈ 12 m³, 8 m² ≈ 20 m³.

| Trajet | WANYM 1 m² (3 m³) | WANYM 2 m² vs SV 6 m³ | WANYM 4 m² vs SV 12 m³ | WANYM 8 m² vs SV 20 m³ |
|---|---|---|---|---|
| 3,6 km | 48 € (SV n'a pas plus petit que 6 m³ : 47 €) | **96 € vs 47 €** | **144 € vs 79 €** | **288 € vs 101 €** |
| 14,3 km | 48 € | **96 € vs 65 €** | **144 € vs 101 €** | **288 € vs 130 €** |
| 72,5 km | 174 € (vs 172 €) | **222 € vs 202 €** | **270 € vs 241 €** | **415 € vs 295 €** |

Lecture honnête : le site WANYM est compétitif **uniquement sur le 1 m²** (un gabarit que Supervan ne vend pas) et sur la longue distance en petit volume. Sur les trois autres tailles, à volume comparable, WANYM est **de 30 % à 185 % plus cher** sur un trajet moyen de 14 km, et l'écart explose sur les courts trajets parce que notre forfait ne descend pas en dessous de 20 km. Les options vont dans le même sens : porte-à-porte +18 € par bout et équipier +36 € chez WANYM, contre une aide du chauffeur à +15 € chez Supervan qui couvre déjà le portage des objets ≤ 30 kg.

Les marqueurs de Supervan qui coûtent peu et rassurent : heure précise ± 15 min, « le plus choisi », deltas de prix sur les cartes, conditions d'annulation écrites dans le formulaire, avis Google datés.

## 4. Pistes pour WANYM (décisions produit, pas de changement de code tant qu'elles ne sont pas prises)

1. **Grille** : introduire un palier court (≤ 10 km) ou un départ plus bas avec un €/km dès le premier kilomètre, et resserrer 2 / 4 / 8 m² (par exemple 60 / 90 / 130 € TTC à 14 km pour être au niveau). Se règle dans l'écran Grilles de NAMY, aucun déploiement du site.
2. **Nuit et dimanche** : Supervan vend la nuit × 2,5 et le dimanche +50 %. NAMY sait porter ces règles (Tarification dynamique, majorations de créneau) ; c'est un levier de marge sans toucher au prix de jour.
3. **Manutention** : vendre « aide du chauffeur » (+15 €) distinct de « équipier supplémentaire » (+30 €), au lieu d'un seul équipier à +36 €. Le porte-à-porte peut rester gratuit jusqu'au 3e étage comme aujourd'hui : c'est un avantage lisible face à eux, à condition de l'écrire sur la carte.
4. **Express** : un « au plus vite » à +9 € est un argument simple ; NAMY accepte déjà la commande le jour même jusqu'à l'heure limite.
5. **Assurance ad valorem** en option payante (19 € pour 1 000 €) : revenu additionnel et réassurance ; dépend d'un contrat assureur côté WANYM.
6. **UX à reprendre** : deltas de prix sur les cartes de taille (« +48 € » plutôt que le prix absolu), badge « le plus choisi », conditions d'annulation affichées avant le paiement, avis clients datés dès qu'il y en a de validés. Aucun de ces points ne change le moteur de prix.

Ce qui ne doit pas être copié : la ligne unique « Prestation » sans détail (notre détail itémisé est un plus), l'absence de créneau (leur ± 15 min engage le dispatch), et l'absence de question étage (c'est là que naissent les litiges).
