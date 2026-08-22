import { createContext, useContext, useEffect, useState } from "react";
import { getSiteSettings } from "@/lib/sanity/data";
import type { SiteSettings } from "@/lib/sanity/data";

const SiteSettingsContext = createContext<SiteSettings | null>(null);

export function SiteSettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<SiteSettings | null>(null);

  useEffect(() => {
    getSiteSettings().then(setSettings);
  }, []);

  return (
    <SiteSettingsContext.Provider value={settings}>
      {children}
    </SiteSettingsContext.Provider>
  );
}

export function useSiteSettings(): SiteSettings | null {
  return useContext(SiteSettingsContext);
}
