import { ChevronDown } from "lucide-react";
import type { NavSection } from "../../docs/types";
import { cn } from "../../lib/utils";
import { SidebarItem } from "./SidebarItem";

interface Props {
  section: NavSection;
  activeSlug: string;
  open: ReadonlySet<string>;
  onToggle: (id: string) => void;
  onNavigate: () => void;
}

export function SidebarSection({
  section,
  activeSlug,
  open,
  onToggle,
  onNavigate,
}: Props) {
  const expanded = open.has(section.id);
  const listId = `docs-section-${section.id}`;
  return (
    <div>
      <button
        type="button"
        onClick={() => onToggle(section.id)}
        aria-expanded={expanded}
        aria-controls={listId}
        className="flex w-full items-center justify-between rounded-md px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-ink-subtle transition-colors hover:text-ink focus-visible:outline-2 focus-visible:outline-accent-ink"
      >
        {section.title}
        <ChevronDown
          className={cn("h-3.5 w-3.5 transition-transform", !expanded && "-rotate-90")}
          aria-hidden
        />
      </button>
      {expanded && (
        <ul id={listId} className="mt-1 space-y-0.5">
          {section.items.map((item) => (
            <SidebarItem
              key={item.slug}
              item={item}
              activeSlug={activeSlug}
              open={open}
              onToggle={onToggle}
              onNavigate={onNavigate}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
