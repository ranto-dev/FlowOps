import { Check, Link2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { slugify } from "../../docs/utils";
import type { PageEntry } from "../../docs/pages";
import type { Block } from "../../docs/types";
import { Callout } from "./Callout";
import { CodeBlock } from "./CodeBlock";
import { DocumentationBreadcrumb } from "./DocumentationBreadcrumb";
import { InlineText } from "./InlineText";

function Heading({ block }: { block: Extract<Block, { type: "h2" | "h3" }> }) {
  const id = slugify(block.text);
  const Tag = block.type;
  return (
    <Tag
      id={id}
      className={
        block.type === "h2"
          ? "group mt-12 scroll-mt-20 border-b border-line pb-2 text-2xl font-semibold tracking-tight text-ink"
          : "group mt-8 scroll-mt-20 text-lg font-semibold text-ink"
      }
    >
      <InlineText text={block.text} />
      <a
        href={`#${id}`}
        aria-label={`Link to ${block.text}`}
        className="ml-2 text-ink-subtle opacity-0 transition hover:text-accent-ink focus-visible:opacity-100 group-hover:opacity-100"
      >
        #
      </a>
    </Tag>
  );
}

function BlockView({ block }: { block: Block }) {
  switch (block.type) {
    case "h2":
    case "h3":
      return <Heading block={block} />;
    case "p":
      return (
        <p className="my-4 leading-7 text-ink">
          <InlineText text={block.text} />
        </p>
      );
    case "list": {
      const Tag = block.ordered ? "ol" : "ul";
      return (
        <Tag
          className={
            block.ordered
              ? "my-4 list-decimal space-y-2 pl-6 marker:text-ink-subtle"
              : "my-4 list-disc space-y-2 pl-6 marker:text-ink-subtle"
          }
        >
          {block.items.map((item, i) => (
            <li key={i} className="pl-1 leading-7 text-ink">
              <InlineText text={item} />
            </li>
          ))}
        </Tag>
      );
    }
    case "code":
      return <CodeBlock code={block.code} lang={block.lang} title={block.title} />;
    case "callout":
      return <Callout tone={block.tone} title={block.title} text={block.text} />;
    case "table":
      return (
        <div className="my-6 overflow-x-auto rounded-lg border border-line [scrollbar-color:#334155_transparent] [scrollbar-width:thin]">
          <table className="w-full min-w-[28rem] text-left text-sm">
            <thead className="bg-surface text-ink">
              <tr>
                {block.head.map((h) => (
                  <th key={h} className="px-4 py-2.5 font-semibold">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-line text-ink">
              {block.rows.map((row, r) => (
                <tr key={r}>
                  {row.map((cell, c) => (
                    <td key={c} className="px-4 py-2.5 align-top">
                      <InlineText text={cell} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
  }
}

export function DocumentationContent({ entry }: { entry: PageEntry }) {
  const { page } = entry;
  const [linkCopied, setLinkCopied] = useState(false);
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(timer.current), []);
  useEffect(() => setLinkCopied(false), [page.slug]);

  const copyLink = () => {
    navigator.clipboard
      .writeText(window.location.href.split("#")[0])
      .then(() => {
        setLinkCopied(true);
        window.clearTimeout(timer.current);
        timer.current = window.setTimeout(() => setLinkCopied(false), 2000);
      })
      .catch(() => setLinkCopied(false));
  };

  return (
    <article className="min-w-0">
      <DocumentationBreadcrumb entry={entry} />
      <header>
        <div className="flex items-start justify-between gap-4">
          <h1 className="text-3xl font-semibold tracking-tight text-ink">
            {page.title}
          </h1>
          <button
            type="button"
            onClick={copyLink}
            className="mt-1 flex shrink-0 items-center gap-1.5 rounded-md border border-line-strong px-2.5 py-1.5 text-xs text-ink transition hover:border-line-strong hover:bg-surface-2 focus-visible:outline-2 focus-visible:outline-accent-ink"
          >
            {linkCopied ? (
              <Check className="h-3.5 w-3.5 text-success" aria-hidden />
            ) : (
              <Link2 className="h-3.5 w-3.5" aria-hidden />
            )}
            <span className="max-sm:sr-only">
              {linkCopied ? "Link copied" : "Copy link"}
            </span>
          </button>
        </div>
        <p className="mt-3 text-lg leading-8 text-ink-muted">
          <InlineText text={page.description} />
        </p>
      </header>
      <div>
        {page.blocks.map((block, i) => (
          <BlockView key={`${page.slug}-${i}`} block={block} />
        ))}
      </div>
    </article>
  );
}
