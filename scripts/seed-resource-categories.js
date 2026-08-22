/**
 * Crée les 5 catégories parentes (Écrits / Enseignement) dans Sanity si elles n'existent pas.
 * Ces catégories racines doivent exister comme documents. D’autres niveaux se créent en choisissant
 * une catégorie parente (même section), sans limite de profondeur côté schéma.
 *
 * Usage: node scripts/seed-resource-categories.js [--dry-run]
 *
 * .env : VITE_SANITY_PROJECT_ID, VITE_SANITY_DATASET, SANITY_API_TOKEN (pour écrire)
 */
import "dotenv/config";
import { client, hasToken } from "./lib/sanityClient.js";

const PARENT_CATEGORIES = [
  {
    slug: "critiques-litteraires",
    title: "Critiques littéraires",
    description: "Articles et commentaires sur les livres d'art récents",
    section: "ecrits",
  },
  {
    slug: "oeil-expo",
    title: "Expositions à voir",
    description: "Articles sur les expositions récentes",
    section: "ecrits",
  },
  {
    slug: "atelier-stages",
    title: "Ateliers & Stages",
    description: "Stages de peinture, cours en atelier et formations pratiques",
    section: "enseignement",
  },
  {
    slug: "histoire-art",
    title: "Histoire de l'art",
    description: "Cours et contenus théoriques",
    section: "enseignement",
  },
  {
    slug: "technique-picturale",
    title: "Technique picturale",
    description: "Cours sur les matériaux et techniques",
    section: "enseignement",
  },
];

function toId(slug) {
  return `resourceCategory-${slug}`;
}

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  if (dryRun) console.log("Mode dry-run : aucune écriture.\n");

  if (!hasToken && !dryRun) {
    console.error("SANITY_API_TOKEN est requis pour créer les documents. Définissez-le dans .env");
    process.exit(1);
  }

  const existing = await client.fetch(
    `*[_type == "resourceCategory" && _id in $ids]._id`,
    { ids: PARENT_CATEGORIES.map((c) => toId(c.slug)) }
  );
  const existingSet = new Set(existing);

  for (const cat of PARENT_CATEGORIES) {
    const id = toId(cat.slug);
    if (existingSet.has(id)) {
      console.log(`Déjà présent : ${cat.title} (${cat.slug})`);
      continue;
    }
    if (dryRun) {
      console.log(`[dry-run] Créerait : ${cat.title} (${cat.slug})`);
      continue;
    }
    try {
      await client.createOrReplace({
        _id: id,
        _type: "resourceCategory",
        title: cat.title,
        slug: { _type: "slug", current: cat.slug },
        description: cat.description,
        section: cat.section,
        // pas de parent = catégorie racine (affichée dans "Catégorie parente")
      });
      console.log(`Créé : ${cat.title} (${cat.slug})`);
    } catch (err) {
      console.error(`Erreur pour ${cat.slug}:`, err.message);
    }
  }

  console.log("\nTerminé. Les catégories parentes devraient apparaître dans le champ « Catégorie parente » du Studio.");
}

main();
