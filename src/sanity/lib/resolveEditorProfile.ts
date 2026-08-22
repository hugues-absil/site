import type { SanityClient } from "@sanity/client";
import {
  canonicalDocId,
  idPair,
  isEditorProfile,
  profileFromRootSlug,
  type EditorProfile,
} from "./resourceEditorProfile";

type CategoryProfileRow = {
  editorProfile?: string;
  slug?: string;
  parentId?: string;
};

/**
 * Remonte la chaîne parent jusqu’à trouver un editorProfile, sinon fallback slug racine.
 */
export async function resolveEditorProfileForCategoryId(
  client: SanityClient,
  categoryId: string
): Promise<EditorProfile | undefined> {
  let id: string | undefined = categoryId;
  const visited = new Set<string>();

  for (let depth = 0; depth < 52; depth++) {
    if (!id) return undefined;
    const canon = canonicalDocId(id);
    if (visited.has(canon)) return undefined;
    visited.add(canon);

    const row: CategoryProfileRow | null = await client.fetch(
      `*[_id in $ids][0]{
        editorProfile,
        "slug": slug.current,
        "parentId": parent._ref
      }`,
      { ids: idPair(id) }
    );
    if (!row) return undefined;

    if (isEditorProfile(row.editorProfile)) {
      return row.editorProfile;
    }
    const fromSlug = profileFromRootSlug(row.slug);
    if (fromSlug) {
      return fromSlug;
    }
    id = row.parentId;
  }
  return undefined;
}
