import React from "react";
import { Loader2, Inbox, AlertCircle, RotateCw } from "lucide-react";
import { Button } from "./Button";

export const LoadingState: React.FC<{ label?: string }> = ({
  label = "Loading...",
}) => (
  <div className="flex flex-col items-center justify-center rounded-lg border border-line bg-surface py-16">
    <Loader2 className="mb-2 h-6 w-6 animate-spin text-accent-ink" />
    <span className="text-sm text-ink-muted">{label}</span>
  </div>
);

export const EmptyState: React.FC<{
  title: string;
  description?: string;
  action?: React.ReactNode;
}> = ({ title, description, action }) => (
  <div className="space-y-3 rounded-lg border border-dashed border-line-strong bg-surface py-14 text-center">
    <Inbox className="mx-auto h-8 w-8 text-ink-subtle" />
    <p className="text-sm font-medium text-ink">{title}</p>
    {description && <p className="text-sm text-ink-muted">{description}</p>}
    {action && <div className="flex justify-center pt-2">{action}</div>}
  </div>
);

export const ErrorState: React.FC<{
  message: string;
  onRetry?: () => void;
}> = ({ message, onRetry }) => (
  <div
    role="alert"
    className="flex items-center gap-2.5 rounded-lg border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger"
  >
    <AlertCircle className="h-4 w-4 shrink-0" />
    <span className="flex-1">{message}</span>
    {onRetry && (
      <Button variant="ghost" size="sm" onClick={onRetry}>
        <RotateCw className="h-3.5 w-3.5" /> Retry
      </Button>
    )}
  </div>
);
