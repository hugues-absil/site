import type { DocumentBadgeComponent } from "sanity";

/**
 * Pastille visible quand un document publié a aussi un brouillon
 * (modifications non encore en ligne).
 */
export const UnpublishedChangesBadge: DocumentBadgeComponent = (props) => {
  const { draft, published } = props;
  if (!draft || !published) return null;

  return {
    label: "Modifications non publiées",
    title: "Ce document a des changements en brouillon qui ne sont pas encore en ligne.",
    color: "warning",
  };
};
