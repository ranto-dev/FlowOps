import React from "react";
import { cn } from "../../lib/utils";

/** Noms conservés (`purple`, `green`, `red`, `amber`, `sky`) ; ils pointent vers les tokens. */
export type BadgeTone = "neutral" | "purple" | "green" | "red" | "amber" | "sky";

const TONES: Record<BadgeTone, { box: string; dot: string }> = {
  neutral: { box: "bg-surface-2 text-ink-muted border-line-strong", dot: "bg-ink-subtle" },
  purple: { box: "bg-accent/15 text-accent-ink border-accent/30", dot: "bg-accent-ink" },
  green: { box: "bg-success/10 text-success border-success/30", dot: "bg-success" },
  red: { box: "bg-danger/10 text-danger border-danger/30", dot: "bg-danger" },
  amber: { box: "bg-warning/10 text-warning border-warning/30", dot: "bg-warning" },
  sky: { box: "bg-info/10 text-info border-info/30", dot: "bg-info" },
};

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone;
  dot?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  tone = "neutral",
  dot = false,
  className = "",
  children,
  ...rest
}) => (
  <span
    className={cn(
      "inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-xs font-medium",
      TONES[tone].box,
      className,
    )}
    {...rest}
  >
    {dot && <span className={cn("h-1.5 w-1.5 rounded-full", TONES[tone].dot)} />}
    {children}
  </span>
);
