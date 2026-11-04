import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { MotionConfig } from "framer-motion";
import App from "./App.tsx";
import "@fontsource-variable/inter";
import "@fontsource-variable/jetbrains-mono";
import "./main.css";
import { PreferencesProvider } from "./lib/preferences";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <PreferencesProvider>
      <MotionConfig reducedMotion="user">
        <App />
      </MotionConfig>
    </PreferencesProvider>
  </StrictMode>,
);
