import type { Resource, ResourceCategory } from "./data";

export type { CategoryRefNode } from "./categoryRefUtils";
export { slugsFromCategoryRef } from "./categoryRefUtils";

/** Profondeur max côté client (protection boucles / données corrompues). */
export const MAX_CATEGORY_TREE_DEPTH = 48;

/** La ressource appartient à la page `pageSlug` si ce slug figure dans sa chaîne d’ancêtres (y compris feuille). */
export function resourceBelongsToCategoryPage(resource: Resource, pageSlug: string): boolean {
  if (!pageSlug) return false;
  const chain = resource.categoryAncestorSlugs;
  if (chain?.length) return chain.includes(pageSlug);
  if (resource.categoryRef?.slug === pageSlug) return true;
  return resource.categoryRef?.parent?.slug === pageSlug;
}

/** Ressources classées directement sous ce slug (feuille = categoryRef du document). */
export function resourcesDirectlyInCategory(resources: Resource[], categorySlug: string): Resource[] {
  return resources.filter((r) => r.categoryRef?.slug === categorySlug);
}

export type CategoryTreeNode = ResourceCategory & { children: CategoryTreeNode[] };

/**
 * Construit un arbre n-aire à partir d’une liste plate, racines = parentSlug.
 * Détecte les cycles / parents manquants (orphelins ignorés pour cette branche).
 */
export function buildCategorySubtrees(
  flat: ResourceCategory[],
  rootParentSlug: string | null,
  maxDepth = MAX_CATEGORY_TREE_DEPTH
): CategoryTreeNode[] {
  const byParent = new Map<string | null, ResourceCategory[]>();
  for (const c of flat) {
    const p = c.parent?.slug ?? null;
    const list = byParent.get(p) ?? [];
    list.push(c);
    byParent.set(p, list);
  }
  const sortFn = (a: ResourceCategory, b: ResourceCategory) => (a.order ?? 999) - (b.order ?? 999);

  function attach(node: ResourceCategory, depth: number, stack: Set<string>): CategoryTreeNode | null {
    if (depth > maxDepth) return null;
    if (stack.has(node.slug)) return null;
    stack.add(node.slug);
    const rawKids = byParent.get(node.slug) ?? [];
    const children: CategoryTreeNode[] = [];
    for (const k of [...rawKids].sort(sortFn)) {
      const sub = attach(k, depth + 1, stack);
      if (sub) children.push(sub);
    }
    stack.delete(node.slug);
    return { ...node, children };
  }

  const roots = (byParent.get(rootParentSlug) ?? []).sort(sortFn);
  const out: CategoryTreeNode[] = [];
  const stack = new Set<string>();
  for (const r of roots) {
    const tree = attach(r, 0, stack);
    if (tree) out.push(tree);
  }
  return out;
}

/** Compte les ressources dont la chaîne d’ancêtres contient `slug` (sous-arbre). */
export function countResourcesInSubtree(resources: Resource[], slug: string): number {
  return resources.filter((r) => r.categoryAncestorSlugs?.includes(slug)).length;
}

/** Indique si ce nœud ou un descendant porte au moins une ressource affichée (sommaire utile). */
export function categoryTocNodeVisible(node: CategoryTreeNode, resources: Resource[]): boolean {
  if (resourcesDirectlyInCategory(resources, node.slug).length > 0) return true;
  return node.children.some((ch) => categoryTocNodeVisible(ch, resources));
}
