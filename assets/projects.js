/* ============================================================
   TECHSOLUX — projects.js
   Données des 12 projets vérifiés (source: fidelesodoga.com/projets).
   Le contenu "étude de cas" décrit le type, le secteur et le périmètre
   d'intervention. Aucune métrique chiffrée n'est inventée : les éléments
   à confirmer avec Fidèle sont marqués TODO.
   ============================================================ */

const FICHE = "https://fidelesodoga.com/projets";

window.PROJECTS = [
  {
    slug:"singulier-benin", num:"01", cat:"web",
    name:"Singulier Bénin", type:"Site web", sector:"École de mode & couture", region:"Bénin",
    tagline:"Site vitrine pour une école de mode et de couture.",
    summary:"Présence en ligne pour une école de formation à la mode et à la couture : présentation des cursus, du corps enseignant et inscription des candidats.",
    services:["UI/UX Design","Développement web","Identité de marque"],
    stack:["WordPress","Elementor","HTML/CSS","JavaScript"],
    fiche:`${FICHE}/singulier-benin-ecole-de-mode-et-de-couture/`,
    live:null,
    context:"Singulier Bénin forme aux métiers de la mode et de la couture. L'école avait besoin d'une vitrine claire pour exposer ses formations et capter de nouvelles inscriptions, sans jargon ni surcharge.",
    approach:"Architecture éditoriale orientée parcours : page d'accueil narrative, présentation détaillée des cursus, mise en avant des réalisations d'étudiants et tunnel d'inscription simple. Design responsive, chargement rapide, gestion autonome du contenu côté client.",
    delivered:["Maquettes UI/UX","Site WordPress responsive","Pages cursus + inscription","Prise en main du back-office"],
    gallery:["Accueil — hero formation","Liste des cursus","Fiche formation","Formulaire d'inscription"]
  },
  {
    slug:"paris-beaute", num:"02", cat:"ecom",
    name:"Paris Beauté", type:"E-commerce", sector:"Cosmétiques femmes", region:"Diaspora",
    tagline:"Boutique en ligne de cosmétiques pour femmes.",
    summary:"Plateforme e-commerce pour une marque de cosmétiques : catalogue, fiches produit, panier et paiement en ligne.",
    services:["UI/UX Design","Développement e-commerce","SEO"],
    stack:["WordPress","WooCommerce","PHP","JavaScript"],
    fiche:`${FICHE}/paris-beaute-boutique-de-cosmetiques-pour-femmes/`,
    image:"assets/img/projets/paris-beaute.png",
    live:null,
    context:"Paris Beauté commercialise des produits cosmétiques destinés à une clientèle féminine. L'enjeu : une boutique désirable et rassurante, du catalogue jusqu'au paiement.",
    approach:"E-commerce structuré autour de la fiche produit : photographie mise en valeur, catégories lisibles, recherche, panier et tunnel de commande optimisés mobile. Base SEO posée sur les pages catégories et produits.",
    delivered:["Boutique WooCommerce","Fiches produit + variations","Tunnel panier / paiement","Optimisation SEO de base"],
    gallery:["Vitrine d'accueil","Catalogue / catégories","Fiche produit","Panier & checkout"]
  },
  {
    slug:"avk-ambition", num:"03", cat:"web",
    name:"AVK Ambition", type:"Site web", sector:"Orientation éducative (France)", region:"France",
    tagline:"Guide vers l'excellence éducative.",
    summary:"Site d'un service d'orientation et d'accompagnement éducatif : présentation des offres, prise de contact et de rendez-vous.",
    services:["UI/UX Design","Développement web","Identité de marque"],
    stack:["WordPress","Elementor","HTML/CSS"],
    fiche:`${FICHE}/avk-ambition-votre-guide-vers-lexcellence-educative/`,
    live:null,
    context:"AVK Ambition accompagne les étudiants dans leur orientation éducative en France. Le site devait inspirer confiance et clarifier une offre de services par nature immatérielle.",
    approach:"Mise en récit de l'accompagnement : promesse claire en hero, détail des prestations, preuve et réassurance, appel au rendez-vous. Hiérarchie typographique sobre, lecture rapide.",
    delivered:["Site vitrine responsive","Pages services","Parcours de contact / RDV","Charte visuelle"],
    gallery:["Accueil","Nos accompagnements","À propos","Contact / rendez-vous"]
  },
  {
    slug:"wedriveu", num:"04", cat:"mobile",
    name:"WeDriveU", type:"Application mobile", sector:"Location de voitures", region:"Bénin",
    tagline:"Louer une voiture depuis son téléphone.",
    summary:"Application mobile de location de véhicules : recherche, réservation et gestion des locations côté utilisateur.",
    services:["UI/UX Design","Développement mobile"],
    stack:["Flutter","iOS","Android","Laravel (API)"],
    fiche:`${FICHE}/wedriveu-location-de-voitures/`,
    live:null,
    context:"WeDriveU met en relation des conducteurs avec des véhicules disponibles à la location. Tout devait tenir dans une expérience mobile fluide : trouver, réserver, payer.",
    approach:"Parcours mobile en quelques écrans : recherche par critères, fiche véhicule, calendrier de réservation, suivi des locations. Application Flutter unique pour iOS et Android, adossée à une API.",
    delivered:["App Flutter iOS + Android","Recherche & réservation","Espace utilisateur","API back-end"],
    gallery:["Onboarding","Recherche véhicule","Fiche & réservation","Mes locations"]
  },
  {
    slug:"kultu-tv", num:"05", cat:"mobile",
    name:"Kultu TV", type:"Application mobile", sector:"Journal & médias Afrique", region:"Afrique",
    tagline:"L'actualité africaine dans la poche.",
    summary:"Application mobile de journal : diffusion d'actualités et de contenus médias avec une lecture optimisée mobile.",
    services:["UI/UX Design","Développement mobile","Création de contenu"],
    stack:["Flutter","iOS","Android","Laravel (API)"],
    fiche:`${FICHE}/kultu-tv-application-de-journal/`,
    image:"assets/img/projets/kultu-tv.png",
    live:null,
    context:"Kultu TV diffuse de l'actualité et des contenus médias centrés sur l'Afrique. L'application devait rendre la lecture rapide, fluide et agréable, y compris en connexion limitée.",
    approach:"Flux d'actualités hiérarchisé, catégories, fiche article lisible et favoris. Interface Flutter performante, attention portée au temps de chargement et au confort de lecture.",
    delivered:["App Flutter iOS + Android","Flux & catégories","Lecteur d'article","Connexion à un back-end de contenu"],
    gallery:["Fil d'actualité","Catégories","Lecture d'article","Profil / favoris"]
  },
  {
    slug:"tiar-mg", num:"06", cat:"web",
    name:"Tiar MG", type:"Site web", sector:"Marketing digital", region:"—",
    tagline:"Vitrine d'une agence de marketing digital.",
    summary:"Site vitrine pour des experts en marketing digital : positionnement, services et génération de contacts.",
    services:["UI/UX Design","Développement web","Identité de marque","SEO"],
    stack:["WordPress","Elementor","JavaScript"],
    fiche:`${FICHE}/tiar-mg-experts-en-marketing-digital/`,
    live:null,
    context:"Tiar MG accompagne des marques sur leur marketing digital. Le site devait être à la hauteur de la promesse : moderne, crédible et orienté conversion.",
    approach:"Page d'accueil démonstrative, détail des expertises, preuves et études de cas, appels à l'action répétés. Soin particulier sur le SEO on-page et la vitesse.",
    delivered:["Site vitrine responsive","Pages services / expertises","Parcours de génération de leads","SEO on-page"],
    gallery:["Accueil","Expertises","Réalisations","Contact"]
  },
  {
    slug:"grand-hiver", num:"07", cat:"ecom",
    name:"Grand Hiver", type:"E-commerce", sector:"Vêtements chauds", region:"—",
    tagline:"Boutique en ligne de vêtements chauds.",
    summary:"E-commerce saisonnier de vêtements chauds : catalogue, fiches produit, panier et paiement.",
    services:["UI/UX Design","Développement e-commerce"],
    stack:["WordPress","WooCommerce","PHP"],
    fiche:`${FICHE}/grand-hiver-boutique-en-ligne-de-vetements-chauds/`,
    image:"assets/img/projets/grand-hiver.png",
    live:null,
    context:"Grand Hiver vend des vêtements chauds en ligne. La boutique devait gérer un catalogue saisonnier avec des tailles et variations, et un parcours d'achat sans friction.",
    approach:"Catalogue filtrable, fiches produit avec variations (taille / couleur), panier et checkout optimisés. Mise en avant des collections et des nouveautés en page d'accueil.",
    delivered:["Boutique WooCommerce","Gestion des variations","Tunnel d'achat","Pages collections"],
    gallery:["Accueil collection","Catalogue filtrable","Fiche produit","Panier & paiement"]
  },
  {
    slug:"ovote", num:"08", cat:"mobile",
    name:"Ovote", type:"Application mobile", sector:"Gestion de votes", region:"—",
    tagline:"Organiser et gérer des votes.",
    summary:"Application mobile de gestion de votes : création de scrutins, participation et suivi des résultats.",
    services:["UI/UX Design","Développement mobile"],
    stack:["Flutter","iOS","Android","Laravel (API)"],
    fiche:`${FICHE}/ovote-application-de-gestion-de-votes/`,
    image:"assets/img/projets/ovote.png",
    live:null,
    context:"Ovote permet d'organiser et de gérer des votes. L'application devait rendre la création d'un scrutin et la participation aussi simples que possible, avec un suivi clair des résultats.",
    approach:"Création de scrutin guidée, participation en quelques touches, restitution lisible des résultats. Architecture Flutter + API pour la synchronisation en temps quasi réel.",
    delivered:["App Flutter iOS + Android","Création de scrutins","Vote & participation","Tableau de résultats"],
    gallery:["Accueil scrutins","Créer un vote","Écran de vote","Résultats"]
  },
  {
    slug:"ionot", num:"09", cat:"mobile",
    name:"Ionot", type:"Application mobile", sector:"Vente d'appareils informatiques", region:"—",
    tagline:"Boutique d'appareils informatiques sur mobile.",
    summary:"Application mobile de vente d'appareils informatiques : catalogue, fiches produit et commande.",
    services:["UI/UX Design","Développement mobile"],
    stack:["Flutter","iOS","Android","Laravel (API)"],
    fiche:`${FICHE}/ionot-boutique-dappareils-informatiques/`,
    live:null,
    context:"Ionot vend des appareils informatiques. L'objectif : porter le catalogue dans une application mobile claire, où l'on trouve et commande un produit rapidement.",
    approach:"Catalogue par catégories, fiche produit détaillée, panier et commande. Navigation Flutter rapide, pensée pour la consultation comme pour l'achat.",
    delivered:["App Flutter iOS + Android","Catalogue & catégories","Fiche produit","Panier & commande"],
    gallery:["Accueil boutique","Catégories","Fiche produit","Panier"]
  },
  {
    slug:"ar-studio-beauty", num:"10", cat:"web",
    name:"AR Studio Beauty", type:"Site web", sector:"Salon de coiffure femmes", region:"—",
    tagline:"Vitrine d'un salon de coiffure.",
    summary:"Site vitrine pour un salon de coiffure femmes : présentation des prestations, galerie et prise de contact.",
    services:["UI/UX Design","Développement web","Identité de marque"],
    stack:["WordPress","Elementor","HTML/CSS"],
    fiche:`${FICHE}/ar-studio-beauty-salon-de-coiffure/`,
    image:"assets/img/projets/ar-studio-beauty.png",
    live:null,
    context:"AR Studio Beauty est un salon de coiffure pour femmes. Le site devait refléter l'univers du salon, présenter les prestations et faciliter la prise de contact / rendez-vous.",
    approach:"Direction visuelle soignée, galerie de réalisations, grille de prestations et appel au rendez-vous. Design responsive centré sur l'image.",
    delivered:["Site vitrine responsive","Galerie de réalisations","Grille de prestations","Contact / rendez-vous"],
    gallery:["Accueil","Prestations","Galerie","Contact"]
  },
  {
    slug:"dashboard-armanios", num:"11", cat:"webapp",
    name:"Dashboard Armanios", type:"Web app", sector:"Outil de gestion RH", region:"—",
    tagline:"Tableau de bord de gestion RH.",
    summary:"Application web métier : tableau de bord de gestion des ressources humaines avec visualisation et administration des données.",
    services:["UI/UX Design","Développement web","Développement back-end"],
    stack:["Laravel","PHP","JavaScript","HTML/CSS"],
    fiche:`${FICHE}/dashboard-armanios-outil-de-gestion-rh/`,
    live:null,
    context:"Armanios avait besoin d'un outil interne pour piloter sa gestion RH : centraliser les données, les visualiser et les administrer dans une interface unique.",
    approach:"Application web sur mesure : tableau de bord avec indicateurs, tables de données, formulaires d'administration et droits d'accès. Back-end Laravel, interface dense mais lisible.",
    delivered:["Web app Laravel sur mesure","Tableau de bord & indicateurs","Modules d'administration RH","Gestion des accès"],
    gallery:["Tableau de bord","Liste / table de données","Formulaire d'édition","Vue détail employé"]
  },
  {
    slug:"boutique-informatique", num:"12", cat:"ecom",
    name:"Boutique Informatique", type:"E-commerce", sector:"Matériel IT", region:"—",
    tagline:"Vente d'outils et de matériel informatique.",
    summary:"E-commerce de matériel informatique : catalogue technique, fiches produit détaillées, panier et paiement.",
    services:["UI/UX Design","Développement e-commerce","SEO"],
    stack:["WordPress","WooCommerce","PHP","JavaScript"],
    fiche:`${FICHE}/boutique-informatique-vente-doutils-et-de-materiel/`,
    image:"assets/img/projets/boutique-informatique.png",
    live:null,
    context:"Cette boutique vend des outils et du matériel informatique. Le défi : présenter un catalogue technique de façon lisible et permettre un achat en ligne fiable.",
    approach:"Catalogue par familles de produits, fiches techniques claires, filtres, panier et checkout. Base SEO sur les pages catégories pour capter la recherche produit.",
    delivered:["Boutique WooCommerce","Catalogue technique filtrable","Fiches produit détaillées","Tunnel d'achat + SEO"],
    gallery:["Accueil","Catalogue / familles","Fiche produit technique","Panier & paiement"]
  }
];
