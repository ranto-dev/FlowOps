import { Languages, Moon, Sun } from "lucide-react";
import { usePreferences } from "../../lib/usePreferences";

interface PreferenceControlsProps {
  compact?: boolean;
}

export function PreferenceControls({
  compact = false,
}: PreferenceControlsProps) {
  const { theme, language, setLanguage, setTheme, t } = usePreferences();
  const nextTheme = theme === "light" ? "dark" : "light";

  return (
    <div
      className={`inline-flex items-center gap-1 ${compact ? "" : "rounded-xl border border-slate-200 bg-white p-1 dark:border-slate-700 dark:bg-slate-900"}`}
      aria-label={t("Preferences")}
    >
      <button
        type="button"
        onClick={() => setTheme(nextTheme)}
        aria-label={`${t("Switch theme")}: ${t(nextTheme === "dark" ? "Dark mode" : "Light mode")}`}
        title={`${t("Switch theme")}: ${t(nextTheme === "dark" ? "Dark mode" : "Light mode")}`}
        className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-600 transition hover:bg-slate-100 hover:text-violet-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-violet-500 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-violet-200"
      >
        {theme === "light" ? (
          <Moon className="h-4 w-4" aria-hidden="true" />
        ) : (
          <Sun className="h-4 w-4" aria-hidden="true" />
        )}
      </button>
      <label className="relative inline-flex h-9 items-center gap-1.5 rounded-lg px-2 text-slate-600 transition hover:bg-slate-100 hover:text-violet-700 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-violet-200">
        <Languages className="h-4 w-4 shrink-0" aria-hidden="true" />
        <span className="sr-only">{t("Switch language")}</span>
        <select
          value={language}
          onChange={(event) =>
            setLanguage(event.currentTarget.value as "en" | "fr")
          }
          aria-label={t("Switch language")}
          className="max-w-[5.5rem] cursor-pointer appearance-none bg-transparent pr-1 text-xs font-semibold outline-none"
        >
          <option value="en">{t("English")}</option>
          <option value="fr">{t("French")}</option>
        </select>
      </label>
    </div>
  );
}
