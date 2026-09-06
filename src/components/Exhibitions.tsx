import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Calendar, MapPin, ExternalLink, ChevronDown, ChevronUp } from "lucide-react";
import type { Exhibition } from "@/lib/sanity/data";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import ExpandableText from "@/components/ui/ExpandableText";
import Image from "@/components/ui/Image";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { hasMeaningfulPortableContent, portableTextPlainPreview } from "@/lib/utils";

const INITIAL_DISPLAY_DESKTOP = 6;
const INITIAL_DISPLAY_MOBILE = 3;
/** Archives souvent nombreuses : afficher plus d’entrées au départ pour éviter de « perdre » une expo (ex. 2023). */
const INITIAL_DISPLAY_PAST_DESKTOP = 36;
const INITIAL_DISPLAY_PAST_MOBILE = 12;
const LOAD_MORE_STEP = 6;
const statusLabels: Record<string, string> = {
  current: "En cours",
  upcoming: "À venir",
  past: "Archives",
};

interface ExhibitionsProps {
  exhibitions: Exhibition[];
}

function formatDateOrNull(dateString: string | null | undefined): string | null {
  if (dateString == null || dateString === "") return null;
  const date = new Date(dateString);
  return Number.isNaN(date.getTime())
    ? null
    : date.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
}

function formatDateRangeLabel(start?: string, end?: string): string | null {
  const a = formatDateOrNull(start);
  const b = formatDateOrNull(end);
  if (a && b) return `${a} – ${b}`;
  if (a) return a;
  if (b) return b;
  return null;
}

function ExhibitionCard({ exhibition }: { exhibition: Exhibition }) {
  const slug = exhibition.slug?.trim();
  const hasDetailPage = Boolean(slug);
  const description = exhibition.description?.trim() ?? "";
  const hasRichBody = Array.isArray(exhibition.body) && exhibition.body.length > 0;
  const rawUrl = exhibition.imageUrl;
  const hasImage = rawUrl != null && String(rawUrl).trim() !== "";

  const bodyTextPreview = hasMeaningfulPortableContent(exhibition.body)
    ? portableTextPlainPreview(exhibition.body, 420)
    : "";
  const cardExcerpt =
    description ||
    bodyTextPreview ||
    (hasDetailPage && hasRichBody ? "Article et images sur la page dédiée." : "");

  const locationLabel = [exhibition.venue, exhibition.city].filter(
    (x): x is string => x != null && String(x).trim() !== ""
  );
  const dateRangeLabel = formatDateRangeLabel(exhibition.dateStart, exhibition.dateEnd);

  const cardContent = (
    <Card className="p-0 flex flex-col overflow-hidden transition-shadow group-hover:shadow-lg border border-gray-100 w-full">
      {hasImage ? (
        <div className="relative flex w-full min-h-[7rem] aspect-[5/3] items-center justify-center bg-gray-100 shrink-0 overflow-hidden">
          <Image
            src={String(rawUrl).trim()}
            alt={exhibition.title}
            className="max-h-full max-w-full object-contain object-center transition-opacity duration-300 group-hover:opacity-95"
          />
        </div>
      ) : null}
      <div className="p-4 sm:p-5 flex flex-col gap-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="font-serif text-lg font-semibold leading-snug line-clamp-3 group-hover:text-gray-800 transition-colors">
              {exhibition.title}
            </h3>
            {locationLabel.length > 0 && (
              <div className="flex items-start gap-1 text-gray-medium text-xs mt-1">
                <MapPin className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                <span className="line-clamp-2">{locationLabel.join(", ")}</span>
              </div>
            )}
            {dateRangeLabel && (
              <div className="flex items-center gap-1 text-gray-medium text-xs mt-0.5">
                <Calendar className="w-3.5 h-3.5 shrink-0" />
                <span className="line-clamp-1">{dateRangeLabel}</span>
              </div>
            )}
          </div>
          <span className="px-2 py-0.5 text-[10px] sm:text-xs font-medium bg-gray-100 text-foreground rounded-full shrink-0 leading-tight">
            {statusLabels[exhibition.status] || exhibition.status}
          </span>
        </div>
        {cardExcerpt ? (
          hasDetailPage ? (
            <p className="text-xs sm:text-sm text-gray-medium leading-snug line-clamp-3">{cardExcerpt}</p>
          ) : (
            <ExpandableText
              text={cardExcerpt}
              maxLength={120}
              textClassName="text-xs sm:text-sm text-gray-medium leading-snug"
            />
          )
        ) : null}
        {hasDetailPage ? null : exhibition.externalLink ? (
          <a
            href={exhibition.externalLink}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center text-xs sm:text-sm text-foreground hover:opacity-80 transition-opacity pt-0.5"
            onClick={(e) => e.stopPropagation()}
          >
            En savoir plus <ExternalLink className="w-3.5 h-3.5 ml-1" />
          </a>
        ) : null}
      </div>
    </Card>
  );

  const wrapperClass = "block w-full cursor-pointer group";

  return (
    <motion.div
      className="w-full"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
    >
      {hasDetailPage ? (
        <Link to={`/expositions/${slug}`} className={wrapperClass}>
          {cardContent}
        </Link>
      ) : (
        cardContent
      )}
    </motion.div>
  );
}

/**
 * Même principe que la galerie : N colonnes, remplissage en quinconce (round-robin).
 * Chaque colonne empile ses cartes à hauteur variable → pas d’étirement à la hauteur de la ligne.
 */
function ExhibitionBucketsGrid({ items }: { items: Exhibition[] }) {
  const isSm = useMediaQuery("(min-width: 640px)");
  const isLg = useMediaQuery("(min-width: 1024px)");
  const columnCount = !isSm ? 1 : !isLg ? 2 : 3;

  const buckets = useMemo(() => {
    const n = columnCount;
    const b: Exhibition[][] = Array.from({ length: n }, () => []);
    items.forEach((e, i) => {
      b[i % n].push(e);
    });
    return b;
  }, [items, columnCount]);

  return (
    <div className="grid grid-cols-1 gap-4 sm:gap-5 sm:grid-cols-2 lg:grid-cols-3 items-start">
      {buckets.map((bucket, colIdx) => (
        <div key={colIdx} className="flex min-w-0 flex-col gap-4 sm:gap-5">
          {bucket.map((exhibition) => (
            <ExhibitionCard key={exhibition._id} exhibition={exhibition} />
          ))}
        </div>
      ))}
    </div>
  );
}

export default function Exhibitions({ exhibitions }: ExhibitionsProps) {
  const isMobile = useMediaQuery("(max-width: 768px)");
  const initialDisplay = isMobile ? INITIAL_DISPLAY_MOBILE : INITIAL_DISPLAY_DESKTOP;
  const initialPastDisplay = isMobile ? INITIAL_DISPLAY_PAST_MOBILE : INITIAL_DISPLAY_PAST_DESKTOP;
  const [displayCountCurrent, setDisplayCountCurrent] = useState(initialDisplay);
  const [displayCountPast, setDisplayCountPast] = useState(initialPastDisplay);
  const [isArchivesOpen, setIsArchivesOpen] = useState(true);

  useEffect(() => {
    if (isMobile) {
      setDisplayCountCurrent((c) => Math.min(c, INITIAL_DISPLAY_MOBILE));
      setDisplayCountPast((c) => Math.min(c, INITIAL_DISPLAY_PAST_MOBILE));
    }
  }, [isMobile]);

  const currentExhibitions = exhibitions.filter((e) => e.status === "current");
  const upcomingExhibitions = exhibitions.filter((e) => e.status === "upcoming");
  const pastExhibitions = exhibitions.filter((e) => e.status === "past");

  const currentAndUpcoming = [...currentExhibitions, ...upcomingExhibitions];
  const displayedCurrent = currentAndUpcoming.slice(0, displayCountCurrent);
  const displayedPast = pastExhibitions.slice(0, displayCountPast);
  const hasMoreCurrent = displayCountCurrent < currentAndUpcoming.length;
  const hasMorePast = displayCountPast < pastExhibitions.length;

  return (
    <section id="exhibitions" className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
      <div className="container mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="font-serif text-4xl sm:text-5xl font-bold mb-4">Expositions</h2>
          <p className="text-gray-medium max-w-2xl mx-auto">
            Découvrez les expositions en cours, à venir et passées
          </p>
        </motion.div>

        {(currentExhibitions.length > 0 || upcomingExhibitions.length > 0) && (
          <div className="mb-16">
            <h3 className="font-serif text-2xl font-semibold mb-8">En cours / À venir</h3>
            <ExhibitionBucketsGrid items={displayedCurrent} />
            {hasMoreCurrent && (
              <div className="text-center mt-8">
                <Button
                  variant="outline"
                  onClick={() => setDisplayCountCurrent((d) => d + LOAD_MORE_STEP)}
                >
                  Charger plus
                </Button>
              </div>
            )}
          </div>
        )}

        {pastExhibitions.length > 0 && (
          <div>
            <button
              type="button"
              onClick={() => setIsArchivesOpen((open) => !open)}
              className="flex items-center justify-between w-full font-serif text-2xl font-semibold mb-8 cursor-pointer text-left hover:opacity-80 transition-opacity"
            >
              <span>Expositions passées ({pastExhibitions.length})</span>
              {isArchivesOpen ? (
                <ChevronUp className="w-6 h-6 shrink-0" />
              ) : (
                <ChevronDown className="w-6 h-6 shrink-0" />
              )}
            </button>
            {isArchivesOpen && (
              <>
                <ExhibitionBucketsGrid items={displayedPast} />
                {hasMorePast && (
                  <div className="text-center mt-8">
                    <Button
                      variant="outline"
                      onClick={() => setDisplayCountPast((d) => d + LOAD_MORE_STEP)}
                    >
                      Charger plus
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
