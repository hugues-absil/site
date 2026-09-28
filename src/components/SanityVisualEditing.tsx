import { useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { VisualEditing } from "@sanity/visual-editing/react";
import type { HistoryAdapter } from "@sanity/visual-editing/react";
import { isPreviewSessionActive } from "@/lib/sanity/client";

function toRouterPath(url: string): string {
  try {
    const base = (import.meta.env.BASE_URL || "/").replace(/\/$/, "");
    const parsed = new URL(url, window.location.origin);
    let path = `${parsed.pathname}${parsed.search}${parsed.hash}`;
    if (base && path.startsWith(base)) {
      path = path.slice(base.length) || "/";
    }
    return path.startsWith("/") ? path : `/${path}`;
  } catch {
    return url.startsWith("/") ? url : `/${url}`;
  }
}

/**
 * Active les overlays Presentation + sync d’URL React Router
 * uniquement pendant une session preview (pas pour les visiteurs).
 */
export default function SanityVisualEditing() {
  const navigate = useNavigate();
  const location = useLocation();
  // Re-évalue à chaque navigation (après /preview/enable → sessionStorage)
  const active = isPreviewSessionActive();

  const history = useMemo<HistoryAdapter>(
    () => ({
      subscribe(navigateHistory) {
        const sync = () => {
          const base = (import.meta.env.BASE_URL || "/").replace(/\/$/, "");
          navigateHistory({
            type: "push",
            url: `${base}${location.pathname}${location.search}${location.hash}`,
          });
        };
        sync();
        return () => {};
      },
      update(update) {
        const url = typeof update.url === "string" ? toRouterPath(update.url) : "/";
        if (update.type === "push" || update.type === "replace") {
          navigate(url, { replace: update.type === "replace" });
        } else if (update.type === "pop") {
          navigate(url);
        }
      },
    }),
    [navigate, location.pathname, location.search, location.hash]
  );

  if (!active) return null;

  return (
    <VisualEditing
      portal
      history={history}
      refresh={() => {
        window.location.reload();
        return Promise.resolve();
      }}
    />
  );
}
