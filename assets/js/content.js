/* ==========================================================================
   TOUT LE CONTENU DU SITE, en français et en anglais.
   Pour modifier un texte, c'est ici et nulle part ailleurs.

   - Un texte est soit une chaîne (identique dans les deux langues),
     soit un objet { fr: '…', en: '…' }.
   - *mot* s'affiche en italique (police serif d'accent).
   - Les dates s'écrivent 'AAAA-MM'. end: null = « aujourd'hui ».
   - Pour ajouter un projet : copier un bloc de `projects.featured`
     (ou de `projects.archive`) et le remplir.
   ========================================================================== */
window.CONTENT = {
  meta: {
    updated: '2026-10'
  },

  person: {
    first: 'Aymeric',
    last: 'Mouttapa',
    email: 'mouttapa.aymeric@gmail.com',
    linkedin: 'https://www.linkedin.com/in/aymeric-mouttapa-974741269/',
    github: 'https://github.com/AymericMtp',
    cv: 'assets/docs/CV_MOUTTAPA_AYMERIC.pdf',
    photo: 'assets/img/profile',            // .webp + .jpg
    location: 'Paris, France',
    // Début de la première alternance : sert à calculer « X ans d'alternance ».
    workSince: '2023-09'
  },

  /* ---------- Textes d'interface ---------- */
  ui: {
    docTitle: { fr: 'Aymeric Mouttapa — Data Analyst & co-fondateur de Hemi', en: 'Aymeric Mouttapa — Data Analyst & co-founder of Hemi' },
    docDesc: {
      fr: 'Aymeric Mouttapa : Data Analyst en alternance chez BNP Paribas Cardif, co-fondateur de Hemi et étudiant en MSc Data/IA à Albert School × Mines Paris – PSL.',
      en: 'Aymeric Mouttapa: apprentice Data Analyst at BNP Paribas Cardif, co-founder of Hemi and MSc Data/AI student at Albert School × Mines Paris – PSL.'
    },
    skip: { fr: 'Aller au contenu', en: 'Skip to content' },
    nav: {
      profil: { fr: 'Profil', en: 'Profile' },
      parcours: { fr: 'Parcours', en: 'Journey' },
      projets: { fr: 'Projets', en: 'Projects' },
      stack: { fr: 'Stack', en: 'Stack' },
      monde: { fr: 'Monde', en: 'World' },
      contact: { fr: 'Contact', en: 'Contact' }
    },
    menu: { fr: 'Menu', en: 'Menu' },
    close: { fr: 'Fermer', en: 'Close' },
    theme: { fr: 'Changer de thème', en: 'Toggle theme' },
    lang: { fr: 'Switch to English', en: 'Passer en français' },
    console: { fr: 'Ouvrir la console SQL', en: 'Open the SQL console' },
    cv: { fr: 'Télécharger le CV', en: 'Download my CV' },
    contactMe: { fr: 'Me contacter', en: 'Get in touch' },
    scroll: { fr: 'Défiler', en: 'Scroll' },
    copy: { fr: 'Copier', en: 'Copy' },
    copied: { fr: 'Adresse copiée dans le presse-papiers', en: 'Email copied to clipboard' },
    view: { fr: 'Voir', en: 'View' },
    verify: { fr: 'Vérifier', en: 'Verify' },
    today: { fr: 'aujourd’hui', en: 'today' },
    ongoing: { fr: 'en cours', en: 'ongoing' },
    pdf: { fr: 'Rapport PDF', en: 'PDF report' },
    app: { fr: 'App en ligne', en: 'Live app' },
    code: { fr: 'Code sur GitHub', en: 'Code on GitHub' },
    backTop: { fr: 'Haut de page', en: 'Back to top' },
    updated: { fr: 'Mis à jour', en: 'Updated' },
    tip: { fr: 'Astuce : appuyez sur / pour ouvrir la console SQL.', en: 'Tip: press / to open the SQL console.' },
    courses: { fr: 'Cours :', en: 'Courses:' },
    mapLabel: { fr: 'Carte du monde : Los Angeles, Abu Dhabi, Berlin puis Paris', en: 'World map: Los Angeles, Abu Dhabi, Berlin, then Paris' },
    mlNote: { fr: 'Score F1 par modèle, axe 0,80 → 0,87 · courbe ROC indicative', en: 'F1 score per model, axis 0.80 → 0.87 · indicative ROC curve' },
    msLabel: { fr: 'Jalon', en: 'Milestone' },
    year: { fr: 'an', en: 'yr' },
    years: { fr: 'ans', en: 'yrs' },
    month: { fr: 'mois', en: 'mo' },
    months: { fr: 'mois', en: 'mo' }
  },

  /* ---------- Accueil ---------- */
  hero: {
    query: {
      fr: 'SELECT * FROM profils WHERE nom = \'Mouttapa\';',
      en: 'SELECT * FROM profiles WHERE name = \'Mouttapa\';'
    },
    result: { fr: '1 ligne · 0,024 s', en: '1 row · 0.024 s' },
    roles: [
      { fr: 'Data Analyst en alternance · BNP Paribas Cardif', en: 'Apprentice Data Analyst · BNP Paribas Cardif' },
      { fr: 'Co-fondateur & dev frontend · Hemi', en: 'Co-founder & frontend dev · Hemi' },
      { fr: 'MSc Data & IA · Albert School × Mines Paris', en: 'MSc Data & AI · Albert School × Mines Paris' }
    ],
    tagline: {
      fr: 'Je transforme des données brutes en *décisions claires* : tableaux de bord, automatisation et produits qu’on utilise vraiment.',
      en: 'I turn raw data into *clear decisions*: dashboards, automation and products people actually use.'
    }
  },

  /* ---------- Profil ---------- */
  about: {
    label: { fr: 'profil', en: 'profile' },
    statement: {
      fr: 'Entre la finance, la tech civique et les études, j’aime le moment où un chiffre bien présenté fait bouger une décision.',
      en: 'Between finance, civic tech and school, I love the moment a well-told number changes a decision.'
    },
    body: [
      {
        fr: 'Data Analyst en alternance à la Direction des Investissements de BNP Paribas Cardif, je conçois des tableaux de bord Power BI, j’automatise des processus métier en Python et PowerShell et je fiabilise des flux de données financières.',
        en: 'As an apprentice Data Analyst in BNP Paribas Cardif’s Investment Department, I design Power BI dashboards, automate business processes with Python and PowerShell, and make financial data flows more reliable.'
      },
      {
        fr: 'Avant cela, deux ans chez ADP m’ont appris à construire des rapports que les managers utilisent vraiment. En parallèle, je prépare un MSc Data/IA for Business à Albert School et Mines Paris – PSL, et je co-développe Hemi, une application qui rend l’activité des députés lisible par tous.',
        en: 'Before that, two years at ADP taught me to build reports managers actually use. Alongside, I’m doing an MSc in Data/AI for Business at Albert School and Mines Paris – PSL, and co-building Hemi, an app that makes the work of French MPs readable for everyone.'
      },
      {
        fr: 'J’ai grandi entre Los Angeles, Abu Dhabi et Berlin : je m’adapte vite, je travaille en trois langues et je me sens chez moi dans les équipes internationales.',
        en: 'I grew up between Los Angeles, Abu Dhabi and Berlin: I adapt fast, work in three languages and feel at home in international teams.'
      }
    ],
    traits: [
      { fr: 'Adaptabilité culturelle', en: 'Cultural adaptability' },
      { fr: 'Rigueur', en: 'Rigour' },
      { fr: 'Curiosité', en: 'Curiosity' },
      { fr: 'Résolution de problèmes', en: 'Problem solving' },
      { fr: 'Créativité', en: 'Creativity' }
    ],
    // La fiche affichée sur la photo, façon ligne de base de données.
    record: [
      { k: 'id', v: '0001' },
      { k: { fr: 'nom', en: 'name' }, v: 'Aymeric Mouttapa' },
      { k: { fr: 'rôle', en: 'role' }, v: 'Data Analyst' },
      { k: { fr: 'base', en: 'based_in' }, v: 'Paris, FR' },
      { k: { fr: 'langues', en: 'languages' }, v: 'fr · en · de' }
    ],
    // value: 'workYears' est calculé à partir de person.workSince.
    kpis: [
      { value: 'workYears', label: { fr: 'ans d’alternance en data', en: 'years of data work-study' }, detail: 'ADP → BNP Paribas Cardif', viz: 'bars' },
      { value: 4, label: { fr: 'pays où j’ai vécu', en: 'countries lived in' }, detail: 'US · AE · DE · FR', viz: 'dots' },
      { value: 3, label: { fr: 'langues de travail', en: 'working languages' }, detail: 'FR · EN · DE', viz: 'levels' },
      { value: 1, label: { fr: 'startup co-fondée', en: 'startup co-founded' }, detail: { fr: 'finaliste Google × Prodiges', en: 'Google × Prodiges finalist' }, viz: 'line' }
    ]
  },

  /* ---------- Parcours ---------- */
  journey: {
    label: { fr: 'parcours', en: 'journey' },
    title: { fr: 'Trois voies, *en parallèle*.', en: 'Three tracks, *in parallel*.' },
    intro: {
      fr: 'Entreprise, études, startup : depuis 2023, je mène les trois de front. Survolez ou touchez une barre pour le détail.',
      en: 'Corporate, school, startup: since 2023 I’ve been running all three at once. Hover or tap a bar for details.'
    },
    // Fenêtre de temps du diagramme.
    from: '2022-09',
    to: '2027-09',
    tracks: [
      { id: 'work', label: { fr: 'Entreprise', en: 'Work' } },
      { id: 'startup', label: { fr: 'Startup', en: 'Startup' } },
      { id: 'school', label: { fr: 'Études', en: 'School' } }
    ],
    expTitle: { fr: 'Expériences', en: 'Experience' },
    eduTitle: { fr: 'Formation', en: 'Education' }
  },

  experience: [
    {
      id: 'hemi',
      track: 'startup',
      company: 'Hemi',
      url: 'https://hemi-app.fr',
      logo: 'assets/img/logos/hemi.png',
      role: { fr: 'Co-fondateur & Développeur Frontend', en: 'Co-founder & Frontend Developer' },
      place: { fr: 'Startup · Application mobile de transparence politique', en: 'Startup · Political-transparency mobile app' },
      start: '2025-10',
      end: null,
      bullets: [
        { fr: 'Co-fondé Hemi lors d’un hackathon organisé avec Google et le fonds Prodiges ; finalistes en février 2026.', en: 'Co-founded Hemi at a hackathon run with Google and VC firm Prodiges; finalists in February 2026.' },
        { fr: 'Intégré le programme de Prodiges en mars 2026.', en: 'Joined the Prodiges programme in March 2026.' },
        { fr: 'Développé l’application en React Native : suivi de l’activité des députés (votes, taux de présence), veille législative et résumés de lois compréhensibles par tous.', en: 'Built the app in React Native: tracking MPs’ activity (votes, attendance), legislative watch and plain-language bill summaries.' }
      ],
      tags: ['React Native', 'Frontend', { fr: 'Produit', en: 'Product' }],
      milestones: [
        { date: '2026-02', label: { fr: 'Finaliste du hackathon Google × Prodiges', en: 'Google × Prodiges hackathon finalist' } },
        { date: '2026-03', label: { fr: 'Entrée dans le programme Prodiges', en: 'Joined the Prodiges programme' } }
      ]
    },
    {
      id: 'bnp',
      track: 'work',
      company: 'BNP Paribas Cardif',
      logo: 'assets/img/logos/bnp-cardif.png',
      role: { fr: 'Data Analyst en alternance · Analyse de masse & optimisation de processus', en: 'Apprentice Data Analyst · Large-scale analysis & process optimisation' },
      place: { fr: 'Direction des Investissements · MOAC', en: 'Investment Department · MOAC' },
      start: '2025-09',
      end: null,
      bullets: [
        { fr: 'Conçu des tableaux de bord Power BI pour le suivi des KPI de l’équipe et le reporting d’activité.', en: 'Designed Power BI dashboards to track team KPIs and report on activity.' },
        { fr: 'Automatisé des processus métier récurrents en Python et PowerShell.', en: 'Automated recurring business processes with Python and PowerShell.' },
        { fr: 'Contribué à la fiabilisation des flux d’intégration des titres et de leurs cours dans CARAT.', en: 'Helped make the integration flows of securities and their prices into CARAT more reliable.' },
        { fr: 'Traduit les besoins des gestionnaires en solutions data exploitables.', en: 'Turned the business teams’ needs into usable data solutions.' }
      ],
      tags: ['Power BI', 'Python', 'PowerShell', { fr: 'Automatisation', en: 'Automation' }]
    },
    {
      id: 'adp',
      track: 'work',
      company: 'ADP France',
      logo: 'assets/img/logos/adp.png',
      role: { fr: 'Data Scientist & Développeur BI en alternance', en: 'Apprentice Data Scientist & BI Developer' },
      place: 'Automatic Data Processing',
      start: '2023-09',
      end: '2025-09',
      bullets: [
        { fr: 'Conçu et optimisé des tableaux de bord Power BI pour l’analyse et le reporting des KPI.', en: 'Designed and optimised Power BI dashboards for KPI analysis and reporting.' },
        { fr: 'Développé des flux de données aux calculs complexes en DAX et Power Query.', en: 'Built dataflows with complex calculations in DAX and Power Query.' },
        { fr: 'Créé des tableaux de bord de suivi de la performance, dont le dashboard NPS relationnel.', en: 'Created performance-tracking dashboards, including the relational NPS dashboard.' },
        { fr: 'Rendu les rapports accessibles (palettes adaptées au daltonisme) et personnalisés selon les besoins.', en: 'Made reports accessible (colour-blind-safe palettes) and tailored to each need.' },
        { fr: 'Travaillé avec les responsables pour livrer des insights exploitables.', en: 'Worked with managers to deliver actionable insights.' }
      ],
      tags: ['Power BI', 'DAX', 'Power Query', 'Oracle', 'Excel']
    }
  ],

  education: [
    {
      id: 'msc',
      track: 'school',
      school: 'Albert School × Mines Paris – PSL',
      short: 'MSc Albert × Mines',
      logo: 'assets/img/logos/albert-mines.png',
      degree: { fr: 'MSc Data/IA for Business', en: 'MSc in Data/AI for Business' },
      place: { fr: 'Paris 10e', en: 'Paris, 10th' },
      start: '2025-09',
      end: '2027-09',
      courses: [
        'Machine Learning', 'Data Mining',
        { fr: 'Modélisation financière', en: 'Financial modelling' },
        { fr: 'Marketing digital', en: 'Digital marketing' },
        { fr: 'Finance durable', en: 'Sustainable finance' }
      ],
      tools: ['Python', 'SQL', 'Cloud', { fr: 'Frameworks d’IA', en: 'AI frameworks' }, 'Data viz']
    },
    {
      id: 'but',
      track: 'school',
      school: 'IUT Paris Rives de Seine · Université Paris Cité',
      short: { fr: 'BUT Science des Données', en: 'BUT Data Science' },
      degree: { fr: 'BUT Science des Données (ex-STID)', en: 'Bachelor’s in Data Science (BUT, ex-STID)' },
      note: { fr: 'En alternance chez ADP dès la 2e année', en: 'Work-study at ADP from year 2' },
      place: { fr: 'Paris 16e', en: 'Paris, 16th' },
      link: 'https://iutparis-seine.u-paris.fr/metiers-de-la-data/bachelor-universitaire-de-technologie-stid/',
      start: '2022-09',
      end: '2025-07',
      courses: [
        { fr: 'Statistiques', en: 'Statistics' }, 'Machine Learning',
        { fr: 'Bases de données', en: 'Databases' },
        'Data visualisation', 'Big Data'
      ],
      tools: ['Python', 'R', 'SQL', 'Power BI', 'Excel', 'SAS', 'HTML/CSS/JS']
    },
    {
      id: 'bac',
      track: null,
      school: 'Lycée d’Arsonval',
      degree: { fr: 'Baccalauréat général · Maths & SES', en: 'French Baccalaureate · Maths & Economics' },
      note: { fr: 'Mention Bien', en: 'With honours (mention Bien)' },
      place: 'Saint-Maur-des-Fossés',
      start: '2019-09',
      end: '2022-07',
      courses: [],
      tools: []
    }
  ],

  /* ---------- Projets ---------- */
  projects: {
    label: { fr: 'projets', en: 'projects' },
    title: { fr: 'Ce que *je construis*.', en: 'What *I build*.' },
    intro: {
      fr: 'Une startup, du machine learning et de la BI en entreprise. Les projets de bachelor sont archivés plus bas.',
      en: 'A startup, machine learning and corporate BI. Bachelor projects are archived further down.'
    },

    featured: [
      {
        id: 'hemi',
        kind: 'hemi',
        type: 'Startup',
        kicker: { fr: 'Startup · 2025 → aujourd’hui', en: 'Startup · 2025 → today' },
        title: 'Hemi',
        subtitle: { fr: 'Rendre l’activité des députés *lisible par tous*.', en: 'Making MPs’ work *readable for everyone*.' },
        description: {
          fr: 'Application mobile de transparence politique née d’un hackathon avec Google et le fonds Prodiges. Je développe le frontend en React Native : fiches députés (votes, taux de présence), veille législative et résumés de lois en langage clair.',
          en: 'A political-transparency mobile app born at a hackathon with Google and VC firm Prodiges. I build the React Native frontend: MP profiles (votes, attendance), legislative watch and plain-language bill summaries.'
        },
        facts: [
          { k: '02 / 2026', v: { fr: 'Finaliste du hackathon Google × Prodiges', en: 'Finalist, Google × Prodiges hackathon' } },
          { k: '03 / 2026', v: { fr: 'Entrée dans le programme Prodiges', en: 'Joined the Prodiges programme' } },
          { k: 'React Native', v: { fr: 'Développement frontend mobile', en: 'Mobile frontend development' } }
        ],
        features: [
          { fr: 'Votes des députés', en: 'MPs’ votes' },
          { fr: 'Taux de présence', en: 'Attendance rate' },
          { fr: 'Veille législative', en: 'Legislative watch' },
          { fr: 'Résumés de lois', en: 'Bill summaries' }
        ],
        tags: ['React Native', 'Frontend', 'Civic tech'],
        links: [{ type: 'site', href: 'https://hemi-app.fr' }]
      },
      {
        id: 'income',
        kind: 'ml',
        type: 'MSc',
        kicker: { fr: 'MSc · Albert School × Mines Paris · 2025', en: 'MSc · Albert School × Mines Paris · 2025' },
        title: { fr: 'Prédiction de revenus', en: 'Income prediction' },
        subtitle: { fr: 'Machine learning supervisé, *de l’EDA au déploiement*.', en: 'Supervised machine learning, *from EDA to deployment*.' },
        description: {
          fr: 'Classification binaire (revenu > 50 K$) sur le jeu Adult Census, pour le cas d’usage d’une ONG : orienter chaque personne surendettée vers l’aide la plus adaptée. Feature engineering, modèles comparés et suivis dans MLflow, pipeline LightGBM final et interface Streamlit. En binôme avec Leon Pejic.',
          en: 'Binary classification (income > $50K) on the Adult Census dataset, for an NGO use case: routing each over-indebted person to the most suitable help. Feature engineering, models compared and tracked in MLflow, a final LightGBM pipeline and a Streamlit app. Built in a pair with Leon Pejic.'
        },
        metrics: [
          { k: 'F1', v: 0.863 },
          { k: 'ROC-AUC', v: 0.926 }
        ],
        // Score F1 de chaque modèle testé (README du dépôt).
        models: [
          { name: 'LightGBM', f1: 0.8627 },
          { name: 'CatBoost', f1: 0.8622 },
          { name: 'XGBoost', f1: 0.8622 },
          { name: 'Random Forest', f1: 0.84 }
        ],
        tags: ['Python', 'LightGBM', 'scikit-learn', 'MLflow', 'Streamlit'],
        links: [{ type: 'code', href: 'https://github.com/AymericMtp/supervised-learning' }]
      },
      {
        id: 'nps',
        kind: 'nps',
        type: 'ADP',
        kicker: { fr: 'ADP France · oct. 2023 → janv. 2024', en: 'ADP France · Oct 2023 → Jan 2024' },
        title: { fr: 'Dashboard NPS relationnel', en: 'Relational NPS dashboard' },
        subtitle: { fr: 'Power BI, en autonomie, *lisible par tous les regards*.', en: 'Power BI, built solo, *readable by every eye*.' },
        description: {
          fr: 'Création puis amélioration d’un tableau de bord qui analyse le Net Promoter Score d’ADP à partir du questionnaire client mensuel : dataflows, modélisation, mesures DAX et langage M. Les visuels s’adaptent à chaque utilisateur et restent lisibles pour les personnes daltoniennes.',
          en: 'Built, then improved, a dashboard analysing ADP’s Net Promoter Score from the monthly customer survey: dataflows, data modelling, DAX measures and M. Visuals adapt to each user and stay readable for colour-blind people.'
        },
        npsLegend: {
          detractors: { fr: 'Détracteurs', en: 'Detractors' },
          passives: { fr: 'Passifs', en: 'Passives' },
          promoters: { fr: 'Promoteurs', en: 'Promoters' },
          formula: { fr: 'NPS = % promoteurs − % détracteurs', en: 'NPS = % promoters − % detractors' },
          toggle: { fr: 'Palette daltonisme', en: 'Colour-blind palette' },
          example: { fr: 'Exemple de lecture (chiffres fictifs)', en: 'How to read it (made-up figures)' }
        },
        // Répartition fictive, uniquement pour illustrer le calcul (en %).
        npsExample: { detractors: 18, passives: 27, promoters: 55 },
        tags: ['Power BI', 'DAX', 'Power Query (M)', 'Dataflows'],
        links: []
      }
    ],

    archiveTitle: { fr: 'Archives · projets de BUT', en: 'Archive · bachelor projects' },
    archiveIntro: {
      fr: 'Les fondations : statistiques, séries temporelles, collecte et intégration de données.',
      en: 'The foundations: statistics, time series, data collection and integration.'
    },
    archive: [
      {
        title: 'FIFA 19',
        what: { fr: 'Dashboard R Shiny pour comparer les joueurs entre ligues : classements, carte, radars de compétences.', en: 'R Shiny dashboard comparing players across leagues: rankings, map, skill radar charts.' },
        tools: ['R', 'Shiny', 'Plotly', 'dplyr'],
        img: 'assets/img/projects/fifa.webp',
        link: { type: 'app', href: 'https://aymeric-mouttapa.shinyapps.io/fifa19_dashboard/' }
      },
      {
        title: 'Petrol Coke',
        what: { fr: 'Séries temporelles : électricité produite à partir de petrol coke aux États-Unis (2001–2022) et prévision 2023 par ARIMA.', en: 'Time series: US electricity generated from petroleum coke (2001–2022) and a 2023 ARIMA forecast.' },
        tools: ['R', 'ARIMA', 'ggplot2', 'forecast'],
        img: 'assets/img/projects/petrolcoke.webp',
        link: { type: 'pdf', href: 'assets/docs/rapport-petrol-coke.pdf' }
      },
      {
        title: 'SIRENE',
        what: { fr: 'Enrichissement de la base SIRENE : géocodage par API et extraction d’informations sur Google Maps avec Selenium.', en: 'Enriching France’s SIRENE business register: geocoding through APIs and Google Maps extraction with Selenium.' },
        tools: ['Python', 'pandas', 'Selenium', 'API'],
        img: 'assets/img/projects/sirene.webp',
        link: { type: 'pdf', href: 'assets/docs/rapport-sirene.pdf' }
      },
      {
        title: 'NIL',
        what: { fr: 'Entrepôt de données et modélisation relationnelle pour analyser ventes et comportements clients, avec tableau de bord.', en: 'Data warehouse and relational model to analyse sales and customer behaviour, plus a dashboard.' },
        tools: ['SQL', { fr: 'Entrepôt de données', en: 'Data warehouse' }, 'BI'],
        img: 'assets/img/projects/nil.webp',
        link: { type: 'pdf', href: 'assets/docs/rapport-nil.pdf' }
      },
      {
        title: 'World Happiness',
        what: { fr: 'Analyse du World Happiness Report 2022 : corrélations, régression linéaire et facteurs du bonheur.', en: 'World Happiness Report 2022 analysis: correlations, linear regression and drivers of happiness.' },
        tools: ['R', { fr: 'Régression', en: 'Regression' }, 'Pearson'],
        img: 'assets/img/projects/happiness.webp',
        link: { type: 'pdf', href: 'assets/docs/rapport-world-happiness.pdf' }
      }
    ]
  },

  /* ---------- Stack ---------- */
  skills: {
    label: { fr: 'stack', en: 'stack' },
    title: { fr: 'Mes outils, *et où je m’en sers*.', en: 'My tools, *and where I use them*.' },
    intro: {
      fr: 'Pas de jauges inventées : chaque outil est relié aux endroits où je l’ai vraiment utilisé. Survolez ou touchez pour explorer.',
      en: 'No made-up skill bars: each tool links to where I actually used it. Hover or tap to explore.'
    },
    all: { fr: 'Tout', en: 'All' },
    contexts: [
      { id: 'bnp', label: 'BNP Paribas Cardif', kind: 'work' },
      { id: 'adp', label: 'ADP', kind: 'work' },
      { id: 'hemi', label: 'Hemi', kind: 'startup' },
      { id: 'msc', label: 'MSc Albert × Mines', kind: 'school' },
      { id: 'but', label: { fr: 'BUT Science des Données', en: 'BUT Data Science' }, kind: 'school' },
      { id: 'cert', label: { fr: 'Certifications', en: 'Certifications' }, kind: 'cert' }
    ],
    groups: [
      {
        label: { fr: 'BI & visualisation', en: 'BI & visualisation' },
        items: [
          { name: 'Power BI', ctx: ['bnp', 'adp', 'but', 'cert'] },
          { name: 'DAX · Power Query', ctx: ['adp'] },
          { name: 'Excel', ctx: ['adp', 'but'] },
          { name: 'R Shiny', ctx: ['but'] },
          { name: 'Celonis', ctx: ['cert'] }
        ]
      },
      {
        label: { fr: 'Langages', en: 'Languages' },
        items: [
          { name: 'Python', ctx: ['bnp', 'msc', 'but'] },
          { name: 'SQL', ctx: ['adp', 'msc', 'but'] },
          { name: 'R', ctx: ['but'] },
          { name: 'SAS', ctx: ['but'] },
          { name: 'PowerShell', ctx: ['bnp'] },
          { name: 'JavaScript · HTML/CSS', ctx: ['hemi', 'but'] }
        ]
      },
      {
        label: { fr: 'Data & ML', en: 'Data & ML' },
        items: [
          { name: 'pandas', ctx: ['msc', 'but'] },
          { name: 'scikit-learn · LightGBM', ctx: ['msc'] },
          { name: 'MLflow', ctx: ['msc'] },
          { name: 'Streamlit', ctx: ['msc'] },
          { name: 'Selenium', ctx: ['but'] }
        ]
      },
      {
        label: { fr: 'Produit & infra', en: 'Product & infra' },
        items: [
          { name: 'React Native', ctx: ['hemi'] },
          { name: 'Oracle', ctx: ['adp'] },
          { name: 'Cloud', ctx: ['msc'] },
          { name: 'Git · GitHub', ctx: ['msc'] }
        ]
      }
    ],
    certTitle: { fr: 'Certifications', en: 'Certifications' },
    certifications: [
      {
        name: 'IELTS Academic',
        issuer: 'British Council',
        date: '2022-03',
        detail: { fr: 'Score global 8.0 / 9', en: 'Overall band 8.0 / 9' },
        img: 'assets/img/certs/ielts.webp'
      },
      {
        name: 'Microsoft Power BI',
        issuer: 'Udemy',
        date: '2023-09',
        detail: { fr: 'Formation complète, 11 h', en: 'Complete course, 11 h' },
        img: 'assets/img/certs/powerbi.webp',
        verify: 'https://ude.my/UC-ddbd94da-ffdd-4049-b420-d93fced43386'
      },
      {
        name: 'Process Mining with Celonis',
        issuer: 'Udemy',
        date: '2023-09',
        detail: { fr: 'Process mining, 4,5 h', en: 'Process mining, 4.5 h' },
        img: 'assets/img/certs/celonis.webp',
        verify: 'https://ude.my/UC-b76d10c7-bbe0-473e-9d93-a64f0300dc78'
      }
    ]
  },

  /* ---------- Monde ---------- */
  world: {
    label: { fr: 'monde', en: 'world' },
    title: { fr: 'Quatre pays, *trois langues*.', en: 'Four countries, *three languages*.' },
    intro: {
      fr: 'Une enfance entre trois continents, puis Paris. C’est là que j’ai appris à m’adapter, vite.',
      en: 'A childhood across three continents, then Paris. That’s where I learned to adapt, fast.'
    },
    places: [
      { code: 'LAX', city: 'Los Angeles', country: { fr: 'États-Unis', en: 'United States' }, lat: 34.05, lon: -118.24, from: 2007, to: 2010, note: { fr: 'Premier départ à l’étranger', en: 'First move abroad' } },
      { code: 'AUH', city: 'Abu Dhabi', country: { fr: 'Émirats arabes unis', en: 'United Arab Emirates' }, lat: 24.45, lon: 54.38, from: 2013, to: 2016, note: { fr: 'Trois ans dans le Golfe', en: 'Three years in the Gulf' } },
      { code: 'BER', city: 'Berlin', country: { fr: 'Allemagne', en: 'Germany' }, lat: 52.52, lon: 13.40, from: 2016, to: 2019, note: { fr: 'Brevet des collèges', en: 'Middle-school diploma' } },
      { code: 'PAR', city: 'Paris', country: { fr: 'France', en: 'France' }, lat: 48.86, lon: 2.35, from: 2019, to: null, note: { fr: 'Bac, BUT, MSc & alternances', en: 'Baccalaureate, BUT, MSc & work-study' } }
    ],
    langTitle: { fr: 'Langues', en: 'Languages' },
    // level : nombre de niveaux CECRL remplis (A1 = 1 … C2 = 6). 2.5 = A2/B1.
    languages: [
      { name: { fr: 'Français', en: 'French' }, level: 6, label: { fr: 'Langue maternelle', en: 'Native' } },
      { name: { fr: 'Anglais', en: 'English' }, level: 6, label: 'C2 · IELTS 8.0' },
      { name: { fr: 'Allemand', en: 'German' }, level: 2.5, label: 'A2 / B1' }
    ],
    offTitle: { fr: 'Hors data', en: 'Off the clock' },
    hobbies: [
      { icon: '✈️', label: { fr: 'Voyages', en: 'Travel' } },
      { icon: '🎧', label: { fr: 'Musique', en: 'Music' } },
      { icon: '🏋️', label: { fr: 'Musculation', en: 'Weightlifting' } },
      { icon: '🎮', label: { fr: 'Jeux vidéo', en: 'Video games' } },
      { icon: '👟', label: { fr: 'Mode', en: 'Fashion' } },
      { icon: '📚', label: { fr: 'Lecture', en: 'Reading' } },
      { icon: '🌆', label: { fr: 'Sorties', en: 'Going out' } }
    ]
  },

  /* ---------- Contact ---------- */
  contact: {
    label: { fr: 'contact', en: 'contact' },
    title: { fr: 'Parlons *data*.', en: 'Let’s talk *data*.' },
    intro: {
      fr: 'Une opportunité, un projet ou une question sur Hemi ? Écrivez-moi, je réponds vite.',
      en: 'An opportunity, a project or a question about Hemi? Drop me a line, I reply fast.'
    },
    query: {
      fr: 'INSERT INTO contacts (nom, message) VALUES (\'vous\', \'bonjour\');',
      en: 'INSERT INTO contacts (name, message) VALUES (\'you\', \'hello\');'
    }
  }
};
