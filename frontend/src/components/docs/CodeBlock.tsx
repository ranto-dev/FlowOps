import { Check, Copy } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import {
  LANGUAGE_LABELS,
  normalizeLang,
  tokenize,
  type TokenKind,
} from "../../docs/highlight";

const KIND_CLASS: Record<TokenKind, string> = {
  comment: "italic text-ink-subtle",
  string: "text-success",
  keyword: "text-accent-ink",
  number: "text-warning",
  key: "text-info",
  flag: "text-info",
  variable: "text-warning",
  literal: "text-warning",
  command: "text-accent-ink",
};

export function CodeBlock({
  code,
  lang,
  title,
}: {
  code: string;
  lang: string;
  title?: string;
}) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(timer.current), []);

  const language = normalizeLang(lang);
  const label = LANGUAGE_LABELS[language] ?? lang;

  const copy = () => {
    navigator.clipboard
      .writeText(code)
      .then(() => {
        setCopied(true);
        window.clearTimeout(timer.current);
        timer.current = window.setTimeout(() => setCopied(false), 2000);
      })
      .catch(() => setCopied(false));
  };

  return (
    <figure className="my-6 overflow-hidden rounded-lg border border-line bg-code">
      <figcaption className="flex items-center justify-between gap-3 border-b border-line px-4 py-2 text-xs">
        <span className="flex min-w-0 items-center gap-2">
          <span className="font-mono font-medium text-ink-muted">{label}</span>
          {title && (
            <span className="truncate text-ink-subtle">· {title}</span>
          )}
        </span>
        <button
          type="button"
          onClick={copy}
          aria-label={copied ? "Code copied" : "Copy code"}
          className="flex shrink-0 items-center gap-1.5 rounded px-1.5 py-1 text-ink-muted transition hover:bg-surface-2 hover:text-ink focus-visible:outline-2 focus-visible:outline-accent-ink"
        >
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5 text-success" aria-hidden />
              Copied
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5" aria-hidden />
              Copy
            </>
          )}
        </button>
      </figcaption>
      <pre className="overflow-x-auto p-4 font-mono text-[13px] leading-6 text-ink [scrollbar-color:var(--color-line-strong)_transparent] [scrollbar-width:thin]">
        <code>
          {tokenize(code, lang).map((t, i) =>
            t.kind ? (
              <span key={i} className={KIND_CLASS[t.kind]}>
                {t.text}
              </span>
            ) : (
              t.text
            ),
          )}
        </code>
      </pre>
    </figure>
  );
}
