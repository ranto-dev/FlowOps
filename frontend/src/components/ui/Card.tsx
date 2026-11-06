import React from "react";
import { cn } from "../../lib/utils";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  as?: "div" | "section";
  /** `glass` (défaut) : verre flouté. `flat` : même teinte sans flou (grilles de cartes). `solid` : zones denses. */
  variant?: "glass" | "flat" | "solid";
  /** Léger relèvement au survol, pour les cartes cliquables. */
  interactive?: boolean;
}

export const Card: React.FC<CardProps> = ({
  as = "div",
  variant = "glass",
  interactive = false,
  className = "",
  children,
  ...rest
}) => {
  const Tag = as;
  return (
    <Tag
      className={cn(
        "rounded-lg border",
        variant === "glass"
          ? "glass"
          : variant === "flat"
            ? "glass-flat"
            : "border-line bg-surface",
        interactive &&
          "transition duration-200 hover:-translate-y-0.5 hover:border-accent/40",
        className,
      )}
      {...rest}
    >
      {children}
    </Tag>
  );
};
