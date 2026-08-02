// frontend/src/pages/AuthPage.tsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Loader2,
  Key,
  CheckCircle2,
  ExternalLink,
  ShieldCheck,
  Copy,
  Check,
  RefreshCw,
  Zap,
  Terminal,
  Activity,
  AlertCircle,
  GitPullRequest,
  Lock,
} from "lucide-react";

export const AuthPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [deviceInfo, setDeviceInfo] = useState<{
    device_code: string;
    user_code: string;
    verification_uri: string;
    interval: number;
  } | null>(null);

  const [authStatus, setAuthStatus] = useState<"idle" | "waiting" | "success">(
    "idle",
  );
  const [username, setUsername] = useState("");

  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

  // Auto-redirection si session déjà valide
  useEffect(() => {
    const token = localStorage.getItem("flowops_token");
    if (token) {
      navigate("/workspace", { replace: true });
    }
  }, [navigate]);

  const startDeviceFlow = async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const res = await fetch(`${API_URL}/api/auth/device-code`, {
        method: "POST",
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setDeviceInfo(data);
      setAuthStatus("waiting");
    } catch (err) {
      setErrorMessage(
        "Échec d'initialisation du flux OAuth. Vérifiez le serveur backend.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCode = () => {
    if (!deviceInfo?.user_code) return;
    navigator.clipboard.writeText(deviceInfo.user_code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Polling vers le backend
  useEffect(() => {
    if (authStatus !== "waiting" || !deviceInfo) return;

    let currentInterval = (deviceInfo.interval || 5) * 1000;
    let timeoutId: NodeJS.Timeout;

    const pollGitHub = async () => {
      try {
        const res = await fetch(`${API_URL}/api/auth/check-login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ device_code: deviceInfo.device_code }),
        });

        if (!res.ok) {
          timeoutId = setTimeout(pollGitHub, currentInterval);
          return;
        }

        const data = await res.json();

        if (data.status === "success") {
          localStorage.setItem("flowops_token", data.token);
          localStorage.setItem("flowops_user", data.username);
          localStorage.setItem("flowops_avatar", data.avatar_url);
          localStorage.setItem("flowops_github_id", data.github_id);

          setUsername(data.username);
          setAuthStatus("success");

          setTimeout(() => {
            navigate("/workspace", { replace: true });
          }, 1200);
          return;
        }

        if (data.error === "slow_down") {
          currentInterval += 5000;
          timeoutId = setTimeout(pollGitHub, currentInterval);
        } else if (
          data.error === "authorization_pending" ||
          data.error === "waiting_user_validation"
        ) {
          timeoutId = setTimeout(pollGitHub, currentInterval);
        } else if (data.error === "expired_token") {
          setAuthStatus("idle");
          setErrorMessage("Le code d'activation a expiré. Veuillez réessayer.");
        } else if (data.error) {
          setAuthStatus("idle");
          setErrorMessage(`Erreur d'authentification: ${data.error}`);
        }
      } catch (err) {
        timeoutId = setTimeout(pollGitHub, currentInterval);
      }
    };

    timeoutId = setTimeout(pollGitHub, currentInterval);
    return () => clearTimeout(timeoutId);
  }, [authStatus, deviceInfo, navigate, API_URL]);

  return (
    <div className="min-h-screen w-full bg-slate-50 flex items-center justify-center p-4 sm:p-6 lg:p-8 font-sans">
      <div className="w-full max-w-5xl bg-white border border-slate-200/80 rounded-3xl shadow-xl shadow-slate-200/50 overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[600px]">
        {/* ========================================================= */}
        {/* COLONNE GAUCHE : FORMULAIRE DE CONNEXION                  */}
        {/* ========================================================= */}
        <div className="lg:col-span-6 p-8 sm:p-10 flex flex-col justify-between space-y-6">
          {/* Header Carte */}
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black tracking-widest text-purple-600 bg-purple-50 px-3 py-1 rounded-full uppercase border border-purple-100 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
                FlowOps Security Gateway
              </span>

              {/* Status Indicator */}
              <div className="flex items-center gap-1.5 text-[11px] font-medium text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-100">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                System Online
              </div>
            </div>

            <h2 className="text-2xl font-black text-slate-900 tracking-tight mt-6">
              Identity Verification
            </h2>
            <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
              Connectez-vous à la plateforme via le protocole sécurisé GitHub
              Device Code Verification.
            </p>
          </div>

          {/* Zone d'Erreur */}
          {errorMessage && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2.5 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* ÉTAT 1 : IDLE */}
          {authStatus === "idle" && (
            <div className="space-y-4 my-auto py-4">
              <button
                onClick={startDeviceFlow}
                disabled={loading}
                className="w-full py-4 px-6 bg-slate-900 hover:bg-purple-900 text-white font-bold text-xs uppercase tracking-widest rounded-2xl transition-all duration-200 flex items-center justify-center gap-3 shadow-lg shadow-slate-900/10 hover:shadow-purple-900/20 active:scale-[0.99] disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin text-purple-400" />
                ) : (
                  <Key className="w-4 h-4 text-purple-400" />
                )}
                <span>Générer le Code d'Activation</span>
              </button>

              <p className="text-[11px] text-center text-slate-400 flex items-center justify-center gap-1">
                <Lock className="w-3 h-3 text-slate-400" /> Authentification
                sécurisée OAuth 2.0 multi-facteurs
              </p>
            </div>
          )}

          {/* ÉTAT 2 : WAITING (AFFICHAGE DU CODE) */}
          {authStatus === "waiting" && deviceInfo && (
            <div className="space-y-5 border border-dashed border-purple-200 p-5 rounded-2xl bg-purple-50/30 text-left animate-in zoom-in-95 duration-200">
              {/* Code Box */}
              <div className="space-y-1.5 text-center">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                  Votre Code Dynamique
                </p>
                <div className="flex items-center justify-between bg-white border border-slate-200 rounded-xl p-2.5 px-4 shadow-sm">
                  <span className="text-2xl font-mono font-black text-purple-600 tracking-widest select-all">
                    {deviceInfo.user_code}
                  </span>
                  <button
                    onClick={handleCopyCode}
                    className="p-2 rounded-lg bg-slate-50 hover:bg-purple-50 text-slate-600 hover:text-purple-600 transition-colors border border-slate-200"
                    title="Copier le code"
                  >
                    {copied ? (
                      <Check className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Directives */}
              <div className="space-y-2 text-[11px] text-slate-600 leading-relaxed pt-2 border-t border-slate-200/60">
                <p className="flex gap-2">
                  <span className="font-bold text-purple-600">1.</span> Copiez
                  le code d'activation ci-dessus.
                </p>
                <p className="flex gap-2">
                  <span className="font-bold text-purple-600">2.</span> Cliquez
                  sur le lien ci-dessous pour ouvrir le portail GitHub.
                </p>
                <p className="flex gap-2">
                  <span className="font-bold text-purple-600">3.</span> Collez
                  le code et autorisez l'accès FlowOps.
                </p>
              </div>

              {/* Bouton GitHub */}
              <a
                href={deviceInfo.verification_uri}
                target="_blank"
                rel="noreferrer"
                className="w-full py-3.5 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-lg text-center"
              >
                <span>Autoriser sur GitHub</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>

              {/* Footer Polling Status */}
              <div className="flex items-center justify-between text-[11px] text-slate-500 pt-3 border-t border-slate-200/60">
                <div className="flex items-center gap-2">
                  <Loader2 className="w-3.5 h-3.5 text-purple-600 animate-spin" />
                  <span>En attente de la validation GitHub...</span>
                </div>
                <button
                  onClick={() => setAuthStatus("idle")}
                  className="p-1 hover:bg-slate-200/50 rounded transition-colors text-slate-400 hover:text-slate-600"
                  title="Recommencer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* ÉTAT 3 : SUCCESS */}
          {authStatus === "success" && (
            <div className="space-y-3 py-8 text-center my-auto animate-in zoom-in-95 duration-200">
              <div className="w-14 h-14 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center border border-emerald-200 shadow-sm mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">
                  Connexion Réussie !
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Accès accordé. Bienvenue,{" "}
                  <span className="font-mono text-purple-600 font-bold">
                    {username}
                  </span>
                </p>
              </div>
            </div>
          )}

          {/* Footer légal / Aide */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
            <span>© FlowOps CI/CD</span>
            <a href="#" className="hover:text-purple-600 transition-colors">
              Support & Documentation
            </a>
          </div>
        </div>

        {/* ========================================================= */}
        {/* COLONNE DROITE : PANNEAU DE PRESENTATION & STATS          */}
        {/* ========================================================= */}
        <div className="lg:col-span-6 bg-slate-900 p-8 sm:p-10 text-white flex flex-col justify-between relative overflow-hidden">
          {/* Éléments visuels de fond (Halo violet) */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

          {/* Section Haut : Titre + Valeur Ajoutée */}
          <div className="relative z-10 space-y-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-purple-600/30 border border-purple-500/30 flex items-center justify-center text-purple-400">
                <Terminal className="w-4 h-4" />
              </div>
              <span className="text-sm font-black tracking-tight text-white">
                FlowOps Control Plane
              </span>
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-bold tracking-tight text-slate-100">
                Supervision CI/CD Temps Réel
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Visualisez vos workflows GitHub Actions, suivez la progression
                étape par étape et déboguez directement depuis une interface
                unifiée.
              </p>
            </div>

            {/* Grille de Fonctionnalités Clés */}
            <div className="space-y-3 pt-2">
              <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-800/50 border border-slate-700/50">
                <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
                  <Zap className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-200">
                    Live Log Streaming
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    Console terminal réactive avec remontée automatique des
                    erreurs.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-800/50 border border-slate-700/50">
                <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
                  <GitPullRequest className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-200">
                    Pipeline Visualization
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    Représentation fluide des builds, branches et jobs
                    dépendants.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Section Bas : Statistiques Clés */}
          <div className="relative z-10 pt-8 border-t border-slate-800 grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-lg font-black text-white font-mono">
                99.9%
              </div>
              <div className="text-[10px] text-slate-400 font-medium uppercase mt-0.5">
                Uptime SLA
              </div>
            </div>

            <div>
              <div className="text-lg font-black text-purple-400 font-mono flex items-center justify-center gap-1">
                <Activity className="w-4 h-4" /> Realtime
              </div>
              <div className="text-[10px] text-slate-400 font-medium uppercase mt-0.5">
                Logs Sync
              </div>
            </div>

            <div>
              <div className="text-lg font-black text-white font-mono">
                &lt; 200ms
              </div>
              <div className="text-[10px] text-slate-400 font-medium uppercase mt-0.5">
                Latency
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
