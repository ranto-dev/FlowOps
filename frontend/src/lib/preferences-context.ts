import { createContext } from "react";

export type Language = "en" | "fr";
export type Theme = "dark" | "light";

export interface PreferencesValue {
  language: Language;
  setLanguage: (language: Language) => void;
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  /** Traduit un texte (clé = anglais d'origine). `{nom}` est remplacé par `vars.nom`. */
  t: (message: string, vars?: Record<string, string | number>) => string;
}

export const PreferencesContext = createContext<PreferencesValue | null>(null);
