import { Fragment } from "react";
import { Link } from "react-router-dom";

const INLINE_RE =
  /(`[^`]+`|\*\*[^*]+\*\*|\[[^\]]+\]\([^)]+\)|\*[^*\s][^*]*\*)/g;

/** Rend le mini-format inline des pages : `code`, **gras**, *italique*, [lien](url). */
export function InlineText({ text }: { text: string }) {
  return (
    <>
      {text.split(INLINE_RE).map((part, i) => {
        if (part.startsWith("`") && part.endsWith("`") && part.length > 2) {
          return (
            <code
              key={i}
              className="rounded border border-line-strong bg-surface-2 px-1.5 py-0.5 font-mono text-[0.85em] text-ink"
            >
              {part.slice(1, -1)}
            </code>
          );
        }
        if (part.startsWith("**") && part.endsWith("**")) {
          return (
            <strong key={i} className="font-semibold text-ink">
              {part.slice(2, -2)}
            </strong>
          );
        }
        const link = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(part);
        if (link) {
          const [, label, href] = link;
          const cls =
            "text-accent-ink underline decoration-accent-ink/40 underline-offset-2 hover:decoration-accent-ink focus-visible:outline-2 focus-visible:outline-accent-ink";
          return href.startsWith("/") ? (
            <Link key={i} to={href} className={cls}>
              {label}
            </Link>
          ) : (
            <a key={i} href={href} target="_blank" rel="noreferrer" className={cls}>
              {label}
            </a>
          );
        }
        if (part.startsWith("*") && part.endsWith("*") && part.length > 2) {
          return <em key={i}>{part.slice(1, -1)}</em>;
        }
        return <Fragment key={i}>{part}</Fragment>;
      })}
    </>
  );
}
