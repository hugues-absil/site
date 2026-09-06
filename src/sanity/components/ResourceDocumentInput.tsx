import { useEffect, useRef } from "react";
import { PatchEvent, set, unset, useClient, type ObjectInputProps } from "sanity";
import { isEditorProfile } from "../lib/resourceEditorProfile";
import { resolveEditorProfileForCategoryId } from "../lib/resolveEditorProfile";

type ResourceDoc = {
  categoryRef?: { _ref?: string };
  editorProfile?: string;
};

/**
 * Input document Ressource : synchronise editorProfile au niveau document
 * selon la catégorie (et son héritage / fallback slug).
 *
 * Important : utiliser props.onChange (API publique), pas FormCallbacksContext,
 * sinon le patch peut ne jamais s’appliquer et le profil reste « chapitre »
 * → champs date masqués pour les expos / stages.
 */
export function ResourceDocumentInput(props: ObjectInputProps) {
  const { value, onChange, renderDefault } = props;
  const client = useClient({ apiVersion: "2024-01-01" });
  const lastSyncRef = useRef<string | null>(null);

  const doc = (value ?? {}) as ResourceDoc;
  const categoryId =
    doc.categoryRef && typeof doc.categoryRef === "object"
      ? String(doc.categoryRef._ref ?? "")
      : "";
  const currentProfile = doc.editorProfile;

  useEffect(() => {
    if (!onChange) return;

    let cancelled = false;

    async function syncProfile() {
      try {
        if (!categoryId) {
          const syncKey = "nocat";
          if (lastSyncRef.current === syncKey) return;
          if (currentProfile != null && currentProfile !== "") {
            lastSyncRef.current = syncKey;
            onChange(PatchEvent.from(unset(["editorProfile"])));
          }
          return;
        }

        const profile = await resolveEditorProfileForCategoryId(client, categoryId);
        if (cancelled) return;

        if (profile) {
          const syncKey = `${categoryId}:${profile}`;
          if (currentProfile === profile) {
            lastSyncRef.current = syncKey;
            return;
          }
          // Écrase un ancien profil erroné (ex. « chapitre » sur une expo à voir).
          lastSyncRef.current = syncKey;
          onChange(PatchEvent.from(set(profile, ["editorProfile"])));
          return;
        }

        // Pas de profil résolu : ne pas effacer un profil déjà valide.
        if (isEditorProfile(currentProfile)) return;
        if (currentProfile != null && currentProfile !== "") {
          lastSyncRef.current = `${categoryId}:unset`;
          onChange(PatchEvent.from(unset(["editorProfile"])));
        }
      } catch {
        /* ne pas planter le Studio */
      }
    }

    const t = window.setTimeout(() => {
      void syncProfile();
    }, 0);

    return () => {
      cancelled = true;
      window.clearTimeout(t);
    };
  }, [categoryId, client, onChange, currentProfile]);

  return renderDefault(props);
}
