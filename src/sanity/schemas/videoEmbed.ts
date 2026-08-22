import { defineType, defineField } from "sanity";

export const videoEmbed = defineType({
  name: "videoEmbed",
  type: "object",
  title: "Vidéo",
  fields: [
    defineField({
      name: "url",
      type: "url",
      title: "URL d'embed (YouTube, Vimeo, etc.)",
    }),
    defineField({
      name: "title",
      type: "string",
      title: "Titre / Légende",
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
  ],
  preview: {
    select: { title: "title", url: "url" },
    prepare({ title, url }) {
      return {
        title: title || "Vidéo",
        subtitle: url || "Sans URL",
      };
    },
  },
});
