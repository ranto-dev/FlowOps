import en from "../messages/en.json";
import fr from "../messages/fr.json";
import type { Language } from "./preferences-context";

/**
 * Traduction hors composants React (utilitaires, `api.ts`…).
 * Dans un composant, préférer `const { t } = usePreferences()`.
 *
 * Clé = texte anglais d'origine ; `{nom}` dans un texte est remplacé par `vars.nom`.
 */
const dictionaries: Record<Language, Record<string, string>> = { en, fr };

function storedLanguage(): Language {
  try {
    return localStorage.getItem("flowops_language") === "fr" ? "fr" : "en";
  } catch {
    return "en";
  }
}

let current: Language = storedLanguage();

export function setCurrentLanguage(language: Language): void {
  current = language;
}

export type MessageVars = Record<string, string | number>;

export function translate(
  message: string,
  vars?: MessageVars,
  language: Language = current,
): string {
  const text = dictionaries[language][message] ?? message;
  return vars
    ? text.replace(/\{(\w+)\}/g, (match, name: string) =>
        name in vars ? String(vars[name]) : match,
      )
    : text;
}
