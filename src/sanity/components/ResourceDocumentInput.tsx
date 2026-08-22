import { useContext, useEffect, useRef } from "react";
import { PatchEvent, set, unset, useClient, type ObjectInputProps } from "sanity";
import { FormCallbacksContext } from "sanity/_singletons";
import { isEditorProfile } from "../lib/resourceEditorProfile";
import { resolveEditorProfileForCategoryId } from "../lib/resolveEditorProfile";

type ResourceDoc = {
  categoryRef?: { _ref?: string };
  editorProfile?: string;
};

/**
 * Input document Ressource : synchronise editorProfile au bon niveau
 * (racine du document), pas à l’intérieur de categoryRef.
 */
export function ResourceDocumentInput(props: ObjectInputProps) {
  const { value, renderDefault } = props;
  const client = useClient({ apiVersion: "2024-01-01" });
  const formCallbacks = useContext(FormCallbacksContext) as
    | { onChange?: (event: PatchEvent) => void }
    | null
    | undefined;
  const lastKeyRef = useRef<string | null>(null);

  const doc = (value ?? {}) as ResourceDoc;
  const categoryId =
    doc.categoryRef && typeof doc.categoryRef === "object"
      ? String(doc.categoryRef._ref ?? "")
      : "";
  const currentProfile = doc.editorProfile;

  useEffect(() => {
    const onChange = formCallbacks?.onChange;
    if (!onChange) return;

    const key = categoryId || "";
    if (lastKeyRef.current === key) return;
    lastKeyRef.current = key;

    let cancelled = false;

    async function syncProfile() {
      try {
        if (!categoryId) {
          if (currentProfile != null && currentProfile !== "") {
            onChange!(PatchEvent.from(unset(["editorProfile"])));
          }
          return;
        }

        const profile = await resolveEditorProfileForCategoryId(client, categoryId);
        if (cancelled) return;

        if (profile) {
          if (currentProfile === profile) return;
          onChange!(PatchEvent.from(set(profile, ["editorProfile"])));
          return;
        }

        if (isEditorProfile(currentProfile)) return;
        if (currentProfile != null && currentProfile !== "") {
          onChange!(PatchEvent.from(unset(["editorProfile"])));
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
  }, [categoryId, client, formCallbacks?.onChange, currentProfile]);

  return renderDefault(props);
}
