/** Retourne l'URL d'embed YouTube/Vimeo ou null. */
export function getVideoEmbedUrl(input: string): string | null {
  const raw = input?.trim();
  if (!raw) return null;
  let url = raw.startsWith("http://") ? "https://" + raw.slice(7) : raw;
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./, "");
    if (host === "youtube.com" || host === "youtu.be") {
      const v = parsed.searchParams.get("v");
      const id = v || (host === "youtu.be" ? parsed.pathname.slice(1).split("/")[0] : null);
      return id ? `https://www.youtube-nocookie.com/embed/${id}` : null;
    }
    if (host === "vimeo.com") {
      const m = parsed.pathname.match(/^\/(?:video\/)?(\d+)/);
      return m ? `https://player.vimeo.com/video/${m[1]}` : null;
    }
    return null;
  } catch {
    return null;
  }
}

/** ID YouTube depuis une URL de partage / embed. */
export function getYouTubeVideoId(input: string): string | null {
  const raw = input?.trim();
  if (!raw) return null;
  let url = raw.startsWith("http://") ? "https://" + raw.slice(7) : raw;
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./, "");
    if (host === "youtube.com" || host === "m.youtube.com") {
      const v = parsed.searchParams.get("v");
      if (v) return v;
      const m = parsed.pathname.match(/^\/embed\/([^/?]+)/);
      return m ? m[1] : null;
    }
    if (host === "youtu.be") {
      return parsed.pathname.slice(1).split("/")[0] || null;
    }
    return null;
  } catch {
    return null;
  }
}

/** Miniature YouTube (hqdefault fonctionne sans clé API). */
export function getYouTubeThumbnailUrl(videoId: string): string {
  return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
}

/**
 * URL d'aperçu pour une vidéo presse : image dédiée, sinon miniature YouTube.
 */
export function getPressVideoPosterUrl(imageUrl: string | undefined | null, videoUrl: string | undefined | null): string | null {
  if (imageUrl?.trim()) return imageUrl.trim();
  const id = videoUrl ? getYouTubeVideoId(videoUrl) : null;
  return id ? getYouTubeThumbnailUrl(id) : null;
}
