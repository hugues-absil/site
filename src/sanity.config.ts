import { defineConfig } from "sanity";
import { structureTool } from "sanity/structure";
import { visionTool } from "@sanity/vision";
import { EditIcon, ImageIcon, TrashIcon, UploadIcon } from "@sanity/icons";
import { schemaTypes } from "./sanity/schemas";
import { buildDeskStructure } from "./sanity/structure";
import { BulkDelete } from "./sanity/tools/BulkDelete";
import { OrphanMediaTool } from "./sanity/tools/OrphanMediaTool";
import { BulkEditPaintings } from "./sanity/tools/BulkEditPaintings";
import { BulkUploadPaintings } from "./sanity/tools/BulkUploadPaintings";
import { UnpublishAction } from "./sanity/actions/UnpublishAction";
import { PublishAction } from "./sanity/actions/PublishAction";
import { ChangeResourceSectionAction } from "./sanity/actions/ChangeResourceSectionAction";
import { MigrateExhibitionToSectionAction } from "./sanity/actions/MigrateExhibitionToSectionAction";
import { MigrateContenuAClasserToSectionAction } from "./sanity/actions/MigrateContenuAClasserToSectionAction";
import { MigratePressArticleToSectionAction } from "./sanity/actions/MigratePressArticleToSectionAction";
import { MigrateAdviceToSectionAction } from "./sanity/actions/MigrateAdviceToSectionAction";
import { DeleteThemeAndUnlinkAction } from "./sanity/actions/DeleteThemeAndUnlinkAction";
import { ReassignPaintingAction } from "./sanity/actions/ReassignPaintingAction";
import { isEditorProfile } from "./sanity/lib/resourceEditorProfile";

const projectId = import.meta.env.VITE_SANITY_PROJECT_ID ?? "";
const dataset = import.meta.env.VITE_SANITY_DATASET ?? "production";

export default defineConfig({
  name: "default",
  title: "Site Hugues",
  projectId,
  dataset,
  // S'adapte à GitHub Pages (base /site/) ou au dev local (base /)
  basePath: `${(import.meta.env.BASE_URL || "/").replace(/\/$/, "")}/studio`,
  plugins: [
    structureTool({
      structure: buildDeskStructure,
    }),
    visionTool(),
  ],
  schema: {
    types: schemaTypes,
    templates: (prev) => [
      ...prev.filter((t) => {
        const id = typeof t === "object" && t && "id" in t ? String((t as { id: string }).id) : "";
        return (
          id !== "resource-in-category" &&
          id !== "resourceCategory-child" &&
          id !== "resourceCategory-root"
        );
      }),
      {
        id: "resource-in-category",
        title: "Ressource dans une catégorie",
        schemaType: "resource",
        parameters: [
          { name: "categoryId", type: "string" },
          { name: "editorProfile", type: "string" },
        ],
        value: (params: { categoryId?: string; editorProfile?: string } = {}) => {
          const raw = typeof params?.categoryId === "string" ? params.categoryId : "";
          const categoryId = raw.replace(/^drafts\./, "").trim();
          const profile = isEditorProfile(params?.editorProfile) ? params.editorProfile : undefined;
          if (!categoryId) {
            return profile ? { editorProfile: profile } : {};
          }
          return {
            categoryRef: {
              _type: "reference" as const,
              _ref: categoryId,
            },
            ...(profile ? { editorProfile: profile } : {}),
          };
        },
      },
      {
        id: "resourceCategory-child",
        title: "Sous-catégorie",
        schemaType: "resourceCategory",
        parameters: [
          { name: "parentId", type: "string" },
          { name: "section", type: "string" },
          { name: "editorProfile", type: "string" },
        ],
        value: (
          params: {
            parentId?: string;
            section?: string;
            editorProfile?: string;
          } = {}
        ) => {
          const parentId = (params?.parentId ?? "").replace(/^drafts\./, "").trim();
          const profile = isEditorProfile(params?.editorProfile) ? params.editorProfile : undefined;
          return {
            ...(params?.section ? { section: params.section } : {}),
            ...(parentId
              ? { parent: { _type: "reference" as const, _ref: parentId } }
              : {}),
            ...(profile ? { editorProfile: profile } : {}),
          };
        },
      },
      {
        id: "resourceCategory-root",
        title: "Catégorie racine",
        schemaType: "resourceCategory",
        parameters: [{ name: "section", type: "string" }],
        value: (params: { section?: string } = {}) => ({
          ...(params?.section ? { section: params.section } : {}),
        }),
      },
    ],
  },
  document: {
    actions: (prev, { schemaType }) => {
      // Dépublier / Publier disponibles pour tous les types (brouillon vs publié)
      const genericActions = [UnpublishAction, PublishAction];
      const extra =
        schemaType === "resource"
          ? [ChangeResourceSectionAction]
          : schemaType === "exhibition"
            ? [MigrateExhibitionToSectionAction]
            : schemaType === "contenuAClasser"
              ? [MigrateContenuAClasserToSectionAction]
              : schemaType === "pressArticle"
                ? [MigratePressArticleToSectionAction]
                : schemaType === "advice"
                  ? [MigrateAdviceToSectionAction]
                  : schemaType === "theme"
                    ? [DeleteThemeAndUnlinkAction]
                    : schemaType === "painting"
                      ? [ReassignPaintingAction]
                      : [];
      return [...genericActions, ...extra, ...prev] as typeof prev;
    },
  },
  tools: [
    {
      name: "bulk-edit-paintings",
      title: "Édition en masse (tableaux)",
      icon: EditIcon,
      component: BulkEditPaintings,
    },
    {
      name: "bulk-upload-paintings",
      title: "Import tableaux (glisser-déposer)",
      icon: UploadIcon,
      component: BulkUploadPaintings,
    },
    {
      name: "bulk-delete",
      title: "Suppression en masse",
      icon: TrashIcon,
      component: BulkDelete,
    },
    {
      name: "orphan-media",
      title: "Médias orphelins",
      icon: ImageIcon,
      component: OrphanMediaTool,
    },
  ],
});
