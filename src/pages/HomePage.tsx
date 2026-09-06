import { useEffect, useLayoutEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { useSiteSettings } from "@/contexts/SiteSettingsContext";
import Hero from "@/components/Hero";
import Gallery from "@/components/Gallery";
import Exhibitions from "@/components/Exhibitions";
import Biography from "@/components/Biography";
import Films from "@/components/Films";
import Press from "@/components/Press";
import Performances from "@/components/Performances";
import Critiques from "@/components/Critiques";
import Enseignement from "@/components/Enseignement";
import Journal from "@/components/Journal";
import Contact from "@/components/Contact";
import { resolveHomeHashId } from "@/lib/resourceSection";
import {
  getPaintings,
  getExhibitions,
  getBiography,
  getFilms,
  getPressArticles,
  getPressQuotes,
  getPerformances,
  getAdvicePosts,
} from "@/lib/sanity/data";

/** Même contrat que dans App.tsx (clic logo → accueil). */
type LogoHomeLocationState = { scrollHomeHero?: boolean };

export default function HomePage() {
  const location = useLocation();
  const siteSettings = useSiteSettings();
  const [paintings, setPaintings] = useState<Awaited<ReturnType<typeof getPaintings>>>([]);
  const [exhibitions, setExhibitions] = useState<Awaited<ReturnType<typeof getExhibitions>>>([]);
  const [biography, setBiography] = useState<Awaited<ReturnType<typeof getBiography>>>(null);
  const [films, setFilms] = useState<Awaited<ReturnType<typeof getFilms>>>([]);
  const [pressArticles, setPressArticles] = useState<Awaited<ReturnType<typeof getPressArticles>>>([]);
  const [pressQuotes, setPressQuotes] = useState<Awaited<ReturnType<typeof getPressQuotes>>>([]);
  const [performances, setPerformances] = useState<Awaited<ReturnType<typeof getPerformances>>>([]);
  const [posts, setPosts] = useState<Awaited<ReturnType<typeof getAdvicePosts>>>([]);
  const [loading, setLoading] = useState(true);
  const scrollHomeFromLogo = useMemo(
    () => Boolean((location.state as LogoHomeLocationState | null)?.scrollHomeHero),
    [location.state]
  );

  useEffect(() => {
    Promise.all([
      getPaintings(),
      getExhibitions(),
      getBiography(),
      getFilms(),
      getPressArticles(),
      getPressQuotes(),
      getPerformances(),
      getAdvicePosts(),
    ]).then(([p, e, b, f, pa, pq, perfs, journalPosts]) => {
      setPaintings(p);
      setExhibitions(e);
      setBiography(b);
      setFilms(f);
      setPressArticles(pa);
      setPressQuotes(pq);
      setPerformances(perfs);
      setPosts(journalPosts);
      setLoading(false);
    });
  }, []);

  useLayoutEffect(() => {
    if (loading || !location.hash) return;
    const raw = location.hash.slice(1);
    if (!raw) return;
    let id: string;
    try {
      id = decodeURIComponent(raw);
    } catch {
      id = raw;
    }
    id = resolveHomeHashId(id);
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "auto" });
    }
  }, [loading, location.hash]);

  useLayoutEffect(() => {
    if (loading || !scrollHomeFromLogo) return;
    const hero = document.getElementById("hero");
    hero?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [loading, scrollHomeFromLogo]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-medium">Chargement...</p>
      </div>
    );
  }

  return (
    <>
      <Hero
        heroImageUrl={siteSettings?.heroImageUrl ?? undefined}
        heroImageAlt={siteSettings?.heroImageAlt ?? undefined}
        heroImages={siteSettings?.heroImages ?? undefined}
        heroTitle={siteSettings?.heroTitle ?? undefined}
        heroSubtitle={siteSettings?.heroSubtitle ?? undefined}
        heroCtaLabel={siteSettings?.heroCtaLabel ?? undefined}
      />
      <Gallery
        paintings={paintings}
        galleryUseFeatured={siteSettings?.galleryUseFeatured ?? false}
      />
      <Exhibitions exhibitions={exhibitions} />
      <Biography biography={biography} />
      {films.length > 0 && <Films films={films} />}
      <Press articles={pressArticles} quotes={pressQuotes} />
      <Performances performances={performances} />
      <Critiques />
      <Enseignement />
      {posts.length > 0 && <Journal posts={posts} />}
      <Contact siteSettings={siteSettings ?? undefined} />
    </>
  );
}
