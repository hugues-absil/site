/**
 * Migration depuis le site web : une ou plusieurs URLs → document « À classer » (upsert).
 *
 * Usage:
 *   node scripts/migrate-from-website.js --url=https://hugues-absil.com/page [--url=...] [--delay=800] [--dry-run]
 *   node scripts/migrate-from-website.js --urls=url1,url2 [--dry-run]
 *
 * .env : VITE_SANITY_PROJECT_ID, VITE_SANITY_DATASET, SANITY_API_TOKEN
 */
import "dotenv/config";
import { client, hasToken } from "./lib/sanityClient.js";
import { fetchHtml } from "./lib/websiteUtils.js";
import { upsertContenuAClasserFromHtml } from "./lib/contenuAClasserImport.js";

const DEFAULT_DELAY_MS = 800;

function parseArgs() {
  const args = process.argv.slice(2);
  const urls = [];
  let delay = DEFAULT_DELAY_MS;
  let dryRun = false;
  for (const a of args) {
    if (a.startsWith("--url=")) urls.push(a.slice(6).trim());
    else if (a.startsWith("--urls=")) urls.push(...a.slice(7).split(",").map((u) => u.trim()).filter(Boolean));
    else if (a.startsWith("--delay=")) delay = parseInt(a.slice(8), 10) || DEFAULT_DELAY_MS;
    else if (a === "--dry-run") dryRun = true;
  }
  return { urls, delay, dryRun };
}

async function processUrl(url, delay, dryRun) {
  console.log(`Fetch: ${url}`);
  const html = await fetchHtml(url);
  await upsertContenuAClasserFromHtml(client, hasToken, { url, html, dryRun });
  await new Promise((r) => setTimeout(r, delay));
}

async function main() {
  const { urls, delay, dryRun } = parseArgs();
  if (urls.length === 0) {
    console.error(
      "Usage: node scripts/migrate-from-website.js --url=https://hugues-absil.com [--url=...] [--urls=url1,url2] [--delay=800] [--dry-run]"
    );
    process.exit(1);
  }

  console.log(`URLs à traiter: ${urls.length}, délai ${delay} ms`);
  if (dryRun) console.log("Mode dry-run: aucune écriture.");
  if (!hasToken && !dryRun) {
    console.error("SANITY_API_TOKEN requis (sauf --dry-run).");
    process.exit(1);
  }

  for (const url of urls) {
    try {
      await processUrl(url, delay, dryRun);
    } catch (e) {
      console.error(`Échec pour ${url}:`, e.message);
    }
  }

  console.log("Terminé.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
