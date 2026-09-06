import groq from "groq";
import {
  RESOURCE_CATEGORY_ANCESTOR_DEPTH,
  buildResourceMatchesCategorySlugConditions,
} from "./categorySubtreeFilter";

/** Le type CMS `contenuAClasser` (« À classer ») n’est pas interrogé ici : réservé au Studio / scripts. */

export { RESOURCE_CATEGORY_ANCESTOR_DEPTH } from "./categorySubtreeFilter";

function buildCategoryRefParentNest(level: number): string {
  if (level <= 0) return `_id, "slug": slug.current`;
  return `_id, "slug": slug.current, "parent": parent->{ ${buildCategoryRefParentNest(level - 1)} }`;
}

/** Projection categoryRef avec chaîne de parents (slug + _id). */
export const resourceCategoryRefProjection = `_id, title, "slug": slug.current, section, showTableOfContents, "parent": parent->{ ${buildCategoryRefParentNest(RESOURCE_CATEGORY_ANCESTOR_DEPTH)} }`;

const resourceInCategoryOrSubtree = buildResourceMatchesCategorySlugConditions(RESOURCE_CATEGORY_ANCESTOR_DEPTH);

export const paintingsQuery = groq`*[_type == "painting" && gallery == true] | order(year desc) {
  _id,
  title,
  "slug": slug.current,
  year,
  reference,
  "technique": technique->{ _id, title, "slug": slug.current },
  "theme": theme->{ _id, title, "slug": slug.current },
  "status": status->{ _id, title, "slug": slug.current },
  dimensions,
  description,
  price,
  "imageUrl": image.asset->url,
  "imageWidth": image.asset->metadata.dimensions.width,
  "imageHeight": image.asset->metadata.dimensions.height,
  "inSituImageUrls": select(
    count(inSituImages) > 0 => inSituImages[].asset->url,
    inSituImage.asset->url != null => [inSituImage.asset->url],
    []
  ),
  "series": series->{ _id, title, "slug": slug.current },
  featured,
  precisions
}`;

export const paintingBySlugQuery = groq`*[_type == "painting" && slug.current == $slug][0] {
  _id,
  title,
  "slug": slug.current,
  year,
  reference,
  "technique": technique->{ _id, title, "slug": slug.current },
  "theme": theme->{ _id, title, "slug": slug.current },
  "status": status->{ _id, title, "slug": slug.current },
  dimensions,
  description,
  price,
  "imageUrl": image.asset->url,
  "imageWidth": image.asset->metadata.dimensions.width,
  "imageHeight": image.asset->metadata.dimensions.height,
  "inSituImageUrls": select(
    count(inSituImages) > 0 => inSituImages[].asset->url,
    inSituImage.asset->url != null => [inSituImage.asset->url],
    []
  ),
  "series": series->{ _id, title, "slug": slug.current },
  precisions
}`;

/** Sans coalesce, les entrées sans dateStart remontent souvent en tête du tri desc et noient les expos datées (ex. 2023). */
export const exhibitionsQuery = groq`*[_type == "exhibition"] | order(coalesce(dateStart, "1900-01-01") desc, title asc) {
  _id,
  title,
  "slug": slug.current,
  type,
  dateStart,
  dateEnd,
  venue,
  city,
  country,
  externalLink,
  "status": select(
    !defined(dateEnd) || now() > dateEnd => "past",
    defined(dateStart) && now() < dateStart => "upcoming",
    "current"
  ),
  image,
  "imageUrl": coalesce(image.asset->url, null),
  "coverFallbackUrl": coalesce(
    body[_type == "image"][0].asset->url,
    body[_type == "imageWithLayout"][0].image.asset->url
  ),
  description,
  body
}`;

export const exhibitionBySlugQuery = groq`*[_type == "exhibition" && slug.current == $slug][0] {
  _id,
  title,
  "slug": slug.current,
  type,
  dateStart,
  dateEnd,
  venue,
  city,
  country,
  externalLink,
  "status": select(
    !defined(dateEnd) || now() > dateEnd => "past",
    defined(dateStart) && now() < dateStart => "upcoming",
    "current"
  ),
  image,
  "imageUrl": coalesce(image.asset->url, null),
  "coverFallbackUrl": coalesce(
    body[_type == "image"][0].asset->url,
    body[_type == "imageWithLayout"][0].image.asset->url
  ),
  description,
  body
}`;

export const siteSettingsQuery = groq`*[_type == "siteSettings"][0] {
  "heroImageUrl": coalesce(heroImage.asset->url, null),
  "heroImageAlt": heroImageAlt,
  "heroImages": heroImages[] {
    "url": coalesce(image.asset->url, null),
    "alt": alt
  },
  siteName,
  heroTitle,
  heroSubtitle,
  heroCtaLabel,
  navItems,
  footerSubtitle,
  footerNavTitle,
  footerSocialTitle,
  instagramUrl,
  linkedinUrl,
  contactEmail,
  contactTitle,
  contactIntro,
  contactInfoTitle,
  contactInfoText,
  contactSuccessMessage,
  contactErrorMessage,
  galleryUseFeatured
}`;

export const biographyQuery = groq`*[_type == "biography"][0] {
  _id,
  text,
  "portraitUrl": portrait.asset->url,
  birthYear,
  nationality,
  education,
  awards,
  professionalActivities,
  gallery,
  diplomas
}`;

export const pressArticlesQuery = groq`*[_type == "pressArticle"] | order(coalesce(date, "1970-01-01") desc) {
  _id,
  title,
  publication,
  date,
  excerpt,
  url,
  videoUrl,
  "slug": slug.current,
  "imageUrl": coalesce(image.asset->url, null)
}`;

export const pressArticleBySlugQuery = groq`*[_type == "pressArticle" && slug.current == $slug][0] {
  _id,
  title,
  publication,
  date,
  excerpt,
  url,
  videoUrl,
  "slug": slug.current,
  "imageUrl": coalesce(image.asset->url, null),
  content
}`;

export const pressQuotesQuery = groq`*[_type == "pressQuote"] | order(date desc) {
  _id,
  quote,
  author,
  publication,
  date
}`;

export const advicePostsQuery = groq`*[_type == "advice"] | order(date desc) {
  _id,
  title,
  "slug": slug.current,
  excerpt,
  content,
  date,
  category,
  "imageUrl": coverImage.asset->url,
  videoUrl,
  tags
}`;

export const adviceBySlugQuery = groq`*[_type == "advice" && slug.current == $slug][0] {
  _id,
  title,
  "slug": slug.current,
  excerpt,
  content,
  date,
  category,
  "imageUrl": coverImage.asset->url,
  videoUrl,
  tags
}`;

export const performancesQuery = groq`*[_type == "performance"] | order(order asc, _createdAt asc) {
  _id,
  title,
  url
}`;

export const filmsQuery = groq`*[_type == "film"] | order(order asc, year desc) {
  _id,
  title,
  "slug": slug.current,
  director,
  directorUrl,
  year,
  description,
  videoUrl,
  "posterImageUrl": posterImage.asset->url,
  duration,
  status,
  order,
  article
}`;

export const resourcesQuery = groq`*[_type == "resource"] | order(order asc, date desc) {
  _id,
  title,
  "slug": slug.current,
  category,
  "categoryRef": categoryRef->{ ${resourceCategoryRefProjection} },
  excerpt,
  content,
  date,
  dateEnd,
  order,
  "status": select(
    !defined(date) && !defined(dateEnd) => "past",
    defined(date) && date < "2000-01-01" => "past",
    defined(dateEnd) && now() > dateEnd => "past",
    !defined(dateEnd) && defined(date) && date < now() => "past",
    defined(date) && now() < date => "upcoming",
    "current"
  ),
  "imageUrl": coverImage.asset->url,
  videoUrl,
  tags,
  workshopDate,
  workshopDuration,
  workshopPrice,
  workshopLocation,
  workshopRegistrationLink,
  sourceUrl
}`;

export const resourcesByCategoryQuery = groq`*[_type == "resource" && (
  ${resourceInCategoryOrSubtree}
  || category == $category
)] | order(order asc, date desc) {
  _id,
  title,
  "slug": slug.current,
  category,
  "categoryRef": categoryRef->{ ${resourceCategoryRefProjection} },
  excerpt,
  content,
  date,
  dateEnd,
  order,
  "status": select(
    !defined(date) && !defined(dateEnd) => "past",
    defined(date) && date < "2000-01-01" => "past",
    defined(dateEnd) && now() > dateEnd => "past",
    !defined(dateEnd) && defined(date) && date < now() => "past",
    defined(date) && now() < date => "upcoming",
    "current"
  ),
  "imageUrl": coverImage.asset->url,
  videoUrl,
  tags,
  workshopDate,
  workshopDuration,
  workshopPrice,
  workshopLocation,
  workshopRegistrationLink,
  sourceUrl
}`;

export const resourceBySlugQuery = groq`*[_type == "resource" && slug.current == $slug][0] {
  _id,
  title,
  "slug": slug.current,
  category,
  "categoryRef": categoryRef->{ ${resourceCategoryRefProjection} },
  excerpt,
  content,
  date,
  dateEnd,
  order,
  "status": select(
    !defined(date) && !defined(dateEnd) => "past",
    defined(date) && date < "2000-01-01" => "past",
    defined(dateEnd) && now() > dateEnd => "past",
    !defined(dateEnd) && defined(date) && date < now() => "past",
    defined(date) && now() < date => "upcoming",
    "current"
  ),
  "imageUrl": coverImage.asset->url,
  videoUrl,
  tags,
  workshopDate,
  workshopDuration,
  workshopPrice,
  workshopLocation,
  workshopRegistrationLink,
  sourceUrl
}`;

export const resourceCategoriesQuery = groq`*[_type == "resourceCategory"] | order(order asc, title asc) {
  _id,
  title,
  "slug": slug.current,
  description,
  section,
  order,
  showTableOfContents,
  "parent": parent->{ _id, "slug": slug.current }
}`;

/** Index de recherche globale : champs légers, corps tronqué, pas de Portable Text complet. */
export const searchIndexQuery = groq`{
  "paintings": *[_type == "painting" && gallery == true] | order(year desc) {
    _id,
    title,
    year,
    reference,
    "techniqueTitle": technique->title,
    "themeTitle": theme->title,
    "seriesTitle": series->title,
    description,
    "imageUrl": image.asset->url
  },
  "exhibitions": *[_type == "exhibition"] {
    _id,
    title,
    "slug": slug.current,
    venue,
    city,
    country,
    description,
    "bodyText": select(defined(body) => pt::text(body)[0..399], ""),
    "imageUrl": coalesce(image.asset->url, null)
  },
  "pressArticles": *[_type == "pressArticle"] {
    _id,
    title,
    publication,
    excerpt,
    "slug": slug.current,
    "bodyText": select(defined(content) => pt::text(content)[0..399], ""),
    "imageUrl": coalesce(image.asset->url, null)
  },
  "advice": *[_type == "advice"] {
    _id,
    title,
    "slug": slug.current,
    excerpt,
    tags,
    category,
    "bodyText": select(defined(content) => pt::text(content)[0..399], ""),
    "imageUrl": coverImage.asset->url
  },
  "resources": *[_type == "resource"] {
    _id,
    title,
    "slug": slug.current,
    category,
    "categoryRef": categoryRef->{ ${resourceCategoryRefProjection} },
    excerpt,
    tags,
    workshopLocation,
    "bodyText": select(defined(content) => pt::text(content)[0..399], ""),
    "imageUrl": coverImage.asset->url
  },
  "films": *[_type == "film"] {
    _id,
    title,
    director,
    year,
    description,
    "bodyText": select(defined(article) => pt::text(article)[0..399], ""),
    "imageUrl": posterImage.asset->url
  },
  "performances": *[_type == "performance"] {
    _id,
    title
  },
  "biography": *[_type == "biography"][0] {
    _id,
    "bodyText": select(defined(text) => pt::text(text)[0..399], ""),
    education,
    awards,
    nationality,
    birthYear
  },
  "resourceCategories": *[_type == "resourceCategory"] {
    _id,
    title,
    "slug": slug.current,
    description,
    section
  }
}`;
