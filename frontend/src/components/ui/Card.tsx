import React from "react";
import { cn } from "../../lib/utils";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  as?: "div" | "section";
}

export const Card: React.FC<CardProps> = ({
  as = "div",
  className = "",
  children,
  ...rest
}) => {
  const Tag = as;
  return (
    <Tag
      className={cn("rounded-lg border border-line bg-surface", className)}
      {...rest}
    >
      {children}
    </Tag>
  );
};
