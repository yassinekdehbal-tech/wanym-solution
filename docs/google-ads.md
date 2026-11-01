# Google Ads — plan de mots-clés WANYM SOLUTION

Objectif : capter le trafic « transport à la demande en camionnette, Île-de-France » sur lequel Supervan est positionné, et l'envoyer vers `/commander` (prix immédiat NAMY + paiement). Les clés `NEXT_PUBLIC_GTAG_ID` / `NEXT_PUBLIC_GTAG_CONVERSION_LABEL` déclenchent la conversion sur `/commander/merci`.

## 1. Méthode

1. **Partir des pages du concurrent**, pas de l'intuition : titres et H1 de supervan.fr (livraison camionnette, transport de meubles, livraison Ikea / Leroy Merlin / Leboncoin, déménagement express, chauffeur avec utilitaire). Chaque promesse de page = une famille de requêtes qu'il achète.
2. **Keyword Planner** (Outils › Planification › Trouver des mots-clés) : coller ces amorces, filtrer Île-de-France, langue français, 12 mois. Garder volume ≥ 50/mois et intention transactionnelle (verbe d'action, lieu, prix).
3. **Compléter avec l'autocomplétion Google** et « Autres questions posées » sur 5 requêtes pivot (ci-dessous).
4. **Après 2 semaines de diffusion** : rapport « Termes de recherche » (ce que les gens ont vraiment tapé) et « Analyse des enchères » (où Supervan se place). On ajoute en exact ce qui convertit, en négatif ce qui coûte sans convertir.

## 2. Familles de mots-clés (ordre de priorité)

| Famille | Exemples (expression / exact) | Page d'atterrissage |
|---|---|---|
| **Besoin générique** (cœur Supervan) | livraison camionnette paris · transport utilitaire avec chauffeur · coursier camionnette île-de-france · livraison express camionnette · chauffeur avec camion de livraison | `/commander` |
| **Par objet** | transport meuble paris · livraison canapé paris · transport électroménager domicile · livraison matelas · transport colis volumineux · livraison palette paris | `/commander?service=livraison-express-a-la-demande` |
| **Par occasion** | livraison achat leboncoin · livraison ikea à domicile · livraison leroy merlin camionnette · récupérer un meuble avec camionnette · déménagement petit volume paris · transport studio paris | idem |
| **B2B** (votre vrai différenciant) | livraison dernier kilomètre entreprise · sous-traitance livraison île-de-france · transporteur magasin domicile client · externaliser ses livraisons · livraison B2B messagerie idf · transport dédié entreprise | `/services/livraison-professionnels-externalisee` |
| **Urgence** | livraison urgente paris aujourd'hui · coursier express camionnette · transport same day île-de-france | `/commander` |
| **Marque concurrente** (test, petit budget) | supervan · supervan prix · supervan avis · alternative supervan | `/commander` — ne jamais écrire « Supervan » dans l'annonce |

Cinq requêtes pivot pour l'autocomplétion : « livraison camionnette », « transport meuble », « coursier utilitaire », « livraison leboncoin », « livraison dernier kilomètre ».

## 3. Mots-clés négatifs (dès le premier jour)

emploi · recrutement · salaire · offre d'emploi · chauffeur recherche · location camionnette (sans « avec chauffeur ») · location utilitaire · gratuit · pas cher occasion · vente camionnette · permis · formation · auto-entrepreneur devenir · uber · stuart · deliveroo · colissimo · chronopost · mondial relay · suivi colis · international · déménagement entreprise complet (si hors périmètre).

## 4. Structure du compte

- **1 campagne Search par intention** : Particuliers à la demande · Professionnels / externalisation · Marque concurrente. Budgets séparés, l'urgence et le B2B ne valent pas le même clic.
- **1 groupe d'annonces par famille**, 10 à 20 mots-clés, expression + exact. Pas de requête large avant 30 conversions.
- **Annonces responsives** : titres avec le prix d'appel (« dès X € TTC »), « prix immédiat en ligne », « paiement sécurisé », « Île-de-France », « chauffeur pro », « sans engagement ». Descriptions : prise en charge, créneau choisi, suivi.
- **Extensions** : appel (07 67 16 60 15), liens annexes (Commander, Tarifs, Pro, Suivi), accroches (Sans engagement, Devis 24h, Depuis 2016), extraits de site (Services).
- **Ciblage** : Île-de-France uniquement, « Présence » (pas « intérêt »). Calendrier : couper la nuit au départ, rouvrir si le suivi montre des commandes.
- **Enchères** : CPC optimisé les 3 premières semaines, puis « Maximiser les conversions » (puis tCPA une fois 30 conversions/mois).

## 5. Ce qui fait gagner l'enchère contre Supervan

Le score de qualité pèse autant que l'enchère. Trois leviers déjà dans le site :

- **Pertinence** : une page d'atterrissage par famille (créable sans déploiement via `PUT /api/services` ou `PUT /api/content`), avec le mot-clé dans le titre et le hero pré-rempli (`/commander?from=&to=&service=`).
- **Expérience** : prix affiché avant toute saisie de coordonnées, formulaire mobile first, Lighthouse ≥ 90.
- **Taux de clic** : prix dans le titre et numéro d'appel. Supervan affiche un prix dès la première page, il faut en faire autant.

## 6. Repères de pilotage

| Indicateur | Cible de départ |
|---|---|
| CPC moyen (IDF, ces familles) | 1,5 à 4 € |
| Taux de conversion `/commander` | 3 à 6 % |
| Coût par commande visé | < 30 % du panier moyen HT |
| Budget d'apprentissage | 25 à 40 €/jour pendant 3 semaines |

Les chiffres sont des ordres de grandeur de marché, à remplacer par le Keyword Planner et les premières semaines réelles.
