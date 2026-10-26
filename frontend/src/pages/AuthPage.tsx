import React, { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  Loader2,
  ShieldCheck,
  Lock,
  Zap,
  Terminal,
  AlertCircle,
  GitPullRequest,
  Copy,
  Check,
  ExternalLink,
  CheckCircle2,
} from "lucide-react";
import { FaGithub } from "react-icons/fa6";
import { apiFetch, isApiError } from "../lib/api";
import type {
  AuthStatus,
  CheckLoginResponse,
  DeviceCodeInfo,
} from "../@types/api";
import { PreferenceControls } from "../components/ui/PreferenceControls";
import { usePreferences } from "../lib/usePreferences";

export const AuthPage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = usePreferences();
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [phase, setPhase] = useState<"idle" | "waiting">("idle");
  const [deviceInfo, setDeviceInfo] = useState<DeviceCodeInfo | null>(null);
  const [copied, setCopied] = useState(false);
  const [asking, setAsking] = useState(false);
  const [authState, setAuthState] = useState<"waiting" | "success">("waiting");
  const [pollingMs, setPollingMs] = useState(5000);

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
        const data = await apiFetch<AuthStatus>("/api/auth/status", {
          auth: false,
        });
        if (!data.configured) {
          navigate("/setup", { replace: true });
        }
      } catch (error) {
        console.error(
          "Impossible de vérifier la configuration GitHub",
          error,
        );
      }
    };
    checkConfig();
  }, [navigate, t]);

  // Polling : dès que l'utilisateur valide sur GitHub, on le ramène
  // automatiquement : la popup se ferme toute seule et la connexion réussit.
  useEffect(() => {
    if (phase !== "waiting") return;

    const checkLogin = async () => {
      const info = deviceInfoRef.current;
      if (!info) return;

      setAsking(true);
      try {
        const data = await apiFetch<CheckLoginResponse>(
          "/api/auth/check-login",
          {
            method: "POST",
            body: { device_code: info.device_code },
            auth: false,
          },
        );

        if (data.status === "success") {
          localStorage.setItem("flowops_token", data.token ?? "");
          localStorage.setItem("flowops_user", data.username ?? "");
          localStorage.setItem("flowops_avatar", data.avatar_url ?? "");
          localStorage.setItem("flowops_github_id", data.github_id ?? "");

          setAuthState("success");
          closePopup();
          if (intervalRef.current) clearInterval(intervalRef.current);

          // Redirection automatique vers le workspace, toujours dans ce même onglet
          setTimeout(() => navigate("/workspace", { replace: true }), 1200);
          return;
        }

        if (data.error === "expired_token") {
          setErrorMessage(
            t("This activation code expired. Generate a new code to try again."),
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
            t("GitHub authorization was denied. You can try again below."),
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
        console.error("Polling error", error);
      } finally {
        setAsking(false);
      }
    };

    intervalRef.current = setInterval(checkLogin, pollingMs);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [phase, pollingMs, navigate, t]);

  // Nettoyage à la fermeture de la page
  useEffect(() => {
    return () => closePopup();
  }, []);

  const startDeviceFlow = async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const data = await apiFetch<DeviceCodeInfo>("/api/auth/device-code", {
        method: "POST",
        auth: false,
      });

      setDeviceInfo(data);
      setPollingMs(Math.max(Number(data.interval) * 1000 || 5000, 5000));
      setPhase("waiting");
      setAuthState("waiting");
    } catch (error) {
      // Un échec vient souvent d'un backend OAuth non configuré : on interroge
      // l'état structuré de /api/auth/status plutôt que de chercher une
      // sous-chaîne dans `detail` (contrat fragile).
      if (isApiError(error)) {
        try {
          const status = await apiFetch<AuthStatus>("/api/auth/status", {
            auth: false,
          });
          if (!status.configured) {
            navigate("/setup", { replace: true });
            return;
          }
        } catch {
          // Statut indisponible : on retombe sur le message générique.
        }
      }
      console.error("Unable to start GitHub authentication", error);
      setErrorMessage(
        t("Could not start GitHub sign-in. Check your connection to the server."),
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
        t("The GitHub window was blocked. Allow pop-ups for FlowOps and try again."),
      );
    }
  };

  return (
    <div className="auth-shell relative min-h-screen w-full overflow-hidden bg-[#050816] px-4 py-6 text-slate-100 antialiased sm:px-6 lg:px-10">
      <div className="pointer-events-none absolute left-1/2 top-0 h-[26rem] w-[42rem] -translate-x-1/2 rounded-full bg-violet-500/20 blur-3xl" />
      <div className="pointer-events-none absolute right-0 top-16 h-80 w-80 rounded-full bg-sky-500/10 blur-3xl" />

      <header className="mx-auto flex w-full max-w-4xl items-center justify-between py-2">
        <div className="flex items-center gap-2.5 rounded-full border border-white/10 bg-slate-900/60 px-4 py-2 shadow-[0_0_30px_rgba(168,85,247,0.15)] backdrop-blur">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-600 text-white shadow-md shadow-violet-600/20">
            <Terminal className="h-5 w-5" />
          </div>
          <div>
            <span className="flex items-center gap-1.5 text-base font-black tracking-tight text-white">
              FlowOps
            </span>
            <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
              {t("Developer platform")}
            </span>
          </div>
        </div>
        <PreferenceControls compact />
      </header>

      <main className="mx-auto my-auto w-full max-w-md py-6">
        <div className="relative space-y-6 rounded-[28px] border border-white/10 bg-slate-950/70 p-8 text-center shadow-[0_30px_80px_rgba(15,23,42,0.6)] backdrop-blur-xl sm:p-10">
          {/* Header Title */}
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 text-[10px] font-black tracking-widest text-purple-600 bg-purple-50 px-3 py-1 rounded-full uppercase border border-purple-100">
              <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
              {t("Secure sign-in")}
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              {phase === "waiting" && authState === "waiting"
                ? t("Authorize on GitHub")
                : authState === "success"
                  ? t("Sign-in successful!")
                  : t("Sign in to FlowOps")}
            </h1>
            <p className="text-xs text-slate-500 leading-relaxed max-w-xs mx-auto">
              {phase === "waiting" && authState === "waiting"
                ? t("GitHub opens over this page. You will return here automatically after authorizing.")
                : authState === "success"
                  ? t("You are signed in. Redirecting to your workspace...")
                  : t("Sign in with GitHub to manage your CI/CD workflows.")}
            </p>
          </div>

          {/* Error Banner */}
          {errorMessage && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2.5 text-left">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Success banner */}
          {authState === "success" && (
            <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center justify-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{t("Successfully connected to GitHub.")}</span>
            </div>
          )}

          {phase === "waiting" && deviceInfo && authState === "waiting" ? (
            <div className="space-y-5 pt-1">
              {/* Le code à copier (Device Flow) */}
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 space-y-3">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">
                  {t("Your activation code")}
                </span>
                <div className="flex items-center justify-center gap-3">
                  <span className="font-mono text-2xl font-black tracking-widest text-slate-900 bg-white border border-slate-200 rounded-xl px-4 py-2.5">
                    {deviceInfo.user_code}
                  </span>
                  <button
                    onClick={copyCode}
                    className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-500 hover:text-purple-600 hover:border-purple-300 transition-all"
                    aria-label={t("Copy activation code")}
                  >
                    {copied ? (
                      <Check className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  {t("Copy this code. It is pre-filled on GitHub, but you can also enter it manually.")}
                </p>
              </div>

              {/* Bouton : ouvre GitHub dans la même "fenêtre" FlowOps */}
              <button
                onClick={openGithub}
                disabled={asking}
                className="w-full py-4 px-6 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs uppercase tracking-widest rounded-2xl transition-all duration-200 flex items-center justify-center gap-3 shadow-lg shadow-slate-900/15 active:scale-[0.99] disabled:opacity-60 group border border-slate-800"
              >
                <ExternalLink className="w-4 h-4" />
                <span>{t("Continue with GitHub")}</span>
                {asking && (
                  <Loader2 className="w-4 h-4 animate-spin text-slate-300" />
                )}
              </button>

              <div className="space-y-2">
                <div className="flex items-center justify-center gap-2 text-[11px] text-slate-400 font-medium">
                  <Loader2 className="w-3 h-3 animate-spin text-purple-600" />
                  <span>{t("Waiting for GitHub authorization…")}</span>
                </div>
                <p className="text-[11px] text-slate-400 font-medium">
                  {t("GitHub closes after authorization and returns you to FlowOps.")}
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
                  {loading ? t("Connecting to GitHub...") : t("Continue with GitHub")}
                </span>
              </button>

              <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400 font-medium">
                <Lock className="w-3 h-3 text-slate-400" />
                <span>
                  {t("GitHub opens over this page. You will return here automatically.")}
                </span>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* FOOTER FEATURE CARDS */}
      <footer className="w-full max-w-4xl space-y-6 pt-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm flex items-start gap-3">
            <div className="p-2 rounded-xl bg-purple-50 text-purple-600 border border-purple-100 shrink-0">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900">
                Device Flow GitHub
              </h4>
              <p className="text-[11px] text-slate-500 leading-normal mt-0.5">
                Authentification OAuth sans mot de passe partagé.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm flex items-start gap-3">
            <div className="p-2 rounded-xl bg-purple-50 text-purple-600 border border-purple-100 shrink-0">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900">
                Workflows low-code
              </h4>
              <p className="text-[11px] text-slate-500 leading-normal mt-0.5">
                Configuration visuelle, YAML généré automatiquement.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm flex items-start gap-3">
            <div className="p-2 rounded-xl bg-purple-50 text-purple-600 border border-purple-100 shrink-0">
              <GitPullRequest className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900">
                Logs & prédictions
              </h4>
              <p className="text-[11px] text-slate-500 leading-normal mt-0.5">
                Suivi temps réel et estimation durée/risque d'échec.
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Legal bar */}
        <div className="flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-200/60 pt-4">
          <span>© FlowOps {t("Developer platform")}</span>
          <div className="flex gap-4">
            <Link to="/setup" className="hover:text-purple-600 transition-colors">
              Configurer GitHub OAuth
            </Link>
            <Link to="/" className="hover:text-purple-600 transition-colors">
              Accueil
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
};