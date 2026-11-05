import React from "react";
import { Loader2 } from "lucide-react";
import { cn } from "../../lib/utils";

type Variant =
  | "primary"
  | "brand"
  | "secondary"
  | "dark"
  | "danger"
  | "success"
  | "ghost";
type Size = "sm" | "md" | "lg";

/** `dark` et `success` sont conservés pour compatibilité : ils rendent comme `secondary` / `primary`. */
const VARIANTS: Record<Variant, string> = {
  primary:
    "bg-accent text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.18)] hover:bg-accent-hover",
  /** Dégradé de marque : réservé aux CTA de la vitrine (landing, authentification). */
  brand:
    "bg-brand shadow-[inset_0_1px_0_rgb(255_255_255/0.25)] hover:brightness-110",
  secondary:
    "border border-line-strong bg-surface/60 text-ink hover:bg-surface-2",
  dark: "border border-line-strong bg-surface/60 text-ink hover:bg-surface-2",
  danger: "bg-danger/15 text-danger border border-danger/30 hover:bg-danger/25",
  success:
    "bg-accent text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.18)] hover:bg-accent-hover",
  ghost: "text-ink-muted hover:bg-surface-2 hover:text-ink",
};

const SIZES: Record<Size, string> = {
  sm: "h-8 px-3 text-xs",
  md: "h-9 px-4 text-sm",
  lg: "h-11 px-6 text-sm",
};

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  variant = "primary",
  size = "md",
  loading = false,
  disabled,
  className = "",
  children,
  ...rest
}) => (
  <button
    disabled={disabled || loading}
    className={cn(
      "inline-flex items-center justify-center gap-2 rounded-md font-medium transition-colors duration-150",
      "disabled:pointer-events-none disabled:opacity-50",
      VARIANTS[variant],
      SIZES[size],
      className,
    )}
    {...rest}
  >
    {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
    {children}
  </button>
);
