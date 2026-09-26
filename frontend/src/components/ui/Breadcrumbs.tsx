import React from "react";
import { ChevronRight } from "lucide-react";

export interface Crumb {
  label: string;
  onClick?: () => void;
}

export const Breadcrumbs: React.FC<{ items: Crumb[] }> = ({ items }) => (
  <nav aria-label="Fil d'Ariane" className="flex items-center gap-1.5">
    {items.map((item, index) => {
      const isLast = index === items.length - 1;
      return (
        <React.Fragment key={item.label}>
          {index > 0 && (
            <ChevronRight className="w-3 h-3 text-slate-300 flex-none" />
          )}
          <button
            onClick={item.onClick}
            disabled={isLast}
            className={`text-xs font-semibold transition-colors ${
              isLast
                ? "text-slate-900"
                : "text-slate-500 hover:text-purple-600"
            }`}
          >
            {item.label}
          </button>
        </React.Fragment>
      );
    })}
  </nav>
);