import { defineType, defineField } from "sanity";
import { ImageWithLayoutPreview } from "../components/ImageWithLayoutPreview";

export const imageWithLayout = defineType({
  name: "imageWithLayout",
  type: "object",
  title: "Image",
  description:
    "Pour que le texte entoure l'image, choisissez « Flottant gauche » ou « Flottant droite » et une taille Petit ou Moyen.",
  fields: [
    defineField({
      name: "image",
      type: "image",
      title: "Image",
      options: { hotspot: true },
    }),
    defineField({
      name: "caption",
      type: "string",
      title: "Légende",
    }),
    defineField({
      name: "layout",
      type: "string",
      title: "Mise en page",
      description:
        "Flottant gauche/droite = texte autour de l'image. Pleine largeur / Centré / Entre le texte = image en bloc.",
      options: {
        list: [
          { value: "fullWidth", title: "Pleine largeur" },
          { value: "centered", title: "Centré" },
          { value: "betweenText", title: "Entre le texte" },
          { value: "floatLeft", title: "Flottant gauche (texte à droite)" },
          { value: "floatRight", title: "Flottant droite (texte à gauche)" },
        ],
        layout: "radio",
      },
      initialValue: "floatLeft",
    }),
    defineField({
      name: "size",
      type: "string",
      title: "Taille",
      description: "Ignorée si « Pleine largeur » est sélectionné.",
      options: {
        list: [
          { value: "small", title: "Petit" },
          { value: "medium", title: "Moyen" },
          { value: "large", title: "Grand" },
        ],
        layout: "radio",
      },
      initialValue: "medium",
    }),
  ],
  components: {
    preview: ImageWithLayoutPreview,
  },
  preview: {
    select: { caption: "caption", media: "image", layout: "layout" },
    prepare({ caption, media, layout }) {
      const layoutLabels: Record<string, string> = {
        fullWidth: "Pleine largeur",
        centered: "Centré",
        betweenText: "Entre le texte",
        floatLeft: "Flottant gauche",
        floatRight: "Flottant droite",
      };
      return {
        title: caption || "Image",
        subtitle: layout ? layoutLabels[layout] || layout : "Flottant gauche",
        media,
        layout: layout || "floatLeft",
      };
    },
  },
});
