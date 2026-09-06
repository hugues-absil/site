/**
 * Corrige les données qui bloquent les dates expo/stages dans le Studio :
 * 1) Restaure les slugs racines attendus par le site (oeil-expo, atelier-stages)
 * 2) Efface les parents fantômes
 * 3) Pose editorProfile = exposition / atelier sur ces catégories
 * 4) Réécrit editorProfile des ressources de ces branches (écrase « chapitre »)
 *
 * Usage :
 *   SANITY_API_TOKEN=... VITE_SANITY_PROJECT_ID=... VITE_SANITY_DATASET=production \
 *     node scripts/fix-dated-category-profiles.js
 *
 * Options :
 *   --dry-run   affiche les mutations sans les envoyer
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

/** Cibles stables par _id Sanity (indépendant du slug affiché). */
const ROOT_FIXES = [
  {
    id: "resourceCategory-oeil-expo",
    slug: "oeil-expo",
    profile: "exposition",
    titleHint: "Expositions à voir",
  },
  {
    id: "resourceCategory-atelier-stages",
    slug: "atelier-stages",
    profile: "atelier",
    titleHint: "Ateliers & Stages",
  },
];

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

function draftId(id) {
  return id.startsWith("drafts.") ? id : `drafts.${id}`;
}

function publishedId(id) {
  return id.replace(/^drafts\./, "");
}

async function patchIfExists(id, build) {
  const exists = await client.fetch(`count(*[_id == $id])`, { id });
  if (!exists) return false;
  if (dryRun) {
    console.log(`[dry-run] patch ${id}`);
    return true;
  }
  let p = client.patch(id);
  p = build(p);
  await p.commit({ autoGenerateArrayKeys: true });
  console.log(`patched ${id}`);
  return true;
}

async function patchPublishedAndDraft(id, build) {
  const pub = publishedId(id);
  await patchIfExists(pub, build);
  await patchIfExists(draftId(pub), build);
}

async function main() {
  console.log(`Project ${projectId}/${dataset}${dryRun ? " (dry-run)" : ""}`);

  for (const fix of ROOT_FIXES) {
    const cat = await client.fetch(
      `*[_id in $ids][0]{ _id, title, "slug": slug.current, editorProfile, parent }`,
      { ids: [fix.id, draftId(fix.id)] }
    );
    if (!cat) {
      console.warn(`Catégorie introuvable: ${fix.id}`);
      continue;
    }

    console.log(
      `\nCatégorie ${cat._id} « ${cat.title} » slug=${cat.slug} profile=${cat.editorProfile} → slug=${fix.slug} profile=${fix.profile}`
    );

    await patchPublishedAndDraft(fix.id, (p) =>
      p.unset(["parent"]).set({
        editorProfile: fix.profile,
        slug: { _type: "slug", current: fix.slug },
      })
    );

    const resources = await client.fetch(
      `*[_type == "resource" && (
          categoryRef._ref in $catIds ||
          categoryRef->slug.current == $slug ||
          categoryRef->parent->slug.current == $slug
        )]{ _id, title, editorProfile }`,
      {
        slug: fix.slug,
        catIds: [fix.id, draftId(fix.id)],
      }
    );

    // Aussi les ressources encore rattachées si le slug avait changé (ex. critique-d-expositions-a-voir)
    const byRef = await client.fetch(
      `*[_type == "resource" && categoryRef._ref in $catIds]{ _id, title, editorProfile }`,
      { catIds: [fix.id, draftId(fix.id)] }
    );

    const map = new Map();
    for (const r of [...resources, ...byRef]) map.set(r._id, r);
    const all = [...map.values()];

    let fixed = 0;
    for (const res of all) {
      if (res.editorProfile === fix.profile) continue;
      if (dryRun) {
        console.log(
          `  [dry-run] resource ${res._id}: ${res.editorProfile} → ${fix.profile} (${res.title})`
        );
      } else {
        await patchPublishedAndDraft(res._id, (p) =>
          p.set({ editorProfile: fix.profile })
        );
      }
      fixed += 1;
    }
    console.log(`  ressources corrigées : ${fixed}/${all.length}`);
  }

  console.log("\nTerminé.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

// migration-run: 2026-09-06T22:07Z
