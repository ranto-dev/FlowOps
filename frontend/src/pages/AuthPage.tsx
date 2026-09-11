import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Loader2,
  ShieldCheck,
  Lock,
  Zap,
  Terminal,
  AlertCircle,
  GitPullRequest,
  Server,
  Sparkles,
  Copy,
  Check,
  ExternalLink,
  CheckCircle2,
} from "lucide-react";
import { FaGithub } from "react-icons/fa6";

interface DeviceCodeInfo {
  device_code: string;
  user_code: string;
  verification_uri: string;
  expires_in: number;
  interval: number;
}

export const AuthPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [phase, setPhase] = useState<"idle" | "waiting">("idle");
  const [deviceInfo, setDeviceInfo] = useState<DeviceCodeInfo | null>(null);
  const [copied, setCopied] = useState(false);
  const [asking, setAsking] = useState(false);
  const [authState, setAuthState] = useState<"waiting" | "success">("waiting");
  const [pollingMs, setPollingMs] = useState(5000);
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

  const popupRef = useRef<Window | null>(null);
  const deviceInfoRef = useRef<DeviceCodeInfo | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Synchronise le ref avec le state (utilisé par le polling)
  deviceInfoRef.current = deviceInfo;

  const closePopup = () => {
    try {
      popupRef.current?.close();
    } catch {
      // ignore
    }
    popupRef.current = null;
  };

  useEffect(() => {
    const token = localStorage.getItem("flowops_token");
    if (token) {
      navigate("/workspace", { replace: true });
      return;
    }

    // Vérifie si le backend est configuré pour l'OAuth GitHub.
    // Si ce n'est pas le cas, on guide l'utilisateur vers la page de setup.
    const checkConfig = async () => {
      try {
        const res = await fetch(`${API_URL}/api/auth/status`);
        if (res.ok) {
          const data = await res.json();
          if (!data.configured) {
            navigate("/setup", { replace: true });
          }
        }
      } catch (error) {
        console.log("Impossible de vérifier la configuration GitHub", error);
      }
    };
    checkConfig();
  }, [navigate, API_URL]);

  // Polling : dès que l'utilisateur valide sur GitHub, on le ramène
  // automatiquement : la popup se ferme toute seule et la connexion réussit.
  useEffect(() => {
    if (phase !== "waiting") return;

    const checkLogin = async () => {
      const info = deviceInfoRef.current;
      if (!info) return;

      setAsking(true);
      try {
        const res = await fetch(`${API_URL}/api/auth/check-login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ device_code: info.device_code }),
        });
        const data = await res.json();

        if (data.status === "success") {
          localStorage.setItem("flowops_token", data.token);
          localStorage.setItem("flowops_user", data.username);
          localStorage.setItem("flowops_avatar", data.avatar_url);
          localStorage.setItem("flowops_github_id", data.github_id);

          setAuthState("success");
          closePopup();
          if (intervalRef.current) clearInterval(intervalRef.current);

          // Redirection automatique vers le workspace, toujours dans ce même onglet
          setTimeout(() => navigate("/workspace", { replace: true }), 1200);
          return;
        }

        if (data.error === "expired_token") {
          setErrorMessage(
            "This authorization code has expired. Please click Generate Code again.",
          );
          setPhase("idle");
          setDeviceInfo(null);
          setLoading(false);
          closePopup();
          if (intervalRef.current) clearInterval(intervalRef.current);
          return;
        }

        if (data.error === "access_denied") {
          setErrorMessage(
            "Authorization was declined on GitHub. You can try again below.",
          );
          setPhase("idle");
          setDeviceInfo(null);
          setLoading(false);
          closePopup();
          if (intervalRef.current) clearInterval(intervalRef.current);
          return;
        }

        // "slow_down" => GitHub nous demande d'espacer les requêtes
        if (data.error === "slow_down") {
          setPollingMs((prev) => Math.min(prev + 5000, 20000));
        }
      } catch (error) {
        console.log("Polling error", error);
      } finally {
        setAsking(false);
      }
    };

    intervalRef.current = setInterval(checkLogin, pollingMs);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [phase, pollingMs, API_URL, navigate]);

  // Nettoyage à la fermeture de la page
  useEffect(() => {
    return () => closePopup();
  }, []);

  const startDeviceFlow = async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const res = await fetch(`${API_URL}/api/auth/device-code`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        if (
          data?.detail &&
          typeof data.detail === "string" &&
          data.detail.toLowerCase().includes("github oauth app is not configured")
        ) {
          navigate("/setup", { replace: true });
          return;
        }
        throw new Error();
      }

      setDeviceInfo(data);
      setPollingMs(Math.max(Number(data.interval) * 1000 || 5000, 5000));
      setPhase("waiting");
      setAuthState("waiting");
    } catch (error) {
      console.log({ error });
      setErrorMessage(
        "Unable to start GitHub authentication. Please check your backend server connection.",
      );
    } finally {
      setLoading(false);
    }
  };

  const copyCode = async () => {
    if (!deviceInfo) return;
    try {
      await navigator.clipboard.writeText(deviceInfo.user_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard non disponible, on ne bloque pas
    }
  };

  // Ouvre GitHub DANS UNE POPUP centrée au-dessus de cet onglet (pas un nouvel
  // onglet) : on reste sur FlowOps, GitHub s'ouvre par-dessus. Le code est
  // pré-rempli pour aller plus vite.
  const openGithub = () => {
    if (!deviceInfo) return;

    const width = 560;
    const height = 700;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;
    const features = `width=${width},height=${height},left=${left},top=${top},menubar=no,toolbar=no,location=yes,status=no,scrollbars=yes,resizable=yes`;

    if (popupRef.current && !popupRef.current.closed) {
      popupRef.current.focus();
      return;
    }

    const url = `${deviceInfo.verification_uri}?user_code=${encodeURIComponent(
      deviceInfo.user_code,
    )}`;
    popupRef.current = window.open(url, "github_device_auth", features);

    // Si le popup a été bloqué, on l'indique clairement
    if (!popupRef.current) {
      setErrorMessage(
        "The GitHub window was blocked by your browser. Please allow popups for FlowOps, then click Continue with GitHub again.",
      );
    }
  };

  return (
    <div className="min-h-screen w-full bg-slate-50 flex flex-col justify-between items-center p-4 sm:p-6 lg:p-10 font-sans text-slate-900 antialiased relative overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-200 h-87.5 bg-purple-100/60 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* TOP HEADER */}
      <header className="w-full max-w-4xl flex items-center justify-between py-2">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-md shadow-purple-600/20">
            <Terminal className="w-5 h-5" />
          </div>
          <div>
            <span className="text-base font-black tracking-tight text-slate-900 flex items-center gap-1.5">
              FlowOps
              <Sparkles className="w-3.5 h-3.5 text-purple-600" />
            </span>
            <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">
              Control Plane
            </span>
          </div>
        </div>

        {/* Live System Indicator */}
        <div className="flex items-center gap-2 bg-white px-3.5 py-1.5 rounded-full border border-slate-200/80 shadow-sm text-xs font-semibold text-slate-700">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>System Operational</span>
        </div>
      </header>

      {/* MAIN CENTERED CARD */}
      <main className="w-full max-w-md my-auto py-6">
        <div className="bg-white border border-slate-200/80 rounded-3xl shadow-xl shadow-slate-200/60 p-8 sm:p-10 space-y-6 text-center relative">
          {/* Header Title */}
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 text-[10px] font-black tracking-widest text-purple-600 bg-purple-50 px-3 py-1 rounded-full uppercase border border-purple-100">
              <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
              Secure Gateway
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              {phase === "waiting" && authState === "waiting"
                ? "Authorize on GitHub"
                : authState === "success"
                  ? "Authentication Successful!"
                  : "Sign in to FlowOps"}
            </h1>
            <p className="text-xs text-slate-500 leading-relaxed max-w-xs mx-auto">
              {phase === "waiting" && authState === "waiting"
                ? "Everything happens right here: GitHub opens above this page, and you're brought back automatically once you've approved."
                : authState === "success"
                  ? "You're signed in. Taking you to your workspace..."
                  : "Authenticate with your GitHub account to manage your CI/CD pipelines."}
            </p>
          </div>

          {/* Error Banner */}
          {errorMessage && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2.5 text-left animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Success banner */}
          {authState === "success" && (
            <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center justify-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Connected to GitHub successfully.</span>
            </div>
          )}

          {phase === "waiting" && deviceInfo && authState === "waiting" ? (
            <div className="space-y-5 pt-1">
              {/* Le code à copier (Device Flow) */}
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 space-y-3">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">
                  Your activation code
                </span>
                <div className="flex items-center justify-center gap-3">
                  <span className="font-mono text-2xl font-black tracking-widest text-slate-900 bg-white border border-slate-200 rounded-xl px-4 py-2.5">
                    {deviceInfo.user_code}
                  </span>
                  <button
                    onClick={copyCode}
                    className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-500 hover:text-purple-600 hover:border-purple-300 transition-all"
                    aria-label="Copy code"
                  >
                    {copied ? (
                      <Check className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Copy this code. It's already pre-filled on GitHub, but you can
                  paste it manually.
                </p>
              </div>

              {/* Bouton : ouvre GitHub dans la même "fenêtre" FlowOps */}
              <button
                onClick={openGithub}
                disabled={asking}
                className="w-full py-4 px-6 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs uppercase tracking-widest rounded-2xl transition-all duration-200 flex items-center justify-center gap-3 shadow-lg shadow-slate-900/15 active:scale-[0.99] disabled:opacity-60 group border border-slate-800"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Continue with GitHub</span>
                {asking && <Loader2 className="w-4 h-4 animate-spin text-slate-300" />}
              </button>

              <div className="space-y-2">
                <div className="flex items-center justify-center gap-2 text-[11px] text-slate-400 font-medium">
                  <Loader2 className="w-3 h-3 animate-spin text-purple-600" />
                  <span>Waiting for your authorization on GitHub...</span>
                </div>
                <p className="text-[11px] text-slate-400 font-medium">
                  No tab switching: as soon as you approve, GitHub closes by
                  itself and you're back on FlowOps.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4 pt-2">
              <button
                onClick={startDeviceFlow}
                disabled={loading}
                className="w-full py-4 px-6 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs uppercase tracking-widest rounded-2xl transition-all duration-200 flex items-center justify-center gap-3 shadow-lg shadow-slate-900/15 active:scale-[0.99] disabled:opacity-50 group border border-slate-800"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin text-slate-300" />
                ) : (
                  <FaGithub className="w-4 h-4" />
                )}
                <span>
                  {loading ? "Contacting GitHub..." : "Continue with GitHub"}
                </span>
              </button>

              <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400 font-medium">
                <Lock className="w-3 h-3 text-slate-400" />
                <span>GitHub opens above this page, then you return automatically.</span>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* FOOTER FEATURE CARDS & METRICS */}
      <footer className="w-full max-w-4xl space-y-6 pt-4">
        {/* Features Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm flex items-start gap-3">
            <div className="p-2 rounded-xl bg-purple-50 text-purple-600 border border-purple-100 shrink-0">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900">Live Telemetry</h4>
              <p className="text-[11px] text-slate-500 leading-normal mt-0.5">
                Real-time log streaming and instant error detection.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm flex items-start gap-3">
            <div className="p-2 rounded-xl bg-purple-50 text-purple-600 border border-purple-100 shrink-0">
              <GitPullRequest className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900">ML Predictions</h4>
              <p className="text-[11px] text-slate-500 leading-normal mt-0.5">
                Pipeline execution duration and risk analysis.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm flex items-start gap-3">
            <div className="p-2 rounded-xl bg-purple-50 text-purple-600 border border-purple-100 shrink-0">
              <Server className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900">High Availability</h4>
              <p className="text-[11px] text-slate-500 leading-normal mt-0.5">
                99.9% SLA uptime for continuous monitoring.
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Legal bar */}
        <div className="flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-200/60 pt-4">
          <span>© FlowOps CI/CD Control Plane</span>
          <div className="flex gap-4">
            <a href="#" className="hover:text-purple-600 transition-colors">
              Documentation
            </a>
            <a href="#" className="hover:text-purple-600 transition-colors">
              Support
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};