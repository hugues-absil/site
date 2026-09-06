import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Retourne true si la valeur est une date à afficher (pas vide, pas invalide, pas 1970). */
function isValidResourceDateValue(value: string | null | undefined): boolean {
  if (value == null || value === "") return false;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return false;
  if (date.getUTCFullYear() === 1970) return false;
  return true;
}

/**
 * Formate une date pour les ressources. Retourne null si pas de date à afficher
 * (vide, invalide, ou 1970 → rien).
 */
export function formatResourceDate(dateString: string | null | undefined): string | null {
  if (!isValidResourceDateValue(dateString)) return null;
  const date = new Date(dateString!);
  return date.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
}

/**
 * Formate une plage date / dateEnd pour les ressources. Retourne null si la date
 * principale est vide, invalide ou 1970 (on n'affiche rien).
 */
export function formatResourceDateRange(
  date: string | null | undefined,
  dateEnd?: string | null | undefined
): string | null {
  if (!isValidResourceDateValue(date)) return null;
  const start = formatResourceDate(date)!;
  if (dateEnd && isValidResourceDateValue(dateEnd) && dateEnd !== date) {
    return `${start} – ${formatResourceDate(dateEnd)}`;
  }
  return start;
}

/** Retourne true si le contenu Portable Text a au moins un bloc à afficher. */
export function hasPortableContent(content: unknown): boolean {
  if (content == null) return false;
  if (Array.isArray(content)) return content.length > 0;
  if (typeof content === "object") return Object.keys(content as object).length > 0;
  return false;
}

/** Indique si le contenu Portable Text contient du texte non vide (pour éviter d'afficher un bloc vide à la place de l'extrait). */
function portableContentHasText(node: unknown): boolean {
  if (node == null) return false;
  if (typeof node === "string") return node.trim().length > 0;
  if (Array.isArray(node)) return node.some(portableContentHasText);
  if (typeof node === "object") {
    const o = node as Record<string, unknown>;
    if (typeof o.text === "string" && o.text.trim().length > 0) return true;
    if (Array.isArray(o.children)) return portableContentHasText(o.children);
    if (Array.isArray(o.content)) return portableContentHasText(o.content);
  }
  return false;
}

/** Retourne true si le contenu a du contenu ET au moins un peu de texte à afficher. Sinon on privilégie l’extrait en fallback. */
export function hasMeaningfulPortableContent(content: unknown): boolean {
  return hasPortableContent(content) && portableContentHasText(content);
}

/**
 * Extrait un aperçu texte depuis du Portable Text (blocs / spans), sans images.
 * Pour les listes (cartes) : évite d’y monter tout le body rich.
 */
export function portableTextPlainPreview(content: unknown, maxLength: number): string {
  if (!Array.isArray(content) || maxLength <= 0) return "";
  const parts: string[] = [];
  const walk = (node: unknown): void => {
    if (parts.join("").length >= maxLength + 32) return;
    if (node == null) return;
    if (typeof node === "string") {
      parts.push(node);
      return;
    }
    if (typeof node !== "object") return;
    const o = node as Record<string, unknown>;
    if (typeof o.text === "string") parts.push(o.text);
    if (Array.isArray(o.children)) for (const c of o.children) walk(c);
    if (Array.isArray(o.content)) for (const c of o.content) walk(c);
  };
  for (const block of content) walk(block);
  const s = parts.join(" ").replace(/\s+/g, " ").trim();
  if (s.length <= maxLength) return s;
  return `${s.slice(0, maxLength).trim()}…`;
}
