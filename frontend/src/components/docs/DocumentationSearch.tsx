import { CornerDownLeft, FileText, Hash, Search, X } from "lucide-react";
import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { DOCS_CONFIG } from "../../docs/navigation";
import { queryTokens, search } from "../../docs/search";
import { cn } from "../../lib/utils";
import { usePreferences } from "../../lib/usePreferences";

function Highlight({ text, tokens }: { text: string; tokens: string[] }) {
  if (tokens.length === 0) return <>{text}</>;
  const escaped = tokens.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  const parts = text.split(new RegExp(`(${escaped.join("|")})`, "gi"));
  return (
    <>
      {parts.map((part, i) =>
        i % 2 === 1 ? (
          <mark key={i} className="rounded-sm bg-accent/30 text-accent-ink">
            {part}
          </mark>
        ) : (
          <Fragment key={i}>{part}</Fragment>
        ),
      )}
    </>
  );
}

export function DocumentationSearch({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate();
  const { t, language } = usePreferences();
  const [query, setQuery] = useState("");
  const [cursor, setCursor] = useState(0);
  const listRef = useRef<HTMLUListElement>(null);

  const tokens = useMemo(() => queryTokens(query), [query]);
  const results = useMemo(() => search(query, language), [query, language]);

  useEffect(() => {
    listRef.current
      ?.querySelector<HTMLElement>(`[data-index="${cursor}"]`)
      ?.scrollIntoView({ block: "nearest" });
  }, [cursor]);

  const go = (i: number) => {
    const r = results[i];
    if (!r) return;
    navigate(
      `${DOCS_CONFIG.basePath}/${r.slug}${r.anchor ? `#${r.anchor}` : ""}`,
    );
    onClose();
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      e.preventDefault();
      onClose();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setCursor((c) => Math.min(c + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setCursor((c) => Math.max(c - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      go(cursor);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-scrim px-4 pt-[10vh]"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={t("Search documentation")}
        onKeyDown={onKeyDown}
        className="flex max-h-[70vh] w-full max-w-xl flex-col overflow-hidden glass-strong rounded-lg border p-4"
      >
        <div className="flex items-center gap-3 border-b border-line px-4 transition-colors">
          <Search className="h-5 w-5 shrink-0 text-accent-ink " aria-hidden />
          <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setCursor(0);
            }}
            role="combobox"
            aria-expanded
            aria-controls="docs-search-results"
            aria-activedescendant={
              results[cursor] ? `docs-result-${cursor}` : undefined
            }
            placeholder={t("Search the documentation…")}
            className="h-14 flex-1 bg-transparent text-base text-ink outline-none placeholder:text-ink-subtle"
          />
          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setCursor(0);
              }}
              aria-label={t("Clear search")}
              className="rounded-md p-1.5 text-ink-subtle transition-colors hover:bg-surface-2 hover:text-ink focus-visible:outline-2 focus-visible:outline-accent-ink"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          <kbd className="rounded-sm border border-line-strong bg-surface px-1.5 py-0.5 font-mono text-[10px] text-ink-subtle max-sm:hidden">
            esc
          </kbd>
        </div>

        <ul
          id="docs-search-results"
          ref={listRef}
          role="listbox"
          className="flex-1 overflow-y-auto p-2 [scrollbar-color:var(--color-line-strong)_transparent] [scrollbar-width:thin]"
        >
          {tokens.length === 0 && (
            <li className="px-3 py-8 text-center text-sm text-ink-subtle">
              {t("Type to search pages, headings and content.")}
            </li>
          )}
          {tokens.length > 0 && results.length === 0 && (
            <li className="px-3 py-8 text-center text-sm text-ink-subtle">
              {t("No results for “{query}”.", { query })}
            </li>
          )}
          {results.map((r, i) => (
            <li
              key={`${r.slug}#${r.anchor ?? ""}`}
              id={`docs-result-${i}`}
              role="option"
              aria-selected={i === cursor}
              data-index={i}
              onMouseMove={() => setCursor(i)}
              onClick={() => go(i)}
              className={cn(
                "flex cursor-pointer items-start gap-3 rounded-lg px-3 py-2.5",
                i === cursor
                  ? "bg-accent/15 ring-1 ring-inset ring-accent/30"
                  : "hover:bg-surface-2",
              )}
            >
              {r.heading ? (
                <Hash
                  className="mt-0.5 h-4 w-4 shrink-0 text-ink-subtle"
                  aria-hidden
                />
              ) : (
                <FileText
                  className="mt-0.5 h-4 w-4 shrink-0 text-ink-subtle"
                  aria-hidden
                />
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-ink">
                  <Highlight text={r.heading ?? r.pageTitle} tokens={tokens} />
                  {r.heading && (
                    <span className="font-normal text-ink-subtle">
                      {" "}
                      — {r.pageTitle}
                    </span>
                  )}
                </p>
                <p className="mt-0.5 line-clamp-2 text-xs leading-5 text-ink-muted">
                  <Highlight text={r.snippet} tokens={tokens} />
                </p>
                <p className="mt-0.5 text-[11px] uppercase tracking-wider text-ink-subtle">
                  {r.sectionTitle}
                </p>
              </div>
              {i === cursor && (
                <CornerDownLeft
                  className="mt-1 h-3.5 w-3.5 shrink-0 text-ink-subtle"
                  aria-hidden
                />
              )}
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-4 border-t border-line px-4 py-2 text-[11px] text-ink-subtle">
          <span>
            <kbd className="font-mono">↑↓</kbd> {t("navigate")}
          </span>
          <span>
            <kbd className="font-mono">↵</kbd> {t("open")}
          </span>
          <span>
            <kbd className="font-mono">esc</kbd> {t("close")}
          </span>
        </div>
      </div>
    </div>
  );
}
