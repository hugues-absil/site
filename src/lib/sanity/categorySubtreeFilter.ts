/** Profondeur max des ancêtres pour les requêtes resource / categoryRef (GROQ statique). */
export const RESOURCE_CATEGORY_ANCESTOR_DEPTH = 14;

/**
 * Conditions GROQ : la ressource appartient à la catégorie $category (feuille ou ancêtre).
 * Paramètre attendu : $category (slug).
 */
export function buildResourceMatchesCategorySlugConditions(depth: number): string {
  const parts: string[] = [];
  let path = "categoryRef";
  for (let i = 0; i <= depth; i++) {
    parts.push(`${path}->slug.current == $category`);
    if (i < depth) path += "->parent";
  }
  return parts.join(" || ");
}

/**
 * Filtre Studio / liste : ressources dans le sous-arbre d'une racine (slug param).
 * Inclut l'ancien champ `category` pour compatibilité legacy.
 */
export function buildResourceInRootCategorySubtreeFilter(
  depth = RESOURCE_CATEGORY_ANCESTOR_DEPTH
): string {
  const subtree = buildResourceMatchesCategorySlugConditions(depth).replace(/\$category/g, "$rootSlug");
  return `_type == "resource" && (category == $rootSlug || ${subtree})`;
}

/** Filtre Studio : ressources sans catégorie (ni categoryRef ni category legacy). */
export const RESOURCE_UNCATEGORIZED_FILTER = `_type == "resource" && !defined(categoryRef) && (!defined(category) || category == "")`;

/**
 * Filtre Studio : ressources rattachées directement à une catégorie ($categoryId).
 * Paramètre : $categoryId (id publié ou draft).
 */
export function buildResourceDirectInCategoryFilter(): string {
  return `_type == "resource" && (
    categoryRef._ref == $categoryId
    || categoryRef._ref == "drafts." + $categoryId
    || "drafts." + categoryRef._ref == $categoryId
  )`;
}

/**
 * Filtre Studio : ressources dans le sous-arbre d'une catégorie (par _id de nœud).
 * Paramètre : $categoryId.
 */
export function buildResourceInCategoryIdSubtreeFilter(
  depth = RESOURCE_CATEGORY_ANCESTOR_DEPTH
): string {
  const parts: string[] = [];
  let path = "categoryRef";
  for (let i = 0; i <= depth; i++) {
    parts.push(
      `${path}._ref == $categoryId || ${path}._ref == "drafts." + $categoryId || "drafts." + ${path}._ref == $categoryId`
    );
    if (i < depth) path += "->parent";
  }
  return `_type == "resource" && (${parts.join(" || ")})`;
}

/** Filtre Studio : catégories enfants directs d'un parent ($parentId). */
export function buildChildCategoriesFilter(): string {
  return `_type == "resourceCategory" && (
    parent._ref == $parentId
    || parent._ref == "drafts." + $parentId
    || "drafts." + parent._ref == $parentId
  )`;
}

/** Filtre Studio : catégories racines d'une section ($section). */
export const RESOURCE_CATEGORY_ROOTS_FILTER = `_type == "resourceCategory" && section == $section && !defined(parent)`;
