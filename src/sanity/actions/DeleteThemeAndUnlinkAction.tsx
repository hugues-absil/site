import { useState, useEffect } from "react";
import { useClient } from "sanity";
import { Stack, Card, Text, Button } from "@sanity/ui";

const PAINTINGS_WITH_THEME_QUERY = `*[_type == "painting" && theme._ref == $themeId]._id`;

function DeleteThemeDialogContent(props: {
  documentId: string;
  themeTitle?: string;
  onClose: () => void;
  onComplete?: () => void;
}) {
  const { documentId, themeTitle, onClose, onComplete } = props;
  const client = useClient({ apiVersion: "2024-01-01" });
  const publishedId = documentId.startsWith("drafts.") ? documentId.slice(7) : documentId;

  const [paintingIds, setPaintingIds] = useState<string[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    client
      .fetch<string[]>(PAINTINGS_WITH_THEME_QUERY, { themeId: publishedId })
      .then((ids) => {
        if (!cancelled) setPaintingIds(ids ?? []);
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : String(e));
      });
    return () => {
      cancelled = true;
    };
  }, [client, publishedId]);

  const handleDelete = async () => {
    setLoading(true);
    setError(null);
    try {
      const ids = paintingIds ?? [];
      for (const id of ids) {
        await client.patch(id).unset(["theme"]).commit();
      }
      await client.delete(publishedId);
      onClose();
      onComplete?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  const count = paintingIds?.length ?? 0;
  const isLoadingCount = paintingIds === null && !error;

  return (
    <Stack space={4}>
      <Text size={2} muted>
        {themeTitle ? `Thème « ${themeTitle} »` : "Ce thème"} sera supprimé. Les tableaux qui y sont rattachés
        n’auront plus de thème.
      </Text>
      {isLoadingCount && (
        <Text size={2} muted>
          Chargement…
        </Text>
      )}
      {error && (
        <Card padding={3} tone="critical" radius={2}>
          <Text size={2}>{error}</Text>
        </Card>
      )}
      {paintingIds !== null && !error && (
        <>
          <Text size={2} weight="semibold">
            {count === 0
              ? "Aucun tableau n’a ce thème."
              : `${count} tableau(x) ont ce thème et seront mis à jour.`}
          </Text>
          <Stack space={2}>
            <Button
              text={loading ? "En cours…" : "Retirer des tableaux et supprimer le thème"}
              tone="critical"
              onClick={handleDelete}
              disabled={loading}
            />
            <Button text="Annuler" mode="ghost" onClick={onClose} disabled={loading} />
          </Stack>
        </>
      )}
    </Stack>
  );
}

type ThemeDoc = { title?: string };

/**
 * Action "Supprimer le thème (retirer des tableaux d'abord)" pour les documents Thème.
 * Retire ce thème de tous les tableaux qui y font référence puis supprime le thème.
 */
export function DeleteThemeAndUnlinkAction(props: {
  id: string;
  type: string;
  draft: unknown;
  published: unknown;
  onComplete?: () => void;
}) {
  const { id, type, draft, published, onComplete } = props;
  const [dialogOpen, setDialogOpen] = useState(false);

  if (type !== "theme") return null;

  const themeDoc = (draft ?? published) as ThemeDoc | null;
  const themeTitle = themeDoc?.title;

  const handleClose = () => setDialogOpen(false);

  return {
    tone: "critical" as const,
    label: "Supprimer le thème (retirer des tableaux d'abord)",
    title: "Retire ce thème de tous les tableaux puis supprime le thème",
    onHandle: () => setDialogOpen(true),
    dialog:
      dialogOpen &&
      ({
        type: "dialog" as const,
        header: "Supprimer le thème",
        onClose: handleClose,
        content: (
          <DeleteThemeDialogContent
            documentId={id}
            themeTitle={themeTitle}
            onClose={handleClose}
            onComplete={onComplete}
          />
        ),
      }),
  };
}
