# Résumé pour l'artiste — Fonctionnalités du site (Sanity)

Ce document décrit les **fonctionnalités mises en place** sur votre site et ce que vous pouvez gérer vous-même via **Sanity Studio**, sans avoir à toucher au code.

---

## Accéder à l'interface d'édition

1. Ouvrez votre site dans le navigateur (ex. `https://votre-site.com` ou `http://localhost:5173`).
2. Ajoutez **`/studio`** à la fin de l’adresse :  
   → `https://votre-site.com/studio`
3. Connectez-vous avec votre compte Sanity.
4. Vous pouvez alors modifier **tout le contenu** du site depuis le menu de gauche.

**Important :** après chaque modification, cliquez sur **« Publish »** pour que les changements soient visibles sur le site.

---

## Ce que vous pouvez modifier (résumé des fonctionnalités)

### Paramètres du site (une seule fiche pour tout le site)

- **Nom du site** : affiché en haut de page, en bas et dans le copyright.
- **Page d’accueil** : image de fond, titre principal, sous-titre, texte du bouton « Découvrir la Galerie ».
- **Menu de navigation** : libellés des liens (Accueil, Galerie, Expositions, Biographie, Films, Presse, Performances, Ressources théoriques, Contact). Vous pouvez ajouter, supprimer ou réordonner les entrées.  
  **À noter :** le lien « Films » n’apparaît dans le menu **que s’il existe au moins un film** dans Sanity.
- **Pied de page** : sous-titre, titres des blocs « Navigation » et « Réseaux Sociaux », liens Instagram et LinkedIn, email de contact.
- **Section Contact** : titre, texte d’introduction, bloc « Informations », et messages affichés après l’envoi du formulaire (succès ou erreur).

### Galerie — Nouvelle option « À la une »

- Dans **Paramètres du site**, une option permet de choisir comment s’affichent les œuvres sur la page d’accueil :
  - **Désactivée** (par défaut) : une sélection aléatoire d’œuvres est affichée.
  - **Activée** : seules les œuvres que vous avez marquées **« À la une »** dans chaque tableau sont affichées en premier (jusqu’à 20).
- Vous gardez ainsi le contrôle des œuvres mises en avant sur l’accueil, sans modifier le code.

### Films sur l’artiste

- **Section dédiée** : si vous ajoutez au moins un film dans Sanity, une section « Films » apparaît sur la page d’accueil et le lien « Films » est ajouté au menu.
- Pour chaque film vous pouvez renseigner : titre, réalisateur, lien vers le réalisateur, année, résumé, URL de la vidéo (Vimeo, YouTube, etc.), affiche, durée, statut (En cours, En post-production, Sorti), et ordre d’affichage.
- **Nouvelle fonctionnalité — « En savoir plus »** : vous pouvez ajouter un **article ou une note explicative** riche (paragraphes, images, vidéos, mise en page) pour chaque film. Ce contenu s’affiche dans un bloc « En savoir plus » sous la carte du film, comme un petit article de presse.

### Biographie

- Texte, portrait, formation, récompenses, activités, galerie, diplômes — le tout éditable dans Sanity.

### Tableaux (peintures)

- Titre, année, technique, thème, série, statut, image, et option **« À la une »** pour les mettre en avant sur la galerie d’accueil (si l’option est activée dans les paramètres du site).

### Expositions

- Dates, lieu, ville, pays, lien externe, image, description.

### Presse

- **Articles** : titre, publication, date, extrait, URL, image.
- **Citations** : à gérer séparément dans Sanity.
- Chaque article peut avoir sa propre page dédiée sur le site (lien direct).

### Journal

- Articles avec titre, extrait, contenu, catégorie, image, vidéo, tags.  
- Accessibles par lien direct ; ils ne sont plus affichés en bloc sur la page d’accueil, mais restent disponibles via leurs URLs.

### Performances

- Vidéos YouTube de performances : titre (optionnel), URL, ordre d’affichage.

### Ressources

- Contenus organisés par catégorie (ateliers, tutoriels, etc.), avec leurs propres pages.

---

## En résumé

| Fonctionnalité | Où la gérer dans Sanity | Effet sur le site |
|----------------|-------------------------|-------------------|
| Textes et images de l’accueil, menu, pied de page, contact | **Paramètres du site** | Modifie l’ensemble du site (en-tête, accueil, menu, bas de page, formulaire). |
| Mise en avant des œuvres en galerie | **Paramètres du site** (option « À la une ») + **Tableaux** (cocher « À la une ») | Choisir quelles œuvres apparaissent en premier sur l’accueil. |
| Section Films + lien menu | **Films sur l’artiste** | La section et le lien « Films » n’apparaissent que s’il y a au moins un film. |
| Article « En savoir plus » sous chaque film | **Films sur l’artiste** → champ « Article / note explicative » | Bloc enrichi (texte, images, vidéos) sous la carte du film. |
| Biographie, tableaux, expositions, presse, journal, performances, ressources | Menus correspondants dans Sanity | Contenu affiché dans les sections et pages dédiées du site. |

Tout ce qui est listé ci-dessus est **éditable par vous dans Sanity** : aucune compétence en programmation n’est nécessaire. Après chaque modification, n’oubliez pas de **publier** pour que le site en ligne soit à jour.

Pour le détail champ par champ (quoi remplir où), vous pouvez vous référer au guide **CONTENT.md** dans le même projet.
