import type { NavigateFunction } from "react-router-dom";
import { resolveHomeHashId } from "@/lib/resourceSection";

/** Hauteur du header fixe (`h-20`) — alignée sur `scroll-margin-top: 5rem`. */
export const HEADER_SCROLL_OFFSET_PX = 80;

let suppressHashScroll = false;
let spyPausedUntil = 0;
let spyLockedUntilUserScroll = false;
let activeSectionListener: ((id: string) => void) | null = null;
let arrivalCleanup: (() => void) | null = null;

export function bindActiveSectionListener(listener: ((id: string) => void) | null) {
  activeSectionListener = listener;
}

export function notifyActiveSection(id: string) {
  activeSectionListener?.(id);
}

export function suppressNextHashScroll() {
  suppressHashScroll = true;
}

export function consumeHashScrollSuppression(): boolean {
  if (!suppressHashScroll) return false;
  suppressHashScroll = false;
  return true;
}

/** Pause le spy (sans bloquer le scroll d’arrivée HomePage). */
export function pauseSectionHashSpy(ms = 900) {
  spyPausedUntil = Date.now() + ms;
}

export function lockSectionHashSpyUntilUserScroll() {
  spyLockedUntilUserScroll = true;
}

export function unlockSectionHashSpyFromUserScroll() {
  spyLockedUntilUserScroll = false;
  clearArrivalWork();
}

export function isSectionHashSpyPaused() {
  return spyLockedUntilUserScroll || Date.now() < spyPausedUntil;
}

function clearArrivalWork() {
  arrivalCleanup?.();
  arrivalCleanup = null;
}

export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function normalizeSectionId(hashOrId: string): string {
  const raw = hashOrId.startsWith("#") ? hashOrId.slice(1) : hashOrId;
  let decoded: string;
  try {
    decoded = decodeURIComponent(raw);
  } catch {
    decoded = raw;
  }
  return resolveHomeHashId(decoded);
}

export function getHashFromLocation(): string {
  return normalizeSectionId(typeof window !== "undefined" ? window.location.hash : "");
}

export function getHomeSectionIds(): string[] {
  return Array.from(document.querySelectorAll("main section[id]"))
    .map((el) => el.id)
    .filter(Boolean);
}

/** Hash présent et section réellement dans le DOM. */
export function resolveValidHomeHash(hashOrId: string): string | null {
  const id = normalizeSectionId(hashOrId);
  if (!id || typeof document === "undefined") return null;
  return document.getElementById(id) ? id : null;
}

function buildHashUrl(id: string): string {
  const base = (import.meta.env.BASE_URL || "/").replace(/\/$/, "");
  if (!base) return `/#${id}`;
  return `${base}#${id}`;
}

export function scrollToSectionElement(
  el: HTMLElement,
  behavior: ScrollBehavior = "auto"
) {
  el.scrollIntoView({ behavior, block: "start" });
}

export function replaceSectionHashSilent(hashOrId: string) {
  const id = normalizeSectionId(hashOrId);
  if (!id || typeof window === "undefined") return;

  const current = normalizeSectionId(window.location.hash || "");
  if (current === id) {
    notifyActiveSection(id);
    return;
  }

  window.history.replaceState(window.history.state, "", buildHashUrl(id));
  notifyActiveSection(id);
}

/**
 * Clic menu / Hero / Footer — chemin dédié, indépendant du Retour.
 * Ne partage pas la logique multi-pin d’arrivée.
 */
export function navigateToSection(
  navigate: NavigateFunction,
  hashOrId: string,
  options: { replace?: boolean; behavior?: ScrollBehavior } = {}
) {
  const id = normalizeSectionId(hashOrId);
  if (!id) return;

  const behavior =
    options.behavior ?? (prefersReducedMotion() ? "auto" : "smooth");

  clearArrivalWork();
  pauseSectionHashSpy(behavior === "auto" ? 300 : 1000);
  suppressNextHashScroll();
  lockSectionHashSpyUntilUserScroll();
  notifyActiveSection(id);

  navigate(
    { pathname: "/", hash: id },
    { replace: options.replace ?? false, preventScrollReset: true }
  );

  const runScroll = () => {
    const el = document.getElementById(id);
    if (el) scrollToSectionElement(el, behavior);
  };

  runScroll();
  requestAnimationFrame(() => {
    runScroll();
    requestAnimationFrame(runScroll);
  });
}

/**
 * Retour / deep-link uniquement.
 * Re-ancre tant que le layout au-dessus bouge (ex. images galerie) — critique pour #exhibitions
 * juste sous la galerie ; #critiques / #enseignement sont moins exposés.
 */
export function scrollToHashOnArrival(hashOrId: string): boolean {
  if (typeof window === "undefined") return false;

  const id = resolveValidHomeHash(hashOrId);
  if (!id) return false;

  clearArrivalWork();
  lockSectionHashSpyUntilUserScroll();
  pauseSectionHashSpy(800);
  notifyActiveSection(id);

  const scrollOnce = () => {
    if (!spyLockedUntilUserScroll) return;
    const expected = normalizeSectionId(window.location.hash || "") || id;
    if (expected !== id) return;
    const target = document.getElementById(id);
    if (!target) return;
    scrollToSectionElement(target, "auto");
  };

  scrollOnce();
  requestAnimationFrame(scrollOnce);

  const started = performance.now();
  const MAX_MS = 2800;
  const STABLE_FRAMES_NEEDED = 20; // ~300ms stables
  let stableFrames = 0;
  let guardId = 0;

  const inHeaderZone = (top: number) =>
    top >= -16 && top <= HEADER_SCROLL_OFFSET_PX + 100;

  const guard = () => {
    if (!spyLockedUntilUserScroll) return;
    if (performance.now() - started > MAX_MS) return;

    const target = document.getElementById(id);
    if (!target) {
      guardId = requestAnimationFrame(guard);
      return;
    }

    const y = target.getBoundingClientRect().top;
    if (!inHeaderZone(y)) {
      scrollOnce();
      stableFrames = 0;
    } else {
      stableFrames += 1;
    }

    if (stableFrames < STABLE_FRAMES_NEEDED) {
      guardId = requestAnimationFrame(guard);
    }
  };
  guardId = requestAnimationFrame(guard);

  const main = document.querySelector("main");
  let ro: ResizeObserver | null = null;
  let stopTimer = 0;
  if (main && typeof ResizeObserver !== "undefined") {
    let lastH = main.getBoundingClientRect().height;
    ro = new ResizeObserver(() => {
      if (!spyLockedUntilUserScroll) return;
      const h = main.getBoundingClientRect().height;
      if (Math.abs(h - lastH) < 24) return;
      lastH = h;
      stableFrames = 0;
      scrollOnce();
      // Relancer la garde si elle s’était arrêtée
      if (stableFrames < STABLE_FRAMES_NEEDED && performance.now() - started < MAX_MS) {
        cancelAnimationFrame(guardId);
        guardId = requestAnimationFrame(guard);
      }
    });
    ro.observe(main);
    stopTimer = window.setTimeout(() => ro?.disconnect(), MAX_MS);
  }

  arrivalCleanup = () => {
    cancelAnimationFrame(guardId);
    ro?.disconnect();
    if (stopTimer) window.clearTimeout(stopTimer);
  };

  return true;
}
