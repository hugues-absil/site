/**
 * Profils d’édition Studio pour les Ressources.
 * Source de vérité : resourceCategory.editorProfile (héritage via parent).
 */

export const EDITOR_PROFILES = ["article", "exposition", "atelier", "chapitre"] as const;

export type EditorProfile = (typeof EDITOR_PROFILES)[number];

export const EDITOR_PROFILE_OPTIONS = [
  { title: "Article", value: "article" },
  { title: "Exposition à voir", value: "exposition" },
  { title: "Atelier / stage", value: "atelier" },
  { title: "Chapitre (sommaire)", value: "chapitre" },
] as const;

/** Profils par défaut des racines connues (slug), si editorProfile non renseigné. */
export const ROOT_SLUG_EDITOR_PROFILE: Record<string, EditorProfile> = {
  "critiques-litteraires": "article",
  "oeil-expo": "exposition",
  "atelier-stages": "atelier",
  "histoire-art": "chapitre",
  "technique-picturale": "chapitre",
};

export function isEditorProfile(value: unknown): value is EditorProfile {
  return typeof value === "string" && (EDITOR_PROFILES as readonly string[]).includes(value);
}

export function profileFromRootSlug(slug: string | undefined | null): EditorProfile | undefined {
  if (!slug) return undefined;
  return ROOT_SLUG_EDITOR_PROFILE[slug];
}

/** Valeur considérée « remplie » pour la règle anti-disparition des champs. */
export function fieldHasValue(value: unknown): boolean {
  if (value == null) return false;
  if (typeof value === "string") return value.trim() !== "";
  if (typeof value === "number") return true;
  if (typeof value === "boolean") return true;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === "object") {
    const o = value as Record<string, unknown>;
    if ("asset" in o && o.asset) return true;
    if ("_ref" in o && o._ref) return true;
    if ("current" in o && typeof o.current === "string" && o.current.trim() !== "") return true;
  }
  return false;
}

export type ConditionalFieldKind = "date" | "dateEnd" | "workshop" | "sourceUrl";

/**
 * Afficher un champ conditionnel : toujours si déjà rempli, sinon selon le profil.
 * Sans profil : masquer les champs métier conditionnels.
 */
export function shouldShowConditionalField(
  kind: ConditionalFieldKind,
  profile: EditorProfile | undefined | null,
  value: unknown
): boolean {
  if (fieldHasValue(value)) return true;
  if (!profile) return false;

  switch (kind) {
    case "date":
      return profile === "exposition" || profile === "article";
    case "dateEnd":
      return profile === "exposition";
    case "workshop":
      return profile === "atelier";
    case "sourceUrl":
      return false;
    default:
      return false;
  }
}

export function dateFieldTitle(profile: EditorProfile | undefined | null): string {
  return profile === "exposition" ? "Date de début" : "Date";
}

export function dateFieldDescription(profile: EditorProfile | undefined | null): string | undefined {
  if (profile === "exposition") {
    return "Utilisée avec la date de fin pour le statut (en cours / à venir / passé).";
  }
  if (profile === "article") {
    return "Date de publication (optionnelle).";
  }
  return undefined;
}

/** Canonicalise un id Sanity (retire drafts.). */
export function canonicalDocId(id: string): string {
  return id.replace(/^drafts\./, "");
}

export function idPair(id: string): string[] {
  const c = canonicalDocId(id.trim());
  if (!c) return [];
  return [c, `drafts.${c}`];
}
