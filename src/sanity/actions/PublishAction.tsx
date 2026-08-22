import { useDocumentOperation } from "sanity";
import { PublishIcon } from "@sanity/icons";

/**
 * Action "Publier" pour tout type de document.
 * Publie le brouillon pour que le contenu soit visible sur le site.
 */
export function PublishAction(props: {
  id: string;
  type: string;
  draft: unknown;
  published: unknown;
  onComplete?: () => void;
}) {
  const { id, type, draft } = props;
  const { publish } = useDocumentOperation(id, type);

  if (!draft) return null; // pas de brouillon → rien à publier

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
      : "Publie le brouillon. Le contenu sera visible sur le site.",
    onHandle: handlePublish,
  };
}
