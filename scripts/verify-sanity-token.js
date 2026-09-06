/**
 * Vérifie que .env pointe vers le bon projet/dataset et que SANITY_API_TOKEN permet
 * lecture + création + suppression (comme le crawl).
 *
 * Usage (depuis la racine du projet) :
 *   node scripts/verify-sanity-token.js
 *   npm run verify:sanity-token
 *
 * Ne logue jamais le jeton complet (seulement présence, longueur, préfixe sk…).
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
const rawToken = process.env.SANITY_API_TOKEN;
const token = typeof rawToken === "string" ? rawToken.trim() : "";

function describeToken() {
  if (!token) return { present: false, length: 0, looksLikeSanitySecret: false };
  return {
    present: true,
    length: token.length,
    looksLikeSanitySecret: token.startsWith("sk"),
  };
}

async function main() {
  console.log("--- Vérification Sanity (scripts) ---\n");

  if (!projectId) {
    console.error(
      "Manque le project id : SANITY_PROJECT_ID ou VITE_SANITY_PROJECT_ID dans .env"
    );
    process.exit(1);
  }

  const t = describeToken();
  console.log(`Projet   : ${projectId}`);
  console.log(`Dataset  : ${dataset}`);
  console.log(
    `Token    : ${t.present ? "présent" : "ABSENT"}${t.present ? ` (longueur ${t.length}${t.looksLikeSanitySecret ? ", préfixe sk…" : " — préfixe inattendu, vérifiez la valeur"})` : ""}`
  );
  console.log(
    `Répertoire de travail : ${process.cwd()} (dotenv charge .env depuis ici)\n`
  );

  if (!t.present) {
    console.error(
      "Définissez SANITY_API_TOKEN dans .env à la racine du projet, puis relancez."
    );
    process.exit(1);
  }

  const client = createClient({
    projectId,
    dataset,
    apiVersion: "2024-01-01",
    useCdn: false,
    token,
  });

  let readOk = false;
  try {
    const n = await client.fetch('count(*[_type == "contenuAClasser"])');
    readOk = true;
    console.log(`Lecture GROQ : OK (nombre de « contenuAClasser » : ${n})`);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("Lecture GROQ : ÉCHEC —", msg.slice(0, 200));
    console.error(
      "→ Projet / dataset / token incohérents, ou dataset privé sans les bons droits de lecture."
    );
  }

  const checkId = `drafts.sanityTokenVerify${Date.now()}`;
  let writeOk = false;
  try {
    await client.create({
      _id: checkId,
      _type: "contenuAClasser",
      title: "[vérif token — supprimable]",
      sourceUrl: "https://invalid.example/sanity-token-verify",
    });
    await client.delete(checkId);
    writeOk = true;
    console.log("Écriture   : OK (brouillon créé puis supprimé — permission « create » OK)");
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("Écriture   : ÉCHEC —", msg.slice(0, 300));
    if (/insufficient|permission.*create/i.test(msg)) {
      console.error(`
→ Le jeton n’a pas le droit d’écrire sur ce dataset.
  1) https://www.sanity.io/manage → ce projet (${projectId}) → API → Tokens
  2) Créer un token avec rôle Editor ou Administrator (pas Viewer).
  3) Recopier la valeur dans SANITY_API_TOKEN (sans guillemets, sans espace en trop).
`);
    }
  }

  if (!readOk || !writeOk) process.exit(1);
  console.log("\nRésumé : configuration utilisable pour crawl / import.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
