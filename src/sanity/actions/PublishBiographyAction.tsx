import { useDocumentOperation } from "sanity";
import { PublishIcon } from "@sanity/icons";

/**
 * Action "Publier" visible pour les documents Biographie dès qu'il existe un brouillon à publier.
 * Après une modification, le document est en brouillon ; cette action permet de publier sans chercher le bouton par défaut.
 * Après un "Dépublier", le brouillon reste : cette action permet de republier.
 */
export function PublishBiographyAction(props: {
  id: string;
  type: string;
  draft: unknown;
  published: unknown;
  onComplete?: () => void;
}) {
  const { id, type, draft } = props;
  const { publish } = useDocumentOperation(id, type);

  if (type !== "biography") return null;
  // Pas de brouillon → pas besoin d'afficher "Publier" (les actions par défaut le font déjà si besoin)
  if (!draft) return null;

  const handlePublish = () => {
    publish.execute();
    props.onComplete?.();
  };

  return {
    tone: "positive" as const,
    icon: PublishIcon,
    label: "Publier",
    disabled: publish.disabled,
    title: publish.disabled
      ? "Impossible de publier (vérifiez les champs requis)"
      : "Publie le brouillon. Le site affichera cette version.",
    onHandle: handlePublish,
  };
}
