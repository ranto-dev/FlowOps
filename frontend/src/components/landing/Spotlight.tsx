import type { CSSProperties, PointerEvent, ReactNode } from "react";
import { cn } from "../../lib/utils";

interface SpotlightProps {
  children: ReactNode;
  className?: string;
}

/** Halo violet qui suit le curseur (effet cartes Vercel). Pose --mx/--my ; le rendu est en CSS. */
export function Spotlight({ children, className }: SpotlightProps) {
  const onMove = (e: PointerEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const style = e.currentTarget.style;
    style.setProperty("--mx", `${e.clientX - rect.left}px`);
    style.setProperty("--my", `${e.clientY - rect.top}px`);
  };
  return (
    <div
      onPointerMove={onMove}
      className={cn("spotlight", className)}
      style={{} as CSSProperties}
    >
      {children}
    </div>
  );
}
