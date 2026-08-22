import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import Image from "@/components/ui/Image";
import { Download, Quote, Play } from "lucide-react";
import type { PressArticle, PressQuote } from "@/lib/sanity/data";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import ExpandableText from "@/components/ui/ExpandableText";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { getVideoEmbedUrl, getPressVideoPosterUrl } from "@/lib/videoEmbed";

const INITIAL_DISPLAY_DESKTOP = 6;
const INITIAL_DISPLAY_MOBILE = 3;
const LOAD_MORE_STEP = 6;

interface PressProps {
  articles: PressArticle[];
  quotes: PressQuote[];
}

function formatDate(dateString: string | null | undefined) {
  if (!dateString?.trim()) return "—";
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
}

function PressArticleTitle({
  article,
  className,
}: {
  article: PressArticle;
  className?: string;
}) {
  const titleClass = `font-serif text-xl font-semibold mb-2 block ${className ?? ""}`;
  if (article.slug) {
    return (
      <Link to={`/presse/${article.slug}`} className={`${titleClass} hover:opacity-80 transition-opacity`}>
        {article.title}
      </Link>
    );
  }
  if (article.url) {
    return (
      <a
        href={article.url}
        target="_blank"
        rel="noopener noreferrer"
        className={`${titleClass} hover:opacity-80 transition-opacity`}
      >
        {article.title}
      </a>
    );
  }
  return <h3 className={titleClass}>{article.title}</h3>;
}

function PressArticleVideoCard({ article, embedUrl }: { article: PressArticle; embedUrl: string }) {
  const [playing, setPlaying] = useState(false);
  const posterUrl = getPressVideoPosterUrl(article.imageUrl ?? null, article.videoUrl ?? null);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
    >
      <Card className="overflow-hidden h-full flex flex-col transition-shadow hover:shadow-lg">
        <div className="relative aspect-video bg-gray-100 shrink-0">
          {!playing ? (
            <button
              type="button"
              onClick={() => setPlaying(true)}
              className="absolute inset-0 group flex items-center justify-center text-left w-full border-0 p-0 cursor-pointer bg-gray-100"
              aria-label="Lire la vidéo"
            >
              {posterUrl ? (
                <Image
                  src={posterUrl}
                  alt=""
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                />
              ) : null}
              <span className="absolute inset-0 flex items-center justify-center bg-black/25 group-hover:bg-black/35 transition-colors">
                <span className="rounded-full bg-black/70 p-4 group-hover:bg-black/85 transition-colors">
                  <Play className="w-10 h-10 text-white fill-white ml-1" aria-hidden />
                </span>
              </span>
            </button>
          ) : (
            <iframe
              src={embedUrl}
              className="absolute inset-0 w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              title={article.title}
            />
          )}
        </div>
        <div className="p-6 flex-1 flex flex-col">
          <PressArticleTitle article={article} />
          <p className="text-sm text-gray-medium mb-3">
            {article.publication} • {formatDate(article.date)}
          </p>
          {article.excerpt ? (
            <ExpandableText
              text={article.excerpt}
              maxLength={150}
              textClassName="text-sm text-foreground leading-relaxed"
            />
          ) : null}
        </div>
      </Card>
    </motion.div>
  );
}

export default function Press({ articles, quotes }: PressProps) {
  const isMobile = useMediaQuery("(max-width: 768px)");
  const initialDisplay = isMobile ? INITIAL_DISPLAY_MOBILE : INITIAL_DISPLAY_DESKTOP;
  const [displayCountQuotes, setDisplayCountQuotes] = useState(initialDisplay);
  const [displayCountArticles, setDisplayCountArticles] = useState(initialDisplay);

  useEffect(() => {
    if (isMobile) {
      setDisplayCountQuotes((c) => Math.min(c, INITIAL_DISPLAY_MOBILE));
      setDisplayCountArticles((c) => Math.min(c, INITIAL_DISPLAY_MOBILE));
    }
  }, [isMobile]);

  const displayedQuotes = quotes.slice(0, displayCountQuotes);
  const displayedArticles = articles.slice(0, displayCountArticles);
  const hasMoreQuotes = displayCountQuotes < quotes.length;
  const hasMoreArticles = displayCountArticles < articles.length;

  return (
    <section id="press" className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
      <div className="container mx-auto max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="font-serif text-4xl sm:text-5xl font-bold mb-4">Presse</h2>
          <p className="text-gray-medium max-w-2xl mx-auto mb-8">
            Articles, critiques et citations sur l'œuvre d'Hugues Absil
          </p>
          <a
            href="#"
            className="inline-flex items-center text-sm text-foreground hover:opacity-80 transition-opacity"
          >
            <Download className="w-4 h-4 mr-2" />
            Télécharger le dossier de presse (PDF)
          </a>
        </motion.div>

        {quotes.length > 0 && (
          <div className="mb-16">
            <h3 className="font-serif text-2xl font-semibold mb-8 text-center">Citations</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {displayedQuotes.map((quote) => (
                <motion.div
                  key={quote._id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5 }}
                >
                  <Card className="p-6 h-full">
                    <Quote className="w-8 h-8 text-gray-medium mb-4" />
                    <div className="mb-4">
                      <ExpandableText
                        text={quote.quote}
                        maxLength={150}
                        textClassName="text-foreground italic leading-relaxed"
                      />
                    </div>
                    <div className="text-sm">
                      <p className="font-semibold text-foreground">{quote.author}</p>
                      <p className="text-gray-medium">{quote.publication}</p>
                      <p className="text-gray-medium text-xs mt-1">{formatDate(quote.date)}</p>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
            {hasMoreQuotes && (
              <div className="text-center mt-8">
                <Button
                  variant="outline"
                  onClick={() => setDisplayCountQuotes((d) => d + LOAD_MORE_STEP)}
                >
                  Charger plus
                </Button>
              </div>
            )}
          </div>
        )}

        <div>
          <h3 className="font-serif text-2xl font-semibold mb-8 text-center">Articles</h3>
          {articles.length === 0 ? (
            <p className="text-center text-gray-medium py-8">Aucun article de presse pour le moment.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {displayedArticles.map((article) => {
                const embedUrl = article.videoUrl ? getVideoEmbedUrl(article.videoUrl) : null;
                if (embedUrl) {
                  return <PressArticleVideoCard key={article._id} article={article} embedUrl={embedUrl} />;
                }

                const cardContent = (
                  <Card className="overflow-hidden h-full transition-shadow group-hover:shadow-lg">
                    {article.imageUrl && (
                      <div className="relative aspect-video bg-gray-100">
                        <Image
                          src={article.imageUrl}
                          alt={article.title}
                          fill
                          className="object-cover"
                          sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        />
                      </div>
                    )}
                    <div className="p-6">
                      <h3 className="font-serif text-xl font-semibold mb-2">{article.title}</h3>
                      <p className="text-sm text-gray-medium mb-3">
                        {article.publication} • {formatDate(article.date)}
                      </p>
                      {article.excerpt ? (
                        <ExpandableText
                          text={article.excerpt}
                          maxLength={150}
                          textClassName="text-sm text-foreground leading-relaxed"
                        />
                      ) : null}
                    </div>
                  </Card>
                );
                const wrapperClass = "block h-full cursor-pointer group";
                return (
                  <motion.div
                    key={article._id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5 }}
                  >
                    {article.slug ? (
                      <Link to={`/presse/${article.slug}`} className={wrapperClass}>
                        {cardContent}
                      </Link>
                    ) : article.url ? (
                      <a href={article.url} target="_blank" rel="noopener noreferrer" className={wrapperClass}>
                        {cardContent}
                      </a>
                    ) : (
                      cardContent
                    )}
                  </motion.div>
                );
              })}
            </div>
          )}
          {articles.length > 0 && hasMoreArticles && (
            <div className="text-center mt-8">
              <Button
                variant="outline"
                onClick={() => setDisplayCountArticles((d) => d + LOAD_MORE_STEP)}
              >
                Charger plus
              </Button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
