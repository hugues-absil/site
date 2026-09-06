# Guide pas à pas – Mise à jour du site (pour le peintre)

Ce guide décrit les gestes à faire dans le **Studio** (back-office du site) pour mettre à jour le contenu **sans compétence technique**. Chaque action est détaillée étape par étape.

---

## 1. Ouvrir le Studio

1. Ouvrez votre navigateur (Chrome, Firefox, Edge, etc.).
2. Dans la barre d’adresse, tapez l’adresse de votre site (ex. `https://votresite.com`).
3. À la fin de l’adresse, ajoutez **`/studio`** (ex. `https://votresite.com/studio`).
4. Appuyez sur Entrée. La page du Studio s’affiche en plein écran.
5. Si on vous demande de vous connecter, utilisez les identifiants fournis par la personne qui a mis en place le site.

**À retenir** : le **menu à gauche** liste les types de contenu (Exposition, Ressource, Tableau, etc.). En cliquant sur un type, vous voyez la liste des documents. En cliquant sur un document ou sur **Create new**, vous modifiez ou créez un contenu.

---

## 2. Gérer les catégories (Critiques / Enseignement)

Les catégories (ex. « Histoire de l'art », « Technique picturale ») déterminent où apparaissent vos textes sur le site. Vous pouvez les créer, les renommer et les réordonner dans le Studio.

### Créer une nouvelle catégorie

1. Dans le menu de gauche, cliquez sur **Catégorie (Critiques / Enseignement)**.
2. Cliquez sur **Create new** (ou le bouton équivalent de création).
3. Renseignez les champs :
   - **Titre** : le nom affiché sur le site (ex. « Anatomie »).
   - **Slug** : cliquez sur **Generate** pour le générer à partir du titre, ou saisissez un mot sans espaces ni accents (ex. `anatomie`). Ce slug sert dans l’URL.
   - **Description** : une courte phrase qui décrit la catégorie (affichée sous le titre sur la page de la catégorie).
   - **Section** : choisissez **Critiques** ou **Enseignement** selon l’endroit où doit apparaître la catégorie sur le site.
   - **Ordre d'affichage** : un numéro (1, 2, 3…) pour l’ordre des cartes sur la page d’accueil (1 = en premier).
   - **Afficher un sommaire des chapitres** : cochez cette case si cette catégorie contient des chapitres que vous voulez voir listés dans un sommaire en tête de page, avec des liens « Chapitre précédent » / « Chapitre suivant » en bas de chaque article.
   - **Catégorie parente** : laissez **vide** pour que la catégorie apparaisse comme carte sur l’accueil (ex. Histoire de l’art, Technique picturale). Si vous créez une **sous-catégorie** (ex. « Cubisme » qui doit apparaître **dans** Histoire de l’art), renseignez ici la catégorie parente (Histoire de l’art) : la nouvelle catégorie n’apparaîtra pas comme carte, et les articles classés dans « Cubisme » s’afficheront sur la page Histoire de l’art.
4. Cliquez sur **Publish** (Publier) pour que la catégorie soit visible sur le site.

### Renommer une catégorie

1. Menu de gauche → **Catégorie (Critiques / Enseignement)**.
2. Cliquez sur la catégorie à modifier.
3. Modifiez le **Titre** (et le **Slug** si vous voulez changer l’URL).
4. Cliquez sur **Publish**.

### Changer l’ordre des catégories sur l’accueil

1. Menu de gauche → **Catégorie (Critiques / Enseignement)**.
2. Ouvrez chaque catégorie et modifiez le champ **Ordre d'affichage** (1 = premier, 2 = deuxième, etc.).
3. Publiez chaque document modifié.

---

## 3. Ajouter ou modifier un article (chapitre) – Ressource

Les textes des sections **Critiques** et **Enseignement** (critiques, expos à voir, ateliers, histoire de l’art, technique picturale) sont des **Ressource**.

### Créer un nouvel article

1. Dans le menu de gauche, cliquez sur **Ressource**.
2. Cliquez sur **Create new**.
3. Renseignez au minimum :
   - **Titre** : le titre de l’article.
   - **Slug** : cliquez sur **Generate** pour le générer à partir du titre.
   - **Catégorie** : dans la liste déroulante (ou le champ **Catégorie** référence si vous utilisez les catégories Sanity), choisissez la catégorie dans laquelle doit apparaître l’article (ex. « Technique picturale », « Histoire de l'art »).
   - **Extrait** : un court résumé (quelques lignes).
   - **Contenu** : le texte complet de l’article (vous pouvez mettre en gras, des listes, insérer des images).
   - **Date de début** : la date de l’article.
   - **Image de couverture** : une image représentative (glisser-déposer ou sélection de fichier).
4. **Ordre d'affichage** : pour les catégories avec sommaire (ex. Technique picturale, Histoire de l'art), saisissez un **numéro** (1, 2, 3…) pour indiquer la position de cet article dans le sommaire. Par exemple : mettez **1** pour le premier chapitre, **2** pour le deuxième. Si vous laissez vide, l’article sera trié par date.
5. Cliquez sur **Publish**.

### Modifier un article existant

1. Menu de gauche → **Ressource**.
2. Cliquez sur l’article à modifier dans la liste.
3. Modifiez les champs souhaités (titre, extrait, contenu, ordre d’affichage, etc.).
4. Cliquez sur **Publish**.

### Supprimer un article

1. Menu de gauche → **Ressource**.
2. Ouvrez l’article.
3. Utilisez l’option de suppression proposée dans le Studio (souvent dans le menu « ⋮ » ou **Delete**). Confirmez si demandé.

---

## 4. Ordre des chapitres et sommaire

Pour les catégories **Histoire de l'art** et **Technique picturale** (ou toute catégorie pour laquelle « Afficher un sommaire des chapitres » est coché) :

- **Sur la page de la catégorie** (ex. Enseignement → Technique picturale), un **sommaire** liste tous les chapitres en ordre. L’ordre est celui du champ **Ordre d'affichage** (1, 2, 3…) de chaque Ressource.
- **Sur chaque article**, en bas de la page, des liens **Chapitre précédent** et **Chapitre suivant** permettent de passer d’un chapitre à l’autre dans le même ordre.

**Exemple** : pour que « La couleur » soit le chapitre 2 dans Technique picturale, ouvrez la Ressource « La couleur », mettez **2** dans le champ **Ordre d'affichage**, puis publiez.

---

## 5. Où voir le résultat sur le site

- **Page d’accueil** : les cartes des sections Critiques et Enseignement pointent vers les catégories. En cliquant sur une catégorie (ex. « Technique picturale »), vous arrivez sur la page liste de cette catégorie.
- **Page d’une catégorie** (ex. `/enseignement/technique-picturale`) : vous voyez le titre, la description, puis le **sommaire** (si la catégorie est configurée pour), la recherche, et la grille des articles.
- **Page d’un article** : en bas, après le texte et la vidéo éventuelle, vous voyez les liens **Chapitre précédent** et **Chapitre suivant** (pour les catégories avec sommaire), puis éventuellement « Ressources similaires ».

---

## 6. Rappel : autres contenus

- **Expositions** : menu **Exposition** ; les statuts (En cours, À venir, Archives) se calculent à partir des dates.
- **Tableaux** : menu **Tableau** ; cochez **Galerie** pour qu’un tableau apparaisse en galerie.
- **Biographie** : menu **Biographie** (un seul document).
- **Paramètres du site** : menu **Paramètres du site** pour le bandeau d’accueil, le contact, le menu, le pied de page.

Pour plus de détails sur ces contenus, voir le document **MODE_EMPLOI.md** à la racine du dossier `docs`.
