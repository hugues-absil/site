import { defineType, defineField } from "sanity";

export const imageWithLayout = defineType({
  name: "imageWithLayout",
  type: "object",
  title: "Image dispos.",
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
      options: {
        list: [
          { value: "fullWidth", title: "Pleine largeur" },
          { value: "centered", title: "Centré" },
          { value: "betweenText", title: "Entre le texte" },
          { value: "floatLeft", title: "Flottant gauche" },
          { value: "floatRight", title: "Flottant droite" },
        ],
      },
    }),
    defineField({
      name: "size",
      type: "string",
      title: "Taille",
      options: {
        list: [
          { value: "small", title: "Petit" },
          { value: "medium", title: "Moyen" },
          { value: "large", title: "Grand" },
        ],
      },
    }),
  ],
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
        title: caption || "Image dispos.",
        subtitle: layout ? layoutLabels[layout] || layout : undefined,
        media,
      };
    },
  },
});
