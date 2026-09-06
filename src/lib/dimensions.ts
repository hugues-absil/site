/**
 * Parse une chaîne de dimensions (ex. "100 x 120 cm", "80×100 cm") en largeur et hauteur en cm.
 * Retourne null si la chaîne est absente ou invalide.
 */
export function parseDimensionsCm(
  dimensions: string | undefined
): { widthCm: number; heightCm: number } | null {
  if (dimensions == null || typeof dimensions !== "string") return null;
  const trimmed = dimensions.trim();
  if (trimmed === "") return null;
  // Formats supportés : "100 x 120 cm", "100×120 cm", "100 x 120", "100x120"
  const match = trimmed.match(
    /^(\d+(?:[.,]\d+)?)\s*[x×]\s*(\d+(?:[.,]\d+)?)\s*(?:cm)?$/i
  );
  if (!match) return null;
  const width = parseFloat(match[1].replace(",", "."));
  const height = parseFloat(match[2].replace(",", "."));
  if (Number.isNaN(width) || Number.isNaN(height) || width <= 0 || height <= 0) return null;
  return { widthCm: width, heightCm: height };
}
