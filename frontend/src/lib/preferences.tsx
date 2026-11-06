import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  PreferencesContext,
  type Language,
  type Theme,
} from "./preferences-context";
import { setCurrentLanguage, translate } from "./i18n";

function readPreference<T extends string>(
  key: string,
  allowed: readonly T[],
  fallback: T,
): T {
  try {
    const stored = localStorage.getItem(key);
    return allowed.includes(stored as T) ? (stored as T) : fallback;
  } catch {
    return fallback;
  }
}

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() =>
    readPreference("flowops_language", ["en", "fr"], "en"),
  );

  const [theme, setThemeState] = useState<Theme>(() =>
    readPreference("flowops_theme", ["dark", "light"], "dark"),
  );

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute("content", theme === "light" ? "#ffffff" : "#0b1020");
    try {
      localStorage.setItem("flowops_theme", theme);
    } catch {
      // Le thème reste appliqué pour la session si le stockage est désactivé.
    }
  }, [theme]);

  useEffect(() => {
    setCurrentLanguage(language);
    document.documentElement.lang = language;
    try {
      localStorage.setItem("flowops_language", language);
    } catch {
      // Preferences still apply for the current session if storage is disabled.
    }
  }, [language]);

  const setLanguage = useCallback(
    (value: Language) => setLanguageState(value),
    [],
  );
  const setTheme = useCallback((value: Theme) => setThemeState(value), []);
  const toggleTheme = useCallback(
    () => setThemeState((current) => (current === "dark" ? "light" : "dark")),
    [],
  );
  const t = useCallback(
    (message: string, vars?: Record<string, string | number>) =>
      translate(message, vars, language),
    [language],
  );
  const value = useMemo(
    () => ({ language, setLanguage, theme, setTheme, toggleTheme, t }),
    [language, setLanguage, theme, setTheme, toggleTheme, t],
  );

  return (
    <PreferencesContext.Provider value={value}>
      {children}
    </PreferencesContext.Provider>
  );
}
