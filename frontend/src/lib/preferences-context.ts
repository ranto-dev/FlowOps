import { createContext } from "react";

export type Theme = "light" | "dark";
export type Language = "en" | "fr";

export interface PreferencesValue {
  theme: Theme;
  language: Language;
  setTheme: (theme: Theme) => void;
  setLanguage: (language: Language) => void;
  t: (message: string) => string;
}

export const PreferencesContext = createContext<PreferencesValue | null>(null);
