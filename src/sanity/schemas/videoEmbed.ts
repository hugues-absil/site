import { defineType, defineField } from "sanity";

export const videoEmbed = defineType({
  name: "videoEmbed",
  type: "object",
  title: "Vidéo",
  description:
    "Collez une URL YouTube ou Vimeo pour afficher la vidéo au milieu du texte (cours, expos, écrits…). Pour une vidéo en bas de fiche ressource, utilisez plutôt le champ « URL vidéo » du document.",
  fields: [
    defineField({
      name: "url",
      type: "url",
      title: "URL YouTube ou Vimeo",
      description: "Collez le lien de la vidéo (page ou embed). Ex. https://www.youtube.com/watch?v=…",
      validation: (Rule) =>
        Rule.required().uri({
          scheme: ["http", "https"],
          allowRelative: false,
        }),
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
      initialValue: "betweenText",
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
