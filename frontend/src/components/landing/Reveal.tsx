import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";
import { cn } from "../../lib/utils";
import { EASE } from "./motion";

interface RevealProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  y?: number;
}

/** Fade + slide-up on scroll, once. Honors prefers-reduced-motion. */
export function Reveal({ children, className, delay = 0, y = 12 }: RevealProps) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: reduce ? 0 : y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.4, delay, ease: EASE }}
    >
      {children}
    </motion.div>
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
      <span className="text-xs font-medium text-accent-ink">
        {eyebrow}
      </span>
      <h2 className="text-balance text-2xl font-semibold leading-tight text-ink sm:text-3xl">
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
