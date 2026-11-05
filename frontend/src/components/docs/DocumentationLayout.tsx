import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, Navigate, useLocation, useParams } from "react-router-dom";
import { getHeadings } from "../../docs/headings";
import { DOCS_CONFIG, NAVIGATION } from "../../docs/navigation";
import type { DocTab } from "../../docs/types";
import { getEntry, getNeighbours } from "../../docs/pages";
import { DocumentationContent } from "./DocumentationContent";
import { DocumentationHeader } from "./DocumentationHeader";
import { DocumentationSearch } from "./DocumentationSearch";
import { DocumentationSidebar } from "./DocumentationSidebar";
import { DocumentationTableOfContents } from "./DocumentationTableOfContents";
import { PageNavigation } from "./PageNavigation";

/** Section + parents d'une page : à déplier dans la sidebar. */
function ancestorsOf(slug: string): string[] {
  const entry = getEntry(slug);
  return entry
    ? [entry.section.id, ...entry.ancestors.map((a) => a.slug)]
    : [NAVIGATION[0].id];
}

export default function DocumentationLayout() {
  const { "*": splat } = useParams();
  const { hash } = useLocation();
  const slug = (splat ?? "").replace(/\/+$/, "");

  const [desktopOpen, setDesktopOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [open, setOpen] = useState<ReadonlySet<string>>(
    () => new Set(ancestorsOf(slug)),
  );

  const isMac =
    typeof navigator !== "undefined" && /mac/i.test(navigator.platform);

  const entry = getEntry(slug);
  const activeTab: DocTab = entry?.section.tab ?? "guides";
  const sections = useMemo(
    () => NAVIGATION.filter((s) => s.tab === activeTab),
    [activeTab],
  );
  const headings = useMemo(() => (entry ? getHeadings(entry.page) : []), [entry]);

  // Déplie la section (et le parent) de la page courante à chaque navigation.
  useEffect(() => {
    setOpen((prev) => new Set([...prev, ...ancestorsOf(slug)]));
  }, [slug]);

  // Ancre dans l'URL → défilement ; sinon retour en haut de page.
  useEffect(() => {
    if (hash) {
      document.getElementById(decodeURIComponent(hash.slice(1)))?.scrollIntoView();
    } else {
      window.scrollTo({ top: 0, behavior: "instant" });
    }
  }, [slug, hash]);

  // Raccourcis : Ctrl/⌘ K ou « / » pour la recherche, Échap pour le tiroir.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = document.activeElement;
      const typing =
        el instanceof HTMLInputElement ||
        el instanceof HTMLTextAreaElement ||
        (el instanceof HTMLElement && el.isContentEditable);
      if (e.key.toLowerCase() === "k" && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        setSearchOpen((o) => !o);
      } else if (e.key === "/" && !typing && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        setSearchOpen(true);
      } else if (e.key === "Escape") {
        setMobileOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const toggleOpen = useCallback((id: string) => {
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleSidebar = () => {
    if (window.matchMedia("(min-width: 1024px)").matches) {
      setDesktopOpen((o) => !o);
    } else {
      setMobileOpen((o) => !o);
    }
  };

  if (!slug) {
    return <Navigate to={`${DOCS_CONFIG.basePath}/${DOCS_CONFIG.homeSlug}`} replace />;
  }

  const { prev, next } = getNeighbours(slug);

  return (
    <div className="min-h-screen text-ink">
      <DocumentationHeader
        activeTab={activeTab}
        onToggleSidebar={toggleSidebar}
        sidebarOpen={desktopOpen || mobileOpen}
        onOpenSearch={() => setSearchOpen(true)}
        isMac={isMac}
      />

      {mobileOpen && (
        <div
          className="fixed inset-0 top-14 z-20 bg-black/50 lg:hidden"
          onClick={() => setMobileOpen(false)}
          aria-hidden
        />
      )}

      <div className="flex w-full">
        <DocumentationSidebar
          sections={sections}
          activeSlug={slug}
          open={open}
          onToggle={toggleOpen}
          desktopOpen={desktopOpen}
          mobileOpen={mobileOpen}
          onNavigate={() => setMobileOpen(false)}
        />

        <main className="min-w-0 flex-1 px-4 py-10 sm:px-8 lg:px-12">
          <div className="mx-auto max-w-3xl">
            {entry ? (
              <>
                <DocumentationContent entry={entry} />
                <PageNavigation prev={prev} next={next} />
              </>
            ) : (
              <div className="py-24 text-center">
                <h1 className="text-2xl font-semibold text-ink">Page not found</h1>
                <p className="mt-2 text-ink-muted">
                  “{slug}” does not exist in the documentation.
                </p>
                <Link
                  to={`${DOCS_CONFIG.basePath}/${DOCS_CONFIG.homeSlug}`}
                  className="mt-6 inline-block text-accent-ink hover:underline"
                >
                  Back to the introduction
                </Link>
              </div>
            )}
          </div>
        </main>

        <aside className="sticky top-14 hidden h-[calc(100dvh-3.5rem)] w-60 shrink-0 self-start overflow-y-auto py-10 pr-6 xl:block">
          <DocumentationTableOfContents headings={headings} pageKey={slug} />
        </aside>
      </div>

      {searchOpen && <DocumentationSearch onClose={() => setSearchOpen(false)} />}
    </div>
  );
}
