/**
 * Crawl complet d'un site : découvre les pages HTML (même origine), importe chaque page
 * en document Sanity « À classer » (contenuAClasser) avec Portable Text, liens et images.
 * Exclut les pages « liste » (extraits + lire la suite) et certains chemins techniques.
 *
 * Usage:
 *   node scripts/crawl-full-site.js --url=https://hugues-absil.com [--max-pages=800] [--delay=800] [--dry-run]
 *
 * .env : VITE_SANITY_PROJECT_ID, VITE_SANITY_DATASET, SANITY_API_TOKEN
 */
import "dotenv/config";
import { client, hasToken } from "./lib/sanityClient.js";
import { fetchHtml, extractInternalLinks } from "./lib/websiteUtils.js";
import { normalizeUrl, upsertContenuAClasserFromHtml } from "./lib/contenuAClasserImport.js";

const DEFAULT_MAX_PAGES = 800;
const DEFAULT_DELAY_MS = 800;

const EXCLUDED_PATH_SEGMENTS = [
  "wp-admin",
  "wp-login",
  "wp-content/uploads",
  "feed",
  "cart",
  "checkout",
  "/tag/",
  "/author/",
  "/comment",
  "login",
  "logout",
  "register",
  ".xml",
  ".rss",
  "?replytocom=",
];

function parseArgs() {
  const args = process.argv.slice(2);
  let baseUrl = null;
  let maxPages = DEFAULT_MAX_PAGES;
  let delay = DEFAULT_DELAY_MS;
  let dryRun = false;
  for (const a of args) {
    if (a.startsWith("--url=")) baseUrl = a.slice(6).trim();
    else if (a.startsWith("--max-pages=")) maxPages = parseInt(a.slice(12), 10) || DEFAULT_MAX_PAGES;
    else if (a.startsWith("--delay=")) delay = parseInt(a.slice(8), 10) || DEFAULT_DELAY_MS;
    else if (a === "--dry-run") dryRun = true;
  }
  return { baseUrl, maxPages, delay, dryRun };
}

function isExcludedUrl(url) {
  const lower = url.toLowerCase();
  return EXCLUDED_PATH_SEGMENTS.some((seg) => lower.includes(seg));
}

async function processPage(url, dryRun) {
  const html = await fetchHtml(url);
  await upsertContenuAClasserFromHtml(client, hasToken, { url, html, dryRun });
  return html;
}

async function main() {
  const { baseUrl, maxPages, delay, dryRun } = parseArgs();
  if (!baseUrl) {
    console.error(
      "Usage: node scripts/crawl-full-site.js --url=https://hugues-absil.com [--max-pages=800] [--delay=800] [--dry-run]"
    );
    process.exit(1);
  }

  let baseOrigin;
  try {
    baseOrigin = new URL(baseUrl).origin;
  } catch {
    console.error("URL de base invalide:", baseUrl);
    process.exit(1);
  }

  console.log(`Crawl depuis ${baseUrl}, max ${maxPages} pages, délai ${delay} ms → uniquement « À classer »`);
  if (dryRun) console.log("Mode dry-run: aucune écriture.");
  if (!hasToken && !dryRun) {
    console.error("SANITY_API_TOKEN requis (sauf --dry-run).");
    process.exit(1);
  }

  const visited = new Set();
  const queue = [normalizeUrl(baseUrl)];
  let processed = 0;

  while (queue.length > 0 && processed < maxPages) {
    const url = queue.shift();
    const normalized = normalizeUrl(url);
    if (visited.has(normalized)) continue;
    if (isExcludedUrl(normalized)) continue;
    visited.add(normalized);
    processed++;

    console.log(`[${processed}/${maxPages}] ${url}`);

    try {
      const html = await processPage(url, dryRun);

      if (processed < maxPages) {
        const links = extractInternalLinks(html, url, baseOrigin);
        for (const link of links) {
          const n = normalizeUrl(link);
          if (!visited.has(n) && !isExcludedUrl(n)) queue.push(n);
        }
      }

      await new Promise((r) => setTimeout(r, delay));
    } catch (e) {
      console.error(`  Échec:`, e.message);
    }
  }

  console.log(`Terminé. ${processed} page(s) traitées.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
