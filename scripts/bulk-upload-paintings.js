/**
 * Upload en masse : un dossier d’images → un document "tableau" (painting) par image.
 * Valeurs par défaut optionnelles (année, afficher en galerie, etc.).
 *
 * Usage:
 *   node scripts/bulk-upload-paintings.js --dir=./photos [--default-year=2024] [--gallery] [--dry-run]
 *
 * .env : VITE_SANITY_PROJECT_ID, VITE_SANITY_DATASET, SANITY_API_TOKEN
 */
import "dotenv/config";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { client, hasToken } from "./lib/sanityClient.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

const IMAGE_EXT = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif", ".avif"]);
const DELAY_MS = 200;

function parseArgs() {
  const args = process.argv.slice(2);
  const out = { dir: null, defaultYear: 2024, gallery: false, dryRun: false };
  for (const a of args) {
    if (a.startsWith("--dir=")) out.dir = a.slice(6).trim();
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

async function main() {
  const { dir, defaultYear, gallery, dryRun } = parseArgs();
  if (!dir) {
    console.error("Usage: node scripts/bulk-upload-paintings.js --dir=./chemin/vers/photos [--default-year=2024] [--gallery] [--dry-run]");
    process.exit(1);
  }

  const dirPath = path.isAbsolute(dir) ? dir : path.join(ROOT, dir);
  if (!fs.existsSync(dirPath) || !fs.statSync(dirPath).isDirectory()) {
    console.error("Le dossier n'existe pas ou n'est pas un répertoire:", dirPath);
    process.exit(1);
  }

  const files = fs.readdirSync(dirPath);
  const imageFiles = files.filter((f) => IMAGE_EXT.has(path.extname(f).toLowerCase()));

  console.log(`Dossier: ${dirPath}`);
  console.log(`Images: ${imageFiles.length}`);
  if (dryRun) console.log("Mode dry-run: aucune écriture.");

  for (const file of imageFiles) {
    const ext = path.extname(file);
    const base = path.basename(file, ext);
    const title = base.replace(/-/g, " ").replace(/_/g, " ");
    const slug = slugify(title) || slugify(base) || "tableau-" + Date.now();

    if (dryRun) {
      console.log(`[dry-run] Créerait tableau: ${title}`);
      continue;
    }

    try {
      const existing = await client.fetch(
        `*[_type == "painting" && title == $title && year == $year][0]._id`,
        { title, year: defaultYear }
      );
      if (existing) {
        console.log(`Déjà existant (ignoré): ${title}`);
        await new Promise((r) => setTimeout(r, DELAY_MS));
        continue;
      }

      const filePath = path.join(dirPath, file);
      const buffer = fs.readFileSync(filePath);
      const asset = await client.assets.upload("image", buffer, { filename: file });

      await client.create({
        _type: "painting",
        title,
        slug: { _type: "slug", current: slug },
        year: defaultYear,
        gallery,
        image: {
          _type: "image",
          asset: { _type: "reference", _ref: asset._id },
        },
      });
      console.log(`Créé: ${title}`);
    } catch (e) {
      console.error(`Erreur pour ${file}:`, e.message);
    }
    await new Promise((r) => setTimeout(r, DELAY_MS));
  }

  console.log("Terminé.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
