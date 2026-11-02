# Modèle de facturation WANYM — analyse et cible

> Objet : comparer la **mécanique** de facturation de Supervan et de WANYM (pas les niveaux de prix, qui seront réglés plus tard dans la grille NAMY), puis fixer le modèle cible : le plus rentable à conversion égale ou meilleure. Relevé Supervan du 02/11/2026 : `docs/benchmark-supervan.md`. Écrit le 02/11/2026.

## 1. Ce que chaque système fait payer

Un transport coûte à WANYM du **temps de chauffeur** (route + attente + manutention), du **temps d'un second homme** quand il y en a un, des **kilomètres**, et du **risque** (casse, annulation tardive, échec). Un bon modèle fait payer chacun de ces postes à celui qui le déclenche, sans que le client le ressente comme une embuscade.

| Poste de coût | Supervan | WANYM aujourd'hui | Lecture |
|---|---|---|---|
| **Taille du véhicule** | 4 volumes (6 / 9 / 12 / 20 m³), prix absolu dépendant du volume et de la distance | 4 surfaces au sol (1 / 2 / 4 / 8 m²), forfait par taille | Équivalent. Le m² est plus parlant qu'un m³ pour un particulier, à garder. |
| **Distance** | pas de km inclus : base + ≈ 1,85 €/km + composante temps de trajet, calculée sur l'heure de départ | 20 km inclus puis €/km | Notre forfait est plus lisible. Supervan facture aussi le **temps de route** (un trajet lent coûte plus cher) : c'est juste économiquement, mais illisible pour le client. |
| **Manutention par le chauffeur** | **payante** : « Transport uniquement » par défaut, « Aide du chauffeur » +15 € (objets ≤ 30 kg et ≤ 1,5 m) | **incluse** sans le dire, sans limite d'objets ni de poids | Nous offrons ce que Supervan vend, et nous ne le valorisons même pas sur la carte. |
| **Temps sur place** (chargement + déchargement) | **20 min cumulées incluses**, packs prépayés 40 min / 1 h / 2 h (+10 / +20 / +50 €), non remboursables, **dépassement 1 €/min** | aucune notion de temps : attente et manutention longues sont absorbées | C'est le trou principal. Une heure de chauffeur immobilisé n'est facturée nulle part chez nous. |
| **Second homme** | +30 € (« chauffeur + 1 aide », max 90 kg par objet) | équipier +30 € HT (+36 TTC) | Équivalent. Supervan ajoute une **règle d'obligation implicite** : au-delà de 30 kg par objet, l'aide seule ne suffit pas. Nous laissons le client sous-déclarer. |
| **Accès** (étage, ascenseur, porte) | rien : pas de question, le temps sur place absorbe tout | remise au trottoir incluse, « à la porte » +15 € HT par bout, 3 étages compris, +10 €/étage sans ascenseur au-delà | Notre approche est plus protectrice (c'est à l'étage que naissent les litiges) mais elle **cumule** avec une manutention illimitée : porter au 3e étage un canapé est facturé 15 €, quel que soit le temps passé. |
| **Horaire** | heure précise ± 15 min ; **nuit 21 h–6 h ≈ × 2,5** ; **dimanche et fériés +50 %** ; « au plus vite » **+9 €** | créneaux de 4 h, pas de majoration horaire ni calendaire | Nous vendons au même prix une course à 7 h du matin un dimanche et une course un mardi à 14 h. |
| **Étape supplémentaire** | tarifée comme une seconde course | non proposée | Manque à gagner et perte de conversion sur les trajets à deux arrêts. |
| **Risque casse** | assurance ad valorem optionnelle, +19 à +199 €, responsabilité légale 33 €/kg rappelée | rien | Revenu additionnel et cadre juridique clair. |
| **Annulation** | 50 % si < 6 h ouvrées, 100 % si chauffeur en route, **écrit dans le formulaire** | échec de retrait 50 % dans la grille ; conditions d'annulation non affichées au client | Une règle non affichée est inapplicable commercialement. |
| **Encaissement** | Stripe à la commande, TTC dominant, HT en petit | identique | — |
| **Dépassements** | prévus (1 €/min) et acceptés aux CGU | aucune voie pour facturer un supplément après la course | Sans moyen de paiement conservé, tout dépassement est perdu. |

Résumé : Supervan vend **du temps** (celui du chauffeur, celui du second homme, celui du créneau) et fait payer **le risque** (annulation, casse, dépassement). WANYM vend **un forfait au m²** et offre le reste. Notre modèle convertit bien parce qu'il est simple, mais il laisse trois postes à découvert : le temps sur place, les horaires pénibles, les dépassements.

## 2. Modèle cible WANYM

Principe : **un forfait généreux et lisible**, qui inclut ce que le client attend (chauffeur qui aide, 20 km, un temps sur place raisonnable, le trottoir), et **des suppléments qui ne se déclenchent que quand le coût existe vraiment**. Pas de « transport uniquement » : l'aide du chauffeur incluse est notre différence face à Supervan, on l'écrit sur la carte au lieu de la cacher.

### 2.1 Le forfait (par taille, inchangé dans sa forme)

Inclus et **affiché** sur la carte : chauffeur **qui aide au chargement et au déchargement**, 20 km, remise au trottoir ou en pied d'immeuble, **30 minutes cumulées sur place** (retrait + livraison). Au-delà de 20 km : €/km comme aujourd'hui.

Pourquoi 30 min et pas 20 comme Supervan : nous incluons la manutention du chauffeur ; 30 min couvre un lave-linge et six cartons sans discussion, et place le dépassement là où il coûte vraiment (déménagements déguisés, attente au pied de l'immeuble).

### 2.2 Le temps sur place

| Mécanique | Règle proposée |
|---|---|
| Inclus | 30 min cumulées |
| Packs prépayés à la commande | +30 min, +1 h, +2 h (prix à fixer, dégressifs comme Supervan : le pack doit être **moins cher** que le dépassement) |
| Dépassement constaté | facturé **par tranche de 15 min entamée** au tarif « dépassement », plus élevé que le pack, après la course |
| Preuve | horodatages terrain NAMY (arrivée géofence, validation des étapes) : la durée sur place est **mesurée**, pas déclarée |
| Attente au retrait | au-delà de 15 min sans personne : échec de retrait facturé 50 % (règle existante), ou attente décomptée du temps inclus si le client prévient |

C'est le poste qui rapporte le plus à coût de conversion nul : le client qui n'a besoin que de 30 min ne voit rien ; celui qui mobilise le chauffeur une heure paie, et il le sait avant.

### 2.3 Portage et équipier

- **Au trottoir** : inclus.
- **Jusqu'à la porte** : option par bout, 3 étages ou ascenseur compris (comme aujourd'hui). Elle **consomme le temps inclus** : la mention « compté dans vos 30 min » suffit à décourager le canapé au 5e sans équipier.
- **Étage sans ascenseur au-delà du 3e** : +X par étage (existant).
- **Équipier** : option (existant). **Règle d'obligation** : dès qu'un objet déclaré dépasse 30 kg ou 1,5 m, l'équipier est **imposé** ou le client doit cocher « je serai là pour aider au port ». L'assistant de taille connaît déjà le poids de chaque objet : le formulaire peut l'appliquer sans question supplémentaire. Protège le chauffeur, évite l'échec sur place, et vend l'équipier là où il est nécessaire.

### 2.4 Horaires et calendrier

| Cas | Règle |
|---|---|
| Semaine 7 h–20 h, samedi | tarif de base |
| **Nuit** (21 h–6 h) | majoration forte, en % (NAMY : règle de majoration de créneau) |
| **Dimanche et fériés** | +50 % |
| **Express** (jour même, « au plus vite ») | forfait fixe ou % (NAMY : règle Express de Tarification dynamique) |
| Créneau | on garde le créneau de 4 h (c'est lui que l'exploitation tient) ; une option « créneau de 2 h » payante est possible plus tard via la règle grille « créneau affiné » déjà en place chez NAMY |

Affichage : badge **+50 %** sur la pastille du dimanche et « nuit » sur les créneaux concernés, comme Supervan. Le client choisit en connaissance de cause, la conversion n'en souffre pas : il compare avec un tarif de base inchangé.

### 2.5 Étapes, annulation, casse

- **Étape supplémentaire** : option « arrêt intermédiaire » = forfait + km réels (pas une seconde course). À prévoir dans une seconde phase : NAMY tarifie une course à deux points.
- **Annulation** : gratuite jusqu'à **24 h** avant le créneau, **50 %** ensuite, **100 %** une fois le chauffeur parti ou en cas d'échec de retrait. Les deux niveaux existent déjà dans NAMY (`delai_annulation_gratuite_heures` + barème). À **écrire dans le formulaire** avant le bouton payer, et dans le mail de confirmation.
- **Assurance ad valorem** : option à prix fixe par palier, quand un contrat assureur sera signé. Le formulaire prévoit la place ; rien n'est vendu avant.

### 2.6 Encaisser les suppléments

Le modèle ne vaut que si le dépassement, l'étage découvert sur place ou le second passage peuvent être **réellement facturés**. Deux voies, par ordre de préférence :

1. **Empreinte conservée** : Stripe Checkout avec `setup_future_usage: off_session` ; les CGV autorisent le débit des suppléments constatés (temps sur place mesuré, étage non déclaré, échec de retrait). Le client reçoit le détail par e-mail avant le débit, l'exploitation valide depuis NAMY (correction de prix → le site débite la différence).
2. **Facture complémentaire** Stripe Invoicing (déjà câblée, `POST /api/orders/[id]/invoice`) quand l'empreinte a échoué.

## 3. Pourquoi ce modèle convertit au moins aussi bien

- Le **prix d'appel ne bouge pas** et devient plus riche : « chauffeur qui aide, 20 km et 30 min sur place inclus » face à un « transport uniquement » chez Supervan.
- Les suppléments sont **conditionnels et expliqués** (nuit, dimanche, dépassement) : un client de semaine à 14 h ne voit aucune ligne de plus.
- Les règles d'obligation (équipier au-delà de 30 kg) sont **déduites de l'assistant**, pas demandées : moins de champs, pas plus.
- Les conditions d'annulation affichées **rassurent** plus qu'elles ne freinent : c'est l'absence de règle qui inquiète.

## 4. Câblage, par lot

| Lot | Où | Contenu |
|---|---|---|
| **A. Temps sur place** | NAMY (catalogue d'options de la grille « SITE WANYM ») + site | options exclusives `temps_30`, `temps_60`, `temps_120` ; libellé inclus sur la carte ; bloc « Temps sur place » dans le formulaire avec « 30 min incluses » ; `orders.options.temps_pack` ; dépassement = correction de prix NAMY → débit du supplément (lot D) |
| **B. Horaires** | NAMY (règles de majoration de créneau et Express, déjà supportées) + site | badges sur les pastilles de date et les créneaux ; la ligne de majoration apparaît déjà dans le détail du prix |
| **C. Équipier obligatoire** | site | règle `objet > 30 kg ou > 150 cm ⇒ équipier requis ou aide client confirmée`, nourrie par le catalogue de l'assistant ; mention sur l'option |
| **D. Suppléments encaissables** | site (Stripe) | `setup_future_usage`, endpoint de débit complémentaire sur correction de prix NAMY, e-mail de détail ; repli facture |
| **E. Annulation affichée** | NAMY (paramètres du client « Site web » : 24 h, 50 %) + site | bloc conditions avant le paiement, reprise dans le mail de confirmation et les CGV |
| **F. Plus tard** | NAMY | étape intermédiaire, assurance ad valorem, créneau de 2 h payant |

Les montants (packs, dépassement, nuit, dimanche, express) se règlent dans NAMY sans redéploiement du site ; les lots A à E sont du câblage, pas des prix.

## 5. Décisions attendues

1. Temps inclus : **30 min** cumulées (ou 20 comme Supervan).
2. Dépassement : facturé **après la course** sur empreinte bancaire (lot D), ou uniquement par packs prépayés.
3. Équipier obligatoire au-delà de **30 kg / 1,5 m** par objet : oui / non.
4. Annulation : **gratuite > 24 h, 50 % < 24 h, 100 % chauffeur parti** (ou 6 h ouvrées comme Supervan).
5. Nuit et dimanche : activer les majorations (montants à fixer plus tard).

## 6. Journal de câblage (02/11/2026)

Décisions : 30 min incluses · dépassement sur empreinte · équipier recommandé (le client peut porter) · annulation 24 h / 50 % / 100 % · majorations nuit et dimanche activées.

| Lot | Fait |
|---|---|
| A | NAMY : options `temps_30` (10 € HT) / `temps_60` (20) / `temps_120` (45) sur la grille « SITE WANYM », **prix provisoires**. Site : bloc « Temps sur place » (30 min incluses + packs exclusifs), liste « inclus » sur les cartes, textes `order.temps_*`. |
| B | NAMY : dimanche ouvert (08-12, 14-18) et soirée 18-21 h (lun → sam) avec règles +50 % ciblées sur le compte site (**pourcentages provisoires**, Tarification dynamique) ; `contexte` expose `majorations`. Site : badge sur la date et libellé sur les créneaux ; la ligne de majoration figure déjà dans le détail du prix. Nuit profonde (après 21 h) non ouverte : à décider avec l'exploitation. |
| C | Site : recommandation d'équipier dès qu'un objet déclaré dépasse 30 kg ou 1,50 m, case « je porterai avec le chauffeur » (`aide_client`, transmis à NAMY dans les notes). |
| D | Site : Checkout avec `setup_future_usage: off_session` ; `POST /api/orders/[id]/charge` et événement NAMY `expedition.supplement` → débit hors session, repli facture Stripe, journal public, e-mail client (`src/lib/supplements.ts`). Reste côté NAMY : émettre l'événement depuis la correction de prix (aujourd'hui l'exploitation appelle l'API du site). |
| E | NAMY : `annulation_client_autorisee`, gratuite 24 h, 50 % ensuite jusqu'au retrait. Site : bloc « Annulation / Après la course » avant le paiement, CGV § 3, 3 bis et 5 réécrits. |
