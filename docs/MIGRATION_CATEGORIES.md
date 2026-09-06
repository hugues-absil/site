# Migration des catégories vers Sanity (Phase 2)

Ce document décrit comment passer des catégories « en dur » aux **catégories gérées dans Sanity**, afin de pouvoir créer, renommer et ordonner les catégories (Écrits / Enseignement) directement depuis le Studio.

## Comportement actuel

- Le site peut afficher les catégories définies dans le code (liste de secours) **ou** celles créées dans Sanity.
- Si des documents **Catégorie (Écrits / Enseignement)** existent dans Sanity, ils sont utilisés pour les cartes sur la page d’accueil (Écrits, Enseignement) et pour les libellés des pages.
- Les **Ressource** (articles, chapitres) peuvent avoir soit l’ancien champ **Catégorie (ancien)** (liste déroulante), soit le champ **Catégorie** (référence vers un document Catégorie). Si les deux sont renseignés, la **référence** est utilisée.
- **Hiérarchie** : une catégorie peut avoir une **Catégorie parente**. Seules les catégories **sans parent** apparaissent comme cartes sur la page d’accueil (ex. Ateliers & Stages, Histoire de l’art, Technique picturale). Les sous-catégories (ex. « Cubisme » avec parent « Histoire de l’art ») n’apparaissent pas comme nouvelle carte ; les articles classés dans « Cubisme » s’affichent **dans la page Histoire de l’art**.

## Étape 1 : Créer les documents Catégorie dans le Studio

1. Ouvrez le **Studio** (URL du site + `/studio`).
2. Dans le menu de gauche, cliquez sur **Catégorie (Écrits / Enseignement)**.
3. Créez un document pour chaque catégorie existante en cliquant sur **Create new**. Renseignez pour chacun :

   | Titre                  | Slug (générer depuis le titre) | Description                                      | Section      | Ordre | Afficher un sommaire des chapitres |
   |------------------------|---------------------------------|--------------------------------------------------|-------------|-------|-------------------------------------|
   | Critiques littéraires  | critiques-litteraires          | Articles et commentaires sur les livres d'art…  | Écrits      | 1     | Non                                 |
   | Expositions à voir    | oeil-expo                      | Articles sur les expositions récentes            | Écrits      | 2     | Non                                 |
   | Ateliers & Stages      | atelier-stages                 | Stages de peinture, cours en atelier…            | Enseignement| 1     | Non                                 |
   | Histoire de l'art      | histoire-art                   | Cours et contenus théoriques                     | Enseignement| 2     | **Oui**                             |
   | Technique picturale   | technique-picturale            | Cours sur les matériaux et techniques            | Enseignement| 3     | **Oui**                             |

4. Pour **Histoire de l'art** et **Technique picturale**, cochez **Afficher un sommaire des chapitres** pour que la page de la catégorie affiche un sommaire et que chaque article ait des liens « Chapitre précédent » / « Chapitre suivant ».
5. **Sauvegardez** chaque document et **publiez-le**.

Une fois ces documents créés, les cartes **Écrits** et **Enseignement** sur la page d’accueil utiliseront ces catégories (titres, descriptions, ordre). Les pages de liste (/ecrits/…, /enseignement/…) utiliseront aussi ces libellés.

## Étape 2 (optionnel) : Lier les Ressource aux nouvelles catégories

Pour que chaque article (Ressource) soit relié à la catégorie Sanity plutôt qu’à l’ancienne liste :

1. Studio → **Ressource**.
2. Ouvrez une ressource (ex. un article « Histoire de l’art »).
3. Dans le champ **Catégorie** (référence), sélectionnez le document **Catégorie** correspondant (ex. « Histoire de l'art »).
4. Vous pouvez laisser ou vider le champ **Catégorie (ancien)** ; s’il est masqué une fois la référence renseignée, c’est normal.
5. Sauvegardez et publiez.

Répétez pour toutes les ressources. Tant qu’une ressource n’a pas de **Catégorie** (référence), le site utilise **Catégorie (ancien)** pour savoir dans quelle catégorie l’afficher ; l’URL et le libellé restent cohérents grâce au slug identique (ex. `histoire-art`).

## Créer une nouvelle catégorie

### Catégorie principale (nouvelle carte sur l’accueil)

1. Studio → **Catégorie (Écrits / Enseignement)** → **Create new**.
2. Renseignez **Titre**, **Slug** (ex. `anatomie`), **Description**, **Section** (Écrits ou Enseignement), **Ordre d’affichage**.
3. **Ne renseignez pas** le champ **Catégorie parente**.
4. Cochez **Afficher un sommaire des chapitres** si cette catégorie doit avoir un sommaire et une navigation chapitre précédent/suivant.
5. Sauvegardez et publiez.

La nouvelle catégorie apparaît comme carte dans la section correspondante sur la page d’accueil.

### Sous-catégorie (à l’intérieur d’une catégorie existante)

Pour une thématique qui doit apparaître **dans** une catégorie existante (ex. « Cubisme » dans « Histoire de l’art »), sans créer une nouvelle carte sur l’accueil :

1. Studio → **Catégorie (Écrits / Enseignement)** → **Create new**.
2. Renseignez **Titre** (ex. Cubisme), **Slug** (ex. `cubisme`), **Description**, **Section** (même section que le parent, ex. Enseignement).
3. Dans **Catégorie parente**, sélectionnez la catégorie concernée (ex. « Histoire de l'art »).
4. Sauvegardez et publiez.

Les articles dont la **Catégorie** (référence) est « Cubisme » s’afficheront sur la page **Histoire de l’art** (/enseignement/histoire-art), avec les autres chapitres. Le lien « Retour à » et le sommaire restent sur la page du parent. La structure des cartes sur l’accueil (Stages, Histoire de l’art, Technique picturale) ne change pas.

## Renommer ou réordonner

- **Renommer** : modifiez le **Titre** (et le **Slug** si besoin) du document Catégorie, puis sauvegardez et publiez. Le site se met à jour partout.
- **Réordonner** : modifiez le champ **Ordre d’affichage** des documents Catégorie ; l’ordre des cartes sur l’accueil et, le cas échéant, des listes suit cet ordre.
