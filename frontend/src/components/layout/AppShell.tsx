import { Menu, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { cn } from "../../lib/utils";

/**
 * Coquille d'application : sidebar fixe à gauche, barre supérieure collée à son bord, corps centré.
 * Disposition reprise du projet 1Eat, avec les tokens FlowOps (violet, verre).
 *
 *  ┌──────────┬──────────────────────────────┐
 *  │ marque   │ fil d'Ariane        actions  │  ← barre supérieure (h-14, collante)
 *  ├──────────┼──────────────────────────────┤
 *  │ nav      │ corps (max 1360 px)          │
 *  └──────────┴──────────────────────────────┘
 *  Mobile : la sidebar devient un tiroir ; la barre porte burger + marque.
 */

export interface ShellNavItem {
  id: string;
  label: string;
  icon: ReactNode;
  active: boolean;
  onSelect: () => void;
}

export interface ShellNavSection {
  id: string;
  items: ShellNavItem[];
}

export interface AppShellProps {
  /** Bloc d'identité (logo + nom), déjà cliquable. */
  brand: ReactNode;
  sections: ShellNavSection[];
  /** Fil d'Ariane affiché dans la barre supérieure sur grand écran. */
  breadcrumb?: ReactNode;
  /** Zone de droite de la barre supérieure (profil, etc.). */
  actions?: ReactNode;
  labels: { navigation: string; openMenu: string; closeMenu: string };
  children: ReactNode;
}

function NavList({
  sections,
  onNavigate,
  navLabel,
}: {
  sections: ShellNavSection[];
  onNavigate?: () => void;
  navLabel: string;
}) {
  return (
    <nav aria-label={navLabel} className="space-y-3">
      {sections.map((section, index) => (
        <div
          key={section.id}
          className={cn("space-y-1", index > 0 && "border-t border-line pt-3")}
        >
          {section.items.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                item.onSelect();
                onNavigate?.();
              }}
              aria-current={item.active ? "page" : undefined}
              className={cn(
                "group flex h-10 w-full items-center gap-2.5 rounded-md px-2.5 text-left text-sm font-medium transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-accent-ink",
                item.active
                  ? "bg-accent/15 text-accent-ink"
                  : "text-ink-muted hover:bg-surface-2/70 hover:text-ink",
              )}
            >
              <span
                className={cn(
                  "shrink-0 transition-colors",
                  item.active
                    ? "text-accent-ink"
                    : "text-ink-subtle group-hover:text-accent-ink",
                )}
                aria-hidden="true"
              >
                {item.icon}
              </span>
              <span className="min-w-0 truncate">{item.label}</span>
            </button>
          ))}
        </div>
      ))}
    </nav>
  );
}

export function AppShell({
  brand,
  sections,
  breadcrumb,
  actions,
  labels,
  children,
}: AppShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const drawerRef = useRef<HTMLElement>(null);
  const close = useCallback(() => setMobileOpen(false), []);

  // Tiroir mobile : focus piégé, Échap pour fermer, focus rendu au bouton.
  useEffect(() => {
    if (!mobileOpen) return;
    const drawer = drawerRef.current;
    const trigger = menuButtonRef.current;
    if (!drawer) return;

    const focusable = () =>
      Array.from(
        drawer.querySelectorAll<HTMLElement>(
          'button:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])',
        ),
      );
    focusable()[0]?.focus();

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        close();
        return;
      }
      if (event.key !== "Tab") return;
      const items = focusable();
      if (items.length === 0) {
        event.preventDefault();
        drawer.focus();
        return;
      }
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      trigger?.focus();
    };
  }, [mobileOpen, close]);

  return (
    <div className="min-h-dvh overflow-x-clip font-sans text-ink">
      {/* Sidebar de bureau — 240 px, fixe, pleine hauteur */}
      <aside
        aria-label={labels.navigation}
        className="glass fixed inset-y-0 left-0 z-20 hidden w-60 flex-col border-r lg:flex"
      >
        <div className="border-b border-line p-3">{brand}</div>
        <div className="flex-1 overflow-y-auto p-2 [scrollbar-color:var(--color-line-strong)_transparent] [scrollbar-width:thin]">
          <NavList sections={sections} navLabel={labels.navigation} />
        </div>
      </aside>

      {/* Tiroir mobile */}
      {mobileOpen && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40 bg-scrim lg:hidden"
            onClick={close}
            aria-label={labels.closeMenu}
          />
          <aside
            ref={drawerRef}
            role="dialog"
            aria-modal="true"
            aria-label={labels.navigation}
            tabIndex={-1}
            className="glass-strong fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r lg:hidden"
          >
            <div className="flex items-center justify-between gap-2 border-b border-line p-3">
              <div className="min-w-0 flex-1">{brand}</div>
              <button
                type="button"
                onClick={close}
                aria-label={labels.closeMenu}
                className="rounded-md p-2 text-ink-muted transition-colors hover:bg-surface-2/70 hover:text-ink"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-3">
              <NavList
                sections={sections}
                onNavigate={close}
                navLabel={labels.navigation}
              />
            </div>
          </aside>
        </>
      )}

      <div className="min-w-0 lg:pl-60">
        {/* Barre supérieure — 56 px, collée au bord droit de la sidebar */}
        <header className="glass sticky top-0 z-30 flex h-14 items-center justify-between gap-3 border-b px-3 sm:px-4 lg:px-6">
          <div className="flex min-w-0 items-center gap-2.5">
            <button
              ref={menuButtonRef}
              type="button"
              onClick={() => setMobileOpen(true)}
              aria-label={labels.openMenu}
              aria-expanded={mobileOpen}
              className="rounded-md p-2 text-ink-muted transition-colors hover:bg-surface-2/70 hover:text-ink focus-visible:outline-2 focus-visible:outline-accent-ink lg:hidden"
            >
              <Menu className="h-5 w-5" aria-hidden="true" />
            </button>
            <div className="lg:hidden">{brand}</div>
            <div className="hidden min-w-0 lg:block">{breadcrumb}</div>
          </div>
          <div className="flex shrink-0 items-center gap-2">{actions}</div>
        </header>

        <main className="min-h-[calc(100dvh-3.5rem)] w-full px-4 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
          <div className="mx-auto w-full max-w-[1360px]">{children}</div>
        </main>
      </div>
    </div>
  );
}
