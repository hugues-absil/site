import { useState } from "react";
import { useClient } from "sanity";
import { Stack, Card, Text, Button, Checkbox, Flex } from "@sanity/ui";
import { RESOURCE_CATEGORIES, type ResourceCategoryValue } from "../constants/resourceCategories";

type PressArticleDoc = {
  title?: string;
  publication?: string;
  date?: string;
  excerpt?: string;
  url?: string;
  image?: { asset?: { _ref?: string }; _type?: string };
  slug?: { current?: string };
  content?: unknown;
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
  article: PressArticleDoc;
  documentId: string;
  onClose: () => void;
  onComplete?: () => void;
}) {
  const { article, documentId, onClose, onComplete } = props;
  const client = useClient({ apiVersion: "2024-01-01" });
  const [selectedCategory, setSelectedCategory] = useState<ResourceCategoryValue>("oeil-expo");
  const [deleteAfter, setDeleteAfter] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleMigrate = async () => {
    setLoading(true);
    setError(null);
    try {
      const baseSlug =
        article.slug?.current && article.slug.current.length > 0
          ? article.slug.current
          : slugify(article.title || "sans-titre") || "ressource-" + Date.now();
      const existingId = await client.fetch<string | null>(
        `*[_type == "resource" && slug.current == $slug][0]._id`,
        { slug: baseSlug }
      );
      const slug = existingId ? `${baseSlug}-${Date.now()}` : baseSlug;

      const excerptParts = [article.publication, article.excerpt].filter(Boolean);
      const excerpt = excerptParts.join(" — ") || "";
      const coverImage =
        article.image?.asset?._ref != null
          ? {
              _type: "image" as const,
              asset: { _type: "reference" as const, _ref: article.image!.asset!._ref },
            }
          : undefined;

      const resource: Record<string, unknown> & { _type: string } = {
        _type: "resource",
        title: article.title || "Sans titre",
        slug: { _type: "slug", current: slug },
        category: selectedCategory,
        excerpt,
        date: article.date ?? undefined,
        coverImage,
        content: article.content ?? undefined,
      };

      await client.create(resource);

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
        Crée une nouvelle Ressource (Écrits/Enseignement) à partir de cet article de presse, avec
        la section choisie.
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
        <Text size={2}>Supprimer l&apos;article de presse après migration</Text>
      </Flex>
      {error && (
        <Card padding={3} tone="critical" radius={2}>
          <Text size={2}>{error}</Text>
        </Card>
      )}
      <Stack space={2}>
        <Button
          text={loading ? "Migration…" : "Migrer"}
          tone="primary"
          onClick={handleMigrate}
          disabled={loading}
        />
        <Button text="Annuler" mode="ghost" onClick={onClose} disabled={loading} />
      </Stack>
    </Stack>
  );
}

/**
 * Action "Migrer vers une section" pour les documents Article de presse.
 * Crée une Ressource avec la catégorie choisie ; option de supprimer l'article après.
 */
export function MigratePressArticleToSectionAction(props: {
  id: string;
  type: string;
  draft: unknown;
  published: unknown;
  onComplete?: () => void;
}) {
  const { id, type, draft, published, onComplete } = props;
  const [dialogOpen, setDialogOpen] = useState(false);

  if (type !== "pressArticle") return null;

  const article = (draft ?? published) as PressArticleDoc | null;
  if (!article) return null;

  const handleClose = () => setDialogOpen(false);

  return {
    tone: "default" as const,
    label: "Migrer vers une section",
    title: "Créer une Ressource (Écrits/Enseignement) à partir de cet article de presse",
    onHandle: () => setDialogOpen(true),
    dialog:
      dialogOpen &&
      ({
        type: "dialog" as const,
        header: "Migrer vers une section",
        onClose: handleClose,
        content: (
          <MigrateDialogContent
            article={article}
            documentId={id}
            onClose={handleClose}
            onComplete={onComplete}
          />
        ),
      }),
  };
}
