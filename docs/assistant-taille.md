# Assistant de choix de taille — cadrage, audit et plan

> Reprend la proposition « Développement de l'assistant de choix de camion » et la met au raccord du projet tel qu'il est en production le 01/11/2026. Ce qui diffère de la proposition est **signalé en gras** avec la raison.

## 1. Audit : ce qui existe déjà (fait)

| Point de la proposition | État réel |
|---|---|
| Architecture Next.js, formulaire `/commander` | Page unique à révélation progressive dans `src/components/OrderForm.tsx` : trajet → **taille du véhicule (4 cartes)** → remise porte/trottoir → date → coordonnées → prix. État React local + brouillon en `sessionStorage`. |
| Les quatre véhicules et leurs capacités | Ce sont les **catégories de véhicule NAMY** de la grille « SITE WANYM » (`categories_vehicules` : nom, volume, `surface_m2`, couleur, ordre). Le site les reçoit par `GET /api/namy/contexte` → `vehicules[]` avec `prix_base_ht`. **Aucune dimension intérieure, charge utile ni ouverture n'existe dans NAMY** : à faire valider par l'exploitation (voir §5). |
| Moteur tarifaire | NAMY, grille zone × véhicule. Le site ne calcule rien ; `POST /api/quote` relaie. **L'assistant ne touche pas au prix** : il ne fait que présélectionner `vehicule_id`, le recalcul existant se déclenche tout seul. |
| Persistance | `orders.options` (jsonb) accepte des clés libres : l'inventaire y sera rangé (`inventaire`) sans migration. NAMY ne le reçoit pas (schéma inchangé), sauf dans la description libre. |
| Styles et icônes | Tailwind, classes `btn-primary`, `field`, `label`, `card` ; icônes maison (`Icon`), camions (`TruckIcon`). Bleu nuit `#0b1f3a`, accent vert, cartes arrondies. |
| Catalogue d'objets / contraintes de chargement | **N'existaient pas.** Créés : `src/lib/catalogue-objets.ts` (valeurs de départ) et moteur `src/lib/vehicle-advisor.ts`. |
| Contenu éditable | Convention du site : tout texte ou paramètre métier vit dans `site_content` et se modifie par l'API. **Le catalogue et les capacités suivront la même voie** (clés JSON `order.catalogue_objets`, `order.vehicules_capacites`), les constantes du code étant le repli. |

## 2. Ce qui est livré dans cette PR (sans toucher au parcours)

- `src/lib/vehicle-advisor.ts` : moteur **pur, sans React, sans réseau**, testable seul. Entrée : inventaire (objet × quantité), véhicules NAMY, capacités. Sortie : `statut` ∈ `vide` · `suggere` · `a_verifier` · `hors_capacite`, véhicule proposé, raisons lisibles, mesures (emprise brute, emprise ajustée, volume, poids, plus grande longueur), incertitudes.
- `src/lib/catalogue-objets.ts` : 19 objets (cartons, électroménager, mobilier, literie, fragile, divers, « Autre objet ») avec dimensions **en orientation de transport**, poids, empilable / porteur / fragile ; 4 capacités de véhicule avec dimensions intérieures et charge utile **typiques, marquées à valider**.
- `tests/vehicle-advisor.test.ts` (`npm test`, 15 cas) : aucun objet, un petit objet, objets identiques empilés, objet trop haut / trop long pour le petit véhicule, charge trop lourde, objets non empilables au-delà de 8 m², dimensions inconnues, montée en quantité monotone, résumé pour « Que transportons-nous ? », santé du catalogue.

### Le modèle de calcul, en clair

1. **Emprise** = longueur × largeur de chaque objet, en orientation de transport (un matelas sur chant, une armoire à plat).
2. **Gerbage** : les objets empilables partagent le sol par couches, limitées par la hauteur intérieure du véhicule (un objet fragile ou non porteur ne reçoit rien dessus : une couche de moins). Ce qui reste d'empilable **monte sur les objets porteurs** (canapé, table, lave-linge, commode) avant de prendre du sol.
3. **Volume** = Σ l × w × h, comparé au volume utile.
4. **Longueur** : le plus grand côté au sol doit tenir dans la longueur intérieure ou dans 95 % de la diagonale du plancher.
5. **Hauteur** : aucun objet plus haut que la hauteur intérieure.
6. **Poids** : Σ poids ≤ charge utile, quand les poids sont connus.
7. **Marge** de 10 % sur l'emprise ajustée et le volume (paramétrable ; **pas de coefficient universel**).
8. Le plus petit véhicule qui passe les six tests est proposé. Dimensions manquantes, objet « à confirmer » ou chargement à plus de 80 % de la surface → `a_verifier` avec la taille quand même proposée. Rien ne passe → `hors_capacite`, raison nommée (longueur, hauteur, poids ou volume), **jamais un 8 m² forcé**.

Ce modèle est volontairement conservateur : la « surface » vendue (1 / 2 / 4 / 8 m²) est commerciale, plus petite que le plancher réel. Quelques résultats des tests, à confronter au terrain :

| Inventaire | Proposition |
|---|---|
| 12 cartons | 1 m² |
| 1 lave-linge + 6 cartons | 1 m² |
| 1 lave-linge + 1 meuble TV | 2 m² |
| 1 matelas (sur chant, 140 cm de haut) | 2 m² (trop haut pour le Kangoo) |
| 1 réfrigérateur debout (180 cm) | 4 m² (hauteur) — à discuter : l'exploitation le couche-t-elle ? |
| canapé 3 places + table + 6 chaises | 4 m² |
| 6 canapés 3 places | hors capacité |
| 20 lave-linge | hors capacité (poids) |

## 3. Améliorations apportées à la proposition

- **Deux lectures, pas une** : en plus de l'assistant, chaque carte de taille affichera un exemple concret (« 1 m² : un lave-linge et 6 cartons »), calculé par le même moteur à partir d'inventaires types éditables. Pas de clic pour la majorité des visiteurs.
- **Catalogue et capacités éditables par l'API** (clés `site_content`), comme tout le reste du site : l'exploitation ajuste un poids, une dimension ou une capacité sans déploiement, et peut désactiver un objet.
- **Préremplissage non destructif** du champ « Que transportons-nous ? » avec le résumé de l'inventaire (« 3 cartons, 1 réfrigérateur ») seulement s'il est vide ; si l'utilisateur a déjà écrit, on propose un bouton « Reprendre la liste ».
- **Traçabilité** : l'inventaire est enregistré dans `orders.options.inventaire` et résumé dans la description envoyée à NAMY (champ libre déjà existant), pour que le dispatch voie ce qui a été déclaré sans changer le contrat NAMY.
- **Mesure** : un événement d'analytics (`assistant_taille_ouvert`, `assistant_taille_accepte`, `assistant_taille_change`) pour savoir si l'assistant aide vraiment à convertir.
- **Honnêteté du libellé** : les trois statuts imposent trois formulations ; aucune n'écrit « tout rentrera ».
- **Pas d'ouverture de porte modélisée pour l'instant** : les ouvertures arrière des utilitaires sont proches de la section intérieure ; on ajoutera la contrainte quand l'exploitation fournira les cotes (une seule colonne à remplir).

## 4. Intégration prévue (étape suivante, après validation des données)

Dans `OrderForm.tsx`, bloc « Quelle place vous faut-il ? » :

1. Sous les cartes, lien « Je ne sais pas quelle taille choisir » → panneau dépliable sous les cartes (mobile et desktop, même page, aucune route).
2. Grille d'objets illustrés avec − / quantité / + (zones tactiles 44 px), compteur total, recherche dès 12 objets, ligne « Autre objet » avec un champ texte.
3. Recommandation recalculée à chaque changement, encadré résultat : icône du camion, nom, m², m³, phrase du statut, bouton « Choisir ce camion », lien « Voir une autre taille ».
4. « Choisir » : `set("vehicule_id", id)`, préremplissage de « Que transportons-nous ? » si vide, fermeture du panneau, le bloc suivant apparaît, le prix NAMY se recalcule (comportement existant).
5. États : vide, sélection, calcul, résultat, incertitude, hors capacité (renvoi vers la demande de devis existante), erreur de chargement du catalogue (le choix manuel reste possible). `prefers-reduced-motion` respecté, transitions 150–200 ms.

Aucune modification de l'ordre des blocs, du paiement, du devis ni du contrat NAMY.

## 5. Données métier à valider par l'exploitation (bloquant pour la mise en ligne de l'assistant)

| Donnée | Valeur de départ dans le code | Qui tranche |
|---|---|---|
| Dimensions intérieures des 4 véhicules (L × l × h) | Kangoo 180 × 120 × 125 · Jumpy 240 × 160 × 140 · Master 320 × 180 × 190 · 20 m³ 420 × 200 × 230 cm | exploitation, d'après le parc réel |
| Charge utile | 600 · 1 000 · 1 200 · 1 100 kg | exploitation |
| Dimensions et poids des 19 objets | tableau de `catalogue-objets.ts` | exploitation (10 minutes de relecture) |
| Objets à ajouter / retirer | — | exploitation + DA (pictos) |
| Règle « réfrigérateur » : debout obligatoire ou couché toléré | debout | exploitation |
| Marge de sécurité | 10 % | exploitation |
| Exemples affichés sur les cartes | 1 m² : lave-linge + 6 cartons · 2 m² : canapé 2 places + 10 cartons (le matelas debout fait passer le moteur à 4 m², vérifié le 01/11) · 4 m² : canapé 3 places + table + 6 chaises + 15 cartons · 8 m² : un studio complet | exploitation |

Tant que ces valeurs ne sont pas validées, l'assistant restera en statut « à vérifier » plus souvent qu'il ne le devrait : c'est voulu, il vaut mieux une recommandation prudente qu'une promesse fausse.
