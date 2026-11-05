import React from "react";

export interface PageHeaderProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  description,
  icon,
  actions,
}) => (
  <div className="flex flex-col justify-between gap-3 sm:flex-row sm:flex-wrap sm:items-start">
    <div className="flex items-start gap-3">
      {icon && (
        <div className="flex-none rounded-md bg-accent/15 p-2.5 text-accent-ink">
          {icon}
        </div>
      )}
      <div>
        <h1 className="break-words text-xl font-semibold tracking-tight text-ink sm:text-2xl">
          {title}
        </h1>
        {description && (
          <p className="mt-1.5 break-words text-sm text-ink-muted">{description}</p>
        )}
      </div>
    </div>
    {actions && <div className="flex items-center gap-2">{actions}</div>}
  </div>
);
