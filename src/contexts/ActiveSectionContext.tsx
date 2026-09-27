import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useLocation } from "react-router-dom";
import {
  bindActiveSectionListener,
  getHashFromLocation,
  normalizeSectionId,
} from "@/lib/sectionHash";

type ActiveSectionContextValue = {
  activeSectionId: string;
  setActiveSectionId: (id: string) => void;
};

const ActiveSectionContext = createContext<ActiveSectionContextValue | null>(null);

export function ActiveSectionProvider({ children }: { children: ReactNode }) {
  const location = useLocation();
  const [activeSectionId, setActiveSectionIdState] = useState(() => {
    if (typeof window === "undefined") return "hero";
    return getHashFromLocation() || "hero";
  });

  const setActiveSectionId = useCallback((id: string) => {
    const normalized = normalizeSectionId(id);
    if (!normalized) return;
    setActiveSectionIdState((prev) => (prev === normalized ? prev : normalized));
  }, []);

  useEffect(() => {
    bindActiveSectionListener(setActiveSectionId);
    return () => bindActiveSectionListener(null);
  }, [setActiveSectionId]);

  // Sync sur POP / deep-link / navigate (pas sur replaceState silencieux).
  useEffect(() => {
    if (location.pathname !== "/") return;
    const fromRr = normalizeSectionId(location.hash || "");
    const fromWindow = getHashFromLocation();
    const id = fromRr || fromWindow || "hero";
    setActiveSectionId(id);
  }, [location.pathname, location.hash, location.key, setActiveSectionId]);

  const value = useMemo(
    () => ({ activeSectionId, setActiveSectionId }),
    [activeSectionId, setActiveSectionId]
  );

  return (
    <ActiveSectionContext.Provider value={value}>{children}</ActiveSectionContext.Provider>
  );
}

export function useActiveSection(): ActiveSectionContextValue {
  const ctx = useContext(ActiveSectionContext);
  if (!ctx) {
    throw new Error("useActiveSection must be used within ActiveSectionProvider");
  }
  return ctx;
}
