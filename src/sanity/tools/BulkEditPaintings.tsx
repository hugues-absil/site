import { useState, useEffect, useCallback } from "react";
import { useClient } from "sanity";
import type { SanityDocument } from "@sanity/client";
import groq from "groq";
import { RESOURCE_CATEGORIES, type ResourceCategoryValue } from "../constants/resourceCategories";

const PAINTINGS_QUERY = groq`*[_type == "painting"] | order(year desc, title asc) {
  _id,
  title,
  year,
  reference,
  description,
  "imageAssetRef": image.asset._ref,
  "theme": theme->{ _id, title },
  "imageUrl": image.asset->url,
  "slug": slug.current
}`;

const TECHNIQUES_QUERY = groq`*[_type == "technique"] | order(title asc) { _id, title, "slug": slug.current }`;
const THEMES_QUERY = groq`*[_type == "theme"] | order(title asc) { _id, title, "slug": slug.current }`;
const STATUSES_QUERY = groq`*[_type == "paintingStatus"] | order(title asc) { _id, title, "slug": slug.current }`;
const SERIES_QUERY = groq`*[_type == "series"] | order(title asc) { _id, title, "slug": slug.current }`;

type ReassignDestination = "exhibition" | "pressArticle" | "resource";

function slugify(text: string): string {
  return String(text)
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9]+/gi, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();
}

type PaintingDoc = SanityDocument & {
  title?: string;
  year?: number;
  reference?: string;
  description?: string;
  imageAssetRef?: string;
  theme?: { _id: string; title?: string } | null;
  imageUrl?: string;
  slug?: string;
};

type RefOption = { _id: string; title: string; slug?: string };

export function BulkEditPaintings() {
  const client = useClient({ apiVersion: "2024-01-01" });
  const [paintings, setPaintings] = useState<PaintingDoc[]>([]);
  const [techniques, setTechniques] = useState<RefOption[]>([]);
  const [themes, setThemes] = useState<RefOption[]>([]);
  const [statuses, setStatuses] = useState<RefOption[]>([]);
  const [series, setSeries] = useState<RefOption[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [filterThemeId, setFilterThemeId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [reassigning, setReassigning] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [reassignDestination, setReassignDestination] = useState<ReassignDestination>("exhibition");
  const [reassignCategory, setReassignCategory] = useState<ResourceCategoryValue>("oeil-expo");
  const [reassignDeleteAfter, setReassignDeleteAfter] = useState(true);

  const [form, setForm] = useState({
    techniqueId: "",
    themeId: "",
    statusId: "",
    seriesId: "",
    year: "",
    referenceAction: "" as "" | "set" | "clear",
    reference: "",
    dimensions: "",
    gallery: "",
    featured: "",
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [p, t, th, s, ser] = await Promise.all([
        client.fetch<PaintingDoc[]>(PAINTINGS_QUERY),
        client.fetch<RefOption[]>(TECHNIQUES_QUERY),
        client.fetch<RefOption[]>(THEMES_QUERY),
        client.fetch<RefOption[]>(STATUSES_QUERY),
        client.fetch<RefOption[]>(SERIES_QUERY),
      ]);
      setPaintings(p || []);
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
    if (selected.size === filteredPaintings.length) setSelected(new Set());
    else setSelected(new Set(filteredPaintings.map((p) => p._id)));
  };

  const filteredPaintings = filterThemeId
    ? paintings.filter((p) => p.theme?._id === filterThemeId)
    : paintings;

  const apply = async () => {
    if (selected.size === 0) {
      setMessage("Sélectionnez au moins un tableau.");
      return;
    }
    if (form.referenceAction === "set" && form.reference.trim() === "") {
      setMessage("Indiquez une référence ou choisissez une autre option pour la référence.");
      return;
    }
    const patch: Record<string, unknown> = {};
    if (form.techniqueId) patch.technique = { _type: "reference", _ref: form.techniqueId };
    if (form.themeId && form.themeId !== "__none__") patch.theme = { _type: "reference", _ref: form.themeId };
    if (form.statusId) patch.status = { _type: "reference", _ref: form.statusId };
    if (form.seriesId) patch.series = { _type: "reference", _ref: form.seriesId };
    if (form.year) {
      const y = parseInt(form.year, 10);
      if (!isNaN(y)) patch.year = y;
    }
    const unsetReference = form.referenceAction === "clear";
    if (form.referenceAction === "set" && form.reference.trim() !== "") {
      patch.reference = form.reference.trim();
    }
    if (form.dimensions !== undefined) patch.dimensions = form.dimensions;
    if (form.gallery === "true") patch.gallery = true;
    if (form.gallery === "false") patch.gallery = false;
    if (form.featured === "true") patch.featured = true;
    if (form.featured === "false") patch.featured = false;

    const unsetTheme = form.themeId === "__none__";
    if (Object.keys(patch).length === 0 && !unsetTheme && !unsetReference) {
      setMessage("Renseignez au moins un champ à appliquer.");
      return;
    }

    setApplying(true);
    setMessage(null);
    let ok = 0;
    let err = 0;
    for (const id of selected) {
      try {
        let p = client.patch(id);
        if (unsetTheme) p = p.unset(["theme"]);
        if (unsetReference) p = p.unset(["reference"]);
        if (Object.keys(patch).length > 0) p = p.set(patch);
        await p.commit();
        ok++;
      } catch (e) {
        err++;
        console.error(id, e);
      }
    }
    setApplying(false);
    setMessage(`Appliqué à ${ok} tableau(x).${err ? ` ${err} erreur(s).` : ""}`);
    if (ok) setSelected(new Set());
  };

  const deleteSelection = async () => {
    if (selected.size === 0) {
      setMessage("Sélectionnez au moins un tableau.");
      return;
    }
    const ok = window.confirm(
      `Supprimer définitivement ${selected.size} tableau(x) ? Cette action est irréversible.`
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
        ? `${deleted} tableau(x) supprimé(s).${err ? ` ${err} erreur(s).` : ""}`
        : "Aucun tableau supprimé."
    );
    if (deleted) {
      setSelected(new Set());
      load();
    }
  };

  const reassignSelection = async () => {
    if (selected.size === 0) {
      setMessage("Sélectionnez au moins un tableau.");
      return;
    }
    const list = filteredPaintings.filter((p) => selected.has(p._id));
    const withoutImage = list.filter((p) => !p.imageAssetRef);
    if (withoutImage.length > 0) {
      setMessage(`${withoutImage.length} tableau(x) sans image : réaffectation impossible.`);
      return;
    }
    const ok = window.confirm(
      `Réaffecter ${selected.size} tableau(x) vers ${reassignDestination === "exhibition" ? "Exposition" : reassignDestination === "pressArticle" ? "Article de presse" : "Ressource"} ?${reassignDeleteAfter ? " Les tableaux seront supprimés après création du document cible." : ""}`
    );
    if (!ok) return;

    setReassigning(true);
    setMessage(null);
    let created = 0;
    let err = 0;
    for (const p of list) {
      if (!p.imageAssetRef) continue;
      try {
        const title = p.title || "Sans titre";
        const description = (p.description ?? "").slice(0, 500) || undefined;
        const imageRef = {
          _type: "image" as const,
          asset: { _type: "reference" as const, _ref: p.imageAssetRef },
        };

        if (reassignDestination === "exhibition") {
          await client.create({
            _type: "exhibition",
            title,
            description,
            image: imageRef,
          });
        } else if (reassignDestination === "pressArticle") {
          const baseSlug = slugify(title) || "article-" + Date.now();
          const existing = await client.fetch<string | null>(
            `*[_type == "pressArticle" && slug.current == $slug][0]._id`,
            { slug: baseSlug }
          );
          const slug = existing ? `${baseSlug}-${Date.now()}` : baseSlug;
          await client.create({
            _type: "pressArticle",
            title,
            excerpt: description,
            image: imageRef,
            slug: { _type: "slug", current: slug },
          });
        } else {
          const baseSlug = slugify(title) || "ressource-" + Date.now();
          const existing = await client.fetch<string | null>(
            `*[_type == "resource" && slug.current == $slug][0]._id`,
            { slug: baseSlug }
          );
          const slug = existing ? `${baseSlug}-${Date.now()}` : baseSlug;
          await client.create({
            _type: "resource",
            title,
            slug: { _type: "slug", current: slug },
            category: reassignCategory,
            excerpt: description ?? "",
            coverImage: imageRef,
          });
        }
        created++;
        if (reassignDeleteAfter) {
          const publishedId = p._id.startsWith("drafts.") ? p._id.slice(7) : p._id;
          await client.delete(publishedId);
        }
      } catch (e) {
        err++;
        console.error(p._id, e);
      }
    }
    setReassigning(false);
    setMessage(
      created
        ? `Réaffecté : ${created} document(s) créé(s).${err ? ` ${err} erreur(s).` : ""}`
        : "Aucune réaffectation."
    );
    if (created) {
      setSelected(new Set());
      load();
    }
  };

  if (loading) {
    return (
      <div style={{ padding: 24 }}>
        <p>Chargement des tableaux…</p>
      </div>
    );
  }

  return (
    <div style={{ padding: 24, maxWidth: 900 }}>
      <h1 style={{ fontSize: 20, marginBottom: 16 }}>Édition en masse des tableaux</h1>
      <p style={{ marginBottom: 16, color: "#666" }}>
        Cochez les tableaux à modifier. Renseignez les champs puis « Appliquer ». Utilisez le filtre par thème pour ne voir que les tableaux d’un thème (ex. avant de supprimer un thème, filtrez par ce thème, retirez-le en masse, puis supprimez le thème).
      </p>

      <div style={{ marginBottom: 16 }}>
        <label style={{ display: "block", marginBottom: 4, fontWeight: 600 }}>Filtrer par thème</label>
        <select
          value={filterThemeId}
          onChange={(e) => setFilterThemeId(e.target.value)}
          style={{ padding: 8, minWidth: 220 }}
        >
          <option value="">Tous les tableaux</option>
          {themes.map((t) => (
            <option key={t._id} value={t._id}>
              {t.title} ({paintings.filter((p) => p.theme?._id === t._id).length})
            </option>
          ))}
        </select>
      </div>

      <div style={{ marginBottom: 24 }}>
        <label style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
          <input
            type="checkbox"
            checked={filteredPaintings.length > 0 && selected.size === filteredPaintings.length}
            onChange={toggleAll}
          />
          <span>Tout sélectionner ({filteredPaintings.length} tableau(x) affiché(s))</span>
        </label>
        <div style={{ maxHeight: 320, overflowY: "auto", border: "1px solid #ccc", borderRadius: 4, padding: 8 }}>
          {filteredPaintings.length === 0 ? (
            <p style={{ color: "#666", margin: 0 }}>
              {filterThemeId ? "Aucun tableau avec ce thème." : "Aucun tableau."}
            </p>
          ) : (
          filteredPaintings.map((p) => (
            <label
              key={p._id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "6px 0",
                borderBottom: "1px solid #eee",
              }}
            >
              <input
                type="checkbox"
                checked={selected.has(p._id)}
                onChange={() => toggle(p._id)}
              />
              {p.imageUrl && (
                <img
                  src={p.imageUrl + "?w=60&h=60&fit=crop"}
                  alt=""
                  width={40}
                  height={40}
                  style={{ objectFit: "cover", borderRadius: 4 }}
                />
              )}
              <span>{p.title ?? "Sans titre"}</span>
              {p.year != null && <span style={{ color: "#666" }}>({p.year})</span>}
              {p.theme?.title && (
                <span style={{ fontSize: 12, color: "#888", marginLeft: "auto" }}>{p.theme.title}</span>
              )}
            </label>
          ))
          )}
        </div>
        <p style={{ marginTop: 8, fontSize: 14, color: "#666" }}>
          {selected.size} tableau(x) sélectionné(s)
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>
        <div>
          <label style={{ display: "block", marginBottom: 4, fontWeight: 600 }}>Technique</label>
          <select
            value={form.techniqueId}
            onChange={(e) => setForm((f) => ({ ...f, techniqueId: e.target.value }))}
            style={{ width: "100%", padding: 8 }}
          >
            <option value="">— ne pas modifier —</option>
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
            <option value="">— ne pas modifier —</option>
            <option value="__none__">— retirer le thème —</option>
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
            <option value="">— ne pas modifier —</option>
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
            <option value="">— ne pas modifier —</option>
            {series.map((s) => (
              <option key={s._id} value={s._id}>{s.title}</option>
            ))}
          </select>
        </div>
        <div>
          <label style={{ display: "block", marginBottom: 4, fontWeight: 600 }}>Année</label>
          <input
            type="number"
            value={form.year}
            onChange={(e) => setForm((f) => ({ ...f, year: e.target.value }))}
            placeholder="Ne pas modifier"
            style={{ width: "100%", padding: 8 }}
          />
        </div>
        <div style={{ gridColumn: "1 / -1" }}>
          <label style={{ display: "block", marginBottom: 4, fontWeight: 600 }}>Référence (catalogue)</label>
          <select
            value={form.referenceAction}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                referenceAction: e.target.value as "" | "set" | "clear",
              }))
            }
            style={{ width: "100%", padding: 8, marginBottom: 8 }}
          >
            <option value="">— ne pas modifier —</option>
            <option value="set">Définir pour la sélection (champ ci-dessous)</option>
            <option value="clear">Vider la référence pour la sélection</option>
          </select>
          {form.referenceAction === "set" && (
            <input
              type="text"
              value={form.reference}
              onChange={(e) => setForm((f) => ({ ...f, reference: e.target.value }))}
              placeholder="ex. 24T05, 24CE03"
              style={{ width: "100%", padding: 8 }}
            />
          )}
        </div>
        <div>
          <label style={{ display: "block", marginBottom: 4, fontWeight: 600 }}>Dimensions</label>
          <input
            type="text"
            value={form.dimensions}
            onChange={(e) => setForm((f) => ({ ...f, dimensions: e.target.value }))}
            placeholder="ex. 100 x 120 cm"
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
            <option value="">— ne pas modifier —</option>
            <option value="true">Oui</option>
            <option value="false">Non</option>
          </select>
        </div>
        <div>
          <label style={{ display: "block", marginBottom: 4, fontWeight: 600 }}>À la une</label>
          <select
            value={form.featured}
            onChange={(e) => setForm((f) => ({ ...f, featured: e.target.value }))}
            style={{ width: "100%", padding: 8 }}
          >
            <option value="">— ne pas modifier —</option>
            <option value="true">Oui</option>
            <option value="false">Non</option>
          </select>
        </div>
      </div>

      <div style={{ marginBottom: 24, padding: 16, border: "1px solid #ccc", borderRadius: 4, background: "#f9f9f9" }}>
        <h2 style={{ fontSize: 16, marginBottom: 12, fontWeight: 600 }}>Réaffecter la sélection</h2>
        <p style={{ fontSize: 14, color: "#666", marginBottom: 12 }}>
          Crée un document Exposition, Article de presse ou Ressource pour chaque tableau coché (même image et métadonnées), puis optionnellement supprime les tableaux.
        </p>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", marginBottom: 12 }}>
          <span style={{ fontWeight: 600 }}>Destination :</span>
          <button
            type="button"
            onClick={() => setReassignDestination("exhibition")}
            style={{
              padding: "6px 12px",
              border: "1px solid #999",
              borderRadius: 4,
              background: reassignDestination === "exhibition" ? "#2276fc" : "#fff",
              color: reassignDestination === "exhibition" ? "#fff" : "#333",
              cursor: "pointer",
            }}
          >
            Exposition
          </button>
          <button
            type="button"
            onClick={() => setReassignDestination("pressArticle")}
            style={{
              padding: "6px 12px",
              border: "1px solid #999",
              borderRadius: 4,
              background: reassignDestination === "pressArticle" ? "#2276fc" : "#fff",
              color: reassignDestination === "pressArticle" ? "#fff" : "#333",
              cursor: "pointer",
            }}
          >
            Article de presse
          </button>
          <button
            type="button"
            onClick={() => setReassignDestination("resource")}
            style={{
              padding: "6px 12px",
              border: "1px solid #999",
              borderRadius: 4,
              background: reassignDestination === "resource" ? "#2276fc" : "#fff",
              color: reassignDestination === "resource" ? "#fff" : "#333",
              cursor: "pointer",
            }}
          >
            Ressource
          </button>
        </div>
        {reassignDestination === "resource" && (
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", marginBottom: 12 }}>
            <span style={{ fontWeight: 600 }}>Section :</span>
            {RESOURCE_CATEGORIES.map(({ value, label }) => (
              <button
                key={value}
                type="button"
                onClick={() => setReassignCategory(value)}
                style={{
                  padding: "4px 10px",
                  border: "1px solid #999",
                  borderRadius: 4,
                  background: reassignCategory === value ? "#2276fc" : "#fff",
                  color: reassignCategory === value ? "#fff" : "#333",
                  cursor: "pointer",
                  fontSize: 13,
                }}
              >
                {label}
              </button>
            ))}
          </div>
        )}
        <label style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
          <input
            type="checkbox"
            checked={reassignDeleteAfter}
            onChange={(e) => setReassignDeleteAfter(e.target.checked)}
            disabled={reassigning}
          />
          <span>Supprimer les tableaux après migration</span>
        </label>
        <button
          type="button"
          onClick={reassignSelection}
          disabled={reassigning || applying || deleting || selected.size === 0}
          style={{
            padding: "8px 16px",
            background: selected.size > 0 && !reassigning ? "#0d9488" : "#ccc",
            color: "#fff",
            border: "none",
            borderRadius: 4,
            cursor: selected.size > 0 && !reassigning ? "pointer" : "not-allowed",
            fontWeight: 600,
          }}
        >
          {reassigning ? "Réaffectation…" : `Réaffecter ${selected.size} tableau(x)`}
        </button>
      </div>

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
        <button
          type="button"
          onClick={apply}
          disabled={applying || deleting || reassigning || selected.size === 0}
          style={{
            padding: "10px 20px",
            background: selected.size > 0 && !deleting ? "#2276fc" : "#ccc",
            color: "#fff",
            border: "none",
            borderRadius: 4,
            cursor: selected.size > 0 && !deleting ? "pointer" : "not-allowed",
            fontWeight: 600,
          }}
        >
          {applying ? "Application…" : `Appliquer à ${selected.size} tableau(x)`}
        </button>
        <button
          type="button"
          onClick={deleteSelection}
          disabled={applying || deleting || reassigning || selected.size === 0}
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
