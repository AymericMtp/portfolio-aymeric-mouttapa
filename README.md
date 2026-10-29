# Portfolio — Aymeric Mouttapa

Site personnel publié sur GitHub Pages : https://aymericmtp.github.io/portfolio-aymeric-mouttapa/

HTML, CSS et JavaScript sans étape de build : on modifie un fichier, on pousse, c'est en ligne.

## Modifier le contenu

Tout le texte du site (français et anglais) est dans **`assets/js/content.js`**. Rien d'autre à toucher pour :

- mettre à jour une expérience, une formation, une langue, un loisir ;
- ajouter un projet : copier un bloc de `projects.featured` (grande carte) ou de `projects.archive` (ligne d'archive) et le remplir ;
- changer le CV : remplacer `assets/docs/CV_MOUTTAPA_AYMERIC.pdf` (même nom de fichier).

Règles d'écriture :

- un texte est soit une chaîne (identique dans les deux langues), soit `{ fr: '…', en: '…' }` ;
- `*mot*` s'affiche en italique serif (l'accent vert des titres) ;
- les dates s'écrivent `'AAAA-MM'`, et `end: null` signifie « aujourd'hui ». Les durées, le diagramme et le chiffre « ans d'alternance » se calculent tout seuls.

## Aperçu en local

Ouvrir `index.html` dans le navigateur suffit. Pour être au plus près du site en ligne :

```bash
python -m http.server 8000
# puis http://localhost:8000
```

## Organisation

```
index.html              structure de la page (en-tête, accueil, emplacements des sections)
assets/js/content.js    TOUT le contenu, FR + EN
assets/js/main.js       rendu des sections, langue, thème, navigation, animations au défilement
assets/js/hero.js       le nom en points de données de l'accueil
assets/js/world.js      la carte du monde et le trajet LA → Abu Dhabi → Berlin → Paris
assets/js/world-dots.js la grille de points des continents (générée, ne pas éditer)
assets/js/console.js    la console SQL cachée (touche « / »)
assets/js/vendor/       GSAP 3.15 + ScrollTrigger, Lenis 1.3.26
assets/css/style.css    tout le style, thèmes clair et sombre
assets/img/             photo, logos, couvertures, certificats, image de partage
assets/docs/            CV et rapports PDF
```

## Détails

- Thème clair / sombre et langue FR / EN : mémorisés par visiteur ; par défaut, ceux de son système.
- Respecte « réduire les animations » : sans particules ni défilement fluide, tout reste lisible.
- Console SQL : appuyer sur `/` (ou le bouton `>_`), puis par exemple `SELECT * FROM experiences;`.
