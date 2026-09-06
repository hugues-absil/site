/**
 * Utilitaires partagés pour l'extraction et le crawl de sites web.
 * Utilisé par migrate-from-website.js et crawl-full-site.js.
 */
import * as cheerio from "cheerio";
import crypto from "node:crypto";

/** Plafonds larges : le corps riche va surtout dans `content` (PT) ; extractedContent/rawHtml servent de secours. */
export const MAX_CONTENT_LENGTH = 5_000_000;
export const MAX_RAW_HTML_LENGTH = 8_000_000;

/** Expressions indiquant un extrait / page liste (lien "continuer la lecture" etc.). */
const LISTING_PHRASES = [
  /continuer\s+la\s+lecture\s*[»"]?/gi,
  /lire\s+la\s+suite\s*[»"]?/gi,
  /read\s+more\s*["']?/gi,
  /voir\s+tout\s*[»"]?/gi,
  /en\s+savoir\s+plus\s*[»"]?/gi,
];

/**
 * Supprime les phrases de type "continuer la lecture" du texte extrait.
 */
export function stripListingPhrases(text) {
  if (!text || typeof text !== "string") return text;
  let out = text;
  for (const re of LISTING_PHRASES) {
    out = out.replace(re, " ").trim();
  }
  return out.replace(/\s+/g, " ").trim();
}

/**
 * Résout une URL relative par rapport à une base.
 */
export function resolveUrl(base, href) {
  if (!href || href.startsWith("#")) return null;
  try {
    return new URL(href, base).href;
  } catch {
    return null;
  }
}

/**
 * Récupère le HTML d'une URL.
 */
export async function fetchHtml(url) {
  const res = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; MigrationBot/1.0)",
      Accept: "text/html",
    },
    redirect: "follow",
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.text();
}

/**
 * Extrait titre, contenu textuel, URLs d'images et HTML brut d'une page.
 * Sélecteurs génériques : à adapter selon la structure réelle du site.
 */
export function extractPageContent(html, pageUrl) {
  const $ = cheerio.load(html);
  $("script, style, nav, footer, iframe").remove();

  const title =
    $("meta[property='og:title']").attr("content")?.trim() ||
    $("title").text().trim() ||
    $("h1").first().text().trim() ||
    "";

  const bodySelectors = ["main", "article", "[role='main']", ".content", "#content", "body"];
  let bodyText = "";
  for (const sel of bodySelectors) {
    const el = $(sel).first();
    if (el.length) {
      bodyText = el.text().replace(/\s+/g, " ").trim();
      if (bodyText.length > 100) break;
    }
  }
  if (bodyText.length < 50) bodyText = $("body").text().replace(/\s+/g, " ").trim();

  bodyText = stripListingPhrases(bodyText);

  const imageUrls = [];
  $("img[src]").each((_, el) => {
    const src = $(el).attr("src");
    const full = resolveUrl(pageUrl, src);
    if (full && /\.(jpg|jpeg|png|webp|gif|avif)(\?|$)/i.test(full)) imageUrls.push(full);
  });

  const rawHtml = $("body").html() || "";
  return {
    title: title.slice(0, 500),
    extractedContent: bodyText.slice(0, MAX_CONTENT_LENGTH),
    rawHtml: rawHtml.slice(0, MAX_RAW_HTML_LENGTH),
    imageUrls,
  };
}

/**
 * Indique si le texte ressemble à une page liste (extraits + "continuer la lecture").
 * Utilisé par le crawl pour ne pas créer de document de contenu depuis une liste.
 * On ne garde que les libellés de lien typiques (pas "article"/"presse" qui peuvent apparaître dans un vrai article).
 */
export function looksLikeListingPage(extracted) {
  const text = (extracted?.extractedContent || "").toLowerCase();
  const listingMarkers = [
    "continuer la lecture",
    "lire la suite",
    "read more",
    "voir tout",
    "en savoir plus",
  ];
  return listingMarkers.some((m) => text.includes(m));
}

/**
 * Génère une clé unique pour les blocs Portable Text.
 */
function blockKey() {
  return crypto.randomBytes(8).toString("hex");
}

/**
 * Convertit un texte brut en blockContent Sanity (Portable Text).
 * Chaque paragraphe (séparé par des retours à la ligne doubles) devient un bloc.
 */
export function textToBlockContent(plainText) {
  if (!plainText || typeof plainText !== "string") return [];
  const trimmed = plainText.trim();
  if (!trimmed) return [];
  const paragraphs = trimmed.split(/\n\s*\n/).map((p) => p.replace(/\s+/g, " ").trim()).filter(Boolean);
  if (paragraphs.length === 0) return [];
  return paragraphs.map((p) => ({
    _type: "block",
    _key: blockKey(),
    style: "normal",
    markDefs: [],
    children: [{ _type: "span", _key: blockKey(), text: p, marks: [] }],
  }));
}

/** Extrait l'URL de la première image dans main/article (image principale). */
export function getMainImageUrl(html, pageUrl) {
  const $ = cheerio.load(html);
  const content = $("main img[src], article img[src], .content img[src], [role='main'] img[src]").first();
  if (content.length) {
    const src = content.attr("src");
    const full = resolveUrl(pageUrl, src);
    if (full && /\.(jpg|jpeg|png|webp|gif|avif)(\?|$)/i.test(full)) return full;
  }
  const first = $("img[src]").first();
  if (first.length) {
    const src = first.attr("src");
    const full = resolveUrl(pageUrl, src);
    if (full && /\.(jpg|jpeg|png|webp|gif|avif)(\?|$)/i.test(full)) return full;
  }
  return null;
}

/**
 * Extrait tous les liens internes (même domaine) d'une page.
 * Retourne un tableau d'URLs normalisées (sans fragment, trailing slash normalisé).
 */
export function extractInternalLinks(html, pageUrl, baseOrigin) {
  const $ = cheerio.load(html);
  const seen = new Set();
  const links = [];
  $("a[href]").each((_, el) => {
    const href = $(el).attr("href");
    const full = resolveUrl(pageUrl, href);
    if (!full) return;
    try {
      const u = new URL(full);
      if (u.origin !== baseOrigin) return;
      if (!/^text\/html|^application\/xhtml/i.test(u.pathname) && /\.(pdf|zip|jpg|jpeg|png|gif|webp|avif|css|js|xml|rss)(\?|$)/i.test(u.pathname)) return;
      const pathname = u.pathname.replace(/\/$/, "") || "/";
      const normalized = u.origin + pathname + (u.search || "");
      if (seen.has(normalized)) return;
      seen.add(normalized);
      links.push(normalized);
    } catch {
      // ignore invalid URL
    }
  });
  return links;
}
