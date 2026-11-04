import type { NavSection } from "../../docs/types";
import { cn } from "../../lib/utils";
import { SidebarSection } from "./SidebarSection";

interface Props {
  sections: NavSection[];
  activeSlug: string;
  open: ReadonlySet<string>;
  onToggle: (id: string) => void;
  /** Visible sur desktop (≥ lg). */
  desktopOpen: boolean;
  /** Tiroir ouvert sur mobile / tablette (< lg). */
  mobileOpen: boolean;
  onNavigate: () => void;
}

export function DocumentationSidebar({
  sections,
  activeSlug,
  open,
  onToggle,
  desktopOpen,
  mobileOpen,
  onNavigate,
}: Props) {
  return (
    <aside
      id="docs-sidebar"
      aria-label="Documentation navigation"
      className={cn(
        "w-72 shrink-0 overflow-y-auto overscroll-contain border-r border-line bg-surface px-3 py-6",
        "[scrollbar-color:var(--color-line-strong)_transparent] [scrollbar-width:thin]",
        // < lg : tiroir
        "max-lg:fixed max-lg:bottom-0 max-lg:left-0 max-lg:top-14 max-lg:z-30 max-lg:transition-transform",
        !mobileOpen && "max-lg:invisible max-lg:-translate-x-full",
        // ≥ lg : colonne collante, masquable
        "lg:sticky lg:top-14 lg:h-[calc(100dvh-3.5rem)] lg:self-start",
        !desktopOpen && "lg:hidden",
      )}
    >
      <nav className="space-y-5 pb-8">
        {sections.map((section) => (
          <SidebarSection
            key={section.id}
            section={section}
            activeSlug={activeSlug}
            open={open}
            onToggle={onToggle}
            onNavigate={onNavigate}
          />
        ))}
      </nav>
    </aside>
  );
}
