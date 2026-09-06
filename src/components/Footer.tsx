import { Instagram, Linkedin } from "lucide-react";
import { Link } from "react-router-dom";
import type { SiteSettings } from "@/lib/sanity/data";

interface FooterProps {
  siteSettings?: SiteSettings | null;
  showFilmsLink?: boolean;
  showJournalLink?: boolean;
}

const normalizeFooterSubtitle = (s: string | null | undefined): string => {
  const raw = s ?? "Artiste contemporain.";
  if (raw.includes("Peintre") || raw.includes("Explorateur de la lumière")) return "Artiste contemporain.";
  return raw;
};

export default function Footer({ siteSettings, showFilmsLink = false, showJournalLink = false }: FooterProps) {
  const siteName = siteSettings?.siteName ?? "Hugues Absil";
  const footerSubtitle = normalizeFooterSubtitle(siteSettings?.footerSubtitle);
  const footerNavTitle = siteSettings?.footerNavTitle ?? "Navigation";
  const footerSocialTitle = siteSettings?.footerSocialTitle ?? "Réseaux Sociaux";
  const instagramUrl = siteSettings?.instagramUrl ?? "https://instagram.com";
  const linkedinUrl = siteSettings?.linkedinUrl ?? "https://linkedin.com";

  return (
    <footer className="bg-background border-t border-gray-200 mt-20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="font-serif text-lg font-semibold mb-4">{siteName}</h3>
            <p className="text-sm text-gray-medium">
              {footerSubtitle}
            </p>
          </div>

          <div>
            <h3 className="font-serif text-lg font-semibold mb-4">{footerNavTitle}</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/#gallery" className="text-gray-medium hover:text-foreground transition-colors">
                  Galerie
                </Link>
              </li>
              <li>
                <Link to="/#exhibitions" className="text-gray-medium hover:text-foreground transition-colors">
                  Expositions
                </Link>
              </li>
              <li>
                <Link to="/#biography" className="text-gray-medium hover:text-foreground transition-colors">
                  Biographie
                </Link>
              </li>
              {showFilmsLink && (
                <li>
                  <Link to="/#films" className="text-gray-medium hover:text-foreground transition-colors">
                    Films
                  </Link>
                </li>
              )}
              <li>
                <Link to="/#press" className="text-gray-medium hover:text-foreground transition-colors">
                  Presse
                </Link>
              </li>
              <li>
                <Link to="/#performances" className="text-gray-medium hover:text-foreground transition-colors">
                  Performances
                </Link>
              </li>
              <li>
                <Link to="/#critiques" className="text-gray-medium hover:text-foreground transition-colors">
                  Critiques
                </Link>
              </li>
              <li>
                <Link to="/#enseignement" className="text-gray-medium hover:text-foreground transition-colors">
                  Enseignement
                </Link>
              </li>
              {showJournalLink && (
                <li>
                  <Link to="/#journal" className="text-gray-medium hover:text-foreground transition-colors">
                    Journal
                  </Link>
                </li>
              )}
              <li>
                <Link to="/#contact" className="text-gray-medium hover:text-foreground transition-colors">
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-serif text-lg font-semibold mb-4">{footerSocialTitle}</h3>
            <div className="flex space-x-4">
              <a
                href={instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-medium hover:text-foreground transition-colors"
                aria-label="Instagram"
              >
                <Instagram className="w-5 h-5" />
              </a>
              <a
                href={linkedinUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-medium hover:text-foreground transition-colors"
                aria-label="LinkedIn"
              >
                <Linkedin className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-gray-200 text-center text-sm text-gray-medium">
          <p>&copy; {new Date().getFullYear()} {siteName}. Tous droits réservés.</p>
        </div>
      </div>
    </footer>
  );
}
