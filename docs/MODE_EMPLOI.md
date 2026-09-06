# Mode d'emploi – Site du peintre

Ce document explique comment utiliser le site et son back-office (Studio) pour modifier le contenu, ajouter des œuvres, gérer les expositions, les textes et la presse.

---

## 1. Accès au Studio (back-office)

Le site public affiche les œuvres, les expositions et les textes. Pour **modifier ou ajouter** tout ce contenu, il faut utiliser le **Studio**.

- **URL du Studio** : ouvrez le site puis ajoutez `/studio` à l’adresse (ex. `https://votresite.com/studio`).
- Le Studio s’ouvre en plein écran, sans le menu ni le pied de page du site.
- **Menu de gauche** : chaque entrée correspond à un **type de contenu**. En cliquant sur une entrée, vous voyez la liste des documents de ce type. En cliquant sur un document (ou sur « Create new »), vous éditez ses champs (titre, dates, texte, image, etc.).
- Les modifications sont **enregistrées** dans le Studio ; après publication et rafraîchissement du site, le contenu mis à jour s’affiche sur le site public.

### Correspondance : menu Studio ↔ site public

| Entrée dans le Studio | Rôle sur le site |
|------------------------|-------------------|
| **Exposition** | **Vos** expositions (section Expositions, après la Galerie). |
| **Article de presse** | Articles **sur vous** / votre œuvre (section Presse : liste d’articles avec lien, extrait). |
| **Citation presse** | Citations **sur vous** / votre œuvre (section Presse : encarts de citations). |
| **Critiques** / **Enseignement** | Textes et catégories en arbre : Critiques littéraires, Expositions à voir, Ateliers & Stages, Histoire de l’art, Technique picturale. Voir section Critiques et Enseignement. |
| **Catégories** (sous Critiques / Enseignement) | Arbre des catégories (créer, renommer, imbriquer). Voir [MIGRATION_CATEGORIES.md](MIGRATION_CATEGORIES.md). |
| **Journal** | Articles du Journal (section Journal sur le site). |
| **Biographie** | Texte et photo de la biographie (section Biographie). |
| **Paramètres du site** (ou **Site settings**) | Textes de la page d’accueil : bandeau (hero), contact, menu, footer, messages du formulaire. |
| **Série**, **Technique**, **Thème**, **Statut tableau** | Listes pour **classer les tableaux** (utilisées comme filtres en galerie). |
| **Tableau** | Les œuvres affichées dans la galerie. |

---

## 2. Expositions

### Où sont affichées les expositions sur le site ?

Dans la section **Expositions** de la page d’accueil (après la Galerie), accessible via le menu ou l’ancre `#expositions`.

### En cours, À venir, Archives

- **En cours** : expositions dont la date du jour est entre la date de début et la date de fin.
- **À venir** : expositions dont la date de début est dans le futur.
- **Archives** : expositions dont la date de fin est passée.

Le statut **n’est pas saisi à la main**. Il est calculé automatiquement à partir des **dates de début et de fin** de chaque exposition. Pour qu’une exposition apparaisse dans **Archives**, il suffit que sa **date de fin** soit passée ; rien à cocher dans le Studio.

### Comment ajouter ou modifier une exposition ?

1. Studio → **Exposition**.
2. Cliquer sur une exposition existante pour la modifier, ou sur **Create new** pour en créer une.
3. Renseigner : **Titre**, **Lieu** (venue), **Ville**, **Pays**, **Date de début**, **Date de fin**, **Description**, **Image**, et éventuellement **Lien externe** (voir ci-dessous).
4. Sauvegarder / publier.

### Lien « En savoir plus » sous chaque exposition

- Le bouton **« En savoir plus »** n’apparaît que si l’exposition a un **Lien externe** renseigné (champ **Lien externe** / **externalLink** dans le Studio).
- Si ce lien pointe vers votre ancien site et que ce site disparaît, le lien sera cassé.

**Que faire :**

- **Modifier le lien** : Studio → **Exposition** → ouvrir l’exposition → champ **Lien externe**. Mettez l’URL de la page du lieu, d’un PDF, ou d’une autre page de votre choix.
- **Faire disparaître le bouton** : laissez le champ **Lien externe** vide ; le bouton « En savoir plus » ne s’affichera pas.

---

## 3. Galerie et tableaux

### Affichage et filtres

- En galerie, chaque œuvre affiche **titre** et **année** au survol et dans la fenêtre détail ; si une **référence** est renseignée dans le Studio, elle apparaît aussi (survol et détail).
- Par défaut, la liste est une **sélection aléatoire** (ou **À la une** si l’option est activée dans les paramètres du site), parmi les œuvres visibles en galerie.
- **Filtres** : Technique, Thème, Disponibilité (statut), **Série**, et **Référence** (menu avec chevron).

### Menu « Référence » (site public)

- **Ordre catalogue** : case à cocher « Ordre catalogue (année, média, n°) » — affiche les œuvres dans un ordre fixe : année décroissante, puis type de média (voir codes ci-dessous), puis numéro de suite dans la cote.
- **Filtrer par référence** : champ qui réduit la liste **au fil de la frappe** : les cotes dont le début correspond à ce que vous tapez restent affichées (insensible à la casse et aux espaces ; correspondance par **préfixe**, ex. `24` puis `24T`). Bouton **Effacer le filtre** pour tout réafficher.
- Si aucune œuvre ne correspond à la référence saisie alors que d’autres filtres laissent des résultats, un message dédié s’affiche.

### Champ « Référence (catalogue) » dans le Studio

Format : **`YY` + code média + numéro** (sans espaces de préférence), par exemple `24T05`, `24CE03`.

| Code | Signification |
|------|----------------|
| **T** | Toile |
| **D** | Dessin |
| **A** | Céramique utilitaire (assiette, bol, etc.) |
| **CE** | Tableaux en carreaux de céramique |
| **C** | Carnet |
| **G** | Gravure |
| **L** | Lithographie |
| **M** | Monotype |
| **S** | Sculpture |

Les **deux premiers chiffres** sont l’année sur 2 positions : **00–29** → 2000–2029, **30–99** → 1930–1999. Si la référence est **reconnue** par le Studio, le champ **Année** est mis à jour automatiquement ; vous pouvez toujours corriger l’année à la main.

**Édition en masse** et **Import tableaux** permettent aussi de renseigner ou de vider la référence pour plusieurs documents.

### Limites

- Il n’y a **pas** de recherche plein texte par **titre** dans la galerie (seulement le filtre par **début de référence**).

### Comment ajouter ou modifier un tableau ?

1. Studio → **Tableau**.
2. Ouvrir un tableau existant ou **Create new**.
3. Renseigner : **Titre**, **Slug**, **Année**, **Référence (catalogue)** (optionnel mais recommandé pour la cote), **Technique**, **Thème**, **Statut**, **Dimensions**, **Description**, **Image**, **Série**, etc. Cochez **Galerie** pour qu’il apparaisse en galerie sur le site.
4. Sauvegarder / publier.

Les **Techniques**, **Thèmes**, **Séries** et **Statuts** se gèrent dans les entrées correspondantes du menu Studio (créer d’abord une technique, un thème, etc., puis les choisir dans le formulaire du tableau).

---

## 4. Critiques et Enseignement

### Différence importante : « Expositions » vs « Critiques »

- **Expositions** (menu / section Expositions) = **vos** expositions personnelles (lieu, dates, lien). Contenu géré dans le Studio sous **Exposition**.
- **Critiques → Expositions à voir** = **vos articles** sur des expositions en général (critiques, regards). Contenu géré dans le Studio sous **Critiques** (ressources), avec la catégorie **Expositions à voir**.

Donc : « Expositions » = vos expos ; « Expositions à voir » = vos textes sur les expos.

### Navigation dans le Studio (arbre)

Dans le menu de gauche, **Critiques** et **Enseignement** sont organisés en **arbre** :

1. Ouvrez une racine (ex. Histoire de l’art), puis une sous-catégorie si besoin.
2. **Articles de ce niveau** : uniquement les textes rattachés à cette catégorie (pas tout le mélange de la branche).
3. **Tous les articles (branche)** : vue d’ensemble du sous-arbre (y compris les anciens textes encore classés par l’ancien champ catégorie).
4. Une feuille sans sous-catégorie ouvre directement la liste des articles.
5. En bas : **Sans catégorie**, puis **Catégories** (arbre pour créer / éditer / imbriquer les catégories).

Après avoir créé une nouvelle sous-catégorie, **rafraîchir le Studio** (F5) si elle n’apparaît pas tout de suite dans l’arbre.

### Formulaire adaptatif

Le premier champ d’une **Ressource** est **Catégorie**. Une fois choisie, le formulaire n’affiche que les champs utiles (ex. dates début/fin pour une exposition à voir, infos atelier pour un stage — pas pour un chapitre d’histoire de l’art).

Sur chaque **catégorie racine**, renseignez le **Profil d’édition** (Article, Exposition à voir, Atelier / stage, Chapitre). Les sous-catégories héritent du parent si le profil est laissé vide.

### Où apparaissent les textes sur le site ?

- **Critiques** : **Critiques littéraires** et **Expositions à voir**.
- **Enseignement** : **Ateliers & Stages**, **Histoire de l’art**, **Technique picturale**.

Tous ces textes sont des documents **Ressource**. Le champ **Catégorie** (référence) détermine où ils s’affichent. Pour Histoire de l’art et Technique picturale, **Ordre d’affichage** ordonne les chapitres dans le sommaire. Voir aussi [MIGRATION_CATEGORIES.md](MIGRATION_CATEGORIES.md) et [GUIDE_PEINTRE.md](GUIDE_PEINTRE.md).

### Catégories racines (référence)

| Affichage sur le site | Slug | Profil d’édition recommandé |
|----------------------|------|-------------------------------|
| Critiques littéraires | `critiques-litteraires` | Article |
| Expositions à voir | `oeil-expo` | Exposition à voir |
| Ateliers & Stages | `atelier-stages` | Atelier / stage |
| Histoire de l’art | `histoire-art` | Chapitre |
| Technique picturale | `technique-picturale` | Chapitre |

### Stages (Ateliers & Stages)

Les stages sont dans **Enseignement** → **Ateliers & Stages**. Créez de préférence l’article **depuis ce dossier** dans l’arbre : la catégorie et le formulaire atelier sont préremplis.

### Gérer les catégories (créer, renommer, réordonner)

Studio → **Critiques** ou **Enseignement** → **Catégories** : naviguez dans l’arbre, ouvrez **Éditer cette catégorie**, ou créez une **sous-catégorie** / **nouvelle catégorie racine**. Les libellés du site suivent ces documents. Détails : [MIGRATION_CATEGORIES.md](MIGRATION_CATEGORIES.md).

**Ancienne méthode (développeur)** : si aucune catégorie n’existe dans Sanity, le site utilise `src/sanity/constants/resourceCategories.ts` (et éventuellement `Critiques.tsx` / `Enseignement.tsx`).

### Comment ajouter ou modifier un texte (Critiques ou Enseignement) ?

1. Studio → **Critiques** ou **Enseignement** → descendre jusqu’à la bonne catégorie (recommandé), ou créer une Ressource et choisir **Catégorie** en premier.
2. **Create new** / ouvrir un document existant.
3. Renseigner **Titre**, **Slug**, **Extrait**, **Contenu**, **Image**, etc. Les champs dates / atelier n’apparaissent que s’ils correspondent à la catégorie.
4. Sauvegarder / publier.

Les articles encore uniquement en « Catégorie (ancien) » restent visibles dans **Tous les articles (branche)** ; pour les voir dans « Articles de ce niveau », renseignez le champ **Catégorie** (référence).

---

## 5. Presse et dossier de presse

### Articles de presse et citations

- **Article de presse** (Studio) = un article **sur vous** / votre œuvre. Il apparaît dans la section Presse du site (liste d’articles avec lien, extrait).
- **Citation presse** (Studio) = une citation **sur vous** / votre œuvre. Elle apparaît dans la section Presse sous forme d’encart.

Pour ajouter un article : Studio → **Article de presse** → Create new, puis renseigner Titre, Publication, Date, Extrait, URL, Image, Slug, Contenu.  
Pour ajouter une citation : Studio → **Citation presse** → Create new, puis Citation, Auteur, Publication, Date.

### Dossier de presse (PDF)

Le lien **« Télécharger le dossier de presse (PDF) »** dans la section Presse est pour l’instant **inactif** : aucun fichier ni URL n’est géré dans le Studio.

**Marche à suivre manuelle :**

1. Préparer un PDF (regroupement d’articles, bio, photos).
2. L’héberger (votre hébergeur, Cloudflare R2, ou autre) et récupérer l’URL du fichier.
3. Communiquer cette URL au développeur pour qu’il la branche sur le bouton.

Si une évolution du site est prévue (champ « URL du dossier de presse » dans les paramètres), vous pourrez ensuite coller vous-même l’URL dans le Studio.

---

## 6. Biographie et photo

La biographie affichée sur le site provient du type **Biographie** dans le Studio (un seul document utilisé).

### Pourquoi l’onglet Biographie est vide ?

Si, dans le Studio, vous ouvrez **Biographie** et ne voyez aucun document, c’est qu’**aucun document Biographie** n’a encore été créé. Dans ce cas, le site affiche une biographie par défaut (données de secours dans le code). Dès que vous créez un document Biographie et le remplissez, le site l’utilise à la place.

### Comment changer la biographie et la photo ?

1. Studio → **Biographie**.
2. S’il n’y a aucun document : cliquer sur **Create new** (ou équivalent) pour créer un document **Biographie**.
3. Renseigner : **Texte** (biographie rédigée), **Portrait** (image), **Année de naissance**, **Nationalité**, **Formation**, **Prix**, **Activités professionnelles**, **Galerie**, **Diplômes**, etc.
4. Sauvegarder / publier. Le site affichera aussitôt cette biographie et ce portrait.

**Mise à jour après modification :** Dès que vous modifiez la biographie, elle passe en **brouillon**. Pour que le site affiche la nouvelle version, cliquez sur **« Publier »** dans la barre d’actions du document. Les boutons **« Dépublier »** (retirer la version en ligne) et **« Publier »** (mettre en ligne le brouillon) sont toujours visibles pour la Biographie selon l’état du document.

---

## 7. Paramètres du site (page d’accueil)

Les textes de la **page d’accueil** (bandeau principal, titres de sections, contact, messages du formulaire, menu, footer) se modifient dans le Studio sous **Paramètres du site** (ou **Site settings**).

1. Studio → **Paramètres du site** (ou **Site settings**).
2. Ouvrir le document existant (il n’y en a qu’un).
3. Modifier les champs proposés (hero : titre, sous-titre, CTA ; contact : titres, textes, messages ; menu ; footer).
   - **Image de fond (accueil)** : utilisée si le diaporama ci-dessous est vide.
   - **Images du diaporama (accueil)** : liste d’images qui défilent en fond à l’accueil (8 secondes par image). L’ordre est celui de la liste ; à chaque visite, le diaporama commence par une image choisie aléatoirement. Glisser les éléments pour réordonner ; renseigner le texte alternatif pour chaque image si besoin.
4. **Lien Instagram** et **Lien LinkedIn** : indiquer l'**URL complète du profil** (ex. `https://www.instagram.com/votrenom`), et non pas seulement `https://instagram.com` ou `https://linkedin.com`, sinon le lien mènera vers la page d'accueil du réseau au lieu de votre profil.
5. Sauvegarder / publier.

---

## 8. Enregistrement de vidéos (OBS Studio)

Le site n’enregistre pas les vidéos ; il peut en **afficher** via une URL (YouTube, Vimeo, ou hébergement propre). Les champs **URL vidéo** existent déjà dans certains contenus (Ressource, Journal).

**Recommandation pour enregistrer des vidéos** (démonstrations, ateliers, etc.) : **OBS Studio** est un bon choix — gratuit, compatible Windows 10 et 11, permet l’enregistrement écran et webcam et l’export en vidéo. Une fois la vidéo en ligne, renseignez son URL dans le Studio (Ressource ou Journal) dans le champ **URL vidéo** pour qu’elle s’affiche sur le site.

---

## 9. À savoir / Limites actuelles

- **Expositions** : le statut (En cours, À venir, Archives) est calculé automatiquement à partir des dates ; pas de case à cocher.
- **« En savoir plus »** : affiché seulement si un **Lien externe** est renseigné ; vide = pas de bouton.
- **Galerie** : pas de recherche par titre ni par référence ; pas de champ référence (ex. 01T25) sur les tableaux. Affichage : titre + année ; tri par année.
- **Dossier de presse** : le bouton PDF est inactif tant qu’une URL n’est pas configurée (voir section Presse).
- **Biographie** : si aucun document Biographie n’existe dans le Studio, le site affiche une biographie par défaut.

---

## 10. Référencement (SEO) et sitemap

Un **sitemap XML** (`sitemap.xml`) est généré pour aider les moteurs de recherche à découvrir et indexer les pages du site.

- **Génération** : le sitemap est créé automatiquement à chaque **build** (`npm run build`). Vous pouvez aussi le générer à la demande avec `npm run generate-sitemap`.
- **Contenu** : lorsqu’un projet Sanity est configuré (variables d’environnement dans `.env`), le script inclut l’accueil, le Studio, et toutes les URLs des articles de presse, du journal, des critiques et de l’enseignement. Sans Sanity, seules l’accueil et le Studio sont listées.
- **URL de base** : par défaut le sitemap utilise `https://absil.fr`. Pour un autre domaine, définir `VITE_SITE_URL` ou `SITE_URL` dans `.env` (ex. `SITE_URL=https://votresite.com`).
- **Soumission** : après déploiement, vous pouvez soumettre l’URL du sitemap (ex. `https://absil.fr/sitemap.xml`) dans [Google Search Console](https://search.google.com/search-console) et Bing Webmaster Tools pour améliorer l’indexation.

---

## 11. Améliorations prévues ou possibles

Ces évolutions peuvent être mises en œuvre selon vos besoins ; elles ne sont pas incluses dans la version actuelle du site :

- **Expositions** : possibilité de masquer le lien « En savoir plus » ou de proposer un lien interne (vers une page du site).
- **Tableaux** : évolutions complémentaires possibles (recherche par titre en galerie, etc.).
- **Dossier de presse** : champ « URL du dossier de presse (PDF) » dans les paramètres du site, pour que vous puissiez mettre à jour le lien vous-même.
- **Clarification** : libellés ou sous-titres sur le site pour distinguer clairement « Mes expositions » (vos expos) et « Mes textes sur les expos » (Critiques → Expositions à voir).

Ces améliorations pourront être détaillées et planifiées avec le développeur si vous le souhaitez.
