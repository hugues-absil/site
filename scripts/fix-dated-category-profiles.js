/**
 * Corrige les données qui bloquent les dates expo/stages dans le Studio :
 * 1) Efface les parents fantômes sur les catégories racines datées
 * 2) Pose editorProfile = exposition / atelier sur oeil-expo / atelier-stages
 * 3) Réécrit editorProfile des ressources de ces branches (écrase « chapitre » erroné)
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

const ROOT_PROFILES = {
  "oeil-expo": "exposition",
  "atelier-stages": "atelier",
};

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

async function patchBoth(id, patchFn) {
  const ids = [...new Set([publishedId(id), draftId(id)])];
  for (const docId of ids) {
    const exists = await client.fetch(`count(*[_id == $id])`, { id: docId });
    if (!exists) continue;
    if (dryRun) {
      console.log(`[dry-run] patch ${docId}`, patchFn);
      continue;
    }
    let p = client.patch(docId);
    p = patchFn(p);
    await p.commit({ autoGenerateArrayKeys: true });
    console.log(`patched ${docId}`);
  }
}

async function main() {
  console.log(`Project ${projectId}/${dataset}${dryRun ? " (dry-run)" : ""}`);

  const roots = await client.fetch(
    `*[_type == "resourceCategory" && slug.current in $slugs]{
      _id, title, "slug": slug.current, editorProfile, parent
    }`,
    { slugs: Object.keys(ROOT_PROFILES) }
  );

  for (const cat of roots) {
    const wanted = ROOT_PROFILES[cat.slug];
    console.log(`\nCatégorie ${cat.slug} (${cat.title}) → profil ${wanted}`);

    await patchBoth(cat._id, (p) => {
      let next = p.unset(["parent"]).set({ editorProfile: wanted });
      return next;
    });

    const resources = await client.fetch(
      `*[_type == "resource" && (
          categoryRef._ref in $catIds ||
          categoryRef->slug.current == $slug ||
          categoryRef->parent->slug.current == $slug
        )]{ _id, title, editorProfile }`,
      {
        slug: cat.slug,
        catIds: [publishedId(cat._id), draftId(cat._id)],
      }
    );

    let fixed = 0;
    for (const res of resources) {
      if (res.editorProfile === wanted) continue;
      if (dryRun) {
        console.log(
          `  [dry-run] resource ${res._id}: ${res.editorProfile} → ${wanted} (${res.title})`
        );
      } else {
        await client
          .patch(res._id)
          .set({ editorProfile: wanted })
          .commit();
        // aussi le draft s'il existe
        const d = draftId(res._id);
        if (d !== res._id) {
          const draftExists = await client.fetch(`count(*[_id == $id])`, { id: d });
          if (draftExists) {
            await client.patch(d).set({ editorProfile: wanted }).commit();
          }
        }
      }
      fixed += 1;
    }
    console.log(`  ressources à corriger : ${fixed}/${resources.length}`);
  }

  console.log("\nTerminé.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
