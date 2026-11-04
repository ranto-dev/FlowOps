import { createContext } from "react";

export type Language = "en" | "fr";

export interface PreferencesValue {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (message: string) => string;
}

export const PreferencesContext = createContext<PreferencesValue | null>(null);
