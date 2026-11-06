import { ArrowLeft, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { DOCS_CONFIG } from "../../docs/navigation";
import type { DocPage } from "../../docs/types";
import { usePreferences } from "../../lib/usePreferences";

const CARD =
  "group flex flex-col gap-1 rounded-lg border border-line p-4 transition-colors hover:border-accent/60 hover:bg-surface focus-visible:outline-2 focus-visible:outline-accent-ink";

export function PageNavigation({
  prev,
  next,
}: {
  prev?: DocPage;
  next?: DocPage;
}) {
  const { t } = usePreferences();
  return (
    <nav
      aria-label={t("Pagination")}
      className="mt-16 grid gap-4 border-t border-line pt-8 sm:grid-cols-2"
    >
      {prev ? (
        <Link to={`${DOCS_CONFIG.basePath}/${prev.slug}`} className={CARD}>
          <span className="flex items-center gap-1.5 text-xs text-ink-subtle">
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden /> {t("Previous")}
          </span>
          <span className="font-medium text-ink group-hover:text-accent-ink">
            {prev.title}
          </span>
        </Link>
      ) : (
        <span aria-hidden />
      )}
      {next && (
        <Link
          to={`${DOCS_CONFIG.basePath}/${next.slug}`}
          className={`${CARD} items-end text-right`}
        >
          <span className="flex items-center gap-1.5 text-xs text-ink-subtle">
            {t("Next")} <ArrowRight className="h-3.5 w-3.5" aria-hidden />
          </span>
          <span className="font-medium text-ink group-hover:text-accent-ink">
            {next.title}
          </span>
        </Link>
      )}
    </nav>
  );
}
