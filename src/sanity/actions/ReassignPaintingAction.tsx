import { useState } from "react";
import { useClient } from "sanity";
import { Stack, Card, Text, Button, Checkbox, Flex } from "@sanity/ui";
import { RESOURCE_CATEGORIES, type ResourceCategoryValue } from "../constants/resourceCategories";

type PaintingDoc = {
  title?: string;
  description?: string;
  image?: { asset?: { _ref?: string }; _type?: string };
};

type Destination = "exhibition" | "pressArticle" | "resource";

function slugify(text: string): string {
  return String(text)
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9]+/gi, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();
}

function ensureUniqueSlug(
  client: { fetch: (query: string, params: Record<string, string>) => Promise<string | null> },
  type: "resource" | "pressArticle",
  baseSlug: string
): Promise<string> {
  return client
    .fetch(`*[_type == $type && slug.current == $slug][0]._id`, { type, slug: baseSlug })
    .then((existingId) => (existingId ? `${baseSlug}-${Date.now()}` : baseSlug));
}

function ReassignDialogContent(props: {
  painting: PaintingDoc;
  documentId: string;
  onClose: () => void;
  onComplete?: () => void;
}) {
  const { painting, documentId, onClose, onComplete } = props;
  const client = useClient({ apiVersion: "2024-01-01" });
  const [destination, setDestination] = useState<Destination>("exhibition");
  const [resourceCategory, setResourceCategory] = useState<ResourceCategoryValue>("oeil-expo");
  const [deleteAfter, setDeleteAfter] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const imageRef =
    painting.image?.asset?._ref != null
      ? {
          _type: "image" as const,
          asset: { _type: "reference" as const, _ref: painting.image!.asset!._ref },
        }
      : undefined;

  const handleReassign = async () => {
    setLoading(true);
    setError(null);
    try {
      const title = painting.title || "Sans titre";
      const description = painting.description ?? "";

      if (destination === "exhibition") {
        await client.create({
          _type: "exhibition",
          title,
          description: description.slice(0, 500) || undefined,
          image: imageRef,
        });
      } else if (destination === "pressArticle") {
        const baseSlug = slugify(title) || "article-" + Date.now();
        const slug = await ensureUniqueSlug(client, "pressArticle", baseSlug);
        await client.create({
          _type: "pressArticle",
          title,
          excerpt: description.slice(0, 500) || undefined,
          image: imageRef,
          slug: { _type: "slug", current: slug },
        });
      } else {
        const baseSlug = slugify(title) || "ressource-" + Date.now();
        const slug = await ensureUniqueSlug(client, "resource", baseSlug);
        await client.create({
          _type: "resource",
          title,
          slug: { _type: "slug", current: slug },
          category: resourceCategory,
          excerpt: description.slice(0, 500) ?? "",
          coverImage: imageRef,
        });
      }

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
        Crée un document du type choisi avec l’image et les métadonnées de ce tableau, puis
        optionnellement retire l’entrée de la liste Tableau.
      </Text>

      <Stack space={2}>
        <Text size={2} weight="semibold">
          Catégorie de destination
        </Text>
        <Flex gap={2} wrap="wrap">
          <Button
            text="Exposition"
            tone={destination === "exhibition" ? "primary" : "default"}
            mode={destination === "exhibition" ? "default" : "ghost"}
            disabled={loading}
            onClick={() => setDestination("exhibition")}
          />
          <Button
            text="Article de presse"
            tone={destination === "pressArticle" ? "primary" : "default"}
            mode={destination === "pressArticle" ? "default" : "ghost"}
            disabled={loading}
            onClick={() => setDestination("pressArticle")}
          />
          <Button
            text="Ressource (Écrits / Enseignement)"
            tone={destination === "resource" ? "primary" : "default"}
            mode={destination === "resource" ? "default" : "ghost"}
            disabled={loading}
            onClick={() => setDestination("resource")}
          />
        </Flex>
      </Stack>

      {destination === "resource" && (
        <Stack space={2}>
          <Text size={2} weight="semibold">
            Section
          </Text>
          <Flex gap={2} wrap="wrap">
            {RESOURCE_CATEGORIES.map(({ value, label }) => (
              <Button
                key={value}
                text={label}
                tone={value === resourceCategory ? "primary" : "default"}
                mode={value === resourceCategory ? "default" : "ghost"}
                disabled={loading}
                onClick={() => setResourceCategory(value)}
              />
            ))}
          </Flex>
        </Stack>
      )}

      <Flex align="center" gap={2}>
        <Checkbox
          checked={deleteAfter}
          onChange={(e) => setDeleteAfter((e.target as HTMLInputElement).checked)}
          disabled={loading}
        />
        <Text size={2}>Supprimer le tableau après migration</Text>
      </Flex>

      {error && (
        <Card padding={3} tone="critical" radius={2}>
          <Text size={2}>{error}</Text>
        </Card>
      )}

      <Stack space={2}>
        <Button
          text={loading ? "Migration…" : "Réaffecter"}
          tone="primary"
          onClick={handleReassign}
          disabled={loading}
        />
        <Button text="Annuler" mode="ghost" onClick={onClose} disabled={loading} />
      </Stack>
    </Stack>
  );
}

/**
 * Action "Réaffecter ce tableau" pour les documents Tableau (painting).
 * Crée un document Exposition, Article de presse ou Ressource avec la même image et les
 * métadonnées, puis optionnellement supprime le tableau.
 */
export function ReassignPaintingAction(props: {
  id: string;
  type: string;
  draft: unknown;
  published: unknown;
  onComplete?: () => void;
}) {
  const { id, type, draft, published, onComplete } = props;
  const [dialogOpen, setDialogOpen] = useState(false);

  if (type !== "painting") return null;

  const painting = (draft ?? published) as PaintingDoc | null;
  if (!painting) return null;

  const handleClose = () => setDialogOpen(false);

  return {
    tone: "default" as const,
    label: "Réaffecter ce tableau",
    title: "Créer une Exposition, un Article de presse ou une Ressource à partir de ce tableau",
    onHandle: () => setDialogOpen(true),
    dialog:
      dialogOpen &&
      ({
        type: "dialog" as const,
        header: "Réaffecter ce tableau",
        onClose: handleClose,
        content: (
          <ReassignDialogContent
            painting={painting}
            documentId={id}
            onClose={handleClose}
            onComplete={onComplete}
          />
        ),
      }),
  };
}
