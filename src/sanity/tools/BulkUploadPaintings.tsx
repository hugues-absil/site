import { useState, useEffect, useCallback, useRef } from "react";
import { useClient } from "sanity";
import groq from "groq";

const TECHNIQUES_QUERY = groq`*[_type == "technique"] | order(title asc) { _id, title, "slug": slug.current }`;
const THEMES_QUERY = groq`*[_type == "theme"] | order(title asc) { _id, title, "slug": slug.current }`;
const STATUSES_QUERY = groq`*[_type == "paintingStatus"] | order(title asc) { _id, title, "slug": slug.current }`;
const SERIES_QUERY = groq`*[_type == "series"] | order(title asc) { _id, title, "slug": slug.current }`;

const IMAGE_EXT = [".jpg", ".jpeg", ".png", ".webp", ".gif", ".avif"];
const DELAY_MS = 150;

type RefOption = { _id: string; title: string; slug?: string };

type FileStatus = "pending" | "uploading" | "done" | "error" | "skipped";

type FileEntry = {
  file: File;
  status: FileStatus;
  error?: string;
};

function slugify(text: string): string {
  return String(text)
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9]+/gi, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();
}

function isImageFile(file: File): boolean {
  const ext = "." + (file.name.split(".").pop() ?? "").toLowerCase();
  return IMAGE_EXT.includes(ext) || file.type.startsWith("image/");
}

function titleFromFilename(name: string): string {
  const base = name.replace(/\.[^.]+$/, "");
  return base.replace(/-/g, " ").replace(/_/g, " ");
}

export function BulkUploadPaintings() {
  const client = useClient({ apiVersion: "2024-01-01" });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [techniques, setTechniques] = useState<RefOption[]>([]);
  const [themes, setThemes] = useState<RefOption[]>([]);
  const [statuses, setStatuses] = useState<RefOption[]>([]);
  const [series, setSeries] = useState<RefOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [entries, setEntries] = useState<FileEntry[]>([]);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const [form, setForm] = useState({
    year: new Date().getFullYear().toString(),
    reference: "",
    gallery: "true",
    techniqueId: "",
    themeId: "",
    statusId: "",
    seriesId: "",
  });

  const loadRefs = useCallback(async () => {
    setLoading(true);
    try {
      const [t, th, s, ser] = await Promise.all([
        client.fetch<RefOption[]>(TECHNIQUES_QUERY),
        client.fetch<RefOption[]>(THEMES_QUERY),
        client.fetch<RefOption[]>(STATUSES_QUERY),
        client.fetch<RefOption[]>(SERIES_QUERY),
      ]);
      setTechniques(t || []);
      setThemes(th || []);
      setStatuses(s || []);
      setSeries(ser || []);
    } catch (e) {
      setMessage("Erreur au chargement: " + (e instanceof Error ? e.message : String(e)));
    } finally {
      setLoading(false);
    }
  }, [client]);

  useEffect(() => {
    loadRefs();
  }, [loadRefs]);

  const addFiles = useCallback((fileList: FileList | null) => {
    if (!fileList?.length) return;
    const newEntries: FileEntry[] = [];
    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      if (isImageFile(file)) {
        newEntries.push({ file, status: "pending" });
      }
    }
    setEntries((prev) => [...prev, ...newEntries]);
    setMessage(null);
  }, []);

  const removeEntry = useCallback((index: number) => {
    setEntries((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      addFiles(e.dataTransfer.files);
    },
    [addFiles]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleFileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      addFiles(e.target.files);
      e.target.value = "";
    },
    [addFiles]
  );

  const startImport = useCallback(async () => {
    const pending = entries.filter((e) => e.status === "pending");
    if (pending.length === 0) {
      setMessage("Ajoutez des images à importer.");
      return;
    }

    setUploading(true);
    setMessage(null);

    const year = parseInt(form.year, 10) || new Date().getFullYear();
    const gallery = form.gallery === "true";

    const patch: Record<string, unknown> = {
      year,
      gallery,
    };
    if (form.techniqueId) patch.technique = { _type: "reference", _ref: form.techniqueId };
    if (form.themeId) patch.theme = { _type: "reference", _ref: form.themeId };
    if (form.statusId) patch.status = { _type: "reference", _ref: form.statusId };
    if (form.seriesId) patch.series = { _type: "reference", _ref: form.seriesId };
    const refTrim = form.reference.trim();
    if (refTrim) patch.reference = refTrim;

    const EXISTING_QUERY = groq`*[_type == "painting" && title == $title && year == $year][0]._id`;
    let done = 0;
    let err = 0;
    let skipped = 0;

    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i];
      if (entry.status !== "pending") continue;

      const title = titleFromFilename(entry.file.name);

      const existing = await client.fetch<string | null>(EXISTING_QUERY, {
        title,
        year,
      });
      if (existing) {
        setEntries((prev) =>
          prev.map((e, j) =>
            j === i
              ? { ...e, status: "skipped" as FileStatus, error: "Déjà existant" }
              : e
          )
        );
        skipped++;
        await new Promise((r) => setTimeout(r, DELAY_MS));
        continue;
      }

      setEntries((prev) =>
        prev.map((e, j) => (j === i ? { ...e, status: "uploading" as FileStatus } : e))
      );

      try {
        const asset = await client.assets.upload("image", entry.file, {
          filename: entry.file.name,
        });
        const slug = slugify(title) || "tableau-" + Date.now() + "-" + i;
        await client.create({
          _type: "painting",
          title,
          slug: { _type: "slug", current: slug },
          ...patch,
          image: {
            _type: "image",
            asset: { _type: "reference", _ref: asset._id },
          },
        });
        setEntries((prev) =>
          prev.map((e, j) => (j === i ? { ...e, status: "done" as FileStatus } : e))
        );
        done++;
      } catch (e) {
        const errorMessage = e instanceof Error ? e.message : String(e);
        setEntries((prev) =>
          prev.map((e, j) =>
            j === i ? { ...e, status: "error" as FileStatus, error: errorMessage } : e
          )
        );
        err++;
      }

      await new Promise((r) => setTimeout(r, DELAY_MS));
    }

    setUploading(false);
    const parts = [`Import terminé : ${done} tableau(x) créé(s).`];
    if (skipped) parts.push(` ${skipped} ignoré(s) (déjà existant).`);
    if (err) parts.push(` ${err} erreur(s).`);
    setMessage(parts.join(""));
  }, [entries, form, client]);

  if (loading) {
    return (
      <div style={{ padding: 24 }}>
        <p>Chargement…</p>
      </div>
    );
  }

  return (
    <div style={{ padding: 24, maxWidth: 700 }}>
      <h1 style={{ fontSize: 20, marginBottom: 16 }}>Import tableaux (glisser-déposer)</h1>
      <p style={{ marginBottom: 24, color: "#666" }}>
        Glissez des images ici ou parcourez vos fichiers. Chaque image créera un document « Tableau ».
        Vous pouvez définir des valeurs par défaut pour tous les tableaux créés.
      </p>

      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        style={{
          border: "2px dashed #ccc",
          borderRadius: 8,
          padding: 32,
          textAlign: "center",
          marginBottom: 24,
          background: "#fafafa",
        }}
      >
        <p style={{ marginBottom: 12 }}>Glissez des images ici</p>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          onChange={handleFileInputChange}
          style={{ display: "none" }}
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          style={{
            padding: "10px 20px",
            background: "#2276fc",
            color: "#fff",
            border: "none",
            borderRadius: 4,
            cursor: "pointer",
            fontWeight: 600,
          }}
        >
          Parcourir
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>
        <div>
          <label style={{ display: "block", marginBottom: 4, fontWeight: 600 }}>Année par défaut</label>
          <input
            type="number"
            value={form.year}
            onChange={(e) => setForm((f) => ({ ...f, year: e.target.value }))}
            style={{ width: "100%", padding: 8 }}
          />
        </div>
        <div>
          <label style={{ display: "block", marginBottom: 4, fontWeight: 600 }}>Référence (optionnel)</label>
          <input
            type="text"
            value={form.reference}
            onChange={(e) => setForm((f) => ({ ...f, reference: e.target.value }))}
            placeholder="ex. 24T05 — identique pour tous les imports"
            style={{ width: "100%", padding: 8 }}
          />
        </div>
        <div>
          <label style={{ display: "block", marginBottom: 4, fontWeight: 600 }}>Afficher en galerie</label>
          <select
            value={form.gallery}
            onChange={(e) => setForm((f) => ({ ...f, gallery: e.target.value }))}
            style={{ width: "100%", padding: 8 }}
          >
            <option value="true">Oui</option>
            <option value="false">Non</option>
          </select>
        </div>
        <div>
          <label style={{ display: "block", marginBottom: 4, fontWeight: 600 }}>Technique</label>
          <select
            value={form.techniqueId}
            onChange={(e) => setForm((f) => ({ ...f, techniqueId: e.target.value }))}
            style={{ width: "100%", padding: 8 }}
          >
            <option value="">—</option>
            {techniques.map((t) => (
              <option key={t._id} value={t._id}>{t.title}</option>
            ))}
          </select>
        </div>
        <div>
          <label style={{ display: "block", marginBottom: 4, fontWeight: 600 }}>Thème</label>
          <select
            value={form.themeId}
            onChange={(e) => setForm((f) => ({ ...f, themeId: e.target.value }))}
            style={{ width: "100%", padding: 8 }}
          >
            <option value="">—</option>
            {themes.map((t) => (
              <option key={t._id} value={t._id}>{t.title}</option>
            ))}
          </select>
        </div>
        <div>
          <label style={{ display: "block", marginBottom: 4, fontWeight: 600 }}>Statut</label>
          <select
            value={form.statusId}
            onChange={(e) => setForm((f) => ({ ...f, statusId: e.target.value }))}
            style={{ width: "100%", padding: 8 }}
          >
            <option value="">—</option>
            {statuses.map((s) => (
              <option key={s._id} value={s._id}>{s.title}</option>
            ))}
          </select>
        </div>
        <div>
          <label style={{ display: "block", marginBottom: 4, fontWeight: 600 }}>Série</label>
          <select
            value={form.seriesId}
            onChange={(e) => setForm((f) => ({ ...f, seriesId: e.target.value }))}
            style={{ width: "100%", padding: 8 }}
          >
            <option value="">—</option>
            {series.map((s) => (
              <option key={s._id} value={s._id}>{s.title}</option>
            ))}
          </select>
        </div>
      </div>

      {entries.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <p style={{ marginBottom: 8, fontWeight: 600 }}>
            {entries.length} image(s) — {entries.filter((e) => e.status === "pending").length} en attente
          </p>
          <div style={{ maxHeight: 240, overflowY: "auto", border: "1px solid #ccc", borderRadius: 4, padding: 8 }}>
            {entries.map((entry, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 8,
                  padding: "6px 0",
                  borderBottom: "1px solid #eee",
                }}
              >
                <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis" }}>
                  {entry.file.name}
                </span>
                <span
                  style={{
                    fontSize: 13,
                    color:
                      entry.status === "done"
                        ? "#0a0"
                        : entry.status === "error"
                          ? "#c00"
                          : entry.status === "skipped"
                            ? "#b80"
                            : entry.status === "uploading"
                              ? "#07c"
                              : "#666",
                  }}
                >
                  {entry.status === "pending" && "En attente"}
                  {entry.status === "uploading" && "En cours…"}
                  {entry.status === "done" && "Créé"}
                  {entry.status === "error" && (entry.error || "Erreur")}
                  {entry.status === "skipped" && (entry.error || "Ignoré")}
                </span>
                {!uploading && (entry.status === "pending" || entry.status === "done" || entry.status === "error" || entry.status === "skipped") && (
                  <button
                    type="button"
                    onClick={() => removeEntry(i)}
                    style={{
                      padding: "2px 8px",
                      background: "transparent",
                      border: "1px solid #999",
                      borderRadius: 4,
                      cursor: "pointer",
                      fontSize: 12,
                    }}
                  >
                    Retirer
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={startImport}
        disabled={uploading || entries.filter((e) => e.status === "pending").length === 0}
        style={{
          padding: "10px 20px",
          background:
            entries.some((e) => e.status === "pending") && !uploading ? "#2276fc" : "#ccc",
          color: "#fff",
          border: "none",
          borderRadius: 4,
          cursor: entries.some((e) => e.status === "pending") && !uploading ? "pointer" : "not-allowed",
          fontWeight: 600,
        }}
      >
        {uploading ? "Import en cours…" : "Lancer l'import"}
      </button>

      {message && <p style={{ marginTop: 16, color: "#333" }}>{message}</p>}
    </div>
  );
}
