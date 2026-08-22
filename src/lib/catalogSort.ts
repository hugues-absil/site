/**
 * Références catalogue : YY + code média + numéro (ex. 24T05, 24CE03).
 * Codes multi-lettres (CE) doivent être testés avant C.
 */

/** Ordre de tri entre médias à année égale (plan : T, D, A, CE, C, G, L, M, S) */
export const REFERENCE_MEDIA_ORDER = ["T", "D", "A", "CE", "C", "G", "L", "M", "S"] as const;

export type ReferenceMediaCode = (typeof REFERENCE_MEDIA_ORDER)[number];

/** Codes triés par longueur décroissante pour le parsing */
const MEDIA_CODES_LONGEST_FIRST = [...REFERENCE_MEDIA_ORDER].sort(
  (a, b) => b.length - a.length
);

/** Année complète à partir des deux chiffres YY : 00–29 → 2000–2029, 30–99 → 1930–1999 */
export function yyToFullYear(yy: number): number {
  if (yy >= 30) return 1900 + yy;
  return 2000 + yy;
}

export function normalizeReference(s: string | undefined | null): string {
  if (s == null || s === "") return "";
  return s.trim().replace(/\s+/g, "").toUpperCase();
}

export type ParsedReference = {
  yearShort: number;
  fullYear: number;
  mediaCode: string;
  sequence: number;
};

export function parseReference(ref: string | undefined | null): ParsedReference | null {
  const n = normalizeReference(ref);
  if (!n.length) return null;
  const ym = n.match(/^(\d{2})(.+)$/);
  if (!ym) return null;
  const yearShort = parseInt(ym[1], 10);
  if (Number.isNaN(yearShort)) return null;
  const rest = ym[2];
  for (const code of MEDIA_CODES_LONGEST_FIRST) {
    if (rest.startsWith(code)) {
      const numPart = rest.slice(code.length);
      if (!/^\d+$/.test(numPart)) return null;
      const sequence = parseInt(numPart, 10);
      if (Number.isNaN(sequence)) return null;
      return {
        yearShort,
        fullYear: yyToFullYear(yearShort),
        mediaCode: code,
        sequence,
      };
    }
  }
  return null;
}

/** Rang pour le tri (0 = premier). Inconnus : après les connus. */
export function mediaRank(mediaCode: string): number {
  const i = REFERENCE_MEDIA_ORDER.indexOf(mediaCode as ReferenceMediaCode);
  if (i >= 0) return i;
  return 1000;
}

export function comparePaintingsCatalogOrder(
  a: { year: number; reference?: string | null; title?: string },
  b: { year: number; reference?: string | null; title?: string }
): number {
  const byYear = b.year - a.year;
  if (byYear !== 0) return byYear;

  const pa = parseReference(a.reference);
  const pb = parseReference(b.reference);

  if (!pa && !pb) return (a.title ?? "").localeCompare(b.title ?? "", "fr");
  if (!pa) return 1;
  if (!pb) return -1;

  const rm = mediaRank(pa.mediaCode) - mediaRank(pb.mediaCode);
  if (rm !== 0) return rm;

  const ns = pa.sequence - pb.sequence;
  if (ns !== 0) return ns;

  return normalizeReference(a.reference).localeCompare(normalizeReference(b.reference), "fr");
}
