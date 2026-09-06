# Scripts de migration et d’upload en masse

Ces scripts s’exécutent en Node et écrivent dans le projet Sanity. Ils utilisent les variables d’environnement du fichier `.env` à la racine du projet.

## Variables d’environnement

- `VITE_SANITY_PROJECT_ID` ou `SANITY_PROJECT_ID` : identifiant du projet Sanity
- `VITE_SANITY_DATASET` ou `SANITY_DATASET` : nom du dataset (ex. `production`)
- `SANITY_API_TOKEN` : token d’API avec droits d’écriture (création / modification de documents). À générer dans [sanity.io/manage](https://sanity.io/manage) (Project → API → Tokens).

Sans `SANITY_API_TOKEN`, les scripts ne pourront pas créer ni modifier de documents.

## Migration depuis des fichiers locaux

Crée un document **tableau** par fichier image dans le dossier, et un document **À classer** pour chaque fichier non image (contenu texte extrait).

```bash
npm run migrate:local -- --dir=./chemin/vers/photos [--csv=./metadonnees.csv] [--default-year=2024] [--gallery] [--dry-run]
```

- `--dir` : dossier contenant les images (obligatoire)
- `--csv` : fichier CSV (séparateur `;`) avec colonnes : `file`, `title`, `year`, `technique_slug`, `theme_slug`, `status_slug`, `dimensions`, `description`
- `--default-year` : année par défaut si non fournie
- `--gallery` : afficher tous les tableaux créés dans la galerie
- `--dry-run` : afficher les actions sans écrire dans Sanity

## Migration depuis le site web (URLs fournies)

Récupère le HTML des URLs indiquées et **met à jour ou crée** un document **À classer** par URL (identifiant déterministe). Chaque document contient un champ **Contenu** (Portable Text) avec texte, **liens cliquables** et **images** téléversées dans Sanity, plus le texte brut et l’HTML de secours.

```bash
npm run migrate:website -- --url=https://hugues-absil.com [--url=...] [--urls=url1,url2] [--delay=800] [--dry-run]
```

- `--url` : une URL (répétable)
- `--urls` : plusieurs URLs séparées par des virgules
- `--delay` : délai en ms entre chaque requête (défaut 800)
- `--dry-run` : ne pas écrire dans Sanity (aucun token requis pour tester l’extraction)

Les pages détectées comme **listes** (extraits + « continuer la lecture » / équivalent) sont **ignorées**.

## Crawl complet du site (découverte automatique)

Une URL de base : le script parcourt **toutes les pages HTML** du même site (file d’attente + liens internes), et importe chaque page en **À classer** (même format que ci‑dessus). Ne crée plus de tableaux, expositions, etc. automatiquement.

```bash
npm run crawl:site -- --url=https://hugues-absil.com [--max-pages=800] [--delay=800] [--dry-run]
```

- `--url` : URL de base (obligatoire)
- `--max-pages` : nombre max de pages à traiter (défaut 800 ; augmenter si le site est très grand)
- `--delay` : délai en ms entre chaque requête (défaut 800)
- `--dry-run` : afficher les actions sans écrire dans Sanity

Chemins exclus par défaut : `wp-admin`, fichiers médias directs, flux RSS, etc. Les **pages liste** sont ignorées comme pour `migrate:website`.

## Upload en masse de tableaux

Crée un document **tableau** par image dans le dossier (titre dérivé du nom de fichier).

```bash
npm run bulk-upload-paintings -- --dir=./photos [--default-year=2024] [--gallery] [--dry-run]
```

## Édition en masse dans le Studio

Une fois le site et le Studio lancés (`npm run dev`), ouvrir `/studio` puis la barre d’outils :

- **Édition en masse (tableaux)** : sélection multiple et champs (technique, thème, statut, série, année, etc.).
- **Suppression en masse** : choisir un **type de document** (dont **À classer**, expositions, ressources, tableaux…), cocher les entrées (ou **Tout sélectionner**), puis **Supprimer la sélection**. Action irréversible.
- **Médias orphelins** : images sans document référent ; suppression possible ou **rattachement** à un document (ID Sanity) en ajoutant un bloc image au champ **Contenu**.
