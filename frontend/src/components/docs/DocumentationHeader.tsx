import { ExternalLink, Menu, PanelLeft, Search } from "lucide-react";
import { Link } from "react-router-dom";
import logo from "../../assets/flowops.svg";
import { DOCS_CONFIG, TAB_LABELS } from "../../docs/navigation";
import type { DocTab } from "../../docs/types";
import { cn } from "../../lib/utils";

interface Props {
  activeTab: DocTab;
  onToggleSidebar: () => void;
  sidebarOpen: boolean;
  onOpenSearch: () => void;
  isMac: boolean;
}

const ICON_BTN =
  "rounded-md p-2 text-ink-muted transition-colors hover:bg-surface-2 hover:text-ink focus-visible:outline-2 focus-visible:outline-accent-ink";

export function DocumentationHeader({
  activeTab,
  onToggleSidebar,
  sidebarOpen,
  onOpenSearch,
  isMac,
}: Props) {
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-canvas">
      <div className="flex h-14 items-center gap-2 px-3 sm:px-4">
        <button
          type="button"
          onClick={onToggleSidebar}
          aria-label="Toggle navigation"
          aria-expanded={sidebarOpen}
          aria-controls="docs-sidebar"
          className={ICON_BTN}
        >
          <Menu className="h-5 w-5 lg:hidden" aria-hidden />
          <PanelLeft className="hidden h-5 w-5 lg:block" aria-hidden />
        </button>

        <Link
          to={DOCS_CONFIG.basePath}
          className="flex items-center gap-2 rounded-md px-1 focus-visible:outline-2 focus-visible:outline-accent-ink"
        >
          <img src={logo} alt="" className="h-7 w-7" />
          <span className="text-sm font-semibold text-ink max-sm:hidden">
            {DOCS_CONFIG.name} <span className="font-normal text-ink-muted">Docs</span>
          </span>
          <span className="rounded-full border border-line-strong px-2 py-0.5 text-[11px] text-ink-muted">
            {DOCS_CONFIG.version}
          </span>
        </Link>

        <nav aria-label="Documentation sections" className="ml-2 flex items-center gap-1 max-md:hidden">
          {(["guides", "developers"] as const).map((tab) => (
            <Link
              key={tab}
              to={`${DOCS_CONFIG.basePath}/${tab === "guides" ? DOCS_CONFIG.homeSlug : DOCS_CONFIG.developerHomeSlug}`}
              aria-current={activeTab === tab ? "page" : undefined}
              className={cn(
                "rounded-md px-3 py-1.5 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-accent-ink",
                activeTab === tab
                  ? "bg-accent/15 font-medium text-accent-ink"
                  : "text-ink-muted hover:bg-surface-2 hover:text-ink",
              )}
            >
              {TAB_LABELS[tab]}
            </Link>
          ))}
        </nav>

        <div className="mx-auto flex w-full max-w-md justify-end sm:justify-center">
          <button
            type="button"
            onClick={onOpenSearch}
            aria-label="Search documentation"
            className="flex h-9 items-center gap-2 rounded-md border border-line-strong bg-surface px-3 text-sm text-ink-muted transition-colors hover:border-line-strong hover:text-ink focus-visible:outline-2 focus-visible:outline-accent-ink sm:w-full"
          >
            <Search className="h-4 w-4" aria-hidden />
            <span className="max-sm:hidden">Search documentation</span>
            <kbd className="ml-auto rounded border border-line-strong px-1.5 text-[10px] text-ink-subtle max-sm:hidden">
              {isMac ? "⌘K" : "Ctrl K"}
            </kbd>
          </button>
        </div>

        <nav className="flex items-center gap-1" aria-label="Resources">
          <a
            href={DOCS_CONFIG.repoUrl}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm text-ink-muted transition-colors hover:bg-surface-2 hover:text-ink focus-visible:outline-2 focus-visible:outline-accent-ink max-md:hidden"
          >
            GitHub <ExternalLink className="h-3.5 w-3.5" aria-hidden />
          </a>
          <Link
            to={DOCS_CONFIG.appUrl}
            className="rounded-md bg-accent px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-accent-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-ink"
          >
            Open app
          </Link>
        </nav>
      </div>
    </header>
  );
}
