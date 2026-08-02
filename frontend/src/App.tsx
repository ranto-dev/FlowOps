// frontend/src/App.tsx
import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  Link,
} from "react-router-dom";
import { AuthPage } from "./pages/AuthPage";
import { Workspace } from "./pages/Workspace";
import { ArrowLeft } from "lucide-react";
import LandingPage from "./pages/LandingPage";

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
  return (
    <Router>
      <div className="min-h-screen bg-white flex flex-col font-sans text-slate-900 selection:bg-purple-100">
        <Routes>
          {/* 1. La Landing Page est désormais la page d'accueil par défaut */}
          <Route
            path="/"
            element={
              <PublicOnlyRoute>
                <LandingPage />
              </PublicOnlyRoute>
            }
          />

          {/* 2. Page d'authentification (avec option de retour à la landing page) */}
          <Route
            path="/auth"
            element={
              <PublicOnlyRoute>
                <div className="relative">
                  {/* Bouton de retour vers la Landing Page */}
                  <Link
                    to="/"
                    className="absolute top-6 left-6 z-50 inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-purple-600 bg-white/80 backdrop-blur border border-slate-200/80 rounded-xl shadow-xs transition-all hover:border-purple-200"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Retour à l'accueil</span>
                  </Link>

                  <AuthPage />
                </div>
              </PublicOnlyRoute>
            }
          />

          {/* 3. Espace de travail protégé */}
          <Route
            path="/workspace"
            element={
              <ProtectedRoute>
                <Workspace />
              </ProtectedRoute>
            }
          />

          {/* Redirection pour les routes inconnues */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
