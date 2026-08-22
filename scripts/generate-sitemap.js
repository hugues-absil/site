/**
 * Génère sitemap.xml pour le référencement (SEO).
 * Récupère les URLs depuis Sanity (presse, journal, écrits, enseignement) et écrit public/sitemap.xml.
 *
 * Usage:
 *   node scripts/generate-sitemap.js
 *
 * Variables .env optionnelles:
 *   VITE_SANITY_PROJECT_ID, VITE_SANITY_DATASET (ou SANITY_*) pour Sanity
 *   VITE_SITE_URL ou SITE_URL (ex. https://absil.fr) pour l'URL de base du site
 *
 * À lancer avant un déploiement (ou ajouter "npm run generate-sitemap" avant le build).
 */

import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const PUBLIC_DIR = path.join(ROOT, "public");
const SITEMAP_PATH = path.join(PUBLIC_DIR, "sitemap.xml");

const BASE_URL = (
  process.env.VITE_SITE_URL ||
  process.env.SITE_URL ||
  "https://absil.fr"
).replace(/\/$/, "");

/** Section (ecrits | enseignement) par catégorie Ressource (aligné avec resourceCategories.ts). */
const RESOURCE_SECTION = {
  "critiques-litteraires": "ecrits",
  "oeil-expo": "ecrits",
  "atelier-stages": "enseignement",
  "histoire-art": "enseignement",
  "technique-picturale": "enseignement",
};

function escapeXml(s) {
  if (s == null || s === "") return "";
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function urlEl(loc, lastmod = null, changefreq = "weekly", priority = "0.8") {
  const lastmodTag = lastmod ? `\n    <lastmod>${escapeXml(lastmod)}</lastmod>` : "";
  return `  <url>
    <loc>${escapeXml(loc)}</loc>${lastmodTag}
    <changefreq>${escapeXml(changefreq)}</changefreq>
    <priority>${escapeXml(priority)}</priority>
  </url>`;
}

async function fetchSlugs(client) {
  const today = new Date().toISOString().slice(0, 10);

  const [press, advice, resources] = await Promise.all([
    client.fetch(
      `*[_type == "pressArticle" && defined(slug.current)]{ "slug": slug.current }`
    ),
    client.fetch(
      `*[_type == "advice" && defined(slug.current)]{ "slug": slug.current }`
    ),
    client.fetch(
      `*[_type == "resource" && defined(slug.current)]{ "slug": slug.current, category }`
    ),
  ]);

  return {
    press: (press || []).map((p) => p.slug).filter(Boolean),
    advice: (advice || []).map((a) => a.slug).filter(Boolean),
    resources: (resources || []).map((r) => ({ slug: r.slug, category: r.category })).filter((r) => r.slug && r.category),
    lastmod: today,
  };
}

function buildUrls(slugs) {
  const urls = [];
  const { lastmod } = slugs;

  // Pages statiques
  urls.push(urlEl(BASE_URL + "/", lastmod, "weekly", "1.0"));
  urls.push(urlEl(BASE_URL + "/studio", lastmod, "monthly", "0.6"));

  // Presse
  for (const slug of slugs.press) {
    urls.push(urlEl(`${BASE_URL}/presse/${slug}`, lastmod));
  }

  // Journal
  for (const slug of slugs.advice) {
    urls.push(urlEl(`${BASE_URL}/journal/${slug}`, lastmod));
  }

  // Ressources (écrits + enseignement)
  const seenCategoryPages = new Set();
  for (const { slug, category } of slugs.resources) {
    const section = RESOURCE_SECTION[category] || "ecrits";
    const prefix = section === "ecrits" ? "ecrits" : "enseignement";
    urls.push(urlEl(`${BASE_URL}/${prefix}/${category}/${slug}`, lastmod));
    if (!seenCategoryPages.has(prefix + "/" + category)) {
      seenCategoryPages.add(prefix + "/" + category);
      urls.push(urlEl(`${BASE_URL}/${prefix}/${category}`, lastmod, "weekly", "0.7"));
    }
  }

  // Dédupliquer les pages catégorie (une seule entrée par catégorie)
  const seen = new Set();
  const deduped = urls.filter((u) => {
    const m = u.match(/<loc>([^<]+)<\/loc>/);
    const loc = m ? m[1] : u;
    if (seen.has(loc)) return false;
    seen.add(loc);
    return true;
  });

  return deduped;
}

async function main() {
  console.log("Génération du sitemap (base:", BASE_URL, ")…");

  const hasSanity =
    process.env.SANITY_PROJECT_ID ||
    process.env.VITE_SANITY_PROJECT_ID;

  let slugs;
  if (hasSanity) {
    try {
      const { client } = await import("./lib/sanityClient.js");
      slugs = await fetchSlugs(client);
    } catch (e) {
      console.warn("Erreur Sanity:", e.message);
      slugs = minimalSlugs();
      console.log("Sitemap minimal (accueil + studio uniquement).");
    }
  } else {
    slugs = minimalSlugs();
    console.log("Sanity non configuré → sitemap minimal (accueil + studio).");
  }

  function minimalSlugs() {
    return {
      press: [],
      advice: [],
      resources: [],
      lastmod: new Date().toISOString().slice(0, 10),
    };
  }

  const urlEntries = buildUrls(slugs);
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlEntries.join("\n")}
</urlset>`;

  if (!fs.existsSync(PUBLIC_DIR)) {
    fs.mkdirSync(PUBLIC_DIR, { recursive: true });
  }
  fs.writeFileSync(SITEMAP_PATH, xml, "utf-8");
  console.log("Écrit:", SITEMAP_PATH, "(" + urlEntries.length, "URLs)");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
