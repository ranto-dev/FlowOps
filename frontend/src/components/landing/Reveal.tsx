import { createElement, useCallback } from "react";
import type { CSSProperties, ElementType, ReactNode } from "react";
import { cn } from "../../lib/utils";

/**
 * Apparition au défilement, sans JavaScript par image : un seul IntersectionObserver partagé
 * pose `data-in` ; la transition (opacity + transform) est en CSS (voir `.reveal` dans main.css).
 */
let observer: IntersectionObserver | null = null;

function getObserver(): IntersectionObserver | null {
  if (observer || typeof IntersectionObserver === "undefined") return observer;
  observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.setAttribute("data-in", "");
          observer?.unobserve(entry.target);
        }
      }
    },
    { threshold: 0.12, rootMargin: "0px 0px -6% 0px" },
  );
  return observer;
}

interface RevealProps {
  children: ReactNode;
  className?: string;
  /** Décalage en secondes (effet d'escalier dans une grille). */
  delay?: number;
  y?: number;
  as?: ElementType;
}

export function Reveal({
  children,
  className,
  delay = 0,
  y = 24,
  as: Tag = "div",
}: RevealProps) {
  const ref = useCallback((node: HTMLElement | null) => {
    if (!node) return;
    const io = getObserver();
    if (!io) {
      node.setAttribute("data-in", "");
      return;
    }
    io.observe(node);
    return () => io.unobserve(node);
  }, []);

  const style = {
    "--reveal-delay": `${delay}s`,
    "--reveal-y": `${y}px`,
  } as CSSProperties;

  return createElement(
    Tag,
    { ref, className: cn("reveal", className), style },
    children,
  );
}

interface SectionHeaderProps {
  eyebrow: string;
  title: ReactNode;
  description?: string;
  align?: "center" | "left";
}

export function SectionHeader({
  eyebrow,
  title,
  description,
  align = "center",
}: SectionHeaderProps) {
  return (
    <Reveal
      className={cn(
        "flex max-w-2xl flex-col gap-4",
        align === "center" ? "mx-auto items-center text-center" : "items-start text-left",
      )}
    >
      <span className="font-mono text-xs uppercase tracking-widest text-accent-ink">
        {eyebrow}
      </span>
      <h2 className="text-gradient text-balance text-3xl font-semibold leading-tight tracking-tight sm:text-4xl md:text-5xl">
        {title}
      </h2>
      {description ? (
        <p className="text-pretty text-base leading-relaxed text-ink-muted">
          {description}
        </p>
      ) : null}
    </Reveal>
  );
}
