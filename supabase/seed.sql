-- Seed: editable copy of wanymsolution.com (08/11/2026 — one visitor = one customer, a delivery ordered in a few clicks; three pillars: on-demand, outsourced delivery, NAMY).
-- Re-runnable: upserts on key / slug. Live values are edited through the content API (docs/API.md); keep this file in sync.

insert into public.site_content (key, value) values
  ('site.name', 'WANYM SOLUTION'),
  ('site.tagline', 'Livraison et transport en Île-de-France, commandés en quelques clics'),
  ('site.description', 'WANYM SOLUTION, transporteur à Drancy depuis 2016 : livraison à la demande au prix affiché (commande en ligne, chauffeur dédié, Île-de-France), livraison externalisée pour les enseignes et les entreprises, et NAMY, notre plateforme de gestion de transport qui suit chaque course.'),
  ('hero.title', 'Un camion et un chauffeur, au prix affiché, en quelques clics.'),
  ('hero.subtitle', 'Canapé, lave-linge, cartons, plantes, matériaux… Entrez vos deux adresses, choisissez la taille du camion, payez en ligne : votre livraison est réservée. Au départ de l''Île-de-France, pour les particuliers et les professionnels.'),
  ('hero.cta_primary', 'Commander une livraison'),
  ('hero.cta_secondary', 'Appeler l''exploitation'),
  ('hero.route_title', 'Votre prix en 30 secondes'),
  ('hero.route_from', 'Adresse de départ'),
  ('hero.route_to', 'Adresse d''arrivée'),
  ('hero.route_button', 'Voir le prix'),
  ('hero.image_alt', 'Deux livreurs WANYM SOLUTION chargent un canapé emballé dans un utilitaire'),
  ('reassurance.items', 'euro:Prix ferme:affiché avant paiement|clock:Jour même:possible avant 12h|calendar:7 jours sur 7:dimanche et soirée en option|route:Suivi:par e-mail et en ligne|handshake:Sans engagement:ni compte à créer|lock:Paiement:sécurisé par Stripe'),
  ('vehicles.title', 'Quelle place vous faut-il ?'),
  ('vehicles.lead', 'Choisissez la surface au sol, nous envoyons l''utilitaire et le chauffeur. Remise à la porte, étage, équipier et temps sur place en option : le prix se met à jour en direct.'),
  ('vehicles.inclus', 'Chauffeur qui aide au chargement|20 km inclus|30 min sur place|Remise au trottoir'),
  ('how.title', 'Commandez en quelques clics'),
  ('how.steps', '[{"t": "Vos deux adresses", "d": "Départ, arrivée : la distance est calculée aussitôt.", "icon": "route"}, {"t": "La taille du camion", "d": "Quatre utilitaires, de 1 à 8 m² au sol. Un assistant vous aide si vous hésitez.", "icon": "box"}, {"t": "Date et options", "d": "Créneau, porte ou trottoir, équipier, temps sur place : le prix se met à jour en direct.", "icon": "calendar"}, {"t": "Payé, réservé", "d": "Vous payez le prix affiché, sans créer de compte. La course part immédiatement à notre exploitation et vous recevez la confirmation par e-mail.", "icon": "lock"}]'),
  ('services.title', 'Trois façons de livrer, un même prix clair'),
  ('services.lead', 'Une livraison aujourd''hui pour un particulier, des flux réguliers pour une enseigne, une tournée dédiée : choisissez la formule, chaque course est suivie dans NAMY, notre plateforme.'),
  ('pro.title', 'Professionnels : un partenaire transport pour vos flux réguliers'),
  ('pro.body', 'Enseignes, ateliers, e-commerçants, entrepôts : WANYM SOLUTION livre vos clients et vos sites. En course ponctuelle commandée en ligne au prix affiché, ou en livraison externalisée sur devis. Chaque course est pilotée dans NAMY, notre plateforme de gestion de transport : suivi en temps réel, preuve de livraison, tchat avec le destinataire.'),
  ('pro.items', 'Course ponctuelle : prix immédiat, paiement en ligne, facture par e-mail|Flux réguliers : devis sous 24 h, sans engagement de durée ni de volume|Suivi en temps réel et preuve de livraison dans NAMY|Chauffeurs formés à la manutention|Exploitation joignable 24h/24'),
  ('about.title', 'WANYM, trois métiers, une même équipe'),
  ('about.body', 'WANYM SOLUTION, c''est l''équipe de FISSA LIV, société de transport créée en 2016 à Drancy et renommée en 2026. En dix ans, nous sommes passés de la course urgente locale à trois métiers : la livraison à la demande, dont le prix est calculé par zone et affiché en ligne ; la livraison externalisée, qui prend en charge le dernier kilomètre des enseignes et des entreprises ; et NAMY, la plateforme de gestion de transport que nous avons développée pour piloter, suivre et prouver chaque course, et que nous ouvrons aux enseignes et aux transporteurs.'),
  ('about.figures', 'Créée en 2016 · SAS au capital de 21 600 € · une équipe de 10 à 19 personnes · flotte jusqu''à 3,5 tonnes · basée à Drancy (93), aux portes de Paris.'),
  ('references.items', '[]'),
  ('group.title', 'Trois métiers, une seule exigence : la livraison tenue'),
  ('group.lead', 'Du particulier qui commande en ligne à l''enseigne qui externalise ses flux, chaque course passe par les mêmes chauffeurs et la même plateforme.'),
  ('group.items', '[{"icon": "zap", "title": "Livraison à la demande", "text": "Un camion et un chauffeur, au prix calculé par zone et affiché avant paiement. Commande en ligne en quelques clics, le jour même avant 12h en Île-de-France.", "href": "/commander", "cta": "Commander une livraison"}, {"icon": "store", "title": "Livraison externalisée", "text": "Nous prenons en charge le dernier kilomètre des enseignes, ateliers, e-commerçants et entrepôts : tournées, pics de saison, retours, preuve de livraison. Sans engagement de durée ni de volume.", "href": "/services/livraison-professionnels-externalisee", "cta": "Pour les entreprises"}, {"icon": "route", "title": "NAMY, la plateforme", "text": "Le logiciel de gestion de transport développé par WANYM : planification, suivi en temps réel, preuve de livraison, tchat avec le destinataire, qualité mesurée. Il pilote nos courses et s''ouvre aux enseignes et aux transporteurs.", "href": "https://nam-y.com", "cta": "Découvrir NAMY"}]'),
  ('faq', '[{"q": "Comment commander une livraison ?", "a": "Entrez vos adresses de départ et d''arrivée, choisissez la taille du camion, la date et le créneau, puis payez en ligne. Pas de compte à créer : la commande prend quelques minutes et part immédiatement à notre exploitation. Vous recevez une confirmation par e-mail, puis un lien de suivi."}, {"q": "Combien ça coûte ?", "a": "Le prix dépend de la taille du camion, de la distance et des options (remise à la porte, étage, équipier, temps sur place). Il s''affiche avant le paiement et ne bouge plus. Seuls les suppléments constatés sur place (temps au-delà du temps réservé, étage non déclaré, échec de retrait) sont facturés après la course, avec un détail par e-mail."}, {"q": "Qu''est-ce qui est inclus ?", "a": "Le chauffeur et son aide au chargement et au déchargement, 20 km, 30 minutes cumulées sur place et la remise au trottoir ou en pied d''immeuble. La remise à la porte, l''étage, un équipier et du temps supplémentaire sont des options que vous ajoutez en commandant."}, {"q": "Pouvez-vous livrer aujourd''hui ?", "a": "Oui, 7 jours sur 7 : commandez en ligne avant 12h pour une livraison le jour même, selon disponibilité. Pour une urgence dans l''heure, appelez l''exploitation au 07 67 16 60 15, joignable 24h/24. Le dimanche et la soirée (18h-21h) sont majorés ; la majoration est affichée avant paiement."}, {"q": "Faut-il porter avec le chauffeur ?", "a": "Le chauffeur charge et décharge avec vous. Au-delà de 30 kg ou de 1,50 m (canapé, armoire, lave-linge), nous recommandons un équipier ; sans équipier, vous vous engagez à porter l''objet avec le chauffeur."}, {"q": "Puis-je annuler ?", "a": "Gratuitement jusqu''à 24 h avant le début du créneau. Moins de 24 h avant, 50 % du prix reste dû ; chauffeur déjà en route ou absence au retrait, 100 %. Le remboursement est fait sur votre carte."}, {"q": "Quelles zones couvrez-vous ?", "a": "Toutes nos courses partent d''Île-de-France. Nous livrons l''Île-de-France au quotidien ; la France entière et l''Europe sur devis, en course dédiée."}, {"q": "Vous êtes professionnel ?", "a": "Commandez vos courses ponctuelles en ligne au prix affiché, facture par e-mail. Pour des livraisons régulières, une tournée dédiée ou l''externalisation de votre dernier kilomètre, décrivez vos besoins : devis sous 24 h, sans engagement de durée ni de volume. Vos livraisons sont pilotées dans NAMY, notre plateforme : suivi en temps réel, preuve de livraison, tchat avec vos clients."}]'),
  ('cta.final_title', 'Votre prix en 30 secondes, votre livraison en quelques clics.'),
  ('cta.final_button', 'Commander une livraison'),
  ('contact.title', 'Contactez l''exploitation'),
  ('contact.lead', 'Une question avant de commander, une urgence, une commande en cours : une personne de l''exploitation vous répond 24h/24.'),
  ('contact.phone', '07 67 16 60 15'),
  ('contact.phone_e164', '+33767166015'),
  ('contact.email', 'contact@wanymsolution.com'),
  ('contact.address', '125 rue Diderot, 93700 Drancy'),
  ('contact.hours', 'Exploitation joignable 24h/24'),
  ('order.title', 'Commander une livraison'),
  ('order.lead', 'Trajet, taille du camion, options, date : le prix s''affiche en direct et se règle en ligne, sans créer de compte. Hors barème, devis sous 24 h.'),
  ('order.namy_services', 'livraison-express-a-la-demande'),
  ('order.exemples_cartes', '{"1": "un lave-linge et 6 cartons", "2": "un canapé 2 places et 10 cartons", "4": "un canapé 3 places, une table, 6 chaises et 15 cartons", "8": "un studio complet"}'),
  ('order.temps_inclus_min', '30'),
  ('order.temps_lead', '30 minutes cumulées sont incluses (chargement + déchargement). Besoin de plus ? Réservez-les maintenant, c''est moins cher qu''un dépassement.'),
  ('order.depassement_notice', 'Au-delà du temps réservé, chaque quart d''heure entamé est facturé au tarif de dépassement des CGV, après la course, sur votre moyen de paiement.'),
  ('order.cancellation_terms', 'Gratuite jusqu''à 24 h avant le début du créneau. Moins de 24 h avant : 50 % du prix. Chauffeur déjà en route ou absence au retrait : 100 %.'),
  ('order.supplements_terms', 'Votre carte est conservée de façon sécurisée par Stripe. Seuls les suppléments constatés sont débités après la course, avec un détail par e-mail : temps sur place au-delà du temps réservé, étage non déclaré, échec de retrait.'),
  ('order.quote_notice', 'Ce transport fait l''objet d''un chiffrage personnalisé : nous vous envoyons un devis sous 24 h, sans engagement.'),
  ('order.quote_received_title', 'Demande de devis reçue'),
  ('order.quote_received_body', 'Notre exploitation chiffre votre transport et vous répond sous 24 h par e-mail, sans engagement.'),
  ('order.success_title', 'Merci, votre livraison est réservée.'),
  ('order.success_body', 'Votre commande est transmise à notre exploitation. Vous recevez un e-mail de confirmation, puis un rappel la veille et le jour de la livraison avec votre lien de suivi.'),
  ('order.cancelled_body', 'Le paiement n''a pas été finalisé. Votre commande est conservée : vous pouvez réessayer ou nous appeler pour régler autrement.'),
  ('track.title', 'Suivre ma commande'),
  ('track.lead', 'Saisissez votre numéro de commande (WS-…) et l''e-mail utilisé lors de la commande.'),
  ('legal.company', 'WANYM SOLUTION'),
  ('legal.form', 'SAS au capital de 21 600 €'),
  ('legal.siren', '823 909 304'),
  ('legal.rcs', 'RCS Bobigny 823 909 304'),
  ('legal.tva', 'FR17 823 909 304'),
  ('legal.director', 'Yassine Dehbal'),
  ('legal.host', 'Vercel Inc., 440 N Barranca Ave #4133, Covina, CA 91723, USA'),
  ('cgv.body', $md$## 1. Objet

Les présentes conditions générales de vente (CGV) régissent les prestations de transport et de commission de transport proposées par WANYM SOLUTION sur le site wanymsolution.com.

## 2. Commande

Toute commande passée sur le site vaut acceptation des présentes CGV. Pour les prestations à prix immédiat, la commande est ferme après paiement en ligne. Pour les prestations sur devis, la commande est ferme après acceptation écrite du devis par le client.

## 3. Prix et paiement

Les prix sont indiqués en euros hors taxes et toutes taxes comprises. Le prix affiché avant paiement est ferme pour la prestation décrite à la commande : taille de véhicule, trajet, options, date et créneau. Le paiement en ligne est sécurisé par Stripe et intervient à la commande. Les prestations sur devis sont facturées selon les conditions du devis accepté.

Chaque forfait comprend le chauffeur, son aide au chargement et au déchargement, les kilomètres indiqués à la commande, la remise au trottoir ou en pied d'immeuble et **30 minutes cumulées de temps sur place** (chargement et déchargement). Les livraisons du dimanche, des jours fériés et en soirée font l'objet d'une majoration affichée avant paiement.

## 3 bis. Temps sur place et suppléments

Le client peut réserver du temps sur place supplémentaire à la commande (packs de 30 minutes, 1 heure ou 2 heures), à un tarif inférieur à celui du dépassement. Au-delà du temps inclus et du temps réservé, chaque quart d'heure entamé est facturé au tarif de dépassement en vigueur, indiqué dans le formulaire de commande. Le temps sur place est mesuré par les horodatages de notre outil d'exploitation (arrivée et départ du chauffeur à chaque adresse).

Sont également facturés après la course, sur la base des constats du chauffeur : un étage ou une absence d'ascenseur non déclarés, une remise à la porte non commandée, et l'échec d'enlèvement imputable au client (absence, marchandise non prête, accès impossible), facturé 50 % du prix de la course.

**Moyen de paiement conservé.** En validant la commande, le client autorise WANYM SOLUTION à conserver son moyen de paiement de façon sécurisée chez Stripe et à y débiter les suppléments ci-dessus, dans la limite de 2 000 € par commande. Chaque débit est précédé ou accompagné d'un e-mail détaillant la nature et le montant du supplément. En cas d'échec du débit, une facture payable en ligne est adressée au client.

Un objet de plus de 30 kg ou de plus de 1,50 m déclaré sans équipier doit être porté avec l'aide du client ; à défaut, le chauffeur peut refuser le chargement de cet objet sans que la course soit remboursée.

## 4. Exécution

WANYM SOLUTION s'engage à exécuter le transport dans le créneau convenu. Les délais sont donnés à titre indicatif et peuvent être affectés par les conditions de circulation ou des événements extérieurs. Le client s'engage à fournir des adresses exactes, un interlocuteur joignable et une marchandise correctement emballée.

## 5. Annulation

L'annulation est gratuite jusqu'à 24 heures avant le début du créneau de livraison. Moins de 24 heures avant le début du créneau, 50 % du prix de la course reste dû. Lorsque le chauffeur est déjà en route ou en cas d'absence au retrait, la course est due à 100 %. Le remboursement de la part non due intervient sur le moyen de paiement d'origine. Les annulations de prestations sur devis sont régies par les conditions du devis.

## 6. Responsabilité

La responsabilité de WANYM SOLUTION est engagée dans les conditions prévues par le contrat type applicable aux transports publics routiers de marchandises (Code des transports). Les marchandises dangereuses, illicites ou de valeur non déclarée sont exclues.

## 7. Réclamations et SAV

Toute réclamation doit être adressée par e-mail dans les 3 jours suivant la livraison, avec le numéro de commande. Le suivi des réclamations est accessible depuis la page « Suivre ma commande ».

## 8. Données personnelles

Les données collectées lors de la commande sont utilisées pour l'exécution de la prestation et la relation client. Voir les mentions légales pour l'exercice de vos droits.

## 9. Droit applicable

Les présentes CGV sont soumises au droit français. Tout litige relève des tribunaux compétents du ressort du siège de WANYM SOLUTION.$md$)
on conflict (key) do update set value = excluded.value;

-- Keys no page reads any more (old static-site structure)
delete from public.site_content where key in ('badges', 'included.title', 'included.items', 'pricing.title', 'pricing.lead', 'pricing.how');

insert into public.services (slug, title, summary, body, icon, sort_order, published) values
  ('livraison-express-a-la-demande', 'Livraison à la demande, prix immédiat', 'Un canapé, un lave-linge, des cartons, un colis urgent : choisissez la taille du camion, le prix s''affiche, vous payez en ligne. Un chauffeur dédié livre en Île-de-France, le jour même si vous commandez avant 12h.', $md$## Commandez en quelques clics

Vos deux adresses, la taille du camion, la date et le créneau : le prix s'affiche avant le paiement et ne bouge plus. Pas de compte à créer, pas d'abonnement, pas d'engagement. Une fois payée, la course part immédiatement à notre exploitation et vous recevez la confirmation par e-mail, puis un lien de suivi.

## Ce qui est inclus

- **Un chauffeur dédié** — votre marchandise ne partage pas le véhicule avec d'autres livraisons.
- **L'aide au chargement et au déchargement** par le chauffeur, et 30 minutes cumulées sur place.
- **20 km** au départ de l'Île-de-France ; au-delà, le kilomètre est affiché avant paiement.
- **La remise au trottoir** ou en pied d'immeuble, avec preuve de livraison.

## Les options, au prix affiché

- **Remise à la porte** au départ ou à l'arrivée, **étage** sans ascenseur.
- **Équipier** pour les objets lourds ou encombrants (recommandé au-delà de 30 kg ou 1,50 m).
- **Temps sur place** supplémentaire, réservé à l'avance : moins cher qu'un dépassement.
- **Dimanche et soirée** (18h-21h), majorés et affichés avant paiement.

## Quatre tailles d'utilitaire

De 1 à 8 m² au sol (3 à 20 m³) : un lave-linge et quelques cartons, un canapé, un salon complet ou un studio. Un assistant vous suggère la taille d'après vos objets ; vous gardez le dernier mot.

## Besoin d'un chauffeur dans l'heure ?

Appelez l'exploitation au 07 67 16 60 15, joignable 24h/24 : nous organisons la course au téléphone, au même prix.$md$, 'zap', 1, true),
  ('livraison-professionnels-externalisee', 'Livraison externalisée pour professionnels', 'Magasins, jardineries, enseignes, e-commerçants : nous livrons vos clients finaux, du retrait en magasin ou en entrepôt jusqu''au domicile. Vous vendez, nous livrons.', $md$## Pourquoi externaliser votre dernier kilomètre ?

Le dernier kilomètre est l'étape la plus coûteuse et la plus délicate de la vente : c'est le moment où votre client vous juge. Gérer une flotte en interne, recruter des livreurs, absorber les pics de saison pèse sur vos marges et votre organisation. Externaliser, c'est transformer un coût fixe en coût variable : vous ne payez que les livraisons réellement effectuées.

## Ce que nous prenons en charge

- **Livraison client final** depuis vos magasins ou entrepôts — en Île-de-France au quotidien, France et Europe sur demande.
- **Produits volumineux et encombrants** — mobilier, électroménager, végétaux, matériaux : manutention et livraison à l'étage par des équipes formées.
- **Pics d'activité** — week-ends, fêtes, soldes, saison : nous absorbons vos variations de volume sans que vous ayez à recruter.
- **Preuve de livraison et suivi** — chaque course est tracée, votre service client sait où en sont ses commandes.
- **Retours et reprises** — reprise d'ancien matériel ou retour en magasin intégrés à la tournée.

## Une course ponctuelle ? Commandez en ligne

Pour une livraison isolée, commandez directement sur le site : prix affiché avant paiement, règlement en ligne, facture par e-mail. Pour des flux réguliers, décrivez vos besoins et recevez un devis sous 24 h.

## Le « sans engagement », concrètement

Aucune durée minimale, aucun volume imposé. Vous testez sur une semaine, un magasin ou une catégorie de produits. Si le service est au niveau, vous restez. C'est à nous de le prouver à chaque tournée.$md$, 'store', 2, true),
  ('transport-dedie-sur-mesure', 'Transport dédié & sur-mesure', 'Chauffeur dédié, tournées récurrentes, marchandises volumineuses, France et Europe : nous construisons la solution logistique qui colle à votre activité.', $md$## Votre logistique, sans la flotte

Un chauffeur et un véhicule affectés à vos flux, pilotés par notre exploitation. Vous obtenez la fiabilité d'une flotte en propre — mêmes chauffeurs, mêmes horaires, connaissance de vos clients — sans en supporter les coûts fixes.

## Nos formules sur-mesure

- **Chauffeur dédié** — à la journée, à la semaine ou à l'année, sur vos plannings.
- **Tournées récurrentes** — vos livraisons régulières optimisées et assurées par les mêmes équipes.
- **Mise à disposition de véhicule avec chauffeur** — jusqu'à 3,5 t, ponctuelle ou longue durée.
- **Volumineux & manutention** — mobilier, électroménager, matériaux : livraison à l'étage, reprise, montage simple.
- **France & Europe Schengen** — courses dédiées longue distance au départ de l'Île-de-France.

## Comment ça se passe

Décrivez vos flux (volumes, zones, horaires, contraintes) : nous revenons vers vous sous 24 h avec un chiffrage clair. Pour une course isolée en Île-de-France, le plus rapide reste la commande en ligne, au prix affiché.

## Sur-mesure ne veut pas dire engagement

Même en tournée dédiée : pas de durée minimale. Votre activité est saisonnière ? La tournée l'est aussi.$md$, 'truck', 3, true)
on conflict (slug) do update set
  title = excluded.title,
  summary = excluded.summary,
  body = excluded.body,
  icon = excluded.icon,
  sort_order = excluded.sort_order,
  published = excluded.published;
