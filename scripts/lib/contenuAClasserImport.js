/**
 * Import / upsert document contenuAClasser depuis une page HTML (crawl ou URL unique).
 */
import crypto from "node:crypto";
import {
  extractPageContent,
  looksLikeListingPage,
} from "./websiteUtils.js";
import { buildPortableTextFromHtml } from "./htmlToPortableText.js";

export function normalizeUrl(url) {
  try {
    const u = new URL(url);
    const pathname = u.pathname.replace(/\/$/, "") || "/";
    return u.origin + pathname + (u.search || "");
  } catch {
    return url;
  }
}

/** _id déterministe pour éviter les doublons (createOrReplace). */
export function contenuAClasserDocumentId(url) {
  const norm = normalizeUrl(url);
  const hash = crypto.createHash("sha256").update(norm).digest("hex").slice(0, 32);
  return "crawl-ac-" + hash;
}

export async function fetchImageBuffer(imageUrl) {
  const res = await fetch(imageUrl, {
    headers: { "User-Agent": "Mozilla/5.0 (compatible; MigrationBot/1.0)" },
  });
  if (!res.ok) throw new Error(`Image HTTP ${res.status}`);
  const ab = await res.arrayBuffer();
  return Buffer.from(ab);
}

/**
 * @param {import("@sanity/client").SanityClient} client
 * @param {boolean} hasToken
 * @param {{ url: string, html: string, dryRun?: boolean }} opts
 * @returns {Promise<{ skipped?: boolean, updated?: boolean, dryRun?: boolean }>}
 */
export async function upsertContenuAClasserFromHtml(client, hasToken, opts) {
  const { url, html, dryRun = false } = opts;
  const normalized = normalizeUrl(url);
  const extracted = extractPageContent(html, normalized);

  if (looksLikeListingPage(extracted)) {
    console.log(`  Page liste (extraits + « lire la suite »), ignorée.`);
    return { skipped: true };
  }

  const imageCache = new Map();
  /** @type {null | ((u: string, alt: string) => Promise<string>)} */
  let uploadImage = null;
  if (hasToken) {
    uploadImage = async (imageUrl, alt) => {
      if (imageCache.has(imageUrl)) return imageCache.get(imageUrl);
      const buffer = await fetchImageBuffer(imageUrl);
      const filename = imageUrl.split("/").pop()?.split("?")[0] || "image.jpg";
      const asset = await client.assets.upload("image", buffer, { filename });
      imageCache.set(imageUrl, asset._id);
      return asset._id;
    };
  }

  const content = await buildPortableTextFromHtml(html, normalized, uploadImage);

  const docId = contenuAClasserDocumentId(normalized);
  const doc = {
    _id: docId,
    _type: "contenuAClasser",
    sourceUrl: normalized,
    title: extracted.title || undefined,
    extractedContent: extracted.extractedContent || undefined,
    extractedAt: new Date().toISOString(),
    contentType: "page_web",
    rawHtml: extracted.rawHtml || undefined,
    ...(content.length > 0 ? { content } : {}),
  };

  if (dryRun) {
    console.log(`  [dry-run] À classer: ${(doc.title || normalized).slice(0, 55)}… (${content.length} bloc(s))`);
    return { dryRun: true };
  }

  if (!hasToken) {
    throw new Error("SANITY_API_TOKEN requis pour écrire dans Sanity");
  }

  try {
    await client.createOrReplace(doc);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    const permissionDenied =
      /insufficient permissions/i.test(msg) || /permission.*create/i.test(msg);
    if (permissionDenied) {
      const cfg = client.config();
      console.error(`
  Sanity a refusé l'écriture : le jeton n'a pas la permission « create » (documents / assets).
  → Ouvrir https://www.sanity.io/manage → projet « ${cfg.projectId ?? "?"} » → API → Tokens
  → Créer un token avec le rôle Editor ou Administrator (pas Viewer).
  → Vérifier le dataset dans .env : actuellement « ${cfg.dataset ?? "?"} ».
`);
    }
    throw e;
  }
  console.log(`  À classer upsert: ${(doc.title || normalized).slice(0, 50)}…`);
  return { updated: true };
}
