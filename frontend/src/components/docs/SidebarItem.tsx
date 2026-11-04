import { ChevronRight } from "lucide-react";
import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { DOCS_CONFIG } from "../../docs/navigation";
import { getPage } from "../../docs/pages";
import type { NavItem } from "../../docs/types";
import { cn } from "../../lib/utils";

interface Props {
  item: NavItem;
  activeSlug: string;
  open: ReadonlySet<string>;
  onToggle: (id: string) => void;
  onNavigate: () => void;
  depth?: number;
}

export function SidebarItem({
  item,
  activeSlug,
  open,
  onToggle,
  onNavigate,
  depth = 0,
}: Props) {
  const page = getPage(item.slug);
  const linkRef = useRef<HTMLAnchorElement>(null);
  const active = item.slug === activeSlug;
  const expanded = open.has(item.slug);
  const hasChildren = !!item.children?.length;

  useEffect(() => {
    if (active) linkRef.current?.scrollIntoView({ block: "nearest" });
  }, [active]);

  if (!page) return null;

  return (
    <li>
      <div className="flex items-center">
        <Link
          ref={linkRef}
          to={`${DOCS_CONFIG.basePath}/${item.slug}`}
          onClick={onNavigate}
          aria-current={active ? "page" : undefined}
          className={cn(
            "flex-1 rounded-md py-1.5 pr-2 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-accent-ink",
            depth === 0 ? "pl-3" : "pl-3",
            active
              ? "bg-accent/15 font-medium text-accent-ink"
              : "text-ink-muted hover:bg-surface-2 hover:text-ink",
          )}
        >
          {page.navTitle ?? page.title}
        </Link>
        {hasChildren && (
          <button
            type="button"
            onClick={() => onToggle(item.slug)}
            aria-expanded={expanded}
            aria-label={`${expanded ? "Collapse" : "Expand"} ${page.title}`}
            className="ml-0.5 rounded p-1.5 text-ink-subtle hover:bg-surface-2 hover:text-ink focus-visible:outline-2 focus-visible:outline-accent-ink"
          >
            <ChevronRight
              className={cn("h-3.5 w-3.5 transition-transform", expanded && "rotate-90")}
              aria-hidden
            />
          </button>
        )}
      </div>
      {hasChildren && expanded && (
        <ul className="ml-3 mt-0.5 space-y-0.5 border-l border-line pl-2">
          {item.children!.map((child) => (
            <SidebarItem
              key={child.slug}
              item={child}
              activeSlug={activeSlug}
              open={open}
              onToggle={onToggle}
              onNavigate={onNavigate}
              depth={depth + 1}
            />
          ))}
        </ul>
      )}
    </li>
  );
}
