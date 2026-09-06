import { defineType, defineField } from "sanity";

export const pressQuote = defineType({
  name: "pressQuote",
  type: "document",
  title: "Citation presse",
  fields: [
    defineField({
      name: "quote",
      type: "text",
      title: "Citation",
    }),
    defineField({
      name: "author",
      type: "string",
      title: "Auteur",
    }),
    defineField({
      name: "publication",
      type: "string",
      title: "Publication",
    }),
    defineField({
      name: "date",
      type: "date",
      title: "Date",
    }),
  ],
});
