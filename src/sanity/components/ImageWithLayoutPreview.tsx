import type { CSSProperties } from "react";
import type { PreviewProps } from "sanity";

const LAYOUT_HINTS: Record<string, string> = {
  fullWidth: "Pleine largeur — image sur toute la colonne",
  centered: "Centré — image centrée, texte au-dessus/dessous",
  betweenText: "Entre le texte — bloc centré entre les paragraphes",
  floatLeft: "Flottant gauche — le texte entoure l'image à droite",
  floatRight: "Flottant droite — le texte entoure l'image à gauche",
};

type ImageLayoutPreviewProps = PreviewProps & { layout?: string };

/**
 * Aperçu schématique — utilise uniquement props.layout (prepare).
 * Pas de useFormValue : peut bloquer l’édition dans les modales PTE.
 */
export function ImageWithLayoutPreview(props: ImageLayoutPreviewProps) {
  const layoutKey =
    typeof props.layout === "string" && LAYOUT_HINTS[props.layout]
      ? props.layout
      : null;

  const hint = layoutKey
    ? LAYOUT_HINTS[layoutKey]
    : "Ouvrir le bloc pour choisir la mise en page";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8, padding: "4px 0" }}>
      {props.renderDefault({
        ...props,
        subtitle: hint,
      })}
      {layoutKey ? <LayoutSketch layout={layoutKey} /> : null}
    </div>
  );
}

function LayoutSketch({ layout }: { layout: string }) {
  const box: CSSProperties = {
    display: "flex",
    gap: 4,
    height: 36,
    borderRadius: 4,
    overflow: "hidden",
    background: "#f3f4f6",
    border: "1px solid #e5e7eb",
  };
  const img: CSSProperties = {
    background: "#9ca3af",
    borderRadius: 2,
  };
  const lines: CSSProperties = {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    gap: 3,
    padding: "4px 6px",
  };
  const line = (w: string): CSSProperties => ({
    height: 3,
    width: w,
    background: "#d1d5db",
    borderRadius: 1,
  });

  if (layout === "floatRight") {
    return (
      <div style={box} aria-hidden>
        <div style={lines}>
          <div style={line("100%")} />
          <div style={line("90%")} />
          <div style={line("70%")} />
        </div>
        <div style={{ ...img, width: "40%" }} />
      </div>
    );
  }

  if (layout === "floatLeft") {
    return (
      <div style={box} aria-hidden>
        <div style={{ ...img, width: "40%" }} />
        <div style={lines}>
          <div style={line("100%")} />
          <div style={line("90%")} />
          <div style={line("70%")} />
        </div>
      </div>
    );
  }

  if (layout === "fullWidth") {
    return (
      <div style={box} aria-hidden>
        <div style={{ ...img, width: "100%" }} />
      </div>
    );
  }

  return (
    <div
      style={{ ...box, justifyContent: "center", alignItems: "center", padding: 4 }}
      aria-hidden
    >
      <div style={{ ...img, width: "55%", height: "100%" }} />
    </div>
  );
}
