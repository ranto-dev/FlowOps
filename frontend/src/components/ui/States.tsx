import React from "react";
import { Loader2, Inbox, AlertCircle, RotateCw } from "lucide-react";
import { Button } from "./Button";

export const LoadingState: React.FC<{ label?: string }> = ({
  label = "Chargement...",
}) => (
  <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl border border-slate-200/80">
    <Loader2 className="w-7 h-7 text-purple-600 animate-spin mb-2" />
    <span className="text-xs font-semibold text-slate-500">{label}</span>
  </div>
);

export const EmptyState: React.FC<{
  title: string;
  description?: string;
  action?: React.ReactNode;
}> = ({ title, description, action }) => (
  <div className="text-center py-14 text-slate-400 text-xs border border-dashed border-slate-200 rounded-2xl bg-white space-y-3">
    <Inbox className="w-8 h-8 text-slate-300 mx-auto" />
    <p className="font-medium text-slate-600">{title}</p>
    {description && <p className="text-[11px] text-slate-400">{description}</p>}
    {action && <div className="pt-2 flex justify-center">{action}</div>}
  </div>
);

export const ErrorState: React.FC<{
  message: string;
  onRetry?: () => void;
}> = ({ message, onRetry }) => (
  <div className="text-xs font-mono text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex items-center gap-2.5">
    <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
    <span className="flex-1">{message}</span>
    {onRetry && (
      <Button variant="ghost" size="sm" onClick={onRetry}>
        <RotateCw className="w-3.5 h-3.5" /> Réessayer
      </Button>
    )}
  </div>
);