import { Languages } from "lucide-react";
import { usePreferences } from "../../lib/usePreferences";
import { cn } from "../../lib/utils";

interface PreferenceControlsProps {
  compact?: boolean;
}

export function PreferenceControls({
  compact = false,
}: PreferenceControlsProps) {
  const { language, setLanguage, t } = usePreferences();

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
    </div>
  );
}
