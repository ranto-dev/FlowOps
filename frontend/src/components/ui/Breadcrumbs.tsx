import React from "react";
import { ChevronRight } from "lucide-react";
import { cn } from "../../lib/utils";

export interface Crumb {
  label: string;
  onClick?: () => void;
}

export const Breadcrumbs: React.FC<{ items: Crumb[] }> = ({ items }) => (
  <nav aria-label="Breadcrumb" className="flex items-center gap-1.5">
    {items.map((item, index) => {
      const isLast = index === items.length - 1;
      return (
        <React.Fragment key={item.label}>
          {index > 0 && (
            <ChevronRight className="h-3 w-3 flex-none text-ink-subtle" />
          )}
          <button
            onClick={item.onClick}
            disabled={isLast}
            className={cn(
              "text-sm transition-colors",
              isLast ? "font-medium text-ink" : "text-ink-muted hover:text-accent-ink",
            )}
          >
            {item.label}
          </button>
        </React.Fragment>
      );
    })}
  </nav>
);
