// frontend/src/App.tsx
import { lazy, Suspense } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { ToastProvider } from "./components/ui/Toast";
import { usePreferences } from "./lib/usePreferences";
import { hasSession } from "./lib/session";

const LandingPage = lazy(() => import("./pages/LandingPage"));
const AuthPage = lazy(() =>
  import("./pages/AuthPage").then(({ AuthPage: page }) => ({ default: page })),
);
const Workspace = lazy(() =>
  import("./pages/Workspace").then(({ Workspace: page }) => ({
    default: page,
  })),
);
const SetupPage = lazy(() =>
  import("./pages/SetupPage").then(({ SetupPage: page }) => ({
    default: page,
  })),
);
const StyleguidePage = lazy(() => import("./pages/StyleguidePage"));
const DocumentationLayout = lazy(
  () => import("./components/docs/DocumentationLayout"),
);

// Garde-fou 1 : Protège le workspace (Redirige vers /auth si non connecté)
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const token = hasSession();
  return token ? <>{children}</> : <Navigate to="/auth" replace />;
};

// Garde-fou 2 : Empêche d'accéder à la Landing/Auth si déjà connecté
const PublicOnlyRoute = ({ children }: { children: React.ReactNode }) => {
  const token = hasSession();
  return token ? <Navigate to="/workspace" replace /> : <>{children}</>;
};

function App() {
  const { t } = usePreferences();

  return (
    <Router>
      <ToastProvider>
        <div className="app-root min-h-screen flex flex-col font-sans">
          <Suspense
            fallback={
              <div
                className="flex min-h-screen items-center justify-center"
                role="status"
              >
                <span className="glass rounded-md border px-3 py-1.5 text-sm text-ink-muted">
                  {t("Loading FlowOps...")}
                </span>
              </div>
            }
          >
            <Routes>
              <Route
                path="/"
                element={
                  <PublicOnlyRoute>
                    <LandingPage />
                  </PublicOnlyRoute>
                }
              />

              <Route
                path="/auth"
                element={
                  <PublicOnlyRoute>
                    <AuthPage />
                  </PublicOnlyRoute>
                }
              />

              <Route
                path="/workspace"
                element={
                  <ProtectedRoute>
                    <Workspace />
                  </ProtectedRoute>
                }
              />

              <Route path="/setup" element={<SetupPage />} />
              {import.meta.env.DEV && (
                <Route path="/styleguide" element={<StyleguidePage />} />
              )}
              <Route path="/docs/*" element={<DocumentationLayout />} />

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </div>
      </ToastProvider>
    </Router>
  );
}

export default App;
