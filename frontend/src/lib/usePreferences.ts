import { useContext } from "react";
import { PreferencesContext, type PreferencesValue } from "./preferences-context";

export function usePreferences(): PreferencesValue {
  const value = useContext(PreferencesContext);
  if (!value) {
    throw new Error("usePreferences must be used inside PreferencesProvider");
  }
  return value;
}
