# Brief visuels — prompt à donner à GPT (génération d'images)

> À coller tel quel dans GPT (mode génération d'images), une section à la fois si besoin. Les formats correspondent exactement aux emplacements du site ; les fichiers reçus se déposent dans `public/images/` et sont branchés dans `Hero.tsx`, `VehicleCards.tsx`, `OrderForm.tsx` (cartes de taille), `SizeAdvisor.tsx` (pictos) et `layout.tsx` (OpenGraph). Compression finale (WebP/AVIF) faite côté site, inutile de la demander à GPT.

---

## PROMPT

Tu es directeur artistique pour **WANYM SOLUTION**, transporteur du dernier kilomètre basé à Drancy (93), aux portes de Paris : un chauffeur et un utilitaire, réservés en ligne au prix affiché. Tu produis une **série d'images cohérentes** pour son site web. Respecte strictement les formats, les fonds et les noms de fichiers ci-dessous : les images sont insérées telles quelles dans des emplacements déjà dimensionnés.

### Direction artistique commune (vaut pour toutes les images)

- Style : **rendu 3D réaliste, propre, lumineux**, type visuel produit premium (pas de cartoon, pas de flat design, pas de croquis). Même rendu, même éclairage et même angle sur toute la série.
- Lumière : lumière du jour douce venant de la gauche, ombres légères, pas de reflets agressifs.
- Palette : blanc `#FFFFFF`, bleu nuit `#0B1F3A`, vert WANYM `#00A67E`, gris clair `#F4F6F8`. Le vert sert aux accents (bande sur les véhicules, détails), jamais en aplat de fond.
- Livrée des véhicules : utilitaire **blanc**, avec une **bande verte `#00A67E` en double chevron** sur le flanc, qui monte de l'arrière de la porte avant vers le toit. Jantes grises, vitres teintées légèrement, plaques d'immatriculation vides.
- **Aucun texte lisible** dans les images, sauf mention contraire explicite : pas de slogan, pas de logo inventé, pas de filigrane, pas de faux lettrage sur les véhicules.
- Pas de personnes reconnaissables, pas de marques tierces visibles (constructeur, cartons de marques).
- Fond **transparent** quand c'est demandé (PNG avec canal alpha, aucun fond blanc simulé, aucun damier). Une ombre de contact douce sous l'objet est bienvenue, rien d'autre.
- Marge : l'objet occupe 85 à 90 % de la largeur, centré, jamais coupé par le bord.
- Un fichier par image, nommé exactement comme indiqué, en minuscules.

### Lot A — Hero (1 image)

**Fichier** : `hero-livraison.jpg`
**Format** : 1600 × 1200 px (4:3), JPG qualité 90, fond réel (pas de transparence).
**Scène** : deux livreurs vus de dos ou de trois quarts (visages non identifiables), tenue de travail bleu nuit, en train de charger un canapé emballé sous film dans un utilitaire blanc à bande verte, porte latérale et portes arrière ouvertes, rue résidentielle calme de proche banlieue parisienne, matin ensoleillé. Cadrage horizontal, le véhicule occupe la moitié droite, de l'espace respirant à gauche. Ambiance : sérieux, efficace, humain. Pas de texte, pas de plaque lisible.
**Variante** : `hero-livraison-portrait.jpg`, 1200 × 1500 px (4:5), même scène recadrée pour mobile.

### Lot B — Les quatre utilitaires (4 images, même série)

Même angle **trois quarts avant gauche**, même hauteur de caméra (légèrement au-dessus du capot), même échelle : les quatre véhicules doivent être **visiblement de tailles différentes** quand on les place côte à côte, la cabine reste comparable et c'est la caisse qui grandit. Fond transparent. Format **1200 × 800 px (3:2)**, PNG.

| Fichier | Véhicule | Repères |
|---|---|---|
| `camion-1m2.png` | fourgonnette compacte (gabarit Renault Kangoo), 1 m² au sol, 3 m³ | la plus petite, caisse courte, toit bas |
| `camion-2m2.png` | fourgon moyen (gabarit Citroën Jumpy), 2 m² au sol, 6 m³ | plus long, toit encore bas |
| `camion-4m2.png` | grand fourgon (gabarit Renault Master L2H2), 4 m² au sol, 12 m³ | nettement plus haut et plus long |
| `camion-8m2.png` | utilitaire 20 m³ à caisse grand volume avec hayon (gabarit Master caisse), 8 m² au sol | le plus imposant, caisse carrée blanche, bande verte sur la caisse |

**Livrer aussi** la même série sur **fond blanc uni** (`camion-1m2-blanc.png`, etc.) au cas où la transparence serait imparfaite.

### Lot C — Emprise au sol par taille (4 images)

Ce qui tient dans chaque taille, posé au sol vu de trois quarts, comme sur un plateau, **sans le véhicule**. Fond transparent, format **1200 × 900 px (4:3)**, PNG, même rendu que le lot B.

| Fichier | Composition |
|---|---|
| `charge-1m2.png` | un lave-linge et six cartons de déménagement bruns empilés |
| `charge-2m2.png` | un canapé deux places gris clair et dix cartons |
| `charge-4m2.png` | un canapé trois places, une table à manger, six chaises empilées, quinze cartons |
| `charge-8m2.png` | un studio complet : lit démonté, armoire démontée, canapé, réfrigérateur, cartons, plante verte |

### Lot D — Pictogrammes des objets (19 images)

Pour le sélecteur « Qu'est-ce qu'on transporte ? ». **Même rendu 3D doux**, vue de trois quarts, couleurs sobres (bois clair, gris, blanc, un seul accent vert possible), fond transparent, format **512 × 512 px**, PNG, objet centré à 80 % de la largeur. Un objet par image, aucun texte.

| Fichier | Objet |
|---|---|
| `obj-carton.png` | carton de déménagement standard fermé |
| `obj-carton_livres.png` | petit carton de livres |
| `obj-valise.png` | valise rigide à roulettes |
| `obj-lave_linge.png` | lave-linge hublot |
| `obj-refrigerateur.png` | réfrigérateur combiné blanc |
| `obj-petit_electro.png` | four micro-ondes |
| `obj-canape_2.png` | canapé deux places gris |
| `obj-canape_3.png` | canapé trois places gris |
| `obj-matelas.png` | matelas debout emballé sous film |
| `obj-lit_demonte.png` | sommier et tête de lit démontés, sanglés |
| `obj-table.png` | table à manger quatre personnes en bois clair |
| `obj-chaise.png` | chaise de salle à manger |
| `obj-commode.png` | commode trois tiroirs |
| `obj-meuble_tv.png` | meuble TV bas |
| `obj-armoire_demontee.png` | panneaux d'armoire démontée sanglés |
| `obj-tv.png` | téléviseur écran plat dans son carton |
| `obj-velo.png` | vélo de ville |
| `obj-plante.png` | plante verte en pot |
| `obj-autre.png` | colis générique avec un point d'interrogation discret (le seul « texte » autorisé) |

### Lot E — Identité et partage (3 images)

- `logo-wanym.svg` (vectoriel) ou à défaut `logo-wanym.png` 2400 × 500 px transparent : le logotype officiel « WANYM SOLUTION » avec le double chevron vert. **Si le logo officiel existe déjà, fournir le fichier source plutôt que d'en générer un.** Livrer aussi la version monochrome blanche `logo-wanym-blanc.png` pour fond bleu nuit.
- `og-image.jpg` 1200 × 630 px : visuel de partage pour les réseaux et Google, l'utilitaire 4 m² de trois quarts sur fond bleu nuit `#0B1F3A` avec dégradé vert discret, espace libre à gauche sur 55 % de la largeur (le titre sera ajouté par le site). Aucun texte.
- `icone-app.png` 1024 × 1024 px, fond bleu nuit `#0B1F3A`, double chevron vert centré, coins droits (l'arrondi est appliqué par les systèmes).

### Livraison

Un dossier `wanym-visuels/` contenant les 36 fichiers nommés exactement comme ci-dessus, chaque image au format indiqué, sans compression destructive (PNG 24 bits avec alpha, JPG qualité 90). Avant de livrer, vérifier : même angle et même lumière sur les quatre camions, tailles croissantes visibles, aucun texte parasite, fonds réellement transparents.

---

## Côté site, à réception

| Fichiers | Emplacement | Composant |
|---|---|---|
| `hero-livraison*.jpg` | `public/images/hero/` | `src/components/home/Hero.tsx` (`next/image`, priorité LCP, 4:3 desktop, 4:5 mobile) |
| `camion-*.png` | `public/images/camions/` | `VehicleCards.tsx`, cartes de taille d'`OrderForm.tsx`, `PriceDetail` ; `TruckIcon` reste en repli |
| `charge-*.png` | `public/images/charges/` | sous chaque carte de l'accueil (exemple visuel) |
| `obj-*.png` | `public/images/objets/` | `SizeAdvisor.tsx` à la place des icônes `Icon` ; le nom de fichier suit l'`id` du catalogue (`catalogue-objets.ts`) |
| `logo-wanym*.svg/png` | `public/images/` | `Logo.tsx` |
| `og-image.jpg`, `icone-app.png` | `public/` | `layout.tsx` (OpenGraph, icônes) |

Conversion WebP/AVIF et dimensionnement responsive par `next/image` ; poids visé après optimisation : hero ≤ 250 Ko, camions ≤ 60 Ko chacun, pictos ≤ 15 Ko.
