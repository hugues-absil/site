/**
 * Migration depuis des fichiers locaux (dossier d'images + CSV optionnel).
 * - Chaque image → document "tableau" (painting) dans Sanity.
 * - Fichiers non image ou lignes CSV non mappables → document "À classer" (contenuAClasser).
 *
 * Usage:
 *   node scripts/migrate-from-local.js --dir=./chemin/vers/photos [--csv=./metadonnees.csv] [--default-year=2024] [--gallery] [--dry-run]
 *
 * CSV (séparateur ;) : file;title;year;technique_slug;theme_slug;status_slug;dimensions;description
 * - file = nom du fichier (ex. photo1.jpg)
 * - technique_slug, theme_slug, status_slug = slugs des documents existants dans Sanity (optionnel)
 *
 * .env : VITE_SANITY_PROJECT_ID, VITE_SANITY_DATASET, SANITY_API_TOKEN (pour écriture)
 */
import "dotenv/config";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { client, hasToken } from "./lib/sanityClient.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

const IMAGE_EXT = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif", ".avif"]);
const BATCH_SIZE = 10;
const DELAY_MS = 200;

function parseArgs() {
  const args = process.argv.slice(2);
  const out = { dir: null, csv: null, defaultYear: 2024, gallery: false, dryRun: false };
  for (const a of args) {
    if (a.startsWith("--dir=")) out.dir = a.slice(6).trim();
    else if (a.startsWith("--csv=")) out.csv = a.slice(6).trim();
    else if (a.startsWith("--default-year=")) out.defaultYear = parseInt(a.slice(15), 10) || 2024;
    else if (a === "--gallery") out.gallery = true;
    else if (a === "--dry-run") out.dryRun = true;
  }
  return out;
}

function slugify(text) {
  return String(text)
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9]+/gi, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();
}

async function resolveRef(type, slug) {
  if (!slug || !slug.trim()) return null;
  const list = await client.fetch(
    `*[_type == $type && slug.current == $slug][0]._id`,
    { type, slug: slug.trim() }
  );
  return list || null;
}

async function ensureRefs(csvRows) {
  const techniques = new Set();
  const themes = new Set();
  const statuses = new Set();
  for (const row of csvRows) {
    if (row.technique_slug) techniques.add(row.technique_slug);
    if (row.theme_slug) themes.add(row.theme_slug);
    if (row.status_slug) statuses.add(row.status_slug);
  }
  const [techIds, themeIds, statusIds] = await Promise.all([
    Promise.all([...techniques].map((s) => resolveRef("technique", s))),
    Promise.all([...themes].map((s) => resolveRef("theme", s))),
    Promise.all([...statuses].map((s) => resolveRef("paintingStatus", s))),
  ]);
  const techniqueMap = Object.fromEntries([...techniques].map((s, i) => [s, techIds[i]]));
  const themeMap = Object.fromEntries([...themes].map((s, i) => [s, themeIds[i]]));
  const statusMap = Object.fromEntries([...statuses].map((s, i) => [s, statusIds[i]]));
  return { techniqueMap, themeMap, statusMap };
}

function parseCSV(csvPath) {
  const fullPath = path.isAbsolute(csvPath) ? csvPath : path.join(ROOT, csvPath);
  const content = fs.readFileSync(fullPath, "utf-8");
  const lines = content.split(/\r?\n/).filter((l) => l.trim());
  const header = lines[0].split(";").map((h) => h.trim().toLowerCase().replace(/\s+/g, "_"));
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(";").map((v) => v.trim());
    const row = {};
    header.forEach((h, j) => (row[h] = values[j] ?? ""));
    rows.push(row);
  }
  return rows;
}

async function createContenuAClasser(doc) {
  if (!hasToken) return;
  await client.create({
    _type: "contenuAClasser",
    sourceUrl: doc.sourceUrl ?? undefined,
    title: doc.title ?? undefined,
    extractedContent: doc.extractedContent ?? undefined,
    extractedAt: new Date().toISOString(),
    contentType: doc.contentType ?? undefined,
    rawHtml: doc.rawHtml ?? undefined,
  });
}

async function main() {
  const { dir, csv, defaultYear, gallery, dryRun } = parseArgs();
  if (!dir) {
    console.error("Usage: node scripts/migrate-from-local.js --dir=./chemin/vers/photos [--csv=./fichier.csv] [--default-year=2024] [--gallery] [--dry-run]");
    process.exit(1);
  }

  const dirPath = path.isAbsolute(dir) ? dir : path.join(ROOT, dir);
  if (!fs.existsSync(dirPath) || !fs.statSync(dirPath).isDirectory()) {
    console.error("Le dossier n'existe pas ou n'est pas un répertoire:", dirPath);
    process.exit(1);
  }

  let csvRows = [];
  let refs = { techniqueMap: {}, themeMap: {}, statusMap: {} };
  if (csv) {
    const csvFull = path.isAbsolute(csv) ? csv : path.join(ROOT, csv);
    if (fs.existsSync(csvFull)) {
      csvRows = parseCSV(csvFull);
      refs = await ensureRefs(csvRows);
    }
  }

  const csvByFile = new Map();
  for (const row of csvRows) {
    const file = (row.file || row.filename || "").trim();
    if (file) csvByFile.set(file.toLowerCase(), row);
  }

  const files = fs.readdirSync(dirPath);
  const imageFiles = files.filter((f) => IMAGE_EXT.has(path.extname(f).toLowerCase()));
  const otherFiles = files.filter((f) => !IMAGE_EXT.has(path.extname(f).toLowerCase()));

  console.log(`Dossier: ${dirPath}`);
  console.log(`Images trouvées: ${imageFiles.length}`);
  console.log(`Autres fichiers: ${otherFiles.length}`);
  if (dryRun) console.log("Mode dry-run: aucune écriture.");

  for (const file of imageFiles) {
    const ext = path.extname(file);
    const base = path.basename(file, ext);
    const row = csvByFile.get(file.toLowerCase()) || csvByFile.get(file);
    const title = row?.title?.trim() || base.replace(/-/g, " ").replace(/_/g, " ");
    const year = row?.year ? parseInt(row.year, 10) : defaultYear;
    const slug = slugify(title) || slugify(base) || "tableau-" + Date.now();
    const techniqueId = row?.technique_slug ? refs.techniqueMap[row.technique_slug] : null;
    const themeId = row?.theme_slug ? refs.themeMap[row.theme_slug] : null;
    const statusId = row?.status_slug ? refs.statusMap[row.status_slug] : null;

    const filePath = path.join(dirPath, file);
    const buffer = fs.readFileSync(filePath);

    if (dryRun) {
      console.log(`[dry-run] Créerait tableau: ${title} (${file})`);
      continue;
    }

    const finalYear = isNaN(year) ? defaultYear : year;
    const existing = await client.fetch(
      `*[_type == "painting" && title == $title && year == $year][0]._id`,
      { title, year: finalYear }
    );
    if (existing) {
      console.log(`Déjà existant (ignoré): ${title}`);
      await new Promise((r) => setTimeout(r, DELAY_MS));
      continue;
    }

    try {
      const asset = await client.assets.upload("image", buffer, {
        filename: file,
      });
      const doc = {
        _type: "painting",
        title,
        slug: { _type: "slug", current: slug },
        year: isNaN(year) ? defaultYear : year,
        dimensions: row?.dimensions?.trim() || undefined,
        description: row?.description?.trim() || undefined,
        gallery: gallery,
        image: {
          _type: "image",
          asset: { _type: "reference", _ref: asset._id },
        },
      };
      if (techniqueId) doc.technique = { _type: "reference", _ref: techniqueId };
      if (themeId) doc.theme = { _type: "reference", _ref: themeId };
      if (statusId) doc.status = { _type: "reference", _ref: statusId };
      await client.create(doc);
      console.log(`Créé: ${title}`);
    } catch (e) {
      console.error(`Erreur pour ${file}:`, e.message);
    }
    await new Promise((r) => setTimeout(r, DELAY_MS));
  }

  for (const file of otherFiles) {
    const filePath = path.join(dirPath, file);
    let extractedContent = "";
    try {
      extractedContent = fs.readFileSync(filePath, "utf-8");
    } catch {
      continue;
    }
    if (dryRun) {
      console.log(`[dry-run] Créerait "À classer": ${file}`);
      continue;
    }
    try {
      await createContenuAClasser({
        title: file,
        sourceUrl: filePath,
        extractedContent: extractedContent.slice(0, 50000),
        contentType: "fichier_local",
      });
      console.log(`À classer créé: ${file}`);
    } catch (e) {
      console.error(`Erreur "À classer" pour ${file}:`, e.message);
    }
    await new Promise((r) => setTimeout(r, DELAY_MS));
  }

  console.log("Terminé.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
