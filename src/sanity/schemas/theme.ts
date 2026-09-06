import { defineType, defineField } from "sanity";

export const theme = defineType({
  name: "theme",
  type: "document",
  title: "Thème",
  fields: [
    defineField({
      name: "title",
      type: "string",
      title: "Titre",
    }),
    defineField({
      name: "slug",
      type: "slug",
      title: "Slug",
      options: { source: "title" },
      validation: (Rule) => Rule.required(),
    }),
  ],
});
