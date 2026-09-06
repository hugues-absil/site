import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import type { Performance } from "@/lib/sanity/data";
import { useMediaQuery } from "@/hooks/useMediaQuery";

const INITIAL_DISPLAY_DESKTOP = 6;
const INITIAL_DISPLAY_MOBILE = 3;
const LOAD_MORE_STEP = 6;

function youtubeToEmbedUrl(url: string): string {
  const match = url.match(
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&?/]+)/
  );
  if (match) return `https://www.youtube.com/embed/${match[1]}`;
  return url;
}

interface PerformancesProps {
  performances: Performance[];
}

export default function Performances({ performances }: PerformancesProps) {
  const isMobile = useMediaQuery("(max-width: 768px)");
  const initialDisplay = isMobile ? INITIAL_DISPLAY_MOBILE : INITIAL_DISPLAY_DESKTOP;
  const [displayCount, setDisplayCount] = useState(initialDisplay);

  useEffect(() => {
    if (isMobile) setDisplayCount((c) => Math.min(c, INITIAL_DISPLAY_MOBILE));
  }, [isMobile]);

  const displayedPerformances = performances.slice(0, displayCount);
  const hasMore = displayCount < performances.length;

  return (
    <section id="performances" className="py-20 px-4 sm:px-6 lg:px-8">
      <div className="container mx-auto max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="font-serif text-4xl sm:text-5xl font-bold mb-4">Performances</h2>
          <p className="text-gray-medium max-w-2xl mx-auto">
            Vidéos de performances artistiques
          </p>
        </motion.div>

        {performances.length === 0 ? (
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center text-gray-medium"
          >
            Aucune vidéo pour le moment.
          </motion.p>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {displayedPerformances.map((perf) => (
                <motion.div
                  key={perf._id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5 }}
                >
                  <Card className="overflow-hidden h-full flex flex-col">
                    <div className="relative aspect-video bg-gray-100">
                      <iframe
                        src={youtubeToEmbedUrl(perf.url)}
                        className="absolute inset-0 w-full h-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        title={perf.title ?? "Vidéo performance"}
                      />
                    </div>
                    {perf.title && (
                      <div className="p-4">
                        <h3 className="font-serif text-lg font-semibold">{perf.title}</h3>
                      </div>
                    )}
                  </Card>
                </motion.div>
              ))}
            </div>
            {hasMore && (
              <div className="text-center mt-8">
                <Button
                  variant="outline"
                  onClick={() => setDisplayCount((d) => d + LOAD_MORE_STEP)}
                >
                  Charger plus
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}
