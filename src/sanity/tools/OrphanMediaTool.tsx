import { useState, useEffect, useCallback } from "react";
import { useClient } from "sanity";
import groq from "groq";
import { Stack, Card, Text, Button, Flex, TextInput } from "@sanity/ui";
import { ImageIcon } from "@sanity/icons";

type AssetRow = {
  _id: string;
  url?: string | null;
  originalFilename?: string | null;
  refCount?: number;
};

const ORPHAN_QUERY = groq`
*[_type == "sanity.imageAsset"] | order(_updatedAt desc) {
  _id,
  url,
  originalFilename,
  "refCount": count(*[references(^._id)])
}[refCount == 0][0...500]
`;

function randomKey() {
  return `k${Math.random().toString(36).slice(2, 12)}${Date.now().toString(36)}`;
}

export function OrphanMediaTool() {
  const client = useClient({ apiVersion: "2024-01-01" });
  const [assets, setAssets] = useState<AssetRow[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [targetDocId, setTargetDocId] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setMessage(null);
    try {
      const list = await client.fetch<AssetRow[]>(ORPHAN_QUERY);
      setAssets(list || []);
      setSelected(new Set());
    } catch (e) {
      setMessage("Erreur au chargement: " + (e instanceof Error ? e.message : String(e)));
    } finally {
      setLoading(false);
    }
  }, [client]);

  useEffect(() => {
    load();
  }, [load]);

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selected.size === assets.length) setSelected(new Set());
    else setSelected(new Set(assets.map((a) => a._id)));
  };

  const deleteSelection = async () => {
    if (selected.size === 0) {
      setMessage("Sélectionnez au moins un média.");
      return;
    }
    const ok = window.confirm(
      `Supprimer définitivement ${selected.size} fichier(s) du CDN Sanity ? Irréversible.`
    );
    if (!ok) return;
    setBusy(true);
    setMessage(null);
    let n = 0;
    let err = 0;
    for (const id of selected) {
      try {
        await client.delete(id);
        n++;
      } catch {
        err++;
      }
    }
    setBusy(false);
    setMessage(`${n} supprimé(s).${err ? ` ${err} erreur(s).` : ""}`);
    load();
  };

  const attachToDocument = async () => {
    const docId = targetDocId.trim();
    if (!docId) {
      setMessage("Renseignez l’ID du document cible (ex. contenuAClasser…).");
      return;
    }
    if (selected.size === 0) {
      setMessage("Sélectionnez un média à rattacher.");
      return;
    }
    if (selected.size > 1) {
      setMessage("Pour l’instant, sélectionnez un seul média par rattachement.");
      return;
    }
    const assetId = [...selected][0];
    setBusy(true);
    setMessage(null);
    try {
      const patchId = docId.trim();
      const exists = await client.fetch<string | null>(`*[_id == $id][0]._id`, { id: patchId });
      if (!exists) {
        setMessage("Document introuvable. Copiez l’ID exact depuis le Studio (y compris drafts. si présent).");
        setBusy(false);
        return;
      }
      const imageBlock = {
        _type: "image",
        _key: randomKey(),
        asset: { _type: "reference", _ref: assetId },
      };
      await client
        .patch(patchId)
        .setIfMissing({ content: [] })
        .append("content", [imageBlock])
        .commit({ visibility: "async" });
      setMessage(`Image ajoutée au document ${patchId}.`);
      setSelected(new Set());
      load();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: 24 }}>
        <p>Chargement des médias orphelins…</p>
      </div>
    );
  }

  return (
    <div style={{ padding: 24, maxWidth: 960 }}>
      <Stack space={4}>
        <Flex align="center" gap={3}>
          <ImageIcon style={{ fontSize: 28 }} />
          <Text size={3} weight="bold">
            Médias orphelins
          </Text>
        </Flex>
        <Text size={2} muted>
          Fichiers image sans référence depuis un document. Vous pouvez les supprimer ou les
          ajouter comme bloc image à un document « À classer » (ID Sanity du document, onglet
          « Info » ou URL du Studio).
        </Text>
        <Button text="Actualiser la liste" onClick={load} disabled={busy} tone="default" />
        <Card padding={3} radius={2} shadow={1}>
          <Stack space={3}>
            <Text size={2} weight="semibold">
              Rattacher à un document
            </Text>
            <TextInput
              placeholder="ID document (ex. crawl-ac-… ou contenuAClasser id)"
              value={targetDocId}
              onChange={(e) => setTargetDocId(e.currentTarget.value)}
              disabled={busy}
            />
            <Button
              text={busy ? "…" : "Ajouter l’image sélectionnée au contenu"}
              onClick={attachToDocument}
              disabled={busy}
              tone="primary"
            />
          </Stack>
        </Card>
        <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <input type="checkbox" checked={assets.length > 0 && selected.size === assets.length} onChange={toggleAll} />
          <span>
            Tout sélectionner ({assets.length} fichier{assets.length > 1 ? "s" : ""} sans référence,
            max 500 affichés)
          </span>
        </label>
        <div
          style={{
            maxHeight: 400,
            overflowY: "auto",
            border: "1px solid #ccc",
            borderRadius: 4,
            padding: 8,
          }}
        >
          {assets.length === 0 ? (
            <Text muted>Aucun média orphelin détecté (parmi les 500 derniers assets).</Text>
          ) : (
            assets.map((a) => (
              <label
                key={a._id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "8px 0",
                  borderBottom: "1px solid #eee",
                }}
              >
                <input type="checkbox" checked={selected.has(a._id)} onChange={() => toggle(a._id)} />
                {a.url ? (
                  <img
                    src={a.url}
                    alt=""
                    style={{ width: 48, height: 48, objectFit: "cover", borderRadius: 4 }}
                  />
                ) : (
                  <div style={{ width: 48, height: 48, background: "#eee", borderRadius: 4 }} />
                )}
                <span style={{ flex: 1, fontSize: 13 }}>
                  {a.originalFilename || a._id}
                  <br />
                  <code style={{ fontSize: 11, color: "#666" }}>{a._id}</code>
                </span>
              </label>
            ))
          )}
        </div>
        <Text size={1} muted>
          {selected.size} sélectionné(s)
        </Text>
        <Button
          text={busy ? "…" : "Supprimer la sélection"}
          tone="critical"
          onClick={deleteSelection}
          disabled={busy || selected.size === 0}
        />
        {message && <Card padding={3}>{message}</Card>}
      </Stack>
    </div>
  );
}
