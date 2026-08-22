# Site Hugues Absil — React + Vite

Site vitrine de l'artiste peintre Hugues Absil, migré de Next.js vers React + Vite pour un déploiement statique (notamment GitHub Pages).

## Développement

```bash
npm install
npm run dev
```

Ouvre [http://localhost:5173](http://localhost:5173).

## Build

```bash
npm run build
```

Sortie dans `dist/`.

Pour un build destiné à GitHub Pages (avec base path `/Site-Hugues-Vite-React/`) :

```bash
set GITHUB_PAGES=true
npm run build
```

(sous PowerShell : `$env:GITHUB_PAGES="true"; npm run build`)

## Données (Sanity / fallback)

- Sans variables d'environnement Sanity, le site utilise les données de fallback dans `src/data/`.
- Pour utiliser Sanity : copier `.env.example` en `.env` et renseigner `VITE_SANITY_PROJECT_ID` et `VITE_SANITY_DATASET` (ex. Project ID : `g5s39v35`).

## Sanity Studio

Sanity Studio est intégré sur la route `/studio` (ex. [http://localhost:5173/studio](http://localhost:5173/studio)). Il permet d’éditer **tout le contenu du site** : paramètres du site (nom, accueil, menu, pied de page, contact), biographie, tableaux, expositions, presse, journal, ressources.

**Guide pour modifier le site sans coder** : voir [CONTENT.md](CONTENT.md).

**CORS** : pour que le Studio fonctionne, ajouter l’origine du site dans les CORS du projet Sanity :

- **Développement** : [sanity.io/manage](https://sanity.io/manage) → projet → API → CORS origins → ajouter `http://localhost:5173` (avec « Allow credentials » si besoin).
- **Production** : ajouter l’URL du site (ex. `https://votre-domaine.github.io` ou `https://votre-domaine.github.io/Site-Hugues-Vite-React`).

## Déploiement / production

Pour que le site en ligne fonctionne correctement (données Sanity, images in situ, portrait de la bio) :

- **Variables d'environnement au build** : définir `VITE_SANITY_PROJECT_ID` et `VITE_SANITY_DATASET` sur la plateforme (Netlify, Vercel, GitHub Actions, etc.) pour que les données et images in situ viennent de Sanity en production.
- **CORS Sanity** : ajouter l’URL du site en production (ex. `https://votredomaine.com` ou `https://username.github.io/repo/`) dans les CORS origins du projet sur [sanity.io/manage](https://sanity.io/manage).
- **Base path** : si le site est servi sous un sous-chemin (ex. GitHub Pages à `https://hugues-absil.github.io/site/`), le build avec `GITHUB_PAGES=true` utilise le base path `/site/`. Pour un autre chemin, définir `VITE_BASE_PATH=/nom-du-repo/` dans `.env`.

## GitHub Pages

1. Créer un dépôt (ex. `site` pour une URL `https://<username>.github.io/site/`).
2. Build avec base path : `GITHUB_PAGES=true npm run build` (par défaut base `/site/` ; pour un autre chemin, définir `VITE_BASE_PATH=/nom-du-repo/` dans `.env`).
3. Déployer le contenu de `dist/` sur la branche `gh-pages` ou via l’option "GitHub Pages" (source : dossier ou branch selon votre config).
4. L’URL du site sera du type : `https://<username>.github.io/site/` (ou le chemin défini par `VITE_BASE_PATH`).

Pour que les routes (ex. `/blog/xxx`) fonctionnent au rafraîchissement, configurer une page 404 personnalisée qui redirige vers `index.html` avec le path (technique SPA classique sur GitHub Pages).

### Domaine personnalisé (absil.fr)

Pour que le site soit accessible sur **absil.fr** au lieu de `username.github.io/site` :

1. **Build pour la racine du domaine**  
   Avec un domaine personnalisé, le site est servi à la racine. Mettre dans `.env` :
   ```env
   GITHUB_PAGES=false
   ```
   Puis build : `npm run build`. Le fichier `public/CNAME` (contenant `absil.fr`) est copié dans `dist/` automatiquement.

2. **Paramètres GitHub**  
   Dans le dépôt : **Settings → Pages → Custom domain** : saisir `absil.fr` et enregistrer. Cocher **Enforce HTTPS** une fois le DNS propagé.

3. **DNS chez votre registrar**  
   Chez le gestionnaire du domaine (OVH, Gandi, etc.) :
   - **Pour le domaine nu (absil.fr)** : créer 4 enregistrements **A** pointant vers :
     - `185.199.108.153`
     - `185.199.109.153`
     - `185.199.110.153`
     - `185.199.111.153`
   - **Pour www.absil.fr** (optionnel) : un enregistrement **CNAME** `www` → `votre-username.github.io`.

4. **CORS Sanity**  
   Ajouter `https://absil.fr` et `https://www.absil.fr` dans les CORS origins du projet Sanity.

La propagation DNS peut prendre jusqu’à 48 h. Une fois terminée, le site sera accessible sur **https://absil.fr**.
