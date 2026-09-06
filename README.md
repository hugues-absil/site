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

Pour un build destiné à GitHub Pages (base path `/site/`) :

```bash
GITHUB_PAGES=true npm run build
```

(sous PowerShell : `$env:GITHUB_PAGES="true"; npm run build`)

## GitHub Pages (déploiement automatique)

Le site est déployé automatiquement sur **https://hugues-absil.github.io/site/** à chaque push sur `main` via GitHub Actions (voir [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml)).

### Configuration initiale (une seule fois)

1. **Settings → Pages → Build and deployment** : choisir **GitHub Actions** comme source (pas « Deploy from branch »).
2. **Settings → Secrets and variables → Actions** : ajouter si besoin :
   - `VITE_SANITY_PROJECT_ID`
   - `VITE_SANITY_DATASET` (ex. `production`)
3. **Sanity CORS** : ajouter `https://hugues-absil.github.io` sur [sanity.io/manage](https://sanity.io/manage).

### Développement local

```bash
npm install
npm run dev
```

Sans variables Sanity, le site utilise les données de fallback dans `src/data/`.

## Données (Sanity / fallback)

- Sans variables d'environnement Sanity, le site utilise les données de fallback dans `src/data/`.
- Pour utiliser Sanity : copier `.env.example` en `.env` et renseigner `VITE_SANITY_PROJECT_ID` et `VITE_SANITY_DATASET` (ex. Project ID : `g5s39v35`).

## Sanity Studio

Sanity Studio est intégré sur la route `/studio` (ex. [http://localhost:5173/studio](http://localhost:5173/studio)). Il permet d’éditer **tout le contenu du site** : paramètres du site (nom, accueil, menu, pied de page, contact), biographie, tableaux, expositions, presse, journal, ressources.

**Guide pour modifier le site sans coder** : voir [CONTENT.md](CONTENT.md).

**CORS** : pour que le Studio fonctionne, ajouter l’origine du site dans les CORS du projet Sanity :

- **Développement** : [sanity.io/manage](https://sanity.io/manage) → projet → API → CORS origins → ajouter `http://localhost:5173` (avec « Allow credentials » si besoin).
- **Production** : ajouter `https://hugues-absil.github.io` dans les CORS origins du projet sur [sanity.io/manage](https://sanity.io/manage).

## Déploiement / production

Le déploiement sur GitHub Pages est **automatique** (workflow CI). Pour d'autres plateformes (Netlify, Vercel) :

- **Variables d'environnement au build** : définir `VITE_SANITY_PROJECT_ID` et `VITE_SANITY_DATASET`.
- **CORS Sanity** : ajouter l'URL de production dans les CORS origins du projet.
- **Base path** : pour GitHub Pages, le workflow définit `GITHUB_PAGES=true` (base `/site/`). Pour un autre chemin, utiliser `VITE_BASE_PATH=/nom-du-repo/`.

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
