import { useEffect, useState } from "react";
import type { Heading } from "../../docs/headings";
import { cn } from "../../lib/utils";

export function DocumentationTableOfContents({
  headings,
  pageKey,
}: {
  headings: Heading[];
  pageKey: string;
}) {
  const [active, setActive] = useState<string | null>(null);

  useEffect(() => {
    const els = headings
      .map((h) => document.getElementById(h.id))
      .filter((el): el is HTMLElement => el !== null);
    if (els.length === 0) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.find((e) => e.isIntersecting);
        if (visible) setActive(visible.target.id);
      },
      { rootMargin: "-80px 0px -70% 0px" },
    );
    els.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
    // pageKey : l'ensemble des titres change à chaque page.
  }, [headings, pageKey]);

  if (headings.length === 0) return null;

  return (
    <nav aria-label="On this page" className="text-sm">
      <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-ink-muted">
        On this page
      </p>
      <ul className="space-y-1.5 border-l border-line">
        {headings.map((h) => (
          <li key={h.id}>
            <a
              href={`#${h.id}`}
              aria-current={active === h.id ? "location" : undefined}
              className={cn(
                "-ml-px block border-l py-0.5 text-[13px] leading-5 transition-colors focus-visible:outline-2 focus-visible:outline-accent-ink",
                h.level === 3 ? "pl-6" : "pl-3",
                active === h.id
                  ? "border-accent-ink text-accent-ink"
                  : "border-transparent text-ink-subtle hover:text-ink",
              )}
            >
              {h.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
