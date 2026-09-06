/**
 * Client Sanity pour les scripts Node (migration, upload en masse).
 * Charge les variables depuis .env (VITE_SANITY_PROJECT_ID, VITE_SANITY_DATASET, SANITY_API_TOKEN).
 */
import "dotenv/config";
import { createClient } from "@sanity/client";

const projectId =
  process.env.SANITY_PROJECT_ID || process.env.VITE_SANITY_PROJECT_ID;
const dataset =
  process.env.SANITY_DATASET || process.env.VITE_SANITY_DATASET || "production";
const token =
  typeof process.env.SANITY_API_TOKEN === "string"
    ? process.env.SANITY_API_TOKEN.trim()
    : undefined;

if (!projectId || !dataset) {
  console.error(
    "Erreur: définir SANITY_PROJECT_ID (ou VITE_SANITY_PROJECT_ID) et SANITY_DATASET (ou VITE_SANITY_DATASET) dans .env"
  );
  process.exit(1);
}

export const client = createClient({
  projectId,
  dataset,
  apiVersion: "2024-01-01",
  useCdn: false,
  token: token || undefined,
});

export const hasToken = Boolean(token);
if (!hasToken) {
  console.warn(
    "Avertissement: SANITY_API_TOKEN non défini. Les écritures (create, patch) échoueront."
  );
}
