import { createClient, type SanityClient } from "@sanity/client";
import { createImageUrlBuilder } from "@sanity/image-url";
import type { SanityImageSource } from "@sanity/image-url";

const projectId = import.meta.env.VITE_SANITY_PROJECT_ID as string | undefined;
const dataset = (import.meta.env.VITE_SANITY_DATASET as string | undefined) || "production";
const viewerToken = import.meta.env.VITE_SANITY_VIEWER_TOKEN as string | undefined;

const PREVIEW_STORAGE_KEY = "sanity-preview-session";

/** Client public (CDN, contenu publié uniquement). */
export const client: SanityClient | null = projectId
  ? createClient({
      projectId,
      dataset,
      apiVersion: "2024-01-01",
      useCdn: import.meta.env.PROD,
    })
  : null;

let previewClient: SanityClient | null = null;

function getPreviewClient(): SanityClient | null {
  if (!projectId || !viewerToken) return null;
  if (!previewClient) {
    previewClient = createClient({
      projectId,
      dataset,
      apiVersion: "2024-01-01",
      useCdn: false,
      token: viewerToken,
      perspective: "drafts",
      stega: {
        enabled: true,
        studioUrl: `${(import.meta.env.BASE_URL || "/").replace(/\/$/, "")}/studio`,
      },
    });
  }
  return previewClient;
}

export function isPreviewSessionActive(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return sessionStorage.getItem(PREVIEW_STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

export function enablePreviewSession(): void {
  try {
    sessionStorage.setItem(PREVIEW_STORAGE_KEY, "1");
  } catch {
    /* ignore */
  }
}

export function disablePreviewSession(): void {
  try {
    sessionStorage.removeItem(PREVIEW_STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

/**
 * Client courant : preview (brouillons + stega) si session Presentation active,
 * sinon client public publié.
 */
export function getSanityClient(): SanityClient | null {
  if (isPreviewSessionActive()) {
    return getPreviewClient() ?? client;
  }
  return client;
}

/** Client avec token pour valider le secret preview (même sans session encore active). */
export function getViewerClient(): SanityClient | null {
  return getPreviewClient() ?? client;
}

const builder = client ? createImageUrlBuilder(client) : null;

export function urlFor(source: SanityImageSource) {
  if (!builder) {
    throw new Error("Sanity client not configured. Cannot build image URLs.");
  }
  return builder.image(source);
}
