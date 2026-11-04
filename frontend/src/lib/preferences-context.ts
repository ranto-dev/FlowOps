import { createContext } from "react";

export type Language = "en" | "fr";
export type Theme = "dark" | "light";

export interface PreferencesValue {
  language: Language;
  setLanguage: (language: Language) => void;
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  t: (message: string) => string;
}

export const PreferencesContext = createContext<PreferencesValue | null>(null);
