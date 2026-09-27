/**
 * Validation Sanity : slug.current unique pour un _type donné.
 * Ignore la paire draft/published du document en cours.
 */
export function idPair(docId: string | undefined): string[] {
  if (!docId) return [];
  const published = docId.replace(/^drafts\./, "");
  return [published, `drafts.${published}`];
}

export function uniqueSlugRule(documentType: string, message = "Ce slug est déjà utilisé.") {
  return async (value: unknown, context: { document?: { _id?: string }; getClient: (opts: { apiVersion: string }) => { fetch: <T>(query: string, params?: Record<string, unknown>) => Promise<T> } }) => {
    const slug =
      value && typeof value === "object" && "current" in value
        ? String((value as { current?: string }).current ?? "").trim()
        : "";
    if (!slug) return true;
    const docId = context.document?._id;
    if (!docId) return true;
    const client = context.getClient({ apiVersion: "2024-01-01" });
    const exclude = idPair(docId);
    if (exclude.length === 0) return true;
    const n = await client.fetch<number>(
      `count(*[_type == $type && slug.current == $slug && !(_id in $exclude)])`,
      { type: documentType, slug, exclude }
    );
    return n > 0 ? message : true;
  };
}
