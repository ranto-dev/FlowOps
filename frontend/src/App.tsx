// frontend/src/App.tsx
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthPage } from "./pages/AuthPage";
import { Workspace } from "./pages/Workspace";
import React from "react";

// Garde-fou de sécurité : Redirige vers /auth si la session est inexistante
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const token = localStorage.getItem("flowops_token");
  return token ? <>{children}</> : <Navigate to="/auth" replace />;
};

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-white flex flex-col font-sans text-slate-900 selection:bg-purple-100">
        <Routes>
          {/* Route racine redirige intelligemment vers le workspace (qui filtrera si non-authentifié) */}
          <Route path="/" element={<Navigate to="/workspace" replace />} />

          {/* Page d'authentification par code API */}
          <Route path="/auth" element={<AuthPage />} />

          {/* Espace de travail sécurisé */}
          <Route
            path="/workspace"
            element={
              <ProtectedRoute>
                <Workspace />
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<Navigate to="/auth" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
