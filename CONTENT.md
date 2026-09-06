# Modifier le contenu du site (sans coder)

Ce guide s'adresse à toute personne qui souhaite modifier les textes, images et liens du site **sans utiliser Cursor ni écrire de code**.

## Où modifier le site ?

1. **Ouvrez le site** dans votre navigateur (en local : `http://localhost:5173`, ou l'URL de votre site en ligne).
2. **Allez sur l'interface d'édition** en ajoutant `/studio` à la fin de l'adresse :
   - Exemple : `https://votre-site.com/studio` ou `http://localhost:5173/studio`
3. **Connectez-vous** à Sanity si demandé (avec le compte utilisé pour le projet).
4. Dans le menu de gauche, vous verrez notamment :
   - **Paramètres du site**
   - Biographie
   - Tableaux (peintures)
   - Expositions
   - Presse (articles et citations)
   - Films sur l'artiste
   - Journal (articles accessibles par lien direct uniquement)
   - Performances (vidéos YouTube)
   - Ressources

## Paramètres du site (textes généraux)

En cliquant sur **Paramètres du site**, vous pouvez modifier :

- **Nom du site** : affiché en haut de page (en-tête), en pied de page et dans le copyright.
- **Accueil (Hero)** : image de fond, titre principal, sous-titre, texte du bouton « Découvrir la Galerie ».
- **Menu de navigation** : libellés et ancres des liens (Accueil, Galerie, Expositions, Biographie, Films, Presse, Performances, Ressources théoriques, Contact). La section « Films » n’apparaît dans le menu que s’il existe au moins un film.  
  Pour un lien vers une section de la page d'accueil, utilisez une ancre comme `#gallery`, `#performances`, `#contact`, etc.  
  La section « Journal » n'est plus affichée sur la page d'accueil que s'il y a des articles ; les articles restent accessibles via leurs liens directs.
- **Pied de page** : sous-titre, titres des blocs « Navigation » et « Réseaux Sociaux », liens Instagram et LinkedIn, email de contact.
- **Section Contact** : titre, texte d'introduction, bloc « Informations », messages de succès et d'erreur du formulaire.

Après avoir modifié un champ, **publiez** (bouton « Publish ») pour que les changements apparaissent sur le site.

## Autres contenus

- **Biographie** : texte, portrait, formation, récompenses, activités, galerie, diplômes.
- **Tableaux** : œuvres affichées dans la galerie (titre, année, technique, thème, image, etc.).
- **Expositions** : dates, lieu, ville, pays, lien externe, image, description.
- **Presse** : articles (titre, publication, date, extrait, URL, image) et citations.
- **Films sur l'artiste** : films sur la vision et la manière de peindre (titre, réalisateur, année, résumé, URL vidéo, affiche, durée, statut). Optionnel : article / note explicative avec texte enrichi (paragraphes, images, vidéos, mise en page, comme un article de presse), affiché dans un bloc « En savoir plus » sous la carte. La section « Films » n’est affichée que s’il existe au moins un film.
- **Journal** : articles avec titre, extrait, contenu, catégorie, image, vidéo, tags (accessibles par lien direct ; affichés en section sur la page d'accueil lorsqu'il y en a).
- **Performances** : vidéos YouTube de performances artistiques (titre optionnel, URL, ordre d'affichage).
- **Ressources** : contenus par catégorie (ateliers, tutoriels, etc.).

## En cas de problème

- Si `/studio` ne s'ouvre pas ou affiche une erreur, vérifiez que le fichier `.env` contient bien `VITE_SANITY_PROJECT_ID` et `VITE_SANITY_DATASET` (voir README).
- Pour la production, l'URL du site doit être ajoutée dans les « CORS origins » du projet Sanity sur [sanity.io/manage](https://sanity.io/manage).
