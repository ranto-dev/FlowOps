import React from "react";
import { cn } from "../../lib/utils";

/** Conteneur sombre partagé : YAML, logs, blocs de code. */
export const CodeSurface = React.forwardRef<
  HTMLPreElement,
  React.HTMLAttributes<HTMLPreElement>
>(({ className, ...rest }, ref) => (
  <pre
    ref={ref}
    className={cn(
      "overflow-auto rounded-lg border border-line bg-code p-4 font-mono text-[13px] leading-6 text-ink [scrollbar-color:var(--color-line-strong)_transparent] [scrollbar-width:thin]",
      className,
    )}
    {...rest}
  />
));
CodeSurface.displayName = "CodeSurface";
