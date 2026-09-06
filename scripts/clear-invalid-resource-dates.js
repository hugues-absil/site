/**
 * Efface les dates ressources invalides (ex. "2098-46-01", mois > 12)
 * laissées par d'anciennes migrations. Sans dateEnd valide, ces fiches
 * apparaissaient à tort en « À venir ».
 *
 * Usage :
 *   SANITY_API_TOKEN=... VITE_SANITY_PROJECT_ID=... VITE_SANITY_DATASET=production \
 *     node scripts/clear-invalid-resource-dates.js
 *
 * Options :
 *   --dry-run   liste les documents sans patch
 */
import "dotenv/config";
import { createClient } from "@sanity/client";

const projectId = (
  process.env.SANITY_PROJECT_ID ||
  process.env.VITE_SANITY_PROJECT_ID ||
  ""
).trim();
const dataset = (
  process.env.SANITY_DATASET ||
  process.env.VITE_SANITY_DATASET ||
  "production"
).trim();
const token = (process.env.SANITY_API_TOKEN || "").trim();
const dryRun = process.argv.includes("--dry-run");

if (!projectId || !dataset) {
  console.error("Manque VITE_SANITY_PROJECT_ID / VITE_SANITY_DATASET");
  process.exit(1);
}
if (!token && !dryRun) {
  console.error("Manque SANITY_API_TOKEN (ou passez --dry-run)");
  process.exit(1);
}

const client = createClient({
  projectId,
  dataset,
  apiVersion: "2024-01-01",
  useCdn: false,
  token: token || undefined,
});

function isInvalidIsoDate(value) {
  if (value == null || value === "") return false;
  if (typeof value !== "string") return true;
  const parts = value.split("-");
  if (parts.length < 2) return true;
  const month = parts[1];
  if (month > "12" || month < "01") return true;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return true;
  if (parsed.getUTCFullYear() === 1970) return true;
  return false;
}

async function main() {
  const docs = await client.fetch(
    `*[_type == "resource" && (defined(date) || defined(dateEnd))]{_id, title, date, dateEnd}`
  );

  let patched = 0;
  for (const doc of docs) {
    const unset = [];
    if (isInvalidIsoDate(doc.date)) unset.push("date");
    if (isInvalidIsoDate(doc.dateEnd)) unset.push("dateEnd");
    if (unset.length === 0) continue;

    console.log(
      `${dryRun ? "[dry-run] " : ""}clear ${doc._id} « ${doc.title} » → unset ${unset.join(", ")} (était date=${doc.date}, dateEnd=${doc.dateEnd})`
    );
    if (!dryRun) {
      await client.patch(doc._id).unset(unset).commit({ autoGenerateArrayKeys: false });
    }
    patched += 1;
  }

  console.log(
    dryRun
      ? `[dry-run] ${patched} document(s) à corriger`
      : `${patched} document(s) corrigé(s)`
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
