import { useState } from "react";
import { useDocumentOperation } from "sanity";
import { UnpublishIcon } from "@sanity/icons";

/**
 * Action "Dépublier" visible pour les documents Biographie même en perspective brouillon,
 * pour pouvoir tester le fallback (src/data/bio) sur le site sans supprimer le document.
 */
export function UnpublishBiographyAction(props: {
  id: string;
  type: string;
  draft: unknown;
  published: unknown;
  onComplete?: () => void;
}) {
  const { id, type, published } = props;
  const publishedId = id.startsWith("drafts.") ? id.slice("drafts.".length) : id;
  const { unpublish } = useDocumentOperation(publishedId, type);
  const [confirmOpen, setConfirmOpen] = useState(false);

  if (type !== "biography") return null;
  if (!published) return null; // pas de version publiée → rien à dépublier

  const handleUnpublish = () => {
    setConfirmOpen(false);
    unpublish.execute();
    props.onComplete?.();
  };

  return {
    tone: "critical" as const,
    icon: UnpublishIcon,
    label: "Dépublier",
    disabled: unpublish.disabled,
    title: unpublish.disabled ? "Impossible de dépublier" : "Retire la version publiée (le brouillon reste). Le site affichera les données de secours.",
    onHandle: () => setConfirmOpen(true),
    dialog: confirmOpen && {
      type: "confirm" as const,
      tone: "critical" as const,
      message: "Dépublier ce document ? La version publiée sera retirée, le brouillon restera. Le site utilisera les données de secours (src/data/bio) jusqu’à la prochaine publication.",
      onConfirm: handleUnpublish,
      onCancel: () => setConfirmOpen(false),
    },
  };
}
