import { ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { DOCS_CONFIG, TAB_LABELS } from "../../docs/navigation";
import type { PageEntry } from "../../docs/pages";

export function DocumentationBreadcrumb({ entry }: { entry: PageEntry }) {
  const crumbs = [
    ...entry.ancestors.map((a) => ({
      label: a.navTitle ?? a.title,
      to: `${DOCS_CONFIG.basePath}/${a.slug}`,
    })),
  ];
  return (
    <nav aria-label="Breadcrumb" className="mb-4">
      <ol className="flex flex-wrap items-center gap-1.5 text-xs text-ink-subtle">
        <li>
          <Link
            to={DOCS_CONFIG.basePath}
            className="hover:text-ink focus-visible:outline-2 focus-visible:outline-accent-ink"
          >
            Docs
          </Link>
        </li>
        {entry.section.tab === "developers" && (
          <li className="flex items-center gap-1.5">
            <ChevronRight className="h-3 w-3" aria-hidden />
            <Link
              to={`${DOCS_CONFIG.basePath}/${DOCS_CONFIG.developerHomeSlug}`}
              className="hover:text-ink"
            >
              {TAB_LABELS.developers}
            </Link>
          </li>
        )}
        <li className="flex items-center gap-1.5">
          <ChevronRight className="h-3 w-3" aria-hidden />
          <span>{entry.section.title}</span>
        </li>
        {crumbs.map((c) => (
          <li key={c.to} className="flex items-center gap-1.5">
            <ChevronRight className="h-3 w-3" aria-hidden />
            <Link to={c.to} className="hover:text-ink">
              {c.label}
            </Link>
          </li>
        ))}
        <li className="flex items-center gap-1.5" aria-current="page">
          <ChevronRight className="h-3 w-3" aria-hidden />
          <span className="text-ink">
            {entry.page.navTitle ?? entry.page.title}
          </span>
        </li>
      </ol>
    </nav>
  );
}
