import { defineType, defineField, defineArrayMember } from "sanity";
import { blockContent } from "./blockContent";

export const biography = defineType({
  name: "biography",
  type: "document",
  title: "Biographie",
  fields: [
    defineField({
      name: "text",
      type: blockContent.name,
      title: "Texte",
    }),
    defineField({
      name: "portrait",
      type: "image",
      title: "Portrait",
      options: { hotspot: true },
    }),
    defineField({
      name: "birthYear",
      type: "number",
      title: "Année de naissance",
    }),
    defineField({
      name: "nationality",
      type: "string",
      title: "Nationalité",
    }),
    defineField({
      name: "education",
      type: "array",
      title: "Formation",
      of: [{ type: "string" }],
    }),
    defineField({
      name: "awards",
      type: "array",
      title: "Prix",
      of: [{ type: "string" }],
    }),
    defineField({
      name: "professionalActivities",
      type: "array",
      title: "Activités professionnelles",
      of: [{ type: "string" }],
    }),
    defineField({
      name: "gallery",
      type: "text",
      title: "Galerie",
    }),
    defineField({
      name: "diplomas",
      type: "array",
      title: "Diplômes",
      of: [
        defineArrayMember({
          type: "object",
          fields: [
            { name: "year", type: "number", title: "Année" },
            { name: "title", type: "string", title: "Titre" },
            { name: "institution", type: "string", title: "Établissement" },
            { name: "details", type: "string", title: "Détails" },
          ],
        }),
      ],
    }),
  ],
});
