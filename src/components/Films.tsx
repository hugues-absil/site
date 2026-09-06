import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "@/components/ui/Image";
import { ChevronDown, ChevronUp, ExternalLink } from "lucide-react";
import type { Film } from "@/lib/sanity/data";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import ExpandableText from "@/components/ui/ExpandableText";
import PortableText from "@/lib/sanity/portableText";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { getVideoEmbedUrl } from "@/lib/videoEmbed";

const INITIAL_DISPLAY_DESKTOP = 6;
const INITIAL_DISPLAY_MOBILE = 3;
const LOAD_MORE_STEP = 6;

const statusLabels: Record<string, string> = {
  inProgress: "En cours",
  postProduction: "En post-production",
  released: "Sorti",
};

function hasArticle(article: unknown): boolean {
  return Array.isArray(article) && article.length > 0;
}

function FilmCard({ film }: { film: Film }) {
  const [articleOpen, setArticleOpen] = useState(false);
  const embedUrl = film.videoUrl ? getVideoEmbedUrl(film.videoUrl) : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
    >
      <Card className="overflow-hidden flex flex-col h-full">
        {film.posterImageUrl ? (
          <div className="relative aspect-video bg-gray-100">
            <Image
              src={film.posterImageUrl}
              alt={film.title}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
            />
            {film.status && (
              <span className="absolute top-3 right-3 px-3 py-1 text-xs font-medium bg-black/60 text-white rounded-full">
                {statusLabels[film.status] || film.status}
              </span>
            )}
          </div>
        ) : null}
        <div className="p-6 flex-1 flex flex-col">
          {!film.posterImageUrl && film.status && (
            <span className="inline-block self-start mb-3 px-3 py-1 text-xs font-medium bg-black/60 text-white rounded-full">
              {statusLabels[film.status] || film.status}
            </span>
          )}
          <h3 className="font-serif text-xl font-semibold mb-2">{film.title}</h3>
          {(film.director || film.year) && (
            <p className="text-sm text-gray-medium mb-2">
              {film.director && (
                <>
                  {film.directorUrl ? (
                    <a
                      href={film.directorUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-foreground hover:underline"
                    >
                      {film.director}
                    </a>
                  ) : (
                    film.director
                  )}
                </>
              )}
              {film.director && film.year && " · "}
              {film.year}
              {film.duration && ` · ${film.duration}`}
            </p>
          )}
          {film.description ? (
            <div className="mb-4 flex-1 min-h-0">
              <ExpandableText
                text={film.description}
                maxLength={150}
                textClassName="text-sm text-gray-medium leading-relaxed"
              />
            </div>
          ) : null}
          {embedUrl && (
            <div className="relative aspect-video rounded overflow-hidden bg-gray-100 mb-4">
              <iframe
                src={embedUrl}
                className="absolute inset-0 w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                title={film.title}
              />
            </div>
          )}
          {film.videoUrl && !embedUrl && (
            <a
              href={film.videoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center text-sm text-foreground hover:opacity-80 transition-opacity mb-4"
            >
              Voir le film <ExternalLink className="w-4 h-4 ml-1" />
            </a>
          )}
          {hasArticle(film.article) && (
            <div className="border-t border-gray-200 pt-4">
              <button
                type="button"
                onClick={() => setArticleOpen((o) => !o)}
                className="flex items-center justify-between w-full text-left text-sm font-medium text-foreground hover:opacity-80"
                aria-expanded={articleOpen}
              >
                En savoir plus
                {articleOpen ? (
                  <ChevronUp className="w-4 h-4 shrink-0" />
                ) : (
                  <ChevronDown className="w-4 h-4 shrink-0" />
                )}
              </button>
              <AnimatePresence initial={false}>
                {articleOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="pt-4">
                      <PortableText content={film.article} className="text-sm" />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      </Card>
    </motion.div>
  );
}

interface FilmsProps {
  films: Film[];
}

export default function Films({ films }: FilmsProps) {
  const isMobile = useMediaQuery("(max-width: 768px)");
  const initialDisplay = isMobile ? INITIAL_DISPLAY_MOBILE : INITIAL_DISPLAY_DESKTOP;
  const [displayCount, setDisplayCount] = useState(initialDisplay);

  useEffect(() => {
    if (isMobile) setDisplayCount((c) => Math.min(c, INITIAL_DISPLAY_MOBILE));
  }, [isMobile]);

  if (!films || films.length === 0) return null;

  const displayedFilms = films.slice(0, displayCount);
  const hasMore = displayCount < films.length;

  return (
    <section id="films" className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
      <div className="container mx-auto max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="font-serif text-4xl sm:text-5xl font-bold mb-4">
            {films.length === 1 ? "Le film" : "Films"}
          </h2>
          <p className="text-gray-medium max-w-2xl mx-auto">
            {films.length === 1
              ? "Un film sur l'artiste, sa vision et sa manière de peindre"
              : "Films sur l'artiste, sa vision et sa manière de peindre"}
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayedFilms.map((film) => (
            <FilmCard key={film._id} film={film} />
          ))}
        </div>
        {hasMore && (
          <div className="text-center mt-8">
            <Button variant="outline" onClick={() => setDisplayCount((d) => d + LOAD_MORE_STEP)}>
              Charger plus
            </Button>
          </div>
        )}
      </div>
    </section>
  );
}
