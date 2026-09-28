import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { validatePreviewUrl } from "@sanity/preview-url-secret";
import { enablePreviewSession, getViewerClient } from "@/lib/sanity/client";

/** Normalise un chemin preview (relatif ou URL absolue) → chemin app sans BASE_URL. */
function toAppPath(pathOrUrl: string): string {
  const base = (import.meta.env.BASE_URL || "/").replace(/\/$/, "");
  let p = pathOrUrl.trim() || "/";

  try {
    if (/^https?:\/\//i.test(p)) {
      p = new URL(p).pathname || "/";
    }
  } catch {
    /* keep p */
  }

  if (!p.startsWith("/")) p = `/${p}`;
  if (base && (p === base || p.startsWith(`${base}/`))) {
    p = p.slice(base.length) || "/";
  }
  return p.startsWith("/") ? p : `/${p}`;
}

function absoluteAppUrl(pathOrUrl: string): string {
  const base = (import.meta.env.BASE_URL || "/").replace(/\/$/, "");
  const path = toAppPath(pathOrUrl);
  return `${window.location.origin}${base}${path}`;
}

/**
 * Point d’entrée Presentation : active la session preview puis redirige
 * (hard navigation) vers la page demandée.
 */
export default function PreviewEnablePage() {
  const [searchParams] = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      const hasToken = Boolean(import.meta.env.VITE_SANITY_VIEWER_TOKEN);
      const client = getViewerClient();

      const fallbackPath =
        searchParams.get("sanity-preview-pathname") ||
        searchParams.get("preview") ||
        "/";

      if (!client || !hasToken) {
        setError("Client Sanity non configuré (project id / token viewer).");
        return;
      }

      try {
        let redirectTo = fallbackPath;
        try {
          const result = await validatePreviewUrl(client, window.location.href);
          if (cancelled) return;
          if (result.isValid && result.redirectTo) {
            redirectTo = result.redirectTo;
          }
        } catch {
          // Token Viewer présent : continuer sans secret serveur.
        }

        enablePreviewSession();
        window.location.replace(absoluteAppUrl(redirectTo || "/"));
      } catch (e) {
        if (cancelled) return;
        console.error(e);
        setError("Impossible d’activer l’aperçu.");
      }
    }

    void run();
    return () => {
      cancelled = true;
    };
  }, [searchParams]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8">
        <p className="text-gray-medium text-center">{error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-8">
      <p className="text-gray-medium">Activation de l’aperçu…</p>
    </div>
  );
}
