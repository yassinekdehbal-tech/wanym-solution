# Campagnes publicitaires WANYM SOLUTION — plan de lancement

Trois canaux, trois cibles, une même mécanique : chaque clic arrive sur une page qui porte le message de
l'annonce, avec un prix visible avant toute saisie, et chaque commande est attribuée à sa campagne
(`gclid` / `utm_*` capturés par `AttributionCapture.tsx`, stockés dans `orders.utm` / `orders.source`).

| Canal | Cible | Message | Page d'atterrissage | Objectif mesuré |
|---|---|---|---|---|
| Google Ads (Search) | particulier ou pro qui **cherche** un camion avec chauffeur maintenant | prix affiché, commande en quelques clics, jour même | `/commander` (pré-rempli) | commande payée (`/commander/merci`) |
| Facebook / Instagram (vidéo) | particulier qui vient d'acheter un objet volumineux (Leboncoin, Ikea, Leroy Merlin) | « vous l'avez acheté, on vous le livre : prix en 30 s » | `/?utm…` puis `/commander` | clic → devis affiché → commande |
| LinkedIn (vidéo démo) | responsables retail, e-commerce, logistique en Île-de-France | externaliser le dernier kilomètre, chaque course suivie dans NAMY | `/services/livraison-professionnels-externalisee` | demande de contact / devis |

Prérequis techniques communs : § 5. Plan détaillé des mots-clés Google : `docs/google-ads.md`.

---

## 1. Google Ads — Search

### 1.1 Structure
Trois campagnes, budgets séparés (cf. `docs/google-ads.md` § 4) :

| Campagne | Groupes d'annonces | Landing |
|---|---|---|
| **Particuliers — à la demande** | besoin générique · par objet (meuble, canapé, électroménager, matelas) · par occasion (Leboncoin, Ikea, Leroy Merlin, petit déménagement) · urgence | `/commander?utm_source=google&utm_medium=cpc&utm_campaign=particuliers&utm_content={groupe}` |
| **Professionnels — externalisation** | dernier kilomètre · sous-traitance livraison · transporteur magasin → domicile · livraison e-commerce IDF | `/services/livraison-professionnels-externalisee?utm_source=google&utm_medium=cpc&utm_campaign=pro` |
| **Marque concurrente** (test, 5 €/jour) | supervan, alternative supervan | `/commander?utm_campaign=concurrent` |

Ciblage : Île-de-France, « présence », français. Enchères : CPC optimisé 3 semaines puis « Maximiser les conversions ».

### 1.2 Annonces responsives — Particuliers (à coller tel quel)
Titres (30 caractères max) :
1. Camion + chauffeur dès 48 € TTC *(remplacer par le prix d'appel NAMY du moment)*
2. Prix affiché avant paiement
3. Livraison en Île-de-France
4. Commandez en quelques clics
5. Livraison le jour même avant 12h
6. Canapé, frigo, cartons, plantes
7. Chauffeur dédié, aide au portage
8. 4 tailles de camion, 3 à 20 m³
9. Sans compte, sans engagement
10. Paiement sécurisé Stripe
11. Exploitation joignable 24h/24
12. Suivi de votre livraison

Descriptions (90 caractères max) :
1. Entrez vos deux adresses, choisissez la taille du camion, payez en ligne : c'est réservé.
2. Chauffeur qui aide au chargement, 20 km et 30 min sur place inclus. Options porte, étage, équipier.
3. Livraison 7j/7 en Île-de-France, le jour même si vous commandez avant 12h. Annulation gratuite 24 h avant.
4. Transporteur en Île-de-France depuis 2016. Prix calculé par notre exploitation, suivi par e-mail.

Extensions : appel 07 67 16 60 15 · liens annexes Commander (`/commander`), Tarifs (`/#camions`), Professionnels (`/#professionnels`), Suivi (`/suivi`) · accroches « Sans engagement », « Jour même avant 12h », « Depuis 2016 », « Paiement sécurisé » · extraits de site « Services : livraison à la demande, livraison externalisée, transport dédié ».

### 1.3 Annonces responsives — Professionnels
Titres : Externalisez vos livraisons · Dernier kilomètre Île-de-France · Transporteur pour enseignes · Sans engagement de volume · Preuve de livraison à chaque course · Suivi temps réel dans NAMY · Devis sous 24 h · Pics de saison absorbés · Retours et reprises intégrés · Tournées dédiées.
Descriptions : « Magasins, e-commerçants, entrepôts : nous livrons vos clients, du retrait au domicile. Devis sous 24 h. » · « Chaque course est planifiée, suivie et prouvée dans NAMY, notre plateforme de transport. » · « Aucune durée minimale, aucun volume imposé : testez sur un magasin ou une saison. »

### 1.4 Mots-clés négatifs dès le jour 1
Liste de `docs/google-ads.md` § 3 (emploi, location sans chauffeur, Colissimo/Chronopost, Uber/Stuart…).

### 1.5 Mesure
- Conversion principale : page `/commander/merci` d'une **commande payée** (événement `conversion` déjà câblé dans `Conversion.tsx`, valeur = montant TTC). À créer dans Google Ads → Objectifs → Conversions → Site web → « Commande payée », puis reporter `NEXT_PUBLIC_GTAG_ID` (AW-…) et `NEXT_PUBLIC_GTAG_CONVERSION_LABEL` sur Vercel (Production) et redéployer.
- Conversion secondaire (optimisation, pas de valeur) : « Prix affiché » = événement `prix_confirme` de `src/lib/analytics.ts` (à déclarer comme conversion secondaire dans Google Ads : Objectifs → Conversions → Événement personnalisé `prix_confirme`).
- Conversions améliorées : activées (`allow_enhanced_conversions`), e-mail haché envoyé à la conversion — à cocher dans l'objectif Google Ads.

---

## 2. Facebook / Instagram — vidéo « le frigo Leboncoin »

### 2.1 Pourquoi cette histoire
Le moment de douleur est précis et universel : on vient d'acheter un objet lourd d'occasion, le vendeur veut qu'on l'enlève vite, personne n'a de camion. L'annonce ne vend pas « du transport », elle vend **la fin du problème en 30 secondes**.

### 2.2 Script — 30 secondes, format vertical 9:16 (Reels, Stories, feed)
Tournage téléphone suffisant ; sous-titres incrustés (80 % des vues sont sans son) ; logo dès la première seconde.

| Temps | Image | Texte à l'écran | Voix / son |
|---|---|---|---|
| 0-3 s | Écran de téléphone : annonce Leboncoin d'un frigo, bouton « Acheter », puis message du vendeur « À récupérer avant samedi » | **Acheté. Et maintenant ?** | bruit de notification |
| 3-7 s | Le même frigo vu de face dans une cuisine, la personne mesure la porte, regarde sa petite voiture par la fenêtre | « Pas de camion. Pas de bras. » | musique légère, rythme rapide |
| 7-14 s | Écran du site wanymsolution.com : deux adresses tapées, le prix apparaît ; clic sur la taille « 2 m² » ; option « remise à la porte » | **Votre prix en 30 secondes** · « 2 adresses, 1 taille, c'est réservé » | voix off : « Sur WANYM, vous entrez vos deux adresses, vous choisissez la taille du camion, le prix s'affiche. » |
| 14-18 s | Paiement par carte sur mobile, écran « Merci, votre livraison est réservée », e-mail de confirmation | « Payé. Réservé. Sans créer de compte. » | voix off : « Vous payez, c'est réservé. » |
| 18-25 s | Utilitaire blanc à bandes vertes devant l'immeuble, chauffeur et client portent le frigo, frigo posé dans la cuisine | « Chauffeur dédié · aide au portage · suivi par e-mail » | voix off : « Un chauffeur dédié vous livre, et vous aide à porter. » |
| 25-30 s | Logo WANYM sur fond bleu nuit, bouton vert « Commander une livraison », mention « dès 48 € TTC · Île-de-France · 7j/7 » | **wanymsolution.com** | voix off : « WANYM. Vous l'avez acheté, on vous le livre. » |

Variantes à tester (même montage, 3 premières secondes différentes) : canapé Ikea à monter dans un 4e sans ascenseur · machine à laver d'un parent à déménager · 15 cartons d'un studio. Le reste de la vidéo ne change pas.

### 2.3 Textes de l'annonce
- **Texte principal** : « Vous venez d'acheter un frigo, un canapé, une armoire… et pas de camion ? Entrez vos deux adresses, choisissez la taille, payez en ligne : un chauffeur dédié vous livre en Île-de-France, le jour même si vous commandez avant 12h. Prix affiché avant paiement, dès 48 € TTC. »
- **Titre** : Un camion et un chauffeur, en quelques clics
- **Description** : Prix en 30 secondes · Paiement sécurisé · Sans engagement
- **Bouton** : Commander
- **URL** : `https://www.wanymsolution.com/?utm_source=facebook&utm_medium=video&utm_campaign=frigo-leboncoin&utm_content={variante}`

### 2.4 Ciblage et diffusion
- Zone : Île-de-France (Paris + petite et grande couronne), 25-55 ans.
- Intérêts (phase 1, large) : Leboncoin, Ikea, Leroy Merlin, Vinted, déménagement, bricolage, décoration. Après 50 clics convertis : audiences similaires des visiteurs de `/commander`.
- Placements : Reels + Stories + feed Instagram et Facebook, automatique.
- Objectif de campagne : **Trafic** la première semaine (mesure le coût du clic), puis **Ventes** sur l'événement `prix_confirme` ou `paiement_debut` dès que le pixel les reçoit (§ 5).
- Budget d'apprentissage : 15 à 20 €/jour pendant 2 semaines, une seule campagne, 3 variantes vidéo.

### 2.5 Ce qui fait la différence à l'écran
Le prix. Montrer le vrai écran du site avec le montant qui apparaît, pas une animation. Et le portage : le chauffeur qui aide est la promesse que Leboncoin ne tient pas.

---

## 3. LinkedIn — démo pour les professionnels du retail

### 3.1 Cible
Responsables logistique, directeurs de magasin, responsables e-commerce et supply chain d'enseignes retail (ameublement, jardinerie, électroménager, bricolage), entrepôts et e-commerçants en Île-de-France. 50 à 5 000 salariés. Fonctions : opérations, logistique, direction de magasin, e-commerce.

### 3.2 Script — 60 à 75 secondes, format 1:1 ou 16:9, enregistrement d'écran + voix
| Temps | Image | Message |
|---|---|---|
| 0-5 s | Carte d'un magasin et de ses livraisons du jour, pins verts | « Vos clients achètent en magasin. Qui livre ? À quel coût ? Avec quelle preuve ? » |
| 5-20 s | Écran NAMY : formulaire vendeur, une commande saisie en magasin (adresses, créneau, options), prix calculé | « Avec WANYM, votre vendeur saisit la livraison en caisse : créneau, options, prix de votre grille. Fini les appels au transporteur. » |
| 20-35 s | Écran NAMY dispatch : tournées planifiées, chauffeurs, carte en temps réel | « Notre exploitation planifie, nos chauffeurs livrent. Vous suivez chaque course en temps réel. » |
| 35-50 s | Tracking client : créneau, suivi, tchat destinataire, photo de preuve de livraison | « Votre client reçoit un suivi, un tchat, une photo de preuve. En cas de litige, tout est dans le dossier. » |
| 50-62 s | Dashboard magasin : taux de respect des créneaux, avis clients (NPS), livraisons par catégorie | « Vous mesurez la qualité : créneaux tenus, satisfaction, volumes. Sans engagement de durée ni de volume. » |
| 62-72 s | Logo WANYM + NAMY, texte « Livraison externalisée en Île-de-France · devis sous 24 h » | « WANYM SOLUTION : vous vendez, nous livrons, NAMY prouve. Parlons de vos flux. » |

Captures à utiliser : formulaire vendeur, dispatch, tracking destinataire, dashboard magasin de NAMY (données de démo, jamais un vrai client sans accord). Mettre le prénom du chauffeur jamais à l'écran (règle NAMY d'anti-désintermédiation).

### 3.3 Textes
- **Introduction** : « Enseignes retail en Île-de-France : externalisez votre dernier kilomètre sans perdre la main. Vos vendeurs saisissent la livraison en magasin, nos chauffeurs livrent, et vous suivez chaque course dans NAMY : temps réel, preuve de livraison, tchat client, qualité mesurée. Sans engagement de volume. »
- **Titre** : Livraison externalisée, pilotée dans NAMY
- **Bouton** : En savoir plus → `https://www.wanymsolution.com/services/livraison-professionnels-externalisee?utm_source=linkedin&utm_medium=video&utm_campaign=retail-externalisation`
- Format alternatif à tester : **Lead Gen Form** LinkedIn (formulaire pré-rempli, champ « volume mensuel de livraisons »), les leads arrivent par e-mail à l'exploitation.

### 3.4 Diffusion
- Objectif : Génération de leads (ou Trafic si Lead Gen Form absent).
- Budget : 20 à 30 €/jour, 3 semaines, puis reciblage des visiteurs de la page pro avec un carrousel « 3 preuves » (créneau tenu, photo de preuve, tchat).
- Plan de suivi : chaque lead reçoit un appel sous 24 h, un devis sous 24 h (c'est la promesse de la page).

---

## 4. Conventions UTM et lecture des résultats

| Paramètre | Valeur |
|---|---|
| `utm_source` | `google`, `facebook`, `instagram`, `linkedin` |
| `utm_medium` | `cpc` (Search), `video`, `retargeting` |
| `utm_campaign` | `particuliers`, `pro`, `concurrent`, `frigo-leboncoin`, `retail-externalisation` |
| `utm_content` | variante créative ou groupe d'annonces |

Les commandes se lisent avec `GET /api/orders?since=…` (champs `source`, `utm`, `gclid`) : coût par commande = dépense de la campagne ÷ commandes portant son `utm_campaign`. Les événements de parcours (`commander_vue`, `camion_selectionne`, `prix_confirme`, `paiement_debut`, `devis_envoye`) sont dans `src/lib/analytics.ts`.

---

## 5. Prérequis techniques avant le premier euro

| # | Quoi | Où | État |
|---|---|---|---|
| 1 | Stripe live : méthode de paiement « Cartes » activée pour l'EUR | Dashboard Stripe → Paramètres → Moyens de paiement (mode production) | **à faire** (bloque toute commande payée) |
| 2 | Premier paiement réel de bout en bout (48 €, puis remboursement) | site + NAMY | après 1 |
| 3 | `NEXT_PUBLIC_GTAG_ID` + `NEXT_PUBLIC_GTAG_CONVERSION_LABEL` | Google Ads → Conversions, puis Vercel Production | à faire |
| 4 | Pixel Meta + API Conversions, LinkedIn Insight Tag | code du site (`src/components/`) | **pas encore implémenté** |
| 5 | Bandeau de consentement (cookies publicitaires) | code du site | **pas encore implémenté** — obligatoire (CNIL) dès qu'un pixel Meta ou LinkedIn est posé ; Google Consent Mode v2 à activer en même temps |
| 6 | Domaine d'envoi Resend vérifié (DNS OVH) | Resend + OVH | à vérifier |
| 7 | Vidéos : tournage Facebook (téléphone, 1 demi-journée), enregistrement d'écran NAMY pour LinkedIn | — | à produire |

Ordre conseillé : 1 → 2 → 3 (Google Ads peut démarrer sans pixel Meta) → 5 + 4 (une PR : consentement + pixels + Consent Mode) → 7 → Facebook et LinkedIn.
