// frontend/src/pages/AuthPage.tsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Loader2,
  Key,
  CheckCircle,
  ExternalLink,
  ShieldCheck,
} from "lucide-react";

export const AuthPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
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

  // 🔄 PROTECTION INTERNE : Auto-redirection si un jeton de session est déjà valide
  useEffect(() => {
    const token = localStorage.getItem("flowops_token");
    if (token) {
      navigate("/workspace", { replace: true });
    }
  }, [navigate]);

  const startDeviceFlow = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/auth/device-code`, {
        method: "POST",
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setDeviceInfo(data);
      setAuthStatus("waiting");
    } catch (err) {
      alert(
        "Failed to initialize GitHub API Authentication Flow. Check backend server.",
      );
    } finally {
      setLoading(false);
    }
  };

  // ⏳ Boucle de Polling Récursive Adaptative (Respecte les limitations 'slow_down' de GitHub)
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
          // Écriture immédiate de la session utilisateur
          localStorage.setItem("flowops_token", data.token);
          localStorage.setItem("flowops_user", data.username);
          localStorage.setItem("flowops_avatar", data.avatar_url);
          localStorage.setItem("flowops_github_id", data.github_id);

          setUsername(data.username);
          setAuthStatus("success");

          // Redirection atomique immédiate vers le workspace
          navigate("/workspace", { replace: true });
          return;
        }

        if (data.error === "slow_down") {
          currentInterval += 5000; // Ralentissement demandé par l'API
          timeoutId = setTimeout(pollGitHub, currentInterval);
        } else if (
          data.error === "authorization_pending" ||
          data.error === "waiting_user_validation"
        ) {
          timeoutId = setTimeout(pollGitHub, currentInterval); // Attente standard
        } else if (data.error) {
          setAuthStatus("idle");
          alert(`Authentication Error: ${data.error}`);
        }
      } catch (err) {
        timeoutId = setTimeout(pollGitHub, currentInterval);
      }
    };

    timeoutId = setTimeout(pollGitHub, currentInterval);
    return () => clearTimeout(timeoutId);
  }, [authStatus, deviceInfo, navigate, API_URL]);

  return (
    <div className="flex-1 flex items-center justify-center bg-slate-50 px-4 py-12 animate-in fade-in duration-200">
      <div className="w-full max-w-md border border-slate-100 bg-white p-8 rounded-3xl shadow-xl text-center space-y-6">
        <div className="flex flex-col items-center space-y-2">
          <span className="text-[10px] font-extrabold tracking-widest text-purple-600 bg-purple-50 px-2.5 py-1 rounded-full uppercase border border-purple-100 flex items-center gap-1">
            <ShieldCheck className="w-3 h-3" /> FlowOps Security Gateway
          </span>
          <h2 className="text-xl font-black text-slate-900 tracking-tight mt-2">
            Identity Verification
          </h2>
          <p className="text-xs text-slate-400 max-w-xs">
            Connect using GitHub Device Verification API Code. Safe, fast, and
            multi-factor ready.
          </p>
        </div>

        {authStatus === "idle" && (
          <button
            onClick={startDeviceFlow}
            disabled={loading}
            className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-3 shadow-md disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Key className="w-4 h-4" />
            )}
            Generate Activation Code
          </button>
        )}

        {authStatus === "waiting" && deviceInfo && (
          <div className="space-y-5 border border-dashed border-slate-200 p-5 rounded-2xl bg-slate-50/50 text-left animate-in zoom-in-95 duration-200">
            <div className="space-y-1.5 text-center">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                Your Activation Code
              </p>
              <div className="text-2xl font-mono font-black text-purple-600 bg-white tracking-widest py-3 border border-slate-200 rounded-xl shadow-sm select-all">
                {deviceInfo.user_code}
              </div>
            </div>

            <div className="space-y-2 text-[11px] text-slate-500 leading-relaxed pt-2 border-t border-slate-100">
              <p className="flex gap-2">
                <span className="font-bold text-purple-600">1.</span> Copy the
                dynamic token above.
              </p>
              <p className="flex gap-2">
                <span className="font-bold text-purple-600">2.</span> Click the
                link below to reach the secure GitHub portal.
              </p>
              <p className="flex gap-2">
                <span className="font-bold text-purple-600">3.</span> Paste the
                activation code and allow authorizations.
              </p>
            </div>

            <a
              href={deviceInfo.verification_uri}
              target="_blank"
              rel="noreferrer"
              className="w-full py-3 bg-gradient-to-r from-violet-600 to-purple-600 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 shadow-md hover:opacity-95 text-center"
            >
              Authorize on GitHub <ExternalLink className="w-3.5 h-3.5" />
            </a>

            <div className="flex items-center justify-center gap-2 text-[11px] text-slate-400 pt-3 border-t border-slate-100">
              <Loader2 className="w-3.5 h-3.5 text-purple-500 animate-spin" />
              Waiting for GitHub validation handshake...
            </div>
          </div>
        )}

        {authStatus === "success" && (
          <div className="space-y-3 py-6 animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center border border-emerald-100 shadow-sm mx-auto">
              <CheckCircle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900">
                Handshake Successful!
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Access granted. Welcome back,{" "}
                <span className="font-mono text-purple-600 font-bold">
                  {username}
                </span>
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
