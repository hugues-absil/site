import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { useActiveSection } from "@/contexts/ActiveSectionContext";
import {
  HEADER_SCROLL_OFFSET_PX,
  getHashFromLocation,
  getHomeSectionIds,
  isSectionHashSpyPaused,
  lockSectionHashSpyUntilUserScroll,
  normalizeSectionId,
  replaceSectionHashSilent,
  unlockSectionHashSpyFromUserScroll,
} from "@/lib/sectionHash";

/**
 * Spy silencieux : met à jour le `#` selon la section visible.
 * Ne se recrée PAS à chaque clic (deps sans location.key).
 */
export function useSectionHashSync(enabled: boolean) {
  const location = useLocation();
  const { setActiveSectionId } = useActiveSection();
  const setActiveRef = useRef(setActiveSectionId);
  setActiveRef.current = setActiveSectionId;

  useEffect(() => {
    if (!enabled || location.pathname !== "/") return;

    let rafId = 0;
    let resizeTimer: ReturnType<typeof setTimeout> | null = null;
    let pendingId: string | null = null;
    let pendingHits = 0;
    let lastApplied = normalizeSectionId(getHashFromLocation() || "");

    // Hash déjà présent (Retour / deep-link / clic) : ne pas le réécrire avant un geste user.
    if (lastApplied) {
      setActiveRef.current(lastApplied);
      lockSectionHashSpyUntilUserScroll();
    }

    const pickActiveId = (): string | null => {
      const ids = getHomeSectionIds();
      if (ids.length === 0) return null;

      const marker = HEADER_SCROLL_OFFSET_PX + 8;
      let active: string | null = ids[0] ?? null;

      for (const id of ids) {
        const el = document.getElementById(id);
        if (!el) continue;
        if (el.getBoundingClientRect().top <= marker) {
          active = id;
        }
      }
      return active;
    };

    const applyId = (id: string) => {
      if (id === lastApplied) return;
      lastApplied = id;
      setActiveRef.current(id);
      replaceSectionHashSilent(id);
    };

    const syncHash = () => {
      if (isSectionHashSpyPaused()) {
        pendingId = null;
        pendingHits = 0;
        return;
      }

      const activeId = pickActiveId();
      if (!activeId) return;

      if (activeId === pendingId) {
        pendingHits += 1;
      } else {
        pendingId = activeId;
        pendingHits = 1;
      }

      if (pendingHits < 2) return;
      if (activeId === lastApplied) return;

      applyId(activeId);
    };

    const onScrollOrResize = () => {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(syncHash);
    };

    const onResizeDebounced = () => {
      if (resizeTimer) clearTimeout(resizeTimer);
      if (isSectionHashSpyPaused()) return;
      resizeTimer = setTimeout(onScrollOrResize, 100);
    };

    const onUserScrollGesture = () => {
      unlockSectionHashSpyFromUserScroll();
    };

    const onUserScrollKey = (e: KeyboardEvent) => {
      if (
        e.key === "ArrowUp" ||
        e.key === "ArrowDown" ||
        e.key === "PageUp" ||
        e.key === "PageDown" ||
        e.key === "Home" ||
        e.key === "End" ||
        e.key === " " ||
        e.key === "Spacebar"
      ) {
        onUserScrollGesture();
      }
    };

    const sections = getHomeSectionIds()
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => Boolean(el));

    const observer = new IntersectionObserver(onScrollOrResize, {
      root: null,
      rootMargin: `-${HEADER_SCROLL_OFFSET_PX}px 0px -55% 0px`,
      threshold: [0, 0.1, 0.25, 0.5, 0.75, 1],
    });

    for (const el of sections) observer.observe(el);

    const main = document.querySelector("main");
    const resizeObserver =
      main && typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(onResizeDebounced)
        : null;
    if (main && resizeObserver) resizeObserver.observe(main);

    window.addEventListener("scroll", onScrollOrResize, { passive: true });
    window.addEventListener("resize", onResizeDebounced, { passive: true });
    window.addEventListener("wheel", onUserScrollGesture, { passive: true });
    window.addEventListener("touchmove", onUserScrollGesture, { passive: true });
    window.addEventListener("keydown", onUserScrollKey);

    if (!lastApplied) {
      onScrollOrResize();
      requestAnimationFrame(() => onScrollOrResize());
    }

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      if (resizeTimer) clearTimeout(resizeTimer);
      observer.disconnect();
      resizeObserver?.disconnect();
      window.removeEventListener("scroll", onScrollOrResize);
      window.removeEventListener("resize", onResizeDebounced);
      window.removeEventListener("wheel", onUserScrollGesture);
      window.removeEventListener("touchmove", onUserScrollGesture);
      window.removeEventListener("keydown", onUserScrollKey);
    };
    // Pas de location.key : un clic menu ne doit pas démonter / remonter le spy.
  }, [enabled, location.pathname]);
}
