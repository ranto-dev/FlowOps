// frontend/src/App.tsx
import { lazy, Suspense } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  Link,
} from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { ToastProvider } from "./components/ui/Toast";
import { usePreferences } from "./lib/usePreferences";

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
const DocsPage = lazy(() =>
  import("./pages/DocsPage").then(({ DocsPage: page }) => ({ default: page })),
);

// Garde-fou 1 : Protège le workspace (Redirige vers /auth si non connecté)
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const token = localStorage.getItem("flowops_token");
  return token ? <>{children}</> : <Navigate to="/auth" replace />;
};

// Garde-fou 2 : Empêche d'accéder à la Landing/Auth si déjà connecté
const PublicOnlyRoute = ({ children }: { children: React.ReactNode }) => {
  const token = localStorage.getItem("flowops_token");
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
                className="flex min-h-screen items-center justify-center text-sm text-slate-500"
                role="status"
              >
                {t("Loading FlowOps...")}
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
                    <div className="relative">
                      <Link
                        to="/"
                        className="absolute left-6 top-6 z-50 inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white/80 px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm backdrop-blur transition hover:border-violet-300 hover:text-violet-700 dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-200"
                      >
                        <ArrowLeft className="h-3.5 w-3.5" />
                        <span>{t("Return home")}</span>
                      </Link>

                      <AuthPage />
                    </div>
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
              <Route path="/docs" element={<DocsPage />} />

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </div>
      </ToastProvider>
    </Router>
  );
}

export default App;
