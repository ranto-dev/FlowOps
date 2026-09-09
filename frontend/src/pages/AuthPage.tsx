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
  AlertCircle,
  GitPullRequest,
  Lock,
  ArrowRight,
  Sparkles,
  Server,
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

  const startDeviceFlow = async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const res = await fetch(`${API_URL}/api/auth/device-code`, {
        method: "POST",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
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
      const data = await res.json();
      setDeviceInfo(data);
      setAuthStatus("waiting");
    } catch (error) {
      console.log({ error });
      setErrorMessage(
        "OAuth initialization failed. Please check your backend server connection.",
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

  // Backend polling
  useEffect(() => {
    if (authStatus !== "waiting" || !deviceInfo) return;

    let currentInterval = (deviceInfo.interval || 5) * 1000;
    let timeoutId: ReturnType<typeof setTimeout>;

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
          setErrorMessage("The activation code has expired. Please try again.");
        } else if (data.error) {
          setAuthStatus("idle");
          setErrorMessage(`Authentication error: ${data.error}`);
        }
      } catch (error) {
        console.log(error);
        timeoutId = setTimeout(pollGitHub, currentInterval);
      }
    };

    timeoutId = setTimeout(pollGitHub, currentInterval);
    return () => clearTimeout(timeoutId);
  }, [authStatus, deviceInfo, navigate, API_URL]);

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
              Sign in to FlowOps
            </h1>
            <p className="text-xs text-slate-500 leading-relaxed max-w-xs mx-auto">
              Authenticate via GitHub Device Protocol to manage your CI/CD
              pipelines.
            </p>
          </div>

          {/* Error Banner */}
          {errorMessage && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2.5 text-left animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* STATE 1: IDLE */}
          {authStatus === "idle" && (
            <div className="space-y-4 pt-2">
              <button
                onClick={startDeviceFlow}
                disabled={loading}
                className="w-full py-4 px-6 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs uppercase tracking-widest rounded-2xl transition-all duration-200 flex items-center justify-center gap-3 shadow-lg shadow-purple-600/20 active:scale-[0.99] disabled:opacity-50 group"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin text-purple-200" />
                ) : (
                  <Key className="w-4 h-4 text-purple-200 group-hover:rotate-12 transition-transform" />
                )}
                <span>Generate Activation Code</span>
                <ArrowRight className="w-4 h-4 text-purple-200 ml-auto group-hover:translate-x-1 transition-transform" />
              </button>

              <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400 font-medium">
                <Lock className="w-3 h-3 text-slate-400" />
                <span>OAuth 2.0 Encrypted Flow</span>
              </div>
            </div>
          )}

          {/* STATE 2: WAITING FOR AUTHORIZATION */}
          {authStatus === "waiting" && deviceInfo && (
            <div className="space-y-5 text-left bg-purple-50/50 p-5 rounded-2xl border border-purple-100 animate-in zoom-in-95 duration-200">
              {/* Big Code Box */}
              <div className="space-y-1.5 text-center">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                  Your One-Time Code
                </span>
                <div className="flex items-center justify-between bg-white border border-purple-200 rounded-xl p-3 px-4 shadow-sm">
                  <span className="text-2xl font-mono font-black text-purple-600 tracking-widest select-all">
                    {deviceInfo.user_code}
                  </span>
                  <button
                    onClick={handleCopyCode}
                    className="p-2 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-700 transition-colors border border-purple-200/60"
                    title="Copy Code"
                  >
                    {copied ? (
                      <Check className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Steps */}
              <div className="space-y-2 text-[11px] text-slate-600 leading-relaxed pt-2 border-t border-purple-100">
                <div className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded-full bg-purple-100 text-purple-700 font-bold flex items-center justify-center text-[10px]">
                    1
                  </span>
                  <span>Copy your code above.</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded-full bg-purple-100 text-purple-700 font-bold flex items-center justify-center text-[10px]">
                    2
                  </span>
                  <span>Click below to open GitHub login page.</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded-full bg-purple-100 text-purple-700 font-bold flex items-center justify-center text-[10px]">
                    3
                  </span>
                  <span>Paste code to authorize FlowOps.</span>
                </div>
              </div>

              {/* GitHub Button */}
              <a
                href={deviceInfo.verification_uri}
                target="_blank"
                rel="noreferrer"
                className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-lg text-center"
              >
                <span>Authorize on GitHub</span>
                <ExternalLink className="w-3.5 h-3.5 text-purple-400" />
              </a>

              {/* Status Polling Bar */}
              <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-purple-100">
                <div className="flex items-center gap-2">
                  <Loader2 className="w-3.5 h-3.5 text-purple-600 animate-spin" />
                  <span>Waiting for validation...</span>
                </div>
                <button
                  onClick={() => setAuthStatus("idle")}
                  className="p-1 hover:bg-purple-100 rounded transition-colors text-slate-400 hover:text-slate-600"
                  title="Restart"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* STATE 3: SUCCESS */}
          {authStatus === "success" && (
            <div className="space-y-3 py-6 text-center animate-in zoom-in-95 duration-200">
              <div className="w-14 h-14 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center border border-emerald-200 shadow-sm mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">
                  Authentication Successful!
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Welcome back,{" "}
                  <span className="font-mono text-purple-600 font-bold">
                    {username}
                  </span>
                </p>
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
              <h4 className="text-xs font-bold text-slate-900">
                Live Telemetry
              </h4>
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
              <h4 className="text-xs font-bold text-slate-900">
                ML Predictions
              </h4>
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
              <h4 className="text-xs font-bold text-slate-900">
                High Availability
              </h4>
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
