import { useState } from "react";
import { useClient } from "sanity";
import { Stack, Card, Text, Button } from "@sanity/ui";
import { RESOURCE_CATEGORIES, type ResourceCategoryValue } from "../constants/resourceCategories";

function CategoryPickerContent(props: {
  documentId: string;
  currentCategory?: string;
  onClose: () => void;
  onComplete?: () => void;
}) {
  const { documentId, currentCategory, onClose, onComplete } = props;
  const client = useClient({ apiVersion: "2024-01-01" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSelect = async (category: ResourceCategoryValue) => {
    if (category === currentCategory) {
      onClose();
      onComplete?.();
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await client.patch(documentId).set({ category }).commit();
      onClose();
      onComplete?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Stack space={4}>
      <Text size={2} muted>
        Choisissez la section de destination pour cette ressource.
      </Text>
      {error && (
        <Card padding={3} tone="critical" radius={2}>
          <Text size={2}>{error}</Text>
        </Card>
      )}
      <Stack space={2}>
        {RESOURCE_CATEGORIES.map(({ value, label }) => (
          <Button
            key={value}
            text={label}
            tone={value === currentCategory ? "primary" : "default"}
            mode={value === currentCategory ? "default" : "ghost"}
            disabled={loading}
            onClick={() => handleSelect(value)}
          />
        ))}
      </Stack>
    </Stack>
  );
}

/**
 * Action "Changer de section" pour les documents Ressource.
 * Affiche une modale avec les 5 catégories ; au clic, patch le champ category.
 */
export function ChangeResourceSectionAction(props: {
  id: string;
  type: string;
  draft: unknown;
  published: unknown;
  onComplete?: () => void;
}) {
  const { id, type, draft, published, onComplete } = props;
  const [dialogOpen, setDialogOpen] = useState(false);

  if (type !== "resource") return null;

  const currentCategory =
    (draft as { category?: string } | null)?.category ??
    (published as { category?: string } | null)?.category;

  const handleClose = () => setDialogOpen(false);

  return {
    tone: "default" as const,
    label: "Changer de section",
    title: "Déplacer cette ressource vers une autre section (Écrits ou Enseignement)",
    onHandle: () => setDialogOpen(true),
    dialog:
      dialogOpen &&
      ({
        type: "dialog" as const,
        header: "Changer de section",
        onClose: handleClose,
        content: (
          <CategoryPickerContent
            documentId={id}
            currentCategory={currentCategory}
            onClose={handleClose}
            onComplete={onComplete}
          />
        ),
      }),
  };
}
