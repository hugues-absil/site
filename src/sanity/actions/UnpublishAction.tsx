import { useState } from "react";
import { useDocumentOperation } from "sanity";
import { UnpublishIcon } from "@sanity/icons";

/**
 * Action "Dépublier" pour tout type de document.
 * Passe le contenu en brouillon uniquement : la version publiée est retirée,
 * le brouillon reste. Permet d’avoir le site propre sans supprimer le contenu à traiter plus tard.
 */
export function UnpublishAction(props: {
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
    title: unpublish.disabled
      ? "Impossible de dépublier"
      : "Retire la version publiée (le brouillon reste). Le contenu ne sera plus visible sur le site.",
    onHandle: () => setConfirmOpen(true),
    dialog: confirmOpen && {
      type: "confirm" as const,
      tone: "critical" as const,
      message:
        "Dépublier ce document ? La version publiée sera retirée, le brouillon restera. Le contenu ne sera plus visible sur le site jusqu’à la prochaine publication.",
      onConfirm: handleUnpublish,
      onCancel: () => setConfirmOpen(false),
    },
  };
}
