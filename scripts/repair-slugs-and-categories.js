/**
 * Répare slugs / catégories Sanity sans supprimer de documents.
 *
 * - Ressources : slugs en double → renomme les non-canoniques ({base}-{leaf})
 * - Ressources sans slug → génère depuis le titre
 * - Ressources sans catégorie → categoryRef + category (legacy string → ref, sinon oeil-expo)
 * - Expositions / peintures / films : slugs manquants ou doublons
 *
 * Usage :
 *   VITE_SANITY_PROJECT_ID=... VITE_SANITY_DATASET=production \
 *     node scripts/repair-slugs-and-categories.js --dry-run
 *
 *   SANITY_API_TOKEN=... VITE_SANITY_PROJECT_ID=... \
 *     node scripts/repair-slugs-and-categories.js
 *
 * Écrit un journal JSON dans scripts/repair-logs/ (ou --log=chemin).
 */
import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@sanity/client";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

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
const logArg = process.argv.find((a) => a.startsWith("--log="));
const logPath = logArg
  ? path.resolve(logArg.slice("--log=".length))
  : path.join(
      ROOT,
      "scripts/repair-logs",
      `repair-${new Date().toISOString().replace(/[:.]/g, "-")}.json`
    );

const OEIL_EXPO_CATEGORY_ID = "resourceCategory-oeil-expo";
const OEIL_EXPO_SLUG = "oeil-expo";

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

const journal = [];

function draftId(id) {
  return id.startsWith("drafts.") ? id : `drafts.${id}`;
}

function publishedId(id) {
  return id.replace(/^drafts\./, "");
}

function slugify(input) {
  return String(input || "")
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 96);
}

function record(entry) {
  journal.push({ ...entry, at: new Date().toISOString() });
  const label = entry.dryRun ? "[dry-run]" : "[patch]";
  console.log(label, entry.type, entry.id, entry.field, `${entry.before ?? "∅"} → ${entry.after}`);
}

async function patchSlug(id, newSlug, type, before) {
  const pub = publishedId(id);
  const ids = [pub, draftId(pub)];
  for (const target of ids) {
    const exists = await client.fetch(`count(*[_id == $id])`, { id: target });
    if (!exists) continue;
    record({
      dryRun,
      type,
      id: target,
      field: "slug.current",
      before: before ?? null,
      after: newSlug,
    });
    if (dryRun) continue;
    await client
      .patch(target)
      .set({ slug: { _type: "slug", current: newSlug } })
      .commit();
  }
}

async function patchCategory(id, categoryId, categorySlug, before) {
  const pub = publishedId(id);
  const ids = [pub, draftId(pub)];
  for (const target of ids) {
    const exists = await client.fetch(`count(*[_id == $id])`, { id: target });
    if (!exists) continue;
    record({
      dryRun,
      type: "resource",
      id: target,
      field: "categoryRef+category",
      before: before ?? null,
      after: `${categorySlug} (${categoryId})`,
    });
    if (dryRun) continue;
    await client
      .patch(target)
      .set({
        category: categorySlug,
        categoryRef: { _type: "reference", _ref: categoryId },
      })
      .commit();
  }
}

function allocateUnique(base, used) {
  let candidate = base || "item";
  if (!used.has(candidate)) {
    used.add(candidate);
    return candidate;
  }
  let n = 2;
  while (used.has(`${candidate}-${n}`)) n += 1;
  const out = `${candidate}-${n}`;
  used.add(out);
  return out;
}

async function loadSitemapSlugs() {
  const sitemapPath = path.join(ROOT, "public/sitemap.xml");
  if (!fs.existsSync(sitemapPath)) return new Set();
  const xml = fs.readFileSync(sitemapPath, "utf8");
  const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  const set = new Set();
  for (const loc of locs) {
    try {
      const u = new URL(loc);
      set.add(u.pathname.replace(/\/$/, ""));
    } catch {
      /* ignore */
    }
  }
  return set;
}

function resourceLeaf(doc) {
  return doc.categoryRef?.slug || doc.category || "";
}

function resourcePathHint(doc) {
  const leaf = resourceLeaf(doc);
  const section = doc.categoryRef?.section === "enseignement" ? "enseignement" : "critiques";
  if (!doc.slug || !leaf) return "";
  return `/${section}/${leaf}/${doc.slug}`;
}

async function repairResources(sitemapPaths) {
  const docs = await client.fetch(`*[_type == "resource"]{
    _id, _createdAt, title, "slug": slug.current, category,
    "categoryRef": categoryRef->{ _id, "slug": slug.current, section }
  }`);
  const categories = await client.fetch(
    `*[_type == "resourceCategory"]{ _id, "slug": slug.current }`
  );
  const catBySlug = new Map(categories.map((c) => [c.slug, publishedId(c._id)]));

  const usedSlugs = new Set(
    docs.map((d) => d.slug).filter((s) => typeof s === "string" && s.trim() !== "")
  );

  // Missing category
  for (const doc of docs) {
    const hasRef = Boolean(doc.categoryRef?.slug);
    const legacy = typeof doc.category === "string" ? doc.category.trim() : "";
    if (hasRef) continue;
    if (legacy && catBySlug.has(legacy)) {
      await patchCategory(doc._id, catBySlug.get(legacy), legacy, legacy || null);
      doc.categoryRef = { _id: catBySlug.get(legacy), slug: legacy };
      doc.category = legacy;
      continue;
    }
    if (!legacy) {
      const oeilId = catBySlug.get(OEIL_EXPO_SLUG) || OEIL_EXPO_CATEGORY_ID;
      await patchCategory(doc._id, oeilId, OEIL_EXPO_SLUG, null);
      doc.categoryRef = { _id: oeilId, slug: OEIL_EXPO_SLUG, section: "ecrits" };
      doc.category = OEIL_EXPO_SLUG;
    }
  }

  // Missing slug
  for (const doc of docs) {
    if (doc.slug && String(doc.slug).trim() !== "") continue;
    const base = slugify(doc.title) || `ressource-${publishedId(doc._id).slice(-8)}`;
    const next = allocateUnique(base, usedSlugs);
    await patchSlug(doc._id, next, "resource", doc.slug);
    doc.slug = next;
  }

  // Duplicate slugs
  const bySlug = new Map();
  for (const doc of docs) {
    if (!doc.slug) continue;
    const list = bySlug.get(doc.slug) || [];
    list.push(doc);
    bySlug.set(doc.slug, list);
  }

  for (const [slug, group] of bySlug) {
    if (group.length < 2) continue;
    const scored = [...group].sort((a, b) => {
      const pathA = resourcePathHint(a);
      const pathB = resourcePathHint(b);
      const inMapA = pathA && sitemapPaths.has(pathA) ? 1 : 0;
      const inMapB = pathB && sitemapPaths.has(pathB) ? 1 : 0;
      if (inMapA !== inMapB) return inMapB - inMapA;
      return String(a._createdAt || "").localeCompare(String(b._createdAt || ""));
    });
    const canonical = scored[0];
    for (const doc of scored.slice(1)) {
      const leaf = resourceLeaf(doc) || "item";
      const base = `${slug}-${slugify(leaf) || "item"}`;
      // free the old slug from used set only for this doc's reassignment tracking
      const next = allocateUnique(base, usedSlugs);
      await patchSlug(doc._id, next, "resource", slug);
      doc.slug = next;
    }
    // keep canonical slug reserved
    usedSlugs.add(canonical.slug);
  }
}

async function repairTypeSlugs(type) {
  const docs = await client.fetch(
    `*[_type == $type]{ _id, _createdAt, title, "slug": slug.current }`,
    { type }
  );
  const used = new Set(docs.map((d) => d.slug).filter((s) => typeof s === "string" && s.trim() !== ""));

  for (const doc of docs) {
    if (doc.slug && String(doc.slug).trim() !== "") continue;
    const base = slugify(doc.title) || `${type}-${publishedId(doc._id).slice(-8)}`;
    const next = allocateUnique(base, used);
    await patchSlug(doc._id, next, type, doc.slug);
    doc.slug = next;
  }

  const bySlug = new Map();
  for (const doc of docs) {
    if (!doc.slug) continue;
    const list = bySlug.get(doc.slug) || [];
    list.push(doc);
    bySlug.set(doc.slug, list);
  }
  for (const [slug, group] of bySlug) {
    if (group.length < 2) continue;
    const scored = [...group].sort((a, b) =>
      String(a._createdAt || "").localeCompare(String(b._createdAt || ""))
    );
    for (const doc of scored.slice(1)) {
      const next = allocateUnique(`${slug}-bis`, used);
      await patchSlug(doc._id, next, type, slug);
      doc.slug = next;
    }
  }
}

async function main() {
  console.log(`Repair slugs/categories (${dryRun ? "dry-run" : "LIVE"}) project=${projectId} dataset=${dataset}`);
  const sitemapPaths = await loadSitemapSlugs();
  console.log("Sitemap paths loaded:", sitemapPaths.size);

  await repairResources(sitemapPaths);
  await repairTypeSlugs("exhibition");
  await repairTypeSlugs("painting");
  await repairTypeSlugs("film");

  fs.mkdirSync(path.dirname(logPath), { recursive: true });
  fs.writeFileSync(logPath, JSON.stringify({ dryRun, projectId, dataset, journal }, null, 2));
  console.log("Journal:", logPath, `(${journal.length} entries)`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
