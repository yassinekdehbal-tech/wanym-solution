# WANYM SOLUTION — cahier des charges par page pour la direction artistique

Document destiné à l'équipe DA (ou à un assistant de création). Il fixe **ce qui ne bouge pas** (contenu, parcours, données, contraintes) et laisse **libre tout le reste** (univers visuel, typographie, couleurs, illustrations, animations). Quand une chose est imposée, elle est marquée **[fixe]** ; quand elle est ouverte, **[libre]**.

---

## 0. L'entreprise et le ton

- **WANYM SOLUTION**, commissionnaire de transport, Drancy (93), Île-de-France, depuis 2016 (ex FISSA LIV). Exploitation joignable 24h/24 : 07 67 16 60 15. 125 rue Diderot, 93700 Drancy. Domaine : wanymsolution.com (sans tiret).
- **Deux clientèles** : les particuliers et petits pros qui ont besoin d'un transport **tout de suite** (un canapé acheté sur Leboncoin, un frigo, un déménagement de studio), et les entreprises qui veulent **externaliser leurs livraisons** (dernier kilomètre, tournées, B2B).
- **Promesse** : « Un camion et un chauffeur, au prix annoncé, quand vous en avez besoin. » Sans engagement, prix ferme avant de payer, suivi en temps réel.
- **Ton** : direct, concret, rassurant. On parle de camions, de mètres carrés, d'heures et d'euros. Pas de jargon logistique, pas de superlatifs. Vouvoiement.
- **Concurrent de référence** : Supervan (livraison en camionnette à la demande). On doit être aussi simple à comprendre en 5 secondes, et plus humain (une vraie équipe à Drancy, 24h/24).
- **Public majoritairement mobile** (trafic Google Ads) : tout se conçoit d'abord en 390 px de large.

## 1. Contraintes transverses [fixe]

| Sujet | Règle |
|---|---|
| Mobile first | Chaque page doit être parfaite à 390 px avant le desktop. Lighthouse mobile ≥ 90 : pas de vidéo en fond, images optimisées, peu de polices. |
| Prix | Tous les prix affichés au client sont **TTC**, le HT en petit à côté. Les montants viennent du moteur de tarification NAMY : la DA ne « dessine » jamais un prix fixe dans une image. |
| Google Ads | Les mentions légales, les CGV et le contact doivent être accessibles depuis chaque page (pied de page). Pas de promesse chiffrée de délai que l'exploitation ne tiendrait pas. |
| Contenu éditable | Tous les textes des pages vitrine sont modifiables sans redéploiement. La DA fournit des gabarits qui supportent des textes plus longs ou plus courts que la maquette. |
| Accessibilité | Contrastes AA, champs avec libellés visibles, erreurs en texte (pas seulement en couleur), boutons de 44 px minimum. |
| Langue | Français uniquement. |
| Ce qui existe déjà | Le site est en ligne et fonctionnel (Next.js). La DA peut tout redessiner, mais les **écrans, les champs et l'ordre des étapes** décrits ci-dessous sont fixés par le fonctionnement. |

## 2. Identité visuelle [libre, avec des points d'appui]

- Couleur dominante actuelle : bleu nuit (#0b1f3a) et un accent vert/turquoise. **Libre de changer**, en gardant une couleur « action » très lisible pour les boutons de paiement.
- Il faut une **famille d'icônes de camions à quatre tailles** (Kangoo 3 m³, Jumpy 6 m³, Master 12 m³, 20 m³) reconnaissables en 64 px de haut, de face ou de trois quarts, déclinables en « sélectionné / non sélectionné ». C'est l'élément le plus important du site.
- Il faut une **représentation du mètre carré au sol** (ce qui tient dans 1 m², 2 m², 4 m², 8 m²) : pictos d'objets (frigo, lave-linge, canapé, cartons, matelas, vélo, meuble démonté…). Voir §5.
- Photos : vraies camionnettes blanches, vrais chauffeurs si possible, Île-de-France reconnaissable. Pas de banque d'images trop lisse.
- Logo : WANYM SOLUTION existe en texte ; une version pictographique est bienvenue (camion + flèche, ou initiale W).

---

## 3. Page d'accueil `/`

**Rôle** : convertir en moins d'une minute un visiteur qui arrive d'une publicité « livraison camionnette paris », tout en rassurant une entreprise.

**Structure [fixe], mise en forme [libre]** :

1. **Hero** avec le widget « Départ → Arrivée » : deux champs d'adresse et un bouton « Voir le prix ». C'est l'action principale du site ; il doit être visible sans scroller sur mobile. Titre et sous-titre éditables (actuels : « Un camion et un chauffeur, quand vous en avez besoin »).
2. **Bandeau de réassurance** : 4 à 6 preuves courtes (prix ferme avant paiement · 24h/24 · depuis 2016 · suivi en temps réel · sans engagement · paiement sécurisé). Éditable.
3. **« Combien de place vous faut-il ? »** : les 4 tailles de camion avec « dès X € TTC » (prix réels venus de NAMY, affichés dynamiquement). Chaque carte renvoie vers le formulaire avec la taille présélectionnée. C'est la section signature du site.
4. **Comment ça marche** en 3 temps : je choisis (adresses, taille, créneau) → je paie le prix annoncé → un chauffeur WANYM livre et je suis en direct.
5. **Services** (3 cartes, contenu depuis la base) : livraison express à la demande · externalisation des livraisons pour les pros · transport dédié sur mesure.
6. **Pour les professionnels** : bloc spécifique B2B (tournées, dernier kilomètre, facturation mensuelle, interlocuteur dédié), CTA « Parler à l'exploitation ».
7. **Références / avis** : logos clients ou verbatims (contenu à fournir, prévoir le gabarit).
8. **FAQ** courte (contenu éditable, déjà écrit).
9. **CTA final** : rappel du widget départ → arrivée.

**États** : le widget doit accepter des adresses incomplètes (il pré-remplit le formulaire, la validation se fait après).

## 4. Pages services `/services` et `/services/[slug]`

**Rôle** : crédibilité B2B et référencement. Contenu 100 % éditable (titre, résumé, corps en markdown, icône).

- `/services` : liste des services en cartes, un paragraphe d'introduction, CTA vers `/commander` ou `/contact` selon le service (certains sont « sur devis »).
- `/services/[slug]` : une page longue par service, gabarit unique : titre, accroche, corps libre (listes, sous-titres), encadré « ce qui est compris », CTA contextuel. Prévoir le gabarit pour un corps de 300 à 1 500 mots.

## 5. Commander `/commander` — la page qui fait vivre le site

**Rôle** : obtenir un prix ferme et le paiement en quelques gestes. Page **unique qui se déplie** : chaque bloc apparaît quand le précédent est rempli. Pas d'étapes numérotées sur des écrans séparés.

**Les blocs, dans cet ordre [fixe]** :

1. **Trajet** : adresse de départ, adresse d'arrivée (auto-complétion). Pré-remplies depuis l'accueil. Une fois les deux saisies, la distance s'affiche (« 15,8 km · 20 km inclus »).
2. **Quelle place vous faut-il ?** Quatre cartes carrées, une par taille : icône du camion de plus en plus long, le **m² en gros**, le modèle et les m³ en légende, « dès X € TTC ». Une seule sélection.
   - **Aide au choix [nouveau, à concevoir]** : sous les cartes, un lien « Je ne sais pas quelle taille choisir » ouvre un assistant léger : l'utilisateur coche ce qu'il transporte dans une liste illustrée (frigo, lave-linge, canapé 2 places, canapé 3 places, matelas, lit démonté, table, chaise, carton standard, vélo, armoire démontée, TV, électroménager petit…), avec une quantité. Chaque objet a une emprise au sol ; l'assistant **propose** une taille (« 2 m² devrait suffire ») que l'utilisateur confirme ou change. L'assistant ne bloque jamais : on peut toujours choisir une carte directement.
   - **Inversement, sur chaque carte**, une ligne « par exemple : un frigo + un lave-linge + 3 cartons » rend le m² concret sans ouvrir l'assistant. Les deux lectures coexistent : la carte dit ce qui rentre, l'assistant calcule.
   - Repères d'emprise au sol à utiliser (approximatifs, à affiner par l'exploitation) : carton standard 0,15 m² · lave-linge 0,36 m² · frigo 0,4 m² · canapé 2 places 0,8 m² · canapé 3 places 1,2 m² · matelas (debout) 0,3 m² · table 4 personnes 1 m² · chaise 0,2 m² · vélo 0,3 m² · armoire démontée 0,6 m² · TV 0,15 m². Le gerbage est pris en compte par un coefficient (on ne somme pas bêtement).
3. **Comment on vous livre** : pour le départ et pour l'arrivée, un choix à deux boutons **« Au trottoir » (inclus) / « À la porte » (+15 € TTC)**. Si « À la porte » : champ étage + case ascenseur, avec la règle affichée (« 3 étages compris, +10 € TTC par étage à partir du 4e sans ascenseur »). Puis une case « Équipier de manutention (+36 € TTC) ». Puis « Que transportons-nous ? » (texte libre, obligatoire) et « Précisions » (facultatif).
4. **Quand ?** Date (jamais un jour fermé par défaut) et créneau (liste venue de NAMY, par exemple 8h-12h, 13h-17h, 8h-18h).
5. **Vos coordonnées** : nom, société (facultatif), e-mail, téléphone. Bloc repliable « quelqu'un d'autre sur place ? » pour les contacts au départ et à l'arrivée.
6. **Votre prix** : le total TTC en très gros, le HT dessous, le détail ligne par ligne (forfait du camion avec les km inclus, km supplémentaires, options, TVA), la case CGV, le bouton **« Payer X € et réserver »**. Sur mobile, le total reste collé en bas de l'écran pendant tout le remplissage.

**Comportements à prévoir dans la DA** :
- Le prix se recalcule à chaque changement (petit état « mise à jour… »).
- Cas « sur devis » : la même page affiche « Sur devis » à la place du prix, avec une phrase explicative et le bouton « Envoyer ma demande ». Il faut que ce soit aussi soigné que le cas payant.
- Erreurs sous les champs, en texte, et retour automatique au champ fautif.
- Paiement : redirection vers une page Stripe (on ne la dessine pas), puis retour sur `/commander/merci`.

## 6. Merci `/commander/merci`

**Rôle** : confirmer et rassurer, puis orienter vers le suivi.

- Référence de commande en gros (format WS-2026-00012), message « votre commande est transmise à notre exploitation », rappel : e-mail de confirmation, rappel la veille et le jour J avec lien de suivi.
- Bouton « Suivre ma commande », bouton « Nouveau transport ».
- Variante « demande de devis reçue » (sans paiement) : « réponse sous 24h ouvrées ».

## 7. Suivi `/suivi`

**Rôle** : rassurer après l'achat sans appeler l'exploitation.

- Formulaire : référence + e-mail. Puis une **frise des étapes** : commande reçue → confirmée → planifiée → en cours de livraison → livrée (ou annulée / incident). Chaque étape horodatée. Les messages de l'exploitation apparaissent dans la frise.
- Prévoir l'état « référence inconnue » et l'état « aucune mise à jour pour l'instant ».

## 8. Contact `/contact`

- Téléphone exploitation 24h/24 très visible (bouton d'appel sur mobile), e-mail, adresse, horaires, carte ou plan stylisé de Drancy. Formulaire simple (nom, e-mail, téléphone, message) **[libre d'intégrer ou non]**.
- Bloc « Vous êtes une entreprise ? » renvoyant vers le service d'externalisation.

## 9. Mentions légales `/mentions-legales` et CGV `/cgv`

- Pages de texte long (markdown éditable). Gabarit sobre, sommaire ancré sur desktop, lisible sur mobile. Obligatoires pour Google Ads : accessibles depuis le pied de page de toutes les pages.

## 10. Éléments communs

- **En-tête** : logo, liens (Services, Pros, Suivi, Contact), bouton « Commander ». Sur mobile : logo + bouton « Commander » + menu.
- **Pied de page** : coordonnées, liens légaux, « depuis 2016 à Drancy », éventuellement les 4 camions en rappel.
- **Barre d'appel collante sur mobile** (existe déjà) : « 07 67 16 60 15 » cliquable, discrète.
- **États de chargement** : squelettes plutôt que spinners.

## 11. Livrables attendus de la DA

1. Planche d'identité : couleurs, typographies (2 maximum, chargement rapide), grille, boutons, champs, cartes, états.
2. Les 4 icônes de camion (SVG) + la série de pictos d'objets pour l'aide au choix (SVG, trait homogène).
3. Maquettes mobile puis desktop : accueil, commander (tous les blocs dépliés + variante « sur devis »), merci, suivi, service, contact.
4. Les illustrations « ce qui tient dans 1 / 2 / 4 / 8 m² ».
5. Un mode d'emploi court : où chaque texte éditable apparaît, tailles mini/maxi.

## 12. Ce que la DA n'a pas à produire

Les textes définitifs (ils existent et restent éditables), la page de paiement (Stripe), les e-mails (gabarits séparés), les prix (ils viennent de NAMY).
