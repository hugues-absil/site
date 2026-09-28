import {
  RESOURCE_CATEGORY_SECTION,
  type ResourceCategoryValue,
} from "../constants/resourceCategories";
import { sectionUrlPrefix } from "@/lib/resourceSection";

/** Types de documents ouverts dans Prévisualisation. */
export const PREVIEWABLE_TYPES = [
  "resource",
  "advice",
  "pressArticle",
  "exhibition",
  "biography",
] as const;

export type PreviewableType = (typeof PREVIEWABLE_TYPES)[number];

export function isPreviewableType(type: string): type is PreviewableType {
  return (PREVIEWABLE_TYPES as readonly string[]).includes(type);
}

export function sitePath(path: string): string {
  const base = (import.meta.env.BASE_URL || "/").replace(/\/$/, "");
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${base}${normalized}` || normalized;
}

function slugOf(doc: Record<string, unknown> | null | undefined): string | null {
  const slug = doc?.slug;
  if (typeof slug === "string" && slug.trim()) return slug.trim();
  if (slug && typeof slug === "object" && "current" in slug) {
    const current = (slug as { current?: unknown }).current;
    if (typeof current === "string" && current.trim()) return current.trim();
  }
  return null;
}

export function resourceHref(doc: {
  slug?: string | null;
  category?: string | null;
  categorySlug?: string | null;
  section?: string | null;
}): string | null {
  const slug = doc.slug?.trim();
  if (!slug) return null;
  const categorySlug = (doc.categorySlug || doc.category || "").trim();
  if (!categorySlug) return null;
  const section =
    doc.section ||
    (categorySlug in RESOURCE_CATEGORY_SECTION
      ? RESOURCE_CATEGORY_SECTION[categorySlug as ResourceCategoryValue]
      : "enseignement");
  return sitePath(`/${sectionUrlPrefix(section)}/${categorySlug}/${slug}`);
}

type SanityClientLike = {
  fetch: <T>(query: string, params?: Record<string, unknown>) => Promise<T>;
};

/**
 * Construit le chemin frontend pour un document (brouillon ou publié).
 * Pour les ressources, résout la catégorie si besoin via une requête légère.
 */
export async function resolvePreviewHref(
  type: string,
  doc: Record<string, unknown> | null | undefined,
  client?: SanityClientLike | null
): Promise<string | null> {
  if (!doc || !isPreviewableType(type)) return null;

  if (type === "biography") {
    return sitePath("/#biography");
  }

  const slug = slugOf(doc);
  if (!slug) return null;

  if (type === "advice") return sitePath(`/journal/${slug}`);
  if (type === "pressArticle") return sitePath(`/presse/${slug}`);
  if (type === "exhibition") return sitePath(`/expositions/${slug}`);

  // resource
  const legacyCategory = typeof doc.category === "string" ? doc.category : null;
  const categoryRef = doc.categoryRef as { _ref?: string } | undefined;
  let categorySlug = legacyCategory;
  let section: string | null = null;

  if (categoryRef?._ref && client) {
    const row = await client.fetch<{ slug?: string; section?: string } | null>(
      `*[_id == $id || _id == "drafts." + $id][0]{ "slug": slug.current, section }`,
      { id: categoryRef._ref.replace(/^drafts\./, "") }
    );
    categorySlug = row?.slug || categorySlug;
    section = row?.section ?? null;
  }

  const href = resourceHref({
    slug,
    category: legacyCategory,
    categorySlug,
    section,
  });

  return href;
}
