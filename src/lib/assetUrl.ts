/**
 * Résout une URL d'asset pour qu'elle fonctionne avec le base path (ex. GitHub Pages).
 * Les URLs relatives (commençant par /) sont préfixées par BASE_URL ; les URLs absolues sont inchangées.
 */
export function assetUrl(url: string): string {
  if (url.startsWith("/")) {
    return `${import.meta.env.BASE_URL}${url.slice(1)}`;
  }
  return url;
}
