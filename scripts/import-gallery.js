/**
 * Import dédié des galeries WordPress de Hugues Absil.
 *
 * Parcourt la page hub de la galerie, suit les liens vers chaque sous-galerie
 * thématique, puis extrait TOUTES les images de tableaux et les importe
 * individuellement dans Sanity en tant que documents "painting".
 *
 * Usage:
 *   node scripts/import-gallery.js --url=https://hugues-absil.com/wordpress/galerie-2/ [--dry-run] [--delay=800] [--gallery=true]
 *
 * Options:
 *   --url          URL de la page galerie hub ou d'une sous-galerie directe
 *   --dry-run      Affiche ce qui serait importé sans rien écrire
 *   --delay=N      Délai en ms entre chaque requête (défaut: 800)
 *   --gallery=true Marquer les tableaux importés comme visibles dans la galerie (défaut: true)
 *
 * .env : VITE_SANITY_PROJECT_ID, VITE_SANITY_DATASET, SANITY_API_TOKEN
 */
import "dotenv/config";
import crypto from "node:crypto";
import * as cheerio from "cheerio";
import { client, hasToken } from "./lib/sanityClient.js";
import { fetchHtml, resolveUrl } from "./lib/websiteUtils.js";

/* ─── Helpers ───────────────────────────────────────────────────────── */

function parseArgs() {
  const args = process.argv.slice(2);
  let url = null;
  let dryRun = false;
  let delay = 800;
  let galleryVisible = true;
  for (const a of args) {
    if (a.startsWith("--url=")) url = a.slice(6).trim();
    else if (a === "--dry-run") dryRun = true;
    else if (a.startsWith("--delay=")) delay = parseInt(a.slice(8), 10) || 800;
    else if (a === "--gallery=false") galleryVisible = false;
  }
  return { url, dryRun, delay, galleryVisible };
}

function slugify(text) {
  return String(text)
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9]+/gi, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();
}

/** ID déterministe basé sur l'URL de l'image (évite les doublons). */
function imageDocId(imageUrl) {
  const hash = crypto.createHash("sha256").update(imageUrl).digest("hex").slice(0, 32);
  return "gallery-" + hash;
}

/** Télécharge une image depuis une URL et retourne un Buffer. */
async function fetchImageBuffer(imageUrl) {
  const res = await fetch(imageUrl, {
    headers: { "User-Agent": "Mozilla/5.0 (compatible; GalleryImport/1.0)" },
  });
  if (!res.ok) throw new Error(`Image HTTP ${res.status} pour ${imageUrl}`);
  const ab = await res.arrayBuffer();
  return Buffer.from(ab);
}

/**
 * Extrait un titre lisible depuis le nom de fichier.
 *
 * Exemples de noms de fichiers WordPress :
 *   13T03.TCHERNOBYL.bd_.jpg  → "13T03 Tchernobyl"
 *   12T25.50x50.jpg           → "12T25 50x50"
 *   09T04-300x200.jpg         → "09T04"
 */
function titleFromFilename(src) {
  try {
    let filename = decodeURIComponent(new URL(src).pathname.split("/").pop() || "");
    // Retirer l'extension
    filename = filename.replace(/\.[^.]+$/, "");
    // Retirer les suffixes WordPress de redimensionnement (-300x200, -1024x768, etc.)
    filename = filename.replace(/-\d+x\d+$/, "");
    // Retirer les suffixes comme .bd_, bdbd_, bd, -bd, fm, etc.
    filename = filename.replace(/[.\-_]?bdbd_?$/i, "");
    filename = filename.replace(/[.\-_]?bd_?$/i, "");
    filename = filename.replace(/[.\-_]?fm_?$/i, "");
    // Retirer les suffixes de tri WordPress (-1, -2, etc.)
    filename = filename.replace(/-\d{1}$/, "");
    // Retirer le suffixe -e suivi de timestamp WordPress
    filename = filename.replace(/-e\d{10,}$/, "");
    // Remplacer les séparateurs par des espaces
    filename = filename.replace(/[._-]+/g, " ").trim();
    return filename || "Sans titre";
  } catch {
    return "Sans titre";
  }
}

/**
 * Extrait un titre lisible à partir du texte alt d'une image
 * ou, à défaut, du nom de fichier.
 *
 * @param {string} alt - texte alt de l'image
 * @param {string} src - URL de l'image
 * @param {boolean} altIsReliable - si false, le alt est considéré comme non fiable (répété)
 */
function extractTitle(alt, src, altIsReliable = true) {
  // Utiliser le alt seulement s'il est fiable, non vide et pas trop générique
  if (altIsReliable && alt && alt.trim().length > 1) {
    return alt.trim();
  }
  return titleFromFilename(src);
}

/**
 * Détecte quels alt sont fiables (uniques) et lesquels sont répétés
 * (hérités d'une galerie WordPress mal configurée).
 * Retourne un Set des alt qui apparaissent plus d'une fois.
 */
function findRepeatedAlts(images) {
  const counts = {};
  for (const img of images) {
    const alt = (img.alt || "").trim();
    if (alt) counts[alt] = (counts[alt] || 0) + 1;
  }
  const repeated = new Set();
  for (const [alt, count] of Object.entries(counts)) {
    if (count > 1) repeated.add(alt);
  }
  return repeated;
}

/**
 * Tente d'extraire une année depuis le titre (format "09T04" → 2009, "12T25" → 2012).
 * Convention : les deux premiers chiffres sont l'année sur 2 digits.
 */
function extractYear(title) {
  const m = title.match(/^(\d{2})[A-Z]/);
  if (m) {
    const yy = parseInt(m[1], 10);
    // Plage raisonnable : 80-99 → 1980-1999, 00-30 → 2000-2030
    return yy >= 80 ? 1900 + yy : 2000 + yy;
  }
  return null;
}

/* ─── Extraction des sous-galeries depuis la page hub ───────────────── */

/**
 * Compare deux origines de manière insensible au protocole (http vs https).
 */
function sameHost(origin1, origin2) {
  return origin1.replace(/^https?:/, "") === origin2.replace(/^https?:/, "");
}

/**
 * Nettoie une URL en retirant les caractères Unicode invisibles
 * (left-to-right mark, zero-width space, etc.) que WordPress ajoute parfois.
 */
function cleanUrl(url) {
  return url.replace(/[\u200E\u200F\u200B\u200C\u200D\uFEFF]/g, "").trim();
}

/**
 * Depuis la page hub, extrait les liens et noms des sous-galeries.
 * Retourne un tableau de { url, theme }.
 */
function extractSubGalleryLinks(html, pageUrl, baseOrigin) {
  const $ = cheerio.load(html);
  const links = [];
  const seen = new Set();

  // Les liens de la galerie sont dans le contenu principal
  // On cherche dans plusieurs sélecteurs possibles
  const contentSelectors = [
    "main a[href]",
    "article a[href]",
    ".entry-content a[href]",
    ".content a[href]",
    "[role='main'] a[href]",
    "body a[href]",
  ];

  for (const sel of contentSelectors) {
    $(sel).each((_, el) => {
      const rawHref = $(el).attr("href");
      if (!rawHref) return;
      const href = cleanUrl(rawHref);
      const full = resolveUrl(pageUrl, href);
      if (!full) return;

      try {
        const u = new URL(cleanUrl(full));
        // Comparer les hosts indépendamment du protocole (http vs https)
        if (!sameHost(u.origin, baseOrigin)) return;
        // Ignorer les liens vers wp-admin, feed, etc.
        if (/wp-admin|wp-login|feed|comment|logout|login|tag\//i.test(u.pathname)) return;
        // Ignorer les liens vers des fichiers média directs
        if (/\.(jpg|jpeg|png|gif|webp|pdf|zip)(\?|$)/i.test(u.pathname)) return;

        // Normaliser avec https pour la déduplication
        const normalized = "https://" + u.host + u.pathname.replace(/\/$/, "");
        if (seen.has(normalized)) return;
        // Ignorer le lien vers la page courante elle-même
        const currentUrl = new URL(pageUrl);
        const currentNorm = "https://" + currentUrl.host + currentUrl.pathname.replace(/\/$/, "");
        if (normalized === currentNorm) return;

        // Ignorer les liens vers les catégories d'expos, tags, etc.
        if (/categor|expoperso|expo-perso|\/tag\//i.test(u.pathname)) return;

        // Extraire le nom du thème depuis le texte du lien
        const text = $(el).text().trim();
        // Ignorer les liens de navigation comme "Consulter la liste des galeries..."
        if (text.length > 60) return;

        // Ne marquer comme vu et n'ajouter que si le lien a un texte
        // (les liens images vides ne doivent pas bloquer le lien texte suivant)
        if (text) {
          seen.add(normalized);
          links.push({
            url: cleanUrl(full),
            theme: text.replace(/\s+/g, " ").trim(),
          });
        }
      } catch {
        // URL invalide
      }
    });

    if (links.length > 0) break; // Utiliser le premier sélecteur qui donne des résultats
  }

  return links;
}

/* ─── Extraction des images de tableaux d'une sous-galerie ──────────── */

/**
 * Extrait toutes les images de tableaux d'une page de sous-galerie.
 * Filtre les images provenant de wp-content/uploads/ (les vrais tableaux)
 * et ignore les icônes, logos, avatars, etc.
 *
 * Retourne un tableau de { src, alt, title }.
 */
function extractPaintingImages(html, pageUrl) {
  const $ = cheerio.load(html);
  const images = [];
  const seen = new Set();

  // Chercher les images dans le contenu principal
  const contentSelectors = [
    ".entry-content img[src]",
    "main img[src]",
    "article img[src]",
    ".content img[src]",
    "[role='main'] img[src]",
  ];

  let found = false;
  for (const sel of contentSelectors) {
    $(sel).each((_, el) => {
      const src = $(el).attr("src");
      const full = resolveUrl(pageUrl, src);
      if (!full) return;

      // Ne garder que les images de wp-content/uploads (les vraies œuvres)
      if (!/wp-content\/uploads\//i.test(full)) return;

      // Ignorer les toutes petites images (icônes, boutons) basées sur le nom
      if (/-\d+x\d+/.test(full)) {
        const sizeMatch = full.match(/-(\d+)x(\d+)/);
        if (sizeMatch) {
          const w = parseInt(sizeMatch[1], 10);
          const h = parseInt(sizeMatch[2], 10);
          // Ignorer les vignettes très petites (<100px dans les deux dimensions)
          if (w < 100 && h < 100) return;
        }
      }

      // Ignorer les doublons (même image avec différentes tailles)
      // On normalise en retirant le suffixe de taille WordPress
      const normalized = full.replace(/-\d+x\d+(\.[^.]+)$/, "$1");
      if (seen.has(normalized)) return;
      seen.add(normalized);

      const alt = $(el).attr("alt") || "";
      const title = $(el).attr("title") || "";

      images.push({
        src: full,
        // Préférer l'URL sans suffixe de taille (image originale)
        originalSrc: normalized,
        alt,
        imgTitle: title,
      });
    });

    if ($(sel).length > 0) {
      found = true;
      break;
    }
  }

  // Fallback : si aucun sélecteur de contenu n'a marché, chercher dans body
  if (!found) {
    $("img[src]").each((_, el) => {
      const src = $(el).attr("src");
      const full = resolveUrl(pageUrl, src);
      if (!full) return;
      if (!/wp-content\/uploads\//i.test(full)) return;

      const normalized = full.replace(/-\d+x\d+(\.[^.]+)$/, "$1");
      if (seen.has(normalized)) return;
      seen.add(normalized);

      images.push({
        src: full,
        originalSrc: normalized,
        alt: $(el).attr("alt") || "",
        imgTitle: $(el).attr("title") || "",
      });
    });
  }

  return images;
}

/**
 * Détecte si une page est une page "hub" de galerie (contient des liens vers
 * des sous-galeries) plutôt qu'une sous-galerie contenant des tableaux.
 */
function isGalleryHub(html, pageUrl) {
  const images = extractPaintingImages(html, pageUrl);
  const $ = cheerio.load(html);
  const pageTitle = $("h1").first().text().toLowerCase();

  // Si la page a peu d'images de tableaux et un titre "galerie",
  // c'est probablement la page hub
  if (images.length <= 2 && /galerie/i.test(pageTitle)) return true;

  // Si le contenu contient "navigation par thèmes", c'est le hub
  const bodyText = $("body").text().toLowerCase();
  if (/navigation par th[eè]mes/i.test(bodyText)) return true;

  return false;
}

/* ─── Création/mise à jour dans Sanity ──────────────────────────────── */

/** Cache des thèmes déjà créés/trouvés dans Sanity: slug → _id */
const themeCache = {};

/**
 * Récupère ou crée un document thème dans Sanity.
 * Retourne l'ID du document thème.
 */
async function getOrCreateTheme(themeName, dryRun) {
  const slug = slugify(themeName);
  if (themeCache[slug]) return themeCache[slug];

  if (dryRun) {
    const fakeId = `theme-${slug}`;
    themeCache[slug] = fakeId;
    return fakeId;
  }

  // Chercher d'abord si le thème existe
  const existing = await client.fetch(
    `*[_type == "theme" && slug.current == $slug][0]._id`,
    { slug }
  );

  if (existing) {
    themeCache[slug] = existing;
    return existing;
  }

  // Créer le thème
  const themeId = `theme-${slug}`;
  await client.createOrReplace({
    _id: themeId,
    _type: "theme",
    title: themeName,
    slug: { _type: "slug", current: slug },
  });
  console.log(`  Thème créé: "${themeName}" (${themeId})`);
  themeCache[slug] = themeId;
  return themeId;
}

/**
 * Importe un tableau dans Sanity.
 */
async function importPainting(imageInfo, themeName, galleryVisible, dryRun, altIsReliable = true) {
  const title = extractTitle(imageInfo.alt || imageInfo.imgTitle, imageInfo.originalSrc, altIsReliable);
  const slug = slugify(title) || "tableau-" + Date.now();
  const year = extractYear(title);
  const docId = imageDocId(imageInfo.originalSrc);

  if (dryRun) {
    console.log(`    [dry-run] Tableau: "${title}" (${imageInfo.originalSrc})`);
    if (year) console.log(`              Année: ${year}`);
    return true;
  }

  try {
    // Vérifier si le document existe déjà avec une image
    const existing = await client.fetch(
      `*[_id == $id][0]{ "assetRef": image.asset._ref }`,
      { id: docId }
    );

    let assetRef;
    if (existing?.assetRef) {
      assetRef = existing.assetRef;
      console.log(`    Image existante réutilisée pour "${title}"`);
    } else {
      // Essayer l'URL originale (sans suffixe de taille), sinon l'URL telle quelle
      let buffer;
      try {
        buffer = await fetchImageBuffer(imageInfo.originalSrc);
      } catch {
        // Si l'original échoue, essayer l'URL telle qu'elle était dans le HTML
        if (imageInfo.originalSrc !== imageInfo.src) {
          console.log(`    URL originale indisponible, tentative avec la vignette...`);
          buffer = await fetchImageBuffer(imageInfo.src);
        } else {
          throw new Error(`Image inaccessible: ${imageInfo.originalSrc}`);
        }
      }
      const filename = imageInfo.originalSrc.split("/").pop()?.split("?")[0] || "image.jpg";
      const asset = await client.assets.upload("image", buffer, { filename });
      assetRef = asset._id;
    }

    // Récupérer ou créer le thème
    const themeId = await getOrCreateTheme(themeName, false);

    await client.createOrReplace({
      _id: docId,
      _type: "painting",
      title,
      slug: { _type: "slug", current: slug },
      ...(year && { year }),
      gallery: galleryVisible,
      image: { _type: "image", asset: { _type: "reference", _ref: assetRef } },
      theme: { _type: "reference", _ref: themeId },
    });
    console.log(`    Créé tableau: "${title}"`);
    return true;
  } catch (e) {
    console.error(`    Erreur pour "${title}":`, e.message);
    return false;
  }
}

/* ─── Logique principale ────────────────────────────────────────────── */

async function processSubGallery(url, themeName, galleryVisible, delay, dryRun) {
  console.log(`\n📂 Sous-galerie: ${themeName} (${url})`);

  let html;
  try {
    html = await fetchHtml(url);
  } catch (e) {
    console.error(`  Impossible de charger la page: ${e.message}`);
    return { found: 0, imported: 0 };
  }

  const images = extractPaintingImages(html, url);
  console.log(`  ${images.length} image(s) de tableau trouvée(s)`);

  // Détecter les alt répétés (bug WordPress fréquent dans les galeries)
  const repeatedAlts = findRepeatedAlts(images);
  if (repeatedAlts.size > 0) {
    console.log(`  ${repeatedAlts.size} alt(s) répété(s) détecté(s), utilisation des noms de fichier comme titre.`);
  }

  let imported = 0;
  for (const img of images) {
    const altIsReliable = !repeatedAlts.has((img.alt || "").trim());
    const ok = await importPainting(img, themeName, galleryVisible, dryRun, altIsReliable);
    if (ok) imported++;
    // Délai entre les uploads pour ne pas surcharger
    if (!dryRun && images.length > 1) {
      await new Promise((r) => setTimeout(r, delay));
    }
  }

  return { found: images.length, imported };
}

async function main() {
  const { url, dryRun, delay, galleryVisible } = parseArgs();

  if (!url) {
    console.error(
      "Usage: node scripts/import-gallery.js --url=https://hugues-absil.com/wordpress/galerie-2/ [--dry-run] [--delay=800] [--gallery=false]"
    );
    process.exit(1);
  }

  if (!hasToken && !dryRun) {
    console.error("SANITY_API_TOKEN requis pour l'import. Utilisez --dry-run pour tester sans token.");
    process.exit(1);
  }

  console.log(`Import galerie depuis: ${url}`);
  if (dryRun) console.log("Mode dry-run: aucune écriture.");
  console.log(`Délai entre requêtes: ${delay}ms`);
  console.log(`Tableaux visibles dans la galerie: ${galleryVisible}`);
  console.log("");

  let html;
  try {
    html = await fetchHtml(url);
  } catch (e) {
    console.error(`Impossible de charger la page: ${e.message}`);
    process.exit(1);
  }

  let totalFound = 0;
  let totalImported = 0;

  // Déterminer si c'est la page hub ou une sous-galerie directe
  if (isGalleryHub(html, url)) {
    console.log("Page hub détectée. Extraction des sous-galeries...\n");

    const baseOrigin = new URL(url).origin;
    const subGalleries = extractSubGalleryLinks(html, url, baseOrigin);

    if (subGalleries.length === 0) {
      console.log("Aucune sous-galerie trouvée.");
      return;
    }

    console.log(`${subGalleries.length} sous-galerie(s) trouvée(s):`);
    for (const sg of subGalleries) {
      console.log(`  - ${sg.theme}: ${sg.url}`);
    }

    for (const sg of subGalleries) {
      const { found, imported } = await processSubGallery(
        sg.url,
        sg.theme,
        galleryVisible,
        delay,
        dryRun
      );
      totalFound += found;
      totalImported += imported;
      // Délai entre les pages
      await new Promise((r) => setTimeout(r, delay));
    }
  } else {
    console.log("Sous-galerie directe détectée.\n");

    // Extraire le nom du thème depuis le h1 de la page
    const $ = cheerio.load(html);
    const themeName = $("h1").first().text().trim() || "Sans thème";

    const { found, imported } = await processSubGallery(
      url,
      themeName,
      galleryVisible,
      delay,
      dryRun
    );
    totalFound = found;
    totalImported = imported;
  }

  console.log("\n" + "═".repeat(50));
  console.log(`Terminé. ${totalFound} image(s) trouvée(s), ${totalImported} importée(s).`);
  if (dryRun) console.log("(Mode dry-run, aucune écriture effectuée.)");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
