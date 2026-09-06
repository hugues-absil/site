/**
 * Tests du matching / classement / URLs de recherche : `npx tsx scripts/test-site-search.ts`
 */
import assert from "node:assert/strict";
import {
  buildSearchIndexFromPayload,
  exhibitionHref,
  isSearchQueryReady,
  journalHref,
  normalizeSearchText,
  pressHref,
  resourceHref,
  resourceSectionAndLeaf,
  scoreSearchItem,
  searchIndex,
  SEARCH_TIER,
  type SearchIndexItem,
} from "../src/lib/search.ts";

assert.equal(normalizeSearchText("  École  "), "ecole");
assert.equal(normalizeSearchText("Beaux-Arts"), "beaux-arts");
assert.equal(isSearchQueryReady("é"), false);
assert.equal(isSearchQueryReady("école"), true);

assert.deepEqual(resourceSectionAndLeaf({ category: "oeil-expo" }), {
  section: "ecrits",
  leaf: "oeil-expo",
});
assert.deepEqual(
  resourceSectionAndLeaf({
    category: "legacy",
    categoryRef: { slug: "histoire-art", section: "enseignement" },
  }),
  { section: "enseignement", leaf: "histoire-art" }
);
assert.equal(
  resourceHref({ slug: "monet", category: "oeil-expo" }),
  "/ecrits/oeil-expo/monet"
);
assert.equal(
  resourceHref({ slug: "cours-1", categoryRef: { slug: "histoire-art", section: "enseignement" } }),
  "/enseignement/histoire-art/cours-1"
);
assert.equal(exhibitionHref("salon-2024"), "/expositions/salon-2024");
assert.equal(exhibitionHref(null), "/#exhibitions");
assert.equal(pressHref("article"), "/presse/article");
assert.equal(pressHref(undefined), "/#press");
assert.equal(journalHref("note"), "/journal/note");

const items: SearchIndexItem[] = [
  {
    id: "title-hit",
    group: "ecrits",
    title: "École de Paris",
    href: "/ecrits/oeil-expo/ecole",
    titleText: "École de Paris",
    metaText: "critique",
    excerptText: "un extrait",
    bodyText: "long texte",
  },
  {
    id: "meta-hit",
    group: "painting",
    title: "Sans rapport",
    href: "/#gallery",
    meta: "24T01",
    titleText: "Sans rapport",
    metaText: "24T01 huile",
    excerptText: "",
    bodyText: "",
  },
  {
    id: "excerpt-hit",
    group: "press",
    title: "Autre titre",
    href: "/#press",
    excerpt: "Une école nouvelle",
    titleText: "Autre titre",
    metaText: "",
    excerptText: "Une école nouvelle",
    bodyText: "",
  },
  {
    id: "body-hit",
    group: "journal",
    title: "Carnet",
    href: "/#journal",
    titleText: "Carnet",
    metaText: "",
    excerptText: "",
    bodyText: "Souvenirs de l'école",
  },
  {
    id: "and-miss",
    group: "page",
    title: "Accueil",
    href: "/#hero",
    titleText: "Accueil",
    metaText: "",
    excerptText: "",
    bodyText: "",
  },
];

assert.equal(scoreSearchItem(items[0], ["ecole"]), SEARCH_TIER.title);
assert.equal(scoreSearchItem(items[1], ["24t01"]), SEARCH_TIER.meta);
assert.equal(scoreSearchItem(items[2], ["ecole"]), SEARCH_TIER.excerpt);
assert.equal(scoreSearchItem(items[3], ["ecole"]), SEARCH_TIER.body);
assert.equal(scoreSearchItem(items[4], ["ecole", "paris"]), null);

const ranked = searchIndex(items, "école");
assert.deepEqual(
  ranked.map((item) => item.id),
  ["title-hit", "excerpt-hit", "body-hit"]
);

const cote = searchIndex(items, "24t01");
assert.equal(cote.length, 1);
assert.equal(cote[0].id, "meta-hit");

const andQuery = searchIndex(items, "école paris");
assert.deepEqual(
  andQuery.map((item) => item.id),
  ["title-hit"]
);

const manyPaintings: SearchIndexItem[] = Array.from({ length: 12 }, (_, i) => ({
  id: `p-${i}`,
  group: "painting" as const,
  title: `Toile ${i} lumière`,
  href: "/#gallery",
  titleText: `Toile ${i} lumière`,
  metaText: "",
  excerptText: "",
  bodyText: "",
}));
const capped = searchIndex(manyPaintings, "lumiere");
assert.equal(capped.length, 8);

const payloadItems = buildSearchIndexFromPayload({
  resources: [
    {
      _id: "r1",
      title: "Monet à Giverny",
      slug: "monet-giverny",
      category: "oeil-expo",
      excerpt: "Une visite",
    },
  ],
  exhibitions: [{ _id: "e1", title: "Salon", city: "Paris" }],
  biography: { _id: "bio", bodyText: "Né en 1961", nationality: "Français", birthYear: 1961 },
});
assert.ok(payloadItems.some((item) => item.href === "/ecrits/oeil-expo/monet-giverny"));
assert.ok(payloadItems.some((item) => item.href === "/#exhibitions" && item.group === "exhibition"));
assert.ok(payloadItems.some((item) => item.title === "Biographie" && item.bodyText.includes("1961")));
assert.ok(payloadItems.some((item) => item.title === "Contact" && item.href === "/#contact"));

console.log("site search tests OK");
