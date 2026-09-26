import React from "react";

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
      className={`bg-white border border-slate-200/80 rounded-2xl shadow-sm ${className}`}
      {...rest}
    >
      {children}
    </Tag>
  );
};