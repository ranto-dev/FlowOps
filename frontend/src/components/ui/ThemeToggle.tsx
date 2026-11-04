import { Moon, Sun } from "lucide-react";
import { usePreferences } from "../../lib/usePreferences";
import { cn } from "../../lib/utils";

/** Bascule entre le thème sombre et le thème clair (mémorisé dans le navigateur). */
export function ThemeToggle({ className }: { className?: string }) {
  const { theme, toggleTheme, t } = usePreferences();
  const toLight = theme === "dark";
  const label = toLight ? t("Switch to light mode") : t("Switch to dark mode");

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={label}
      title={label}
      className={cn(
        "inline-flex h-8 w-8 items-center justify-center rounded-md text-ink-muted transition-colors hover:bg-surface-2 hover:text-ink",
        className,
      )}
    >
      {toLight ? (
        <Sun className="h-4 w-4" aria-hidden="true" />
      ) : (
        <Moon className="h-4 w-4" aria-hidden="true" />
      )}
    </button>
  );
}
