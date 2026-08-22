export type PaintingStatus = "available" | "reserved" | "private_collection";

export type PaintingTechnique = "oil" | "pastel" | "charcoal" | "mixed";

export type PaintingTheme = "portrait" | "landscape" | "abstract" | "still_life" | "urban";

export interface PaintingSeries {
  _id: string;
  title: string;
  slug: string;
}

export interface Painting {
  id: string;
  title: string;
  year: number;
  /** Cote catalogue optionnelle (démo hors Sanity) */
  reference?: string;
  technique: PaintingTechnique;
  theme: PaintingTheme;
  status: PaintingStatus;
  imageUrl: string;
  imageWidth: number;
  imageHeight: number;
  description?: string;
  dimensions?: string;
  price?: number;
  series?: PaintingSeries;
  featured?: boolean;
}

export const paintings: Painting[] = [
  {
    id: "1",
    title: "Contemplation Nocturne",
    year: 2024,
    reference: "24T01",
    technique: "oil",
    theme: "portrait",
    status: "available",
    imageUrl: "https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=800&h=1200&fit=crop",
    imageWidth: 800,
    imageHeight: 1200,
    description: "Une œuvre qui explore la solitude et la réflexion intérieure.",
    dimensions: "100 x 120 cm",
    price: 8500,
    series: { _id: "series-personnages", title: "Personnages", slug: "personnages" },
    featured: true,
  },
  {
    id: "2",
    title: "Horizons Perdus",
    year: 2023,
    reference: "23T02",
    technique: "pastel",
    theme: "landscape",
    status: "available",
    imageUrl: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&h=800&fit=crop",
    imageWidth: 1200,
    imageHeight: 800,
    description: "Paysage onirique aux couleurs pastel.",
    dimensions: "80 x 100 cm",
    price: 6200,
    series: { _id: "series-paysage-orphique", title: "Paysage orphique", slug: "paysage-orphique" },
    featured: true,
  },
  {
    id: "3",
    title: "Métamorphose Urbaine",
    year: 2024,
    reference: "24D01",
    technique: "mixed",
    theme: "urban",
    status: "reserved",
    imageUrl: "https://images.unsplash.com/photo-1514565131-fce0801e5785?w=1000&h=1400&fit=crop",
    imageWidth: 1000,
    imageHeight: 1400,
    description: "Exploration de l'architecture moderne et de ses contrastes.",
    dimensions: "120 x 150 cm",
    series: { _id: "series-venise", title: "Venise", slug: "venise" },
  },
  {
    id: "4",
    title: "Nature Morte aux Fruits",
    year: 2023,
    technique: "oil",
    theme: "still_life",
    status: "available",
    imageUrl: "https://images.unsplash.com/photo-1518635017498-87f514b751ba?w=900&h=1100&fit=crop",
    imageWidth: 900,
    imageHeight: 1100,
    description: "Composition classique revisitée avec une palette contemporaine.",
    dimensions: "60 x 80 cm",
    price: 4500,
  },
  {
    id: "5",
    title: "Abstraction Émotionnelle",
    year: 2024,
    technique: "oil",
    theme: "abstract",
    status: "private_collection",
    imageUrl: "https://images.unsplash.com/photo-1549490349-864336224d51?w=1100&h=900&fit=crop",
    imageWidth: 1100,
    imageHeight: 900,
    description: "Expression libre des émotions à travers la couleur et le geste.",
    dimensions: "90 x 110 cm",
    series: { _id: "series-paysage-orphique", title: "Paysage orphique", slug: "paysage-orphique" },
  },
  {
    id: "6",
    title: "Portrait d'Inconnu",
    year: 2023,
    technique: "charcoal",
    theme: "portrait",
    status: "available",
    imageUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=1000&fit=crop",
    imageWidth: 800,
    imageHeight: 1000,
    description: "Étude au fusain d'une grande intensité expressive.",
    dimensions: "50 x 65 cm",
    price: 3200,
    series: { _id: "series-personnages", title: "Personnages", slug: "personnages" },
  },
  {
    id: "7",
    title: "Vallée des Lumières",
    year: 2024,
    technique: "pastel",
    theme: "landscape",
    status: "available",
    imageUrl: "https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=1200&h=700&fit=crop",
    imageWidth: 1200,
    imageHeight: 700,
    description: "Paysage bucolique aux lumières changeantes.",
    dimensions: "100 x 80 cm",
    price: 5800,
    series: { _id: "series-paysages", title: "Paysages", slug: "paysages" },
  },
  {
    id: "8",
    title: "Rythmes de la Ville",
    year: 2023,
    technique: "mixed",
    theme: "urban",
    status: "available",
    imageUrl: "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=1000&h=1200&fit=crop",
    imageWidth: 1000,
    imageHeight: 1200,
    description: "Capture du mouvement et de l'énergie urbaine.",
    dimensions: "110 x 130 cm",
    price: 7200,
    series: { _id: "series-venise", title: "Venise", slug: "venise" },
  },
];
