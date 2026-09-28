import { defineLocations } from "sanity/presentation";
import { resourceHref, sitePath } from "./previewPaths";

/**
 * Résolution document → URL pour l’outil Prévisualisation (Presentation).
 */
export const presentationLocations = {
  resource: defineLocations({
    select: {
      title: "title",
      slug: "slug.current",
      category: "category",
      categorySlug: "categoryRef.slug.current",
      section: "categoryRef.section",
    },
    resolve: (doc) => {
      const href = doc ? resourceHref(doc) : null;
      return {
        locations: href
          ? [{ title: doc?.title || "Ressource", href }]
          : [],
      };
    },
  }),
  advice: defineLocations({
    select: { title: "title", slug: "slug.current" },
    resolve: (doc) => ({
      locations:
        doc?.slug
          ? [{ title: doc.title || "Journal", href: sitePath(`/journal/${doc.slug}`) }]
          : [],
    }),
  }),
  pressArticle: defineLocations({
    select: { title: "title", slug: "slug.current" },
    resolve: (doc) => ({
      locations:
        doc?.slug
          ? [{ title: doc.title || "Presse", href: sitePath(`/presse/${doc.slug}`) }]
          : [],
    }),
  }),
  exhibition: defineLocations({
    select: { title: "title", slug: "slug.current" },
    resolve: (doc) => ({
      locations:
        doc?.slug
          ? [
              {
                title: doc.title || "Exposition",
                href: sitePath(`/expositions/${doc.slug}`),
              },
            ]
          : [],
    }),
  }),
  biography: defineLocations({
    select: {},
    resolve: () => ({
      locations: [
        {
          title: "Biographie",
          href: sitePath("/#biography"),
        },
      ],
    }),
  }),
};
