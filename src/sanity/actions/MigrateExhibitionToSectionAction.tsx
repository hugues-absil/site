import { useState } from "react";
import { useClient } from "sanity";
import { Stack, Card, Text, Button, Checkbox, Flex } from "@sanity/ui";
import { RESOURCE_CATEGORIES, type ResourceCategoryValue } from "../constants/resourceCategories";

type ExhibitionDoc = {
  title?: string;
  description?: string;
  dateStart?: string;
  dateEnd?: string;
  venue?: string;
  city?: string;
  country?: string;
  image?: { asset?: { _ref?: string }; _type?: string };
};

function slugify(text: string): string {
  return String(text)
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9]+/gi, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();
}

function MigrateDialogContent(props: {
  exhibition: ExhibitionDoc;
  documentId: string;
  onClose: () => void;
  onComplete?: () => void;
}) {
  const { exhibition, documentId, onClose, onComplete } = props;
  const client = useClient({ apiVersion: "2024-01-01" });
  const [selectedCategory, setSelectedCategory] = useState<ResourceCategoryValue>("oeil-expo");
  const [deleteAfter, setDeleteAfter] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleMigrate = async () => {
    setLoading(true);
    setError(null);
    try {
      const baseSlug = slugify(exhibition.title || "sans-titre") || "ressource-" + Date.now();
      const existingId = await client.fetch<string | null>(
        `*[_type == "resource" && slug.current == $slug][0]._id`,
        { slug: baseSlug }
      );
      const slug = existingId ? `${baseSlug}-${Date.now()}` : baseSlug;

      const excerptParts = [
        exhibition.description,
        [exhibition.venue, exhibition.city, exhibition.country].filter(Boolean).join(", "),
      ].filter(Boolean);
      const excerpt = excerptParts.join(" — ") || undefined;
      const date = exhibition.dateEnd || exhibition.dateStart || undefined;
      const coverImage =
        exhibition.image?.asset?._ref != null
          ? {
              _type: "image" as const,
              asset: { _type: "reference" as const, _ref: exhibition.image!.asset!._ref },
            }
          : undefined;

      await client.create({
        _type: "resource",
        title: exhibition.title || "Sans titre",
        slug: { _type: "slug", current: slug },
        category: selectedCategory,
        excerpt: excerpt || "",
        date,
        coverImage,
      });

      if (deleteAfter) {
        const publishedId = documentId.startsWith("drafts.") ? documentId.slice(7) : documentId;
        await client.delete(publishedId);
      }

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
        Crée une nouvelle Ressource (Écrits/Enseignement) à partir de cette exposition, avec la section
        choisie.
      </Text>
      <Stack space={2}>
        <Text size={2} weight="semibold">
          Section de destination
        </Text>
        {RESOURCE_CATEGORIES.map(({ value, label }) => (
          <Button
            key={value}
            text={label}
            tone={value === selectedCategory ? "primary" : "default"}
            mode={value === selectedCategory ? "default" : "ghost"}
            disabled={loading}
            onClick={() => setSelectedCategory(value)}
          />
        ))}
      </Stack>
      <Flex align="center" gap={2}>
        <Checkbox
          checked={deleteAfter}
          onChange={(e) => setDeleteAfter((e.target as HTMLInputElement).checked)}
          disabled={loading}
        />
        <Text size={2}>Supprimer l'exposition après migration</Text>
      </Flex>
      {error && (
        <Card padding={3} tone="critical" radius={2}>
          <Text size={2}>{error}</Text>
        </Card>
      )}
      <Stack space={2}>
        <Button text={loading ? "Migration…" : "Migrer"} tone="primary" onClick={handleMigrate} disabled={loading} />
        <Button text="Annuler" mode="ghost" onClick={onClose} disabled={loading} />
      </Stack>
    </Stack>
  );
}

/**
 * Action "Migrer vers une section" pour les documents Exposition.
 * Crée une Ressource avec la catégorie choisie ; option de supprimer l'exposition après.
 */
export function MigrateExhibitionToSectionAction(props: {
  id: string;
  type: string;
  draft: unknown;
  published: unknown;
  onComplete?: () => void;
}) {
  const { id, type, draft, published, onComplete } = props;
  const [dialogOpen, setDialogOpen] = useState(false);

  if (type !== "exhibition") return null;

  const exhibition = (draft ?? published) as ExhibitionDoc | null;
  if (!exhibition) return null;

  const handleClose = () => setDialogOpen(false);

  return {
    tone: "default" as const,
    label: "Migrer vers une section",
    title: "Créer une Ressource (Écrits/Enseignement) à partir de cette exposition",
    onHandle: () => setDialogOpen(true),
    dialog:
      dialogOpen &&
      ({
        type: "dialog" as const,
        header: "Migrer vers une section",
        onClose: handleClose,
        content: (
          <MigrateDialogContent
            exhibition={exhibition}
            documentId={id}
            onClose={handleClose}
            onComplete={onComplete}
          />
        ),
      }),
  };
}
