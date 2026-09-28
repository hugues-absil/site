import { useEffect, useState } from "react";
import { Studio } from "sanity";
import config from "@/sanity.config";

/**
 * Nettoie une perspective « previewDrafts » coincée dans l’URL Studio.
 * (Créée par erreur via ?perspective=previewDrafts — rend les formulaires read-only
 * avec le bandeau « Not in the previewDrafts release ».)
 */
function sanitizeStudioUrl(): boolean {
  const url = new URL(window.location.href);
  let dirty = false;

  const perspective = url.searchParams.get("perspective");
  if (perspective === "previewDrafts") {
    url.searchParams.delete("perspective");
    dirty = true;
  }

  if (url.href.includes("previewDrafts")) {
    const cleaned = url.href.replace(/previewDrafts/g, "drafts");
    if (cleaned !== url.href) {
      window.location.replace(
        perspective === "previewDrafts" ? url.toString() : cleaned
      );
      return true;
    }
  }

  if (dirty) {
    window.location.replace(url.toString());
    return true;
  }

  return false;
}

export default function StudioPage() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (sanitizeStudioUrl()) return;
    setReady(true);
  }, []);

  if (!ready) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-neutral-900 text-neutral-300">
        Chargement du Studio…
      </div>
    );
  }

  return (
    <div className="h-screen w-screen overflow-hidden">
      <Studio config={config} />
    </div>
  );
}
