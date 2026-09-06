import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent, type Ref, type RefObject } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import { Search, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { getSearchIndex } from "@/lib/sanity/data";
import {
  groupSearchResults,
  isSearchQueryReady,
  searchIndex,
  type SearchIndexItem,
} from "@/lib/search";
import { cn } from "@/lib/utils";

export function SiteSearchTrigger({
  expanded,
  onOpen,
  className,
  buttonRef,
}: {
  expanded: boolean;
  onOpen: (el: HTMLButtonElement) => void;
  className?: string;
  buttonRef?: Ref<HTMLButtonElement>;
}) {
  return (
    <button
      type="button"
      ref={buttonRef}
      className={cn(
        "inline-flex items-center justify-center p-2 min-w-11 min-h-11 text-foreground hover:text-gray-medium transition-colors",
        className
      )}
      aria-label="Rechercher sur le site"
      aria-expanded={expanded}
      aria-haspopup="dialog"
      onClick={(event) => onOpen(event.currentTarget)}
    >
      <Search className="w-5 h-5" aria-hidden />
    </button>
  );
}

export default function SiteSearch({
  open,
  onClose,
  triggerRef,
}: {
  open: boolean;
  onClose: () => void;
  triggerRef: RefObject<HTMLElement | null>;
}) {
  const titleId = useId();
  const inputId = useId();
  const listId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const wasOpenRef = useRef(false);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [items, setItems] = useState<SearchIndexItem[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedQuery(query), 200);
    return () => window.clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    getSearchIndex().then((result) => {
      if (cancelled) return;
      if (!result.ok) {
        setItems([]);
        setFailed(true);
        return;
      }
      setItems(result.items);
      setFailed(false);
    });
    return () => {
      cancelled = true;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const focusTimer = window.setTimeout(() => inputRef.current?.focus(), 30);
    return () => {
      document.body.style.overflow = previous;
      window.clearTimeout(focusTimer);
    };
  }, [open]);

  const status = failed ? "error" : items == null ? "loading" : "ready";
  const queryReady = isSearchQueryReady(debouncedQuery);
  const results = useMemo(
    () => (status === "ready" && items && queryReady ? searchIndex(items, debouncedQuery) : []),
    [status, queryReady, items, debouncedQuery]
  );
  const groups = useMemo(() => groupSearchResults(results), [results]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key !== "Tab" || !panelRef.current) return;
      const focusable = getFocusable(panelRef.current);
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;
      if (event.shiftKey && active === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, results.length, status]);

  useEffect(() => {
    if (open) {
      wasOpenRef.current = true;
      return;
    }
    if (!wasOpenRef.current) return;
    wasOpenRef.current = false;
    triggerRef.current?.focus();
  }, [open, triggerRef]);

  const safeActiveIndex = results.length === 0 ? 0 : Math.min(activeIndex, results.length - 1);
  const activeId = results[safeActiveIndex] ? `${listId}-${results[safeActiveIndex].id}` : undefined;

  const onInputKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (results.length === 0) return;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((index) => (index + 1) % results.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((index) => (index - 1 + results.length) % results.length);
    } else if (event.key === "Enter") {
      const target = results[safeActiveIndex];
      if (!target) return;
      event.preventDefault();
      const link = document.getElementById(`${listId}-${target.id}`);
      if (link instanceof HTMLAnchorElement) {
        link.click();
      }
    }
  };

  if (typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[60] flex items-stretch justify-center lg:items-start lg:pt-[12vh] lg:px-4 lg:pb-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            aria-label="Fermer la recherche"
            onClick={onClose}
          />
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className="relative flex h-dvh w-full flex-col bg-white shadow-2xl lg:h-auto lg:max-h-[80vh] lg:max-w-xl lg:rounded-xl"
            style={{
              paddingTop: "max(0.75rem, env(safe-area-inset-top))",
              paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))",
            }}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.18 }}
          >
            <div className="flex items-center gap-2 border-b border-gray-200 px-4 pb-3">
              <h2 id={titleId} className="sr-only">
                Rechercher sur le site
              </h2>
              <label htmlFor={inputId} className="sr-only">
                Rechercher sur le site
              </label>
              <div className="relative min-w-0 flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" aria-hidden />
                <input
                  ref={inputRef}
                  id={inputId}
                  type="search"
                  value={query}
                  onChange={(event) => {
                    setQuery(event.target.value);
                    setActiveIndex(0);
                  }}
                  onKeyDown={onInputKeyDown}
                  placeholder="Rechercher sur le site…"
                  className="w-full rounded-lg border border-gray-200 bg-white py-3 pl-11 pr-4 text-foreground placeholder:text-gray-400 shadow-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-gray-900"
                  aria-autocomplete="list"
                  aria-controls={listId}
                  aria-activedescendant={activeId}
                />
              </div>
              <button
                type="button"
                onClick={onClose}
                className="inline-flex min-h-11 min-w-11 items-center justify-center text-foreground hover:text-gray-medium"
                aria-label="Fermer"
              >
                <X className="h-5 w-5" aria-hidden />
              </button>
            </div>

            <div id={listId} role="listbox" aria-label="Résultats de recherche" className="min-h-0 flex-1 overflow-y-auto px-3 py-3">
              {status === "loading" && (
                <p className="px-2 py-6 text-center text-sm text-gray-medium">Chargement…</p>
              )}
              {status === "error" && (
                <p className="px-2 py-6 text-center text-sm text-gray-medium">
                  Recherche indisponible pour le moment.
                </p>
              )}
              {status === "ready" && !queryReady && (
                <p className="px-2 py-6 text-center text-sm text-gray-medium">
                  Saisissez au moins 2 caractères.
                </p>
              )}
              {status === "ready" && queryReady && results.length === 0 && (
                <p className="px-2 py-6 text-center text-sm text-gray-medium">
                  Aucun résultat pour « {debouncedQuery.trim()} ».
                </p>
              )}
              {status === "ready" &&
                groups.map((group) => (
                  <section key={group.group} className="mb-4 last:mb-0">
                    <h3 className="px-2 pb-1 text-xs font-semibold uppercase tracking-wide text-gray-medium">
                      {group.label}
                    </h3>
                    <ul className="space-y-1">
                      {group.items.map((item) => {
                        const index = results.findIndex((row) => row.id === item.id);
                        const isActive = index === safeActiveIndex;
                        return (
                          <li key={item.id}>
                            <Link
                              id={`${listId}-${item.id}`}
                              role="option"
                              aria-selected={isActive}
                              to={item.href}
                              onClick={onClose}
                              onMouseEnter={() => setActiveIndex(index)}
                              className={cn(
                                "flex items-center gap-3 rounded-lg px-2 py-2 transition-colors",
                                isActive ? "bg-gray-100" : "hover:bg-gray-50"
                              )}
                            >
                              {item.imageUrl ? (
                                <img
                                  src={item.imageUrl}
                                  alt=""
                                  className="hidden h-12 w-12 shrink-0 rounded object-cover sm:block"
                                />
                              ) : null}
                              <span className="min-w-0 flex-1">
                                <span className="block font-serif text-base text-foreground">{item.title}</span>
                                {item.meta ? (
                                  <span className="mt-0.5 block text-sm text-gray-medium">{item.meta}</span>
                                ) : item.excerpt ? (
                                  <span className="mt-0.5 block truncate text-sm text-gray-medium">{item.excerpt}</span>
                                ) : null}
                              </span>
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  </section>
                ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}

function getFocusable(root: HTMLElement): HTMLElement[] {
  const nodes = root.querySelectorAll<HTMLElement>(
    'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
  );
  return Array.from(nodes).filter((node) => !node.hasAttribute("disabled") && node.tabIndex !== -1);
}
