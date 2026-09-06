import { useState } from "react";
import { useClient } from "sanity";
import { Stack, Card, Text, Button, Checkbox, Flex } from "@sanity/ui";
import { RESOURCE_CATEGORIES, type ResourceCategoryValue } from "../constants/resourceCategories";

type TargetType = "resource" | "exhibition" | "pressArticle" | "advice";

type ContenuAClasserDoc = {
  title?: string;
  extractedContent?: string;
  extractedAt?: string;
  sourceUrl?: string;
  content?: unknown[];
};

const TARGET_OPTIONS: { value: TargetType; label: string }[] = [
  { value: "resource", label: "Ressource (Écrits / Enseignement)" },
  { value: "exhibition", label: "Exposition" },
  { value: "pressArticle", label: "Article de presse" },
  { value: "advice", label: "Journal" },
];

function slugify(text: string): string {
  return String(text)
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9]+/gi, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();
}

function portableTextToPlain(content: unknown): string {
  if (!Array.isArray(content)) return "";
  let s = "";
  for (const node of content as Record<string, unknown>[]) {
    if (node?._type === "block" && Array.isArray(node.children)) {
      for (const c of node.children as { text?: string }[]) {
        if (c?.text) s += c.text;
      }
      s += " ";
    }
  }
  return s.replace(/\s+/g, " ").trim();
}

function clonePortableText(content: unknown): unknown[] | undefined {
  if (!Array.isArray(content) || content.length === 0) return undefined;
  return JSON.parse(JSON.stringify(content)) as unknown[];
}

function excerptFromDoc(doc: ContenuAClasserDoc): string {
  const fromPt = portableTextToPlain(doc.content);
  const plain = fromPt || doc.extractedContent || "";
  return plain.slice(0, 500);
}

async function uniqueSlug(
  client: ReturnType<typeof useClient>,
  type: string,
  base: string
): Promise<string> {
  const baseSlug = slugify(base) || `${type}-` + Date.now();
  const existingId = await client.fetch<string | null>(
    `*[_type == $t && slug.current == $slug][0]._id`,
    { t: type, slug: baseSlug }
  );
  return existingId ? `${baseSlug}-${Date.now()}` : baseSlug;
}

function MigrateDialogContent(props: {
  doc: ContenuAClasserDoc;
  documentId: string;
  onClose: () => void;
  onComplete?: () => void;
}) {
  const { doc, documentId, onClose, onComplete } = props;
  const client = useClient({ apiVersion: "2024-01-01" });
  const [target, setTarget] = useState<TargetType>("resource");
  const [selectedCategory, setSelectedCategory] = useState<ResourceCategoryValue>("oeil-expo");
  const [deleteAfter, setDeleteAfter] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleMigrate = async () => {
    setLoading(true);
    setError(null);
    try {
      const title = doc.title || "Sans titre";
      const excerpt = excerptFromDoc(doc);
      const content = clonePortableText(doc.content);
      const sourceUrl = doc.sourceUrl;
      const dateStr = doc.extractedAt ? doc.extractedAt.slice(0, 10) : undefined;

      if (target === "resource") {
        const slug = await uniqueSlug(client, "resource", title);
        await client.create({
          _type: "resource",
          title,
          slug: { _type: "slug", current: slug },
          category: selectedCategory,
          excerpt,
          ...(content ? { content } : {}),
          ...(dateStr ? { date: dateStr } : {}),
          ...(sourceUrl ? { sourceUrl } : {}),
        });
      } else if (target === "exhibition") {
        const slug = await uniqueSlug(client, "exhibition", title);
        await client.create({
          _type: "exhibition",
          title,
          slug: { _type: "slug", current: slug },
          description: excerpt || undefined,
          ...(content ? { body: content } : {}),
          ...(sourceUrl ? { externalLink: sourceUrl } : {}),
          ...(dateStr ? { dateStart: dateStr } : {}),
        });
      } else if (target === "pressArticle") {
        const slug = await uniqueSlug(client, "pressArticle", title);
        await client.create({
          _type: "pressArticle",
          title,
          slug: { _type: "slug", current: slug },
          excerpt,
          ...(content ? { content } : {}),
          ...(sourceUrl ? { url: sourceUrl } : {}),
          ...(dateStr ? { date: dateStr } : {}),
        });
      } else if (target === "advice") {
        const slug = await uniqueSlug(client, "advice", title);
        await client.create({
          _type: "advice",
          title,
          slug: { _type: "slug", current: slug },
          excerpt,
          ...(content ? { content } : {}),
          ...(dateStr ? { date: dateStr } : {}),
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
        Crée un document dans la section choisie à partir de cet élément « À classer ». Le contenu
        riche (Portable Text) et l&apos;URL source sont copiés lorsque les champs existent sur la
        cible. Un extrait court est généré à partir du texte du contenu.
      </Text>
      <Stack space={2}>
        <Text size={2} weight="semibold">
          Type de destination
        </Text>
        {TARGET_OPTIONS.map((o) => (
          <Button
            key={o.value}
            text={o.label}
            tone={o.value === target ? "primary" : "default"}
            mode={o.value === target ? "default" : "ghost"}
            disabled={loading}
            onClick={() => setTarget(o.value)}
          />
        ))}
      </Stack>
      {target === "resource" && (
        <Stack space={2}>
          <Text size={2} weight="semibold">
            Catégorie (ressource)
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
      )}
      <Flex align="center" gap={2}>
        <Checkbox
          checked={deleteAfter}
          onChange={(e) => setDeleteAfter((e.target as HTMLInputElement).checked)}
          disabled={loading}
        />
        <Text size={2}>Supprimer l&apos;entrée « À classer » après migration</Text>
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
 * Action « Migrer vers une section » : ressource, exposition, article de presse ou journal.
 */
export function MigrateContenuAClasserToSectionAction(props: {
  id: string;
  type: string;
  draft: unknown;
  published: unknown;
  onComplete?: () => void;
}) {
  const { id, type, draft, published, onComplete } = props;
  const [dialogOpen, setDialogOpen] = useState(false);

  if (type !== "contenuAClasser") return null;

  const doc = (draft ?? published) as ContenuAClasserDoc | null;
  if (!doc) return null;

  const handleClose = () => setDialogOpen(false);

  return {
    tone: "default" as const,
    label: "Migrer vers une section",
    title: "Migrer cet élément À classer vers Ressource, Exposition, Presse ou Journal",
    onHandle: () => setDialogOpen(true),
    dialog:
      dialogOpen &&
      ({
        type: "dialog" as const,
        header: "Migrer vers une section",
        onClose: handleClose,
        content: (
          <MigrateDialogContent
            doc={doc}
            documentId={id}
            onClose={handleClose}
            onComplete={onComplete}
          />
        ),
      }),
  };
}
