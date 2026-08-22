import { defineType, defineField } from "sanity";

export const performance = defineType({
  name: "performance",
  type: "document",
  title: "Performance",
  fields: [
    defineField({
      name: "title",
      type: "string",
      title: "Titre",
      description: "Titre optionnel de la vidéo (ex. nom de l'événement, lieu)",
    }),
    defineField({
      name: "url",
      type: "url",
      title: "URL YouTube",
      description: "URL de la vidéo YouTube (partagée ou embed)",
      validation: (Rule) =>
        Rule.uri({
          scheme: ["http", "https"],
          allowRelative: false,
        }),
    }),
    defineField({
      name: "order",
      type: "number",
      title: "Ordre d'affichage",
      description: "Plus le nombre est petit, plus la vidéo apparaît en premier",
      initialValue: 0,
    }),
  ],
  orderings: [
    {
      title: "Ordre d'affichage",
      name: "orderAsc",
      by: [{ field: "order", direction: "asc" }],
    },
  ],
  preview: {
    select: { title: "title", url: "url" },
    prepare({ title, url }: { title?: string; url?: string }) {
      const label = title || "Sans titre";
      const id = url ? extractYoutubeId(url) : null;
      return {
        title: label,
        subtitle: id ? `YouTube: ${id}` : url || "—",
      };
    },
  },
});

function extractYoutubeId(url: string): string | null {
  const match =
    url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&?/]+)/) ?? null;
  return match ? match[1] : null;
}
