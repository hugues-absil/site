/** Évite un import circulaire data ↔ resourceCategoryTree. */

export type CategoryRefNode = {
  _id?: string;
  title?: string;
  slug?: string;
  section?: string;
  showTableOfContents?: boolean;
  parent?: CategoryRefNode | null;
};

const MAX_CATEGORY_TREE_DEPTH = 48;

/**
 * Remonte la chaîne parent depuis la feuille (categoryRef) et retourne
 * [racine, …, feuille] en slugs, ainsi que le slug feuille.
 */
export function slugsFromCategoryRef(ref: CategoryRefNode | null | undefined): {
  leafSlug: string;
  ancestorSlugs: string[];
} {
  if (!ref?.slug) {
    return { leafSlug: "", ancestorSlugs: [] };
  }
  const up: string[] = [];
  let cur: CategoryRefNode | null | undefined = ref;
  let guard = 0;
  const seen = new Set<string>();
  while (cur && guard++ < MAX_CATEGORY_TREE_DEPTH) {
    const slug = cur.slug;
    if (slug) {
      if (seen.has(slug)) break;
      seen.add(slug);
      up.push(slug);
    }
    cur = cur.parent ?? null;
  }
  const ancestorSlugs = [...up].reverse();
  return { leafSlug: ref.slug, ancestorSlugs };
}
