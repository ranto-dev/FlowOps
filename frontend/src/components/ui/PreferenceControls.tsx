import { Languages, Moon, Sun } from "lucide-react";
import type { ReactNode } from "react";
import { usePreferences } from "../../lib/usePreferences";
import { cn } from "../../lib/utils";
import { ThemeToggle } from "./ThemeToggle";

interface PreferenceControlsProps {
  compact?: boolean;
  layout?: "inline" | "menu";
}

export function PreferenceControls({
  compact = false,
  layout = "inline",
}: PreferenceControlsProps) {
  const { language, setLanguage, theme, toggleTheme, t } = usePreferences();

  if (layout === "menu") {
    const languageIsFrench = language === "fr";
    const darkModeEnabled = theme === "dark";

    return (
      <div className="space-y-1" role="group" aria-label={t("Preferences")}>
        <PreferenceSwitch
          label={t("Language")}
          value={languageIsFrench ? t("French") : t("English")}
          checked={languageIsFrench}
          onChange={() => setLanguage(languageIsFrench ? "en" : "fr")}
          icon={<Languages className="size-4" aria-hidden="true" />}
        />
        <PreferenceSwitch
          label={t("Theme")}
          value={darkModeEnabled ? t("Dark") : t("Light")}
          checked={darkModeEnabled}
          onChange={toggleTheme}
          icon={
            darkModeEnabled ? (
              <Moon className="size-4" aria-hidden="true" />
            ) : (
              <Sun className="size-4" aria-hidden="true" />
            )
          }
        />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1",
        !compact && "rounded-md border border-line-strong bg-surface p-1",
      )}
      aria-label={t("Preferences")}
    >
      <label className="relative inline-flex h-8 items-center gap-1.5 rounded-md px-2 text-ink-muted transition-colors hover:bg-surface-2 hover:text-ink">
        <Languages className="h-4 w-4 shrink-0" aria-hidden="true" />
        <span className="sr-only">{t("Switch language")}</span>
        <select
          value={language}
          onChange={(event) =>
            setLanguage(event.currentTarget.value as "en" | "fr")
          }
          aria-label={t("Switch language")}
          className="max-w-[5.5rem] cursor-pointer appearance-none bg-transparent pr-1 text-sm outline-none"
        >
          <option value="en">{t("English")}</option>
          <option value="fr">{t("French")}</option>
        </select>
      </label>
      <ThemeToggle />
    </div>
  );
}

interface PreferenceSwitchProps {
  label: string;
  value: string;
  checked: boolean;
  onChange: () => void;
  icon: ReactNode;
}

function PreferenceSwitch({
  label,
  value,
  checked,
  onChange,
  icon,
}: PreferenceSwitchProps) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-md px-2 py-2 transition-colors hover:bg-surface-2/70">
      <div className="flex min-w-0 items-center gap-2.5">
        <span className="text-ink-muted">{icon}</span>
        <span className="text-sm font-medium text-ink">{label}</span>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <span className="text-xs text-ink-muted">{value}</span>
        <button
          type="button"
          role="switch"
          aria-checked={checked}
          aria-label={`${label}: ${value}`}
          onClick={onChange}
          className={cn(
            "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border p-0.5 transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-ink",
            checked
              ? "border-accent bg-accent"
              : "border-line-strong bg-surface-2",
          )}
        >
          <span
            aria-hidden="true"
            className={cn(
              "size-4 rounded-full bg-white shadow-sm transition-transform duration-200",
              checked && "translate-x-5",
            )}
          />
        </button>
      </div>
    </div>
  );
}
