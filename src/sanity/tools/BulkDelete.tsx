import { useState, useEffect, useCallback } from "react";
import { useClient } from "sanity";
import groq from "groq";

const TYPE_OPTIONS = [
  { value: "contenuAClasser", label: "À classer" },
  { value: "exhibition", label: "Exposition" },
  { value: "pressArticle", label: "Article de presse" },
  { value: "resource", label: "Ressource" },
  { value: "painting", label: "Tableau" },
] as const;

type DocType = (typeof TYPE_OPTIONS)[number]["value"];

const QUERIES: Record<DocType, string> = {
  contenuAClasser: groq`*[_type == "contenuAClasser"] | order(extractedAt desc) { _id, title, sourceUrl }`,
  exhibition: groq`*[_type == "exhibition"] | order(dateStart desc) { _id, title, externalLink }`,
  pressArticle: groq`*[_type == "pressArticle"] | order(date desc) { _id, title, url }`,
  resource: groq`*[_type == "resource"] | order(_createdAt desc) { _id, title }`,
  painting: groq`*[_type == "painting"] | order(year desc, title asc) { _id, title, year }`,
};

type DocRow = { _id: string; title?: string } & Record<string, unknown>;

function getSubtitle(doc: DocRow, type: DocType): string {
  switch (type) {
    case "contenuAClasser":
      return (doc.sourceUrl as string) || "";
    case "exhibition":
      return (doc.externalLink as string) || "";
    case "pressArticle":
      return (doc.url as string) || "";
    case "painting":
      return doc.year != null ? String(doc.year) : "";
    default:
      return "";
  }
}

export function BulkDelete() {
  const client = useClient({ apiVersion: "2024-01-01" });
  const [docType, setDocType] = useState<DocType>("contenuAClasser");
  const [docs, setDocs] = useState<DocRow[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setMessage(null);
    try {
      const list = await client.fetch<DocRow[]>(QUERIES[docType]);
      setDocs(list || []);
      setSelected(new Set());
    } catch (e) {
      setMessage("Erreur au chargement: " + (e instanceof Error ? e.message : String(e)));
    } finally {
      setLoading(false);
    }
  }, [client, docType]);

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
    if (selected.size === docs.length) setSelected(new Set());
    else setSelected(new Set(docs.map((d) => d._id)));
  };

  const deleteSelection = async () => {
    if (selected.size === 0) {
      setMessage("Sélectionnez au moins un document.");
      return;
    }
    const typeLabel = TYPE_OPTIONS.find((o) => o.value === docType)?.label ?? docType;
    const ok = window.confirm(
      `Supprimer définitivement ${selected.size} document(s) (${typeLabel}) ? Cette action est irréversible.`
    );
    if (!ok) return;

    setDeleting(true);
    setMessage(null);
    let deleted = 0;
    let err = 0;
    const ids = Array.from(selected);
    for (const id of ids) {
      try {
        await client.delete(id);
        deleted++;
      } catch (e) {
        err++;
        console.error(id, e);
      }
    }
    setDeleting(false);
    setMessage(
      deleted
        ? `${deleted} document(s) supprimé(s).${err ? ` ${err} erreur(s).` : ""}`
        : "Aucun document supprimé."
    );
    if (deleted) {
      setSelected(new Set());
      load();
    }
  };

  if (loading) {
    return (
      <div style={{ padding: 24 }}>
        <p>Chargement…</p>
      </div>
    );
  }

  return (
    <div style={{ padding: 24, maxWidth: 900 }}>
      <h1 style={{ fontSize: 20, marginBottom: 16 }}>Suppression en masse</h1>
      <p style={{ marginBottom: 16, color: "#666" }}>
        Choisissez un type de document, cochez les entrées à supprimer, puis cliquez sur « Supprimer la sélection ». Cette action est irréversible.
      </p>

      <div style={{ marginBottom: 16 }}>
        <label style={{ display: "block", marginBottom: 8, fontWeight: 600 }}>Type de document</label>
        <select
          value={docType}
          onChange={(e) => setDocType(e.target.value as DocType)}
          style={{ padding: 8, minWidth: 200 }}
        >
          {TYPE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      <div style={{ marginBottom: 24 }}>
        <label style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
          <input
            type="checkbox"
            checked={docs.length > 0 && selected.size === docs.length}
            onChange={toggleAll}
          />
          <span>Tout sélectionner ({docs.length} document(s))</span>
        </label>
        <div style={{ maxHeight: 360, overflowY: "auto", border: "1px solid #ccc", borderRadius: 4, padding: 8 }}>
          {docs.length === 0 ? (
            <p style={{ color: "#666", margin: 0 }}>Aucun document de ce type.</p>
          ) : (
            docs.map((d) => {
              const sub = getSubtitle(d, docType);
              return (
                <label
                  key={d._id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "8px 0",
                    borderBottom: "1px solid #eee",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={selected.has(d._id)}
                    onChange={() => toggle(d._id)}
                  />
                  <span style={{ flex: 1 }}>{d.title ?? "Sans titre"}</span>
                  {sub && (
                    <span style={{ fontSize: 12, color: "#666", maxWidth: 280, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={sub}>
                      {sub}
                    </span>
                  )}
                </label>
              );
            })
          )}
        </div>
        <p style={{ marginTop: 8, fontSize: 14, color: "#666" }}>
          {selected.size} document(s) sélectionné(s)
        </p>
      </div>

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
        <button
          type="button"
          onClick={deleteSelection}
          disabled={deleting || selected.size === 0}
          style={{
            padding: "10px 20px",
            background: selected.size > 0 && !deleting ? "#c53030" : "#ccc",
            color: "#fff",
            border: "none",
            borderRadius: 4,
            cursor: selected.size > 0 && !deleting ? "pointer" : "not-allowed",
            fontWeight: 600,
          }}
        >
          {deleting ? "Suppression…" : "Supprimer la sélection"}
        </button>
      </div>

      {message && (
        <p style={{ marginTop: 16, color: "#333" }}>{message}</p>
      )}
    </div>
  );
}
