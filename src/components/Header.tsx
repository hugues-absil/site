import { useState } from "react";
import { Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useLocation, useNavigate } from "react-router-dom";
import type { NavItem } from "@/lib/sanity/data";

interface HeaderProps {
  siteName?: string;
  navItems?: NavItem[];
}

export default function Header({ siteName = "Hugues Absil", navItems = [] }: HeaderProps) {
  const items = navItems.length > 0 ? navItems : [
    { label: "Accueil", href: "#hero" },
    { label: "Galerie", href: "#gallery" },
    { label: "Expositions", href: "#exhibitions" },
    { label: "Biographie", href: "#biography" },
    { label: "Presse", href: "#press" },
    { label: "Performances", href: "#performances" },
    { label: "Écrits", href: "#ecrits" },
    { label: "Enseignement", href: "#enseignement" },
    { label: "Journal", href: "#journal" },
    { label: "Contact", href: "#contact" },
  ];
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const handleNavClick = (href: string) => {
    if (!href.startsWith("/")) {
      const element = document.querySelector(href);
      if (element) {
        element.scrollIntoView({ behavior: "smooth" });
        // Fermer le menu après la fin du scroll smooth pour ne pas annuler le défilement (reflow du menu interrompt le scroll)
        setTimeout(() => setIsMenuOpen(false), 600);
        return;
      }
    }
    setIsMenuOpen(false);
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b border-gray-200">
      <nav className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <Link
            to="/"
            className="font-serif text-2xl font-bold text-foreground hover:opacity-80 transition-opacity"
            onClick={(e) => {
              if (location.pathname === "/") {
                e.preventDefault();
                handleNavClick("#hero");
              } else {
                e.preventDefault();
                navigate("/", { state: { scrollHomeHero: true } });
              }
            }}
          >
            {siteName}
          </Link>

          <div className="hidden lg:flex items-center space-x-3 xl:space-x-5">
            {items.map((item) => {
              const isAnchor = !item.href.startsWith("/");
              const to = isAnchor && location.pathname !== "/" ? `/${item.href}` : item.href;
              if (!isAnchor) {
                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    className="text-sm font-medium text-foreground hover:text-gray-medium transition-colors"
                  >
                    {item.label}
                  </Link>
                );
              }
              return (
                <Link
                  key={item.href}
                  to={to}
                  className="text-sm font-medium text-foreground hover:text-gray-medium transition-colors"
                  onClick={(e) => {
                    if (location.pathname === "/") {
                      e.preventDefault();
                      handleNavClick(item.href);
                    }
                  }}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>

          <button
            className="lg:hidden p-2"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle menu"
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="lg:hidden overflow-hidden"
            >
              <div className="py-4 space-y-2">
                {items.map((item) => {
                  if (!item.href.startsWith("#")) {
                    return (
                      <Link
                        key={item.href}
                        to={item.href}
                        onClick={() => {
                          setIsMenuOpen(false);
                        }}
                        className="block w-full text-left px-4 py-2 text-sm font-medium text-foreground hover:bg-gray-100 transition-colors"
                      >
                        {item.label}
                      </Link>
                    );
                  }
                  const to = location.pathname !== "/" ? `/${item.href}` : item.href;
                  return (
                    <Link
                      key={item.href}
                      to={to}
                      onClick={(e) => {
                        e.preventDefault();
                        handleNavClick(item.href);
                      }}
                      className="block w-full text-left px-4 py-2 text-sm font-medium text-foreground hover:bg-gray-100 transition-colors"
                    >
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>
    </header>
  );
}
