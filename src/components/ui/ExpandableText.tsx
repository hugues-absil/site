import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

interface ExpandableTextProps {
  /** Texte à afficher (peut être tronqué si trop long). */
  text: string;
  /** Longueur max en caractères avant troncature (défaut 150). */
  maxLength?: number;
  /** Classes pour le conteneur. */
  className?: string;
  /** Classes pour le paragraphe (défaut: text-sm text-gray-medium leading-relaxed). */
  textClassName?: string;
  /** Classes pour le bouton "Voir plus" / "Voir moins". */
  buttonClassName?: string;
}

/**
 * Affiche un texte ; s’il dépasse maxLength, le tronque et affiche un bouton
 * "Voir plus" / "Voir moins" pour déplier.
 */
export default function ExpandableText({
  text,
  maxLength = 150,
  className,
  textClassName = "text-sm text-gray-medium leading-relaxed",
  buttonClassName,
}: ExpandableTextProps) {
  const trimmed = text.trim();
  const isLong = trimmed.length > maxLength;
  const truncated =
    isLong ? trimmed.slice(0, maxLength).trim() + "…" : trimmed;

  const [expanded, setExpanded] = useState(false);

  if (!trimmed) return null;

  return (
    <div className={className}>
      <p className={textClassName}>
        {expanded ? trimmed : truncated}
      </p>
      {isLong && (
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setExpanded((prev) => !prev);
          }}
          className={
            buttonClassName ??
            "mt-2 flex items-center gap-1 text-sm font-medium text-foreground hover:opacity-80 transition-opacity"
          }
          aria-expanded={expanded}
        >
          {expanded ? (
            <>
              Voir moins <ChevronUp className="w-4 h-4 shrink-0" />
            </>
          ) : (
            <>
              Voir plus <ChevronDown className="w-4 h-4 shrink-0" />
            </>
          )}
        </button>
      )}
    </div>
  );
}
