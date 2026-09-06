import { useEffect, useMemo, useState } from "react";
import type { Location } from "react-router-dom";
import {
  createBrowserRouter,
  RouterProvider,
  Outlet,
  ScrollRestoration,
  useLocation,
  useParams,
  Navigate,
} from "react-router-dom";
import { CRITIQUES_LABEL, CRITIQUES_URL_PREFIX, LEGACY_CRITIQUES_URL_PREFIX, normalizeNavItems } from "@/lib/resourceSection";
import { SiteSettingsProvider, useSiteSettings } from "@/contexts/SiteSettingsContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import HomePage from "@/pages/HomePage";
import JournalPostPage from "@/pages/JournalPostPage";
import PressArticlePage from "@/pages/PressArticlePage";
import ExhibitionPage from "@/pages/ExhibitionPage";
import ResourceCategoryPage from "@/pages/ResourceCategoryPage";
import ResourcePage from "@/pages/ResourcePage";
import StudioPage from "@/pages/StudioPage";
import NotFoundPage from "@/pages/NotFoundPage";

/** Inclure le hash pour ne pas fusionner `/` et `/#critiques` (sinon on restaure le dernier scroll « accueil » au mauvais endroit). */
function scrollRestorationKey(location: Location) {
  return location.pathname + location.search + (location.hash ?? "");
}

/** État posé par le clic sur le logo (retour accueil → hero). */
type LogoHomeLocationState = { scrollHomeHero?: boolean };

const DEFAULT_NAV_ITEMS = [
  { label: "Accueil", href: "#hero" },
  { label: "Galerie", href: "#gallery" },
  { label: "Expositions", href: "#exhibitions" },
  { label: "Biographie", href: "#biography" },
  { label: "Films", href: "#films" },
  { label: "Presse", href: "#press" },
  { label: "Performances", href: "#performances" },
  { label: CRITIQUES_LABEL, href: "#critiques" },
  { label: "Enseignement", href: "#enseignement" },
  { label: "Journal", href: "#journal" },
  { label: "Contact", href: "#contact" },
];

function Layout() {
  const siteSettings = useSiteSettings();
  const [hasFilms, setHasFilms] = useState(false);
  const [hasJournal, setHasJournal] = useState(false);
  const location = useLocation();

  useEffect(() => {
    import("@/lib/sanity/data").then(({ getFilms, getAdvicePosts }) => {
      getFilms().then((films) => setHasFilms(Array.isArray(films) && films.length > 0));
      getAdvicePosts().then((posts) => setHasJournal(Array.isArray(posts) && posts.length > 0));
    });
  }, []);

  const navItems = useMemo(() => {
    const base = normalizeNavItems(siteSettings?.navItems ?? DEFAULT_NAV_ITEMS);
    return base.filter((item) => {
      if (item.href === "#films" && !hasFilms) return false;
      if (item.href === "#journal" && !hasJournal) return false;
      return true;
    });
  }, [siteSettings?.navItems, hasFilms, hasJournal]);

  useEffect(() => {
    const state = location.state as LogoHomeLocationState | null;
    if (location.pathname !== "/" || !state?.scrollHomeHero) return;
    const hero = document.getElementById("hero");
    if (hero) {
      hero.scrollIntoView({ behavior: "smooth", block: "start" });
    } else {
      window.scrollTo(0, 0);
    }
  }, [location.pathname, location.state]);

  return (
    <div className="min-h-screen flex flex-col">
      <ScrollRestoration getKey={(loc) => scrollRestorationKey(loc)} />
      <Header
        siteName={siteSettings?.siteName ?? "Hugues Absil"}
        navItems={navItems}
      />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer siteSettings={siteSettings} showFilmsLink={hasFilms} showJournalLink={hasJournal} />
    </div>
  );
}

function RedirectEcritsToCritiques() {
  const { category, slug } = useParams();
  const path = slug
    ? `/${CRITIQUES_URL_PREFIX}/${category}/${slug}`
    : `/${CRITIQUES_URL_PREFIX}/${category}`;
  return <Navigate to={path} replace />;
}

const basename = import.meta.env.BASE_URL.replace(/\/$/, "") || undefined;

const router = createBrowserRouter(
  [
    { path: "studio", element: <StudioPage /> },
    { path: "studio/*", element: <StudioPage /> },
    {
      path: "/",
      element: <Layout />,
      children: [
        { index: true, element: <HomePage /> },
        { path: "journal/:slug", element: <JournalPostPage /> },
        { path: "presse/:slug", element: <PressArticlePage /> },
        { path: "expositions/:slug", element: <ExhibitionPage /> },
        { path: `${CRITIQUES_URL_PREFIX}/:category`, element: <ResourceCategoryPage /> },
        { path: `${CRITIQUES_URL_PREFIX}/:category/:slug`, element: <ResourcePage /> },
        { path: `${LEGACY_CRITIQUES_URL_PREFIX}/:category`, element: <RedirectEcritsToCritiques /> },
        { path: `${LEGACY_CRITIQUES_URL_PREFIX}/:category/:slug`, element: <RedirectEcritsToCritiques /> },
        { path: "enseignement/:category", element: <ResourceCategoryPage /> },
        { path: "enseignement/:category/:slug", element: <ResourcePage /> },
        { path: "*", element: <NotFoundPage /> },
      ],
    },
  ],
  basename ? { basename } : undefined
);

export default function App() {
  return (
    <SiteSettingsProvider>
      <RouterProvider router={router} />
    </SiteSettingsProvider>
  );
}
