// frontend/src/App.tsx
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { Header } from "./components/Header";
import { Footer } from "./components/Footer";
import { LandingPage } from "./pages/LandingPage";
import { AuthPage } from "./pages/AuthPage";
import { Workspace } from "./pages/Workspace";

// Garde-fou de protection des routes (Vérification du Token)
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const token = localStorage.getItem("flowops_token");
  return token ? <>{children}</> : <Navigate to="/auth" replace />;
};

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-white flex flex-col font-sans text-slate-900 selection:bg-purple-100">
        <Header />

        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route
            path="/workspace"
            element={
              <ProtectedRoute>
                <Workspace />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>

        <Footer />
      </div>
    </Router>
  );
}

export default App;
