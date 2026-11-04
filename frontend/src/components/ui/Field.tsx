import React, { useId } from "react";
import { cn } from "../../lib/utils";

/** Styles partagés par tous les champs de saisie. */
export const CONTROL_CLASS =
  "w-full rounded-md border border-line-strong bg-surface-2 px-3 text-sm text-ink placeholder:text-ink-subtle transition-colors hover:border-ink-subtle focus-visible:border-accent-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 disabled:cursor-not-allowed disabled:opacity-50 aria-[invalid=true]:border-danger";

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, ...rest }, ref) => (
  <input ref={ref} className={cn(CONTROL_CLASS, "h-9", className)} {...rest} />
));
Input.displayName = "Input";

export const Select = React.forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement>
>(({ className, ...rest }, ref) => (
  <select ref={ref} className={cn(CONTROL_CLASS, "h-9", className)} {...rest} />
));
Select.displayName = "Select";

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...rest }, ref) => (
  <textarea
    ref={ref}
    className={cn(CONTROL_CLASS, "min-h-20 py-2", className)}
    {...rest}
  />
));
Textarea.displayName = "Textarea";

export interface FieldProps {
  label: string;
  hint?: string;
  error?: string;
  className?: string;
  /** Reçoit l'`id` à poser sur le champ pour relier le label. */
  children: (id: string) => React.ReactNode;
}

/** Label + champ + aide / erreur. */
export const Field: React.FC<FieldProps> = ({
  label,
  hint,
  error,
  className,
  children,
}) => {
  const id = useId();
  return (
    <div className={cn("space-y-1.5", className)}>
      <label htmlFor={id} className="block text-sm font-medium text-ink">
        {label}
      </label>
      {children(id)}
      {error ? (
        <p role="alert" className="text-xs text-danger">
          {error}
        </p>
      ) : (
        hint && <p className="text-xs text-ink-muted">{hint}</p>
      )}
    </div>
  );
};
