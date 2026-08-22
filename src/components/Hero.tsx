import { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "@/components/ui/Image";
import Button from "@/components/ui/Button";
import { ChevronDown } from "lucide-react";
import type { HeroImageItem } from "@/lib/sanity/data";

const HERO_IMAGE_FALLBACK_URL =
  "https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=1920&h=1080&fit=crop";
const HERO_IMAGE_FALLBACK_ALT = "Œuvre de Hugues Absil";
const SLIDE_INTERVAL_MS = 8000;

interface HeroProps {
  heroImageUrl?: string | null;
  heroImageAlt?: string | null;
  heroImages?: HeroImageItem[] | null;
  heroTitle?: string | null;
  heroSubtitle?: string | null;
  heroCtaLabel?: string | null;
}

const normalizeHeroSubtitle = (s: string | null | undefined): string =>
  !s || s.includes("Peintre") ? "Artiste Contemporain" : s;

export default function Hero({
  heroImageUrl,
  heroImageAlt,
  heroImages,
  heroTitle = "Hugues Absil",
  heroSubtitle = "Artiste Contemporain",
  heroCtaLabel = "Découvrir la Galerie",
}: HeroProps) {
  const displaySubtitle = normalizeHeroSubtitle(heroSubtitle);
  const scrollToGallery = () => {
    const element = document.querySelector("#gallery");
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  const slides = useMemo(() => {
    const list = Array.isArray(heroImages) && heroImages.length > 0
      ? heroImages.filter((item) => item?.url)
      : null;
    if (list && list.length > 0) return list;
    const singleUrl = heroImageUrl || HERO_IMAGE_FALLBACK_URL;
    const singleAlt = heroImageAlt ?? HERO_IMAGE_FALLBACK_ALT;
    return [{ url: singleUrl, alt: singleAlt }];
  }, [heroImages, heroImageUrl, heroImageAlt]);

  const [currentIndex, setCurrentIndex] = useState(() =>
    slides.length > 1 ? Math.floor(Math.random() * slides.length) : 0
  );

  useEffect(() => {
    if (slides.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentIndex((i) => (i + 1) % slides.length);
    }, SLIDE_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [slides.length]);

  const currentSlide = slides[currentIndex] ?? slides[0];
  const alt = currentSlide?.alt ?? HERO_IMAGE_FALLBACK_ALT;

  return (
    <section id="hero" className="relative h-screen flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1 }}
              className="absolute inset-0"
            >
              <Image
                src={currentSlide.url}
                alt={alt}
                fill
                className="object-cover"
              />
            </motion.div>
          </AnimatePresence>
        </div>
        <div className="absolute inset-0 bg-black/30" />
      </div>

      <div className="relative z-10 text-center px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <h1 className="font-serif text-5xl sm:text-6xl lg:text-7xl font-bold text-white mb-6">
            {heroTitle}
          </h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-xl sm:text-2xl text-white/90 mb-8 font-light"
          >
            {displaySubtitle}
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            <Button
              variant="outline"
              className="bg-white/10 backdrop-blur-sm border-white text-white hover:bg-white hover:text-foreground"
              onClick={scrollToGallery}
            >
              {heroCtaLabel}
            </Button>
          </motion.div>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 1 }}
        className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-10"
      >
        <motion.button
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          onClick={scrollToGallery}
          className="text-white/80 hover:text-white transition-colors"
          aria-label="Scroll down"
        >
          <ChevronDown className="w-8 h-8" />
        </motion.button>
      </motion.div>
    </section>
  );
}
