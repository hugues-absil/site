import { EyeOpenIcon } from "@sanity/icons";
import { useClient } from "sanity";
import {
  isPreviewableType,
  resolvePreviewHref,
} from "../presentation/previewPaths";

function hasSlug(doc: Record<string, unknown> | null | undefined): boolean {
  if (!doc) return false;
  const slug = doc.slug;
  if (typeof slug === "string" && slug.trim()) return true;
  if (slug && typeof slug === "object" && "current" in slug) {
    const current = (slug as { current?: unknown }).current;
    return typeof current === "string" && Boolean(current.trim());
  }
  return false;
}

/** Chemin Studio Présentation, ex. `/site/studio/presentation`. */
function studioPresentationPath(): string {
  const base = (import.meta.env.BASE_URL || "/").replace(/\/$/, "");
  return `${base}/studio/presentation`;
}

/**
 * Action « Prévisualiser » : ouvre l’outil Prévisualisation sur l’URL du document.
 */
export function PreviewAction(props: {
  id: string;
  type: string;
  draft: unknown;
  published: unknown;
  onComplete?: () => void;
}) {
  const { id, type, draft, published, onComplete } = props;
  const client = useClient({ apiVersion: "2024-01-01" });

  if (!isPreviewableType(type)) return null;

  const doc = (draft ?? published) as Record<string, unknown> | null;
  const canPreview = type === "biography" || hasSlug(doc);

  return {
    label: "Prévisualiser",
    icon: EyeOpenIcon,
    disabled: !canPreview,
    title: canPreview
      ? "Ouvre l’aperçu du site (brouillons inclus) pour ce document."
      : "Impossible de prévisualiser : renseignez d’abord le slug.",
    onHandle: async () => {
      const href = await resolvePreviewHref(type, doc, client);
      if (href) {
        const qs = new URLSearchParams({ preview: href });
        const docId = id.replace(/^drafts\./, "");
        // Ne PAS passer perspective=previewDrafts : Sanity le prend pour une "release"
        // et bloque l’édition (« Not in the previewDrafts release »).
        window.location.assign(
          `${studioPresentationPath()}/${type}/${docId}?${qs.toString()}`
        );
      }
      onComplete?.();
    },
  };
}
