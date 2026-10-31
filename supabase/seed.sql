-- Seed: content carried over from the July 2026 static site (yassinekdehbal-tech/wanym-solution)
-- Re-runnable: upserts on key / slug.

insert into public.site_content (key, value) values
  ('site.name', 'WANYM SOLUTION'),
  ('site.tagline', 'La livraison du dernier kilomètre, en solution globale et sans engagement'),
  ('site.description', 'Externalisez vos livraisons du dernier kilomètre sans engagement : pros, express et transport dédié au départ de l''Île-de-France. Devis gratuit sous 24h.'),
  ('hero.title', 'La livraison du dernier kilomètre, en solution globale et sans engagement'),
  ('hero.subtitle', 'WANYM SOLUTION livre vos clients à votre place : livraison externalisée pour les professionnels, course express à la demande et transport dédié sur-mesure. Au départ de l''Île-de-France, vers toute la France et l''Europe.'),
  ('hero.cta_primary', 'Commander un transport'),
  ('hero.cta_secondary', 'Appeler l''exploitation'),
  ('badges', 'Sans engagement|Exploitation 24h/24|Équipe en activité depuis 2016|IDF · France · Europe'),
  ('services.title', 'Une seule solution, trois façons de livrer'),
  ('services.lead', 'Un interlocuteur unique pour tout votre dernier kilomètre : le régulier, l''urgent et le sur-mesure.'),
  ('included.title', 'Ce qui est toujours inclus'),
  ('included.items', 'Devis gratuit sous 24h, sans engagement de durée ni de volume.|Preuve de livraison sur chaque course.|Exploitation joignable 24h/24.|Chauffeurs formés à la manutention et à la relation client.'),
  ('pricing.title', 'Des tarifs au réel, sans engagement'),
  ('pricing.lead', 'Pas de forfait opaque, pas de durée minimale : vous payez les livraisons effectuées, au prix annoncé avant le départ.'),
  ('pricing.how', 'Votre tarif dépend de quatre facteurs simples : la zone (IDF, France, Europe), le format (du pli à la palette, volumineux ou non), la fréquence (course ponctuelle, tournée récurrente, chauffeur dédié) et le niveau de service (créneaux, étage, reprise…).'),
  ('about.title', 'WANYM SOLUTION — dix ans de dernier kilomètre'),
  ('about.body', 'WANYM SOLUTION est née en 2026 de l''évolution de FISSA LIV, société de transport créée en 2016 à Drancy. En dix ans, notre équipe est passée de la course urgente locale à un métier complet : la livraison externalisée pour les enseignes, l''express à la demande et le transport dédié, au départ de l''Île-de-France vers toute la France et l''Europe.'),
  ('about.figures', 'Créée en 2016 · SAS au capital de 21 600 € · une équipe de 10 à 19 personnes · flotte jusqu''à 3,5 tonnes · basée à Drancy (93), aux portes de Paris.'),
  ('cta.final_title', 'Décrivez vos flux, recevez un chiffrage clair sous 24h.'),
  ('cta.final_button', 'Commander un transport'),
  ('contact.phone', '07 67 16 60 15'),
  ('contact.phone_e164', '+33767166015'),
  ('contact.email', 'contact@wanymsolution.com'),
  ('contact.address', '125 rue Diderot, 93700 Drancy'),
  ('contact.hours', 'Exploitation joignable 24h/24'),
  ('legal.company', 'WANYM SOLUTION'),
  ('legal.form', 'SAS au capital de 21 600 €'),
  ('legal.siren', 'À COMPLÉTER'),
  ('legal.rcs', 'À COMPLÉTER'),
  ('legal.tva', 'À COMPLÉTER'),
  ('legal.director', 'À COMPLÉTER'),
  ('legal.host', 'Vercel Inc., 440 N Barranca Ave #4133, Covina, CA 91723, USA'),
  ('faq', '[{"q":"Travaillez-vous vraiment sans engagement ?","a":"Oui. Nos contrats sont sans durée minimale : vous externalisez vos livraisons quand vous en avez besoin, vous arrêtez quand vous voulez. La qualité de service est notre seul argument de fidélisation."},{"q":"Quelles zones couvrez-vous ?","a":"Toutes nos tournées partent d''Île-de-France. Nous livrons l''Île-de-France au quotidien, la France entière et l''Europe (espace Schengen) sur demande ou en tournée dédiée."},{"q":"Quels types de marchandises livrez-vous ?","a":"Colis, produits volumineux (mobilier, électroménager, végétaux…), marchandises de vos clients en magasin ou e-commerce — en véhicules jusqu''à 3,5 tonnes, avec manutention par nos équipes."},{"q":"En combien de temps pouvez-vous intervenir ?","a":"Notre exploitation est joignable 24h/24. En express, un chauffeur peut être chez vous en Île-de-France dans l''heure selon disponibilité."}]')
on conflict (key) do update set value = excluded.value;

insert into public.services (slug, title, summary, body, icon, sort_order, published) values
(
  'livraison-professionnels-externalisee',
  'Livraison externalisée pour professionnels',
  'Magasins, jardineries, enseignes, e-commerçants : nous prenons en charge la livraison de vos clients finaux, du retrait en magasin ou entrepôt jusqu''au domicile. Vous vendez, nous livrons.',
  $md$## Pourquoi externaliser votre dernier kilomètre ?

Le dernier kilomètre est l'étape la plus coûteuse et la plus délicate de la vente : c'est le moment où votre client vous juge. Gérer une flotte en interne, recruter des livreurs, absorber les pics de saison — tout cela pèse sur vos marges et votre organisation. Externaliser sa livraison, c'est transformer un coût fixe en coût variable : vous ne payez que les livraisons réellement effectuées.

## Ce que nous prenons en charge

- **Livraison client final** depuis vos magasins ou entrepôts — en Île-de-France au quotidien, France et Europe sur demande.
- **Produits volumineux et encombrants** — mobilier, électroménager, végétaux, matériaux : manutention et livraison à l'étage par des équipes formées.
- **Pics d'activité** — week-ends, fêtes, soldes, saison : nous absorbons vos variations de volume sans que vous ayez à recruter.
- **Preuve de livraison et suivi** — chaque course est tracée, votre service client sait où en sont ses commandes.
- **Retours et reprises** — reprise d'ancien matériel ou retour en magasin intégrés à la tournée.

## Le « sans engagement », concrètement

Aucune durée minimale, aucun volume imposé. Vous testez sur une semaine, un magasin ou une catégorie de produits. Si le service est au niveau, vous restez. C'est à nous de le prouver à chaque tournée.$md$,
  'store', 1, true
),
(
  'livraison-express-a-la-demande',
  'Livraison express à la demande',
  'Une course urgente, un colis à livrer le jour même à Paris ou en Île-de-France ? Un chauffeur part dès votre appel. Simple, rapide, tracé.',
  $md$## La course urgente, sans friction

Vous appelez, un chauffeur part. La course est directe — votre marchandise ne partage pas le véhicule avec dix autres arrêts. Pas d'abonnement, pas d'application obligatoire, pas d'engagement. Le prix est annoncé avant le départ.

## Ce que couvre notre express

- **Course directe Paris et Île-de-France** — prise en charge rapide, livraison en heures, pas en jours.
- **Livraison jour même (same day)** — pour vos clients e-commerce ou vos urgences B2B.
- **Du pli à la palette** — véhicules du deux-roues au 20 m³ selon le format.
- **Départs province et Europe en urgence** — course dédiée longue distance au départ de l'IDF.
- **Exploitation joignable 24h/24** — l'urgence n'a pas d'horaires de bureau.$md$,
  'zap', 2, true
),
(
  'transport-dedie-sur-mesure',
  'Transport dédié & sur-mesure',
  'Chauffeur dédié, tournées récurrentes, marchandises volumineuses, France et Europe : nous construisons la solution logistique qui colle à votre activité.',
  $md$## Votre logistique, sans la flotte

Un chauffeur et un véhicule affectés à vos flux, pilotés par notre exploitation. Vous obtenez la fiabilité d'une flotte en propre — mêmes chauffeurs, mêmes horaires, connaissance de vos clients — sans en supporter les coûts fixes.

## Nos formules sur-mesure

- **Chauffeur dédié** — à la journée, à la semaine ou à l'année, sur vos plannings.
- **Tournées récurrentes** — vos livraisons régulières optimisées et assurées par les mêmes équipes.
- **Location de véhicule avec chauffeur** — jusqu'à 3,5 t, ponctuelle ou longue durée.
- **Volumineux & manutention** — mobilier, électroménager, matériaux : livraison à l'étage, reprise, montage simple.
- **France & Europe Schengen** — courses dédiées longue distance au départ de l'Île-de-France.

## Sur-mesure ne veut pas dire engagement

Même en tournée dédiée : pas de durée minimale. Votre activité est saisonnière ? La tournée l'est aussi.$md$,
  'truck', 3, true
)
on conflict (slug) do update set
  title = excluded.title,
  summary = excluded.summary,
  body = excluded.body,
  icon = excluded.icon,
  sort_order = excluded.sort_order;
