import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertCircle, Check, CheckCircle2, Copy, Loader2 } from "lucide-react";
import { FaGithub } from "react-icons/fa6";
import { apiFetch, isApiError } from "../lib/api";
import type {
  AuthStatus,
  CheckLoginResponse,
  DeviceCodeInfo,
} from "../@types/api";
import { PreferenceControls } from "../components/ui/PreferenceControls";
import { usePreferences } from "../lib/usePreferences";
import { motion } from "framer-motion";
import { Illustration } from "../components/landing/ui/Illustration";
import Logo from "../assets/logo-flowOps-transparent.png";

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

  deviceInfoRef.current = deviceInfo;

  const closePopup = () => {
    try {
      popupRef.current?.close();
    } catch {
      // La fermeture d'une popup peut être refusée par le navigateur.
    }
    popupRef.current = null;
  };

  useEffect(() => {
    if (localStorage.getItem("flowops_token")) {
      navigate("/workspace", { replace: true });
      return;
    }

    const checkConfig = async () => {
      try {
        const data = await apiFetch<AuthStatus>("/api/auth/status", {
          auth: false,
        });
        if (!data.configured) {
          navigate("/setup", { replace: true });
        }
      } catch (error) {
        console.error("Impossible de vérifier la configuration GitHub", error);
      }
    };
    void checkConfig();
  }, [navigate]);

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
          window.setTimeout(
            () => navigate("/workspace", { replace: true }),
            1200,
          );
          return;
        }

        if (data.error === "expired_token") {
          setErrorMessage(
            t(
              "This activation code expired. Generate a new code to try again.",
            ),
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

        if (data.error === "slow_down") {
          setPollingMs((previous) => Math.min(previous + 5000, 20000));
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

  useEffect(() => () => closePopup(), []);

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
          // Le message générique est affiché si le statut OAuth est indisponible.
        }
      }
      console.error("Unable to start GitHub authentication", error);
      setErrorMessage(
        t(
          "Could not start GitHub sign-in. Check your connection to the server.",
        ),
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
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setErrorMessage(t("Could not copy activation code. Copy it manually."));
    }
  };

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

    if (!popupRef.current) {
      setErrorMessage(
        t(
          "The GitHub window was blocked. Allow pop-ups for FlowOps and try again.",
        ),
      );
    }
  };

  const isWaiting =
    phase === "waiting" && deviceInfo && authState === "waiting";

  return (
    <div className="auth-shell relative min-h-screen flex flex-col overflow-hidden bg-gradient-to-b from-[#0a0a0c] to-[#0e0e12] px-5 py-5 text-zinc-100 antialiased sm:px-8">
      <div className="relative pointer-events-none">
        <Illustration className="absolute inset-0 pointer-events-none" />
        <motion.div
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          className="absolute left-1/2 top-[-15rem] -translate-x-1/2 h-[35rem] w-[45rem] rounded-2xl bg-purple-500/5 blur-xl border border-purple-500/20"
        />
      </div>
      <header className="relative z-10 mx-auto flex w-full max-w-6xl items-center justify-between">
        <button
          type="button"
          onClick={() => navigate("/")}
          className="inline-flex items-center gap-2.5 rounded-xl bg-purple-600 text-white px-4 py-2 text-sm font-medium transition hover:bg-purple-500"
          aria-label="Go home"
        >
          <span className="size-4">←</span>
          <span>{t("Retour")}</span>
        </button>
        <PreferenceControls compact />
      </header>

      <main className="relative z-10 flex flex-1 items-center justify-center py-12">
        <section className="auth-card w-full max-w-[400px] rounded-2xl border border-white/[0.07] bg-[#111113]/90 p-6 shadow-lg shadow-black/[0.3] backdrop-blur-xl sm:p-8 sm:rounded-2xl">
          <div className="mb-8 text-center">
            <div className="flex justify-center items-center">
              <img src={Logo} className="w-24" />
            </div>
            <h1 className="font-display text-3xl font-semibold tracking-tight text-white">
              {isWaiting
                ? t("Authorize on GitHub")
                : authState === "success"
                  ? t("Sign-in successful!")
                  : t("Sign in to FlowOps")}
            </h1>
            <p className="mx-auto mt-3 max-w-xs text-sm leading-6 text-zinc-400">
              {isWaiting
                ? t(
                    "GitHub opens over this page. You will return here automatically after authorizing.",
                  )
                : authState === "success"
                  ? t("You are signed in. Redirecting to your workspace...")
                  : t("Sign in with GitHub to manage your CI/CD workflows.")}
            </p>
          </div>

          {errorMessage && (
            <div
              className="mb-4 rounded-xl border border-rose-400/20 bg-rose-400/[0.06] p-3.5 text-left text-sm text-rose-200"
              role="alert"
            >
              <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-rose-300" />
              <span>{errorMessage}</span>
            </div>
          )}

          {authState === "success" && (
            <div
              className="mb-4 rounded-xl border border-emerald-400/20 bg-emerald-400/[0.06] p-3.5 text-sm text-emerald-200"
              role="status"
            >
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-300" />
              <span>{t("Successfully connected to GitHub.")}</span>
            </div>
          )}

          {isWaiting && deviceInfo ? (
            <div className="space-y-4">
              <div className="rounded-xl border border-white/[0.05] bg-black/15 p-4 text-center">
                <p className="mb-4 text-xs text-zinc-400">
                  {t(
                    "Copy this code. It is pre-filled on GitHub, but you can also enter it manually.",
                  )}
                </p>
                <div className="flex items-center justify-center gap-2.5">
                  <code className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 font-mono text-2xl font-semibold tracking-[0.18em] text-white">
                    {deviceInfo.user_code}
                  </code>
                  <button
                    type="button"
                    onClick={copyCode}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-zinc-300 transition hover:border-purple-300/30 hover:bg-white/[0.08] hover:text-white"
                    aria-label={t("Copy activation code")}
                    title={t("Copy activation code")}
                  >
                    {copied ? (
                      <Check className="h-3.5 w-3.5 text-emerald-300" />
                    ) : (
                      <Copy className="h-3.5" />
                    )}
                  </button>
                </div>
              </div>

              <button
                type="button"
                onClick={openGithub}
                disabled={asking}
                className="flex w-full items-center justify-center gap-2.5 rounded-xl bg-purple-600 text-white px-5 py-3 text-sm font-medium transition hover:bg-purple-500 disabled:cursor-wait disabled:opacity-70"
              >
                <FaGithub className="h-3.5 w-3.5 mr-1.5" />
                <span>{t("Continue with GitHub")}</span>
              </button>

              <p
                className="flex items-center justify-center gap-2 pt-1 text-xs text-zinc-500"
                role="status"
              >
                <Loader2 className="h-3 w-3.5 animate-spin text-purple-300" />
                {t("Waiting for GitHub authorization…")}
              </p>
            </div>
          ) : (
            <button
              type="button"
              onClick={startDeviceFlow}
              disabled={loading || authState === "success"}
              className="flex w-full items-center justify-center gap-2.5 rounded-xl bg-purple-600 text-white px-5 py-3 text-sm font-medium transition hover:bg-purple-500 disabled:cursor-wait disabled:opacity-70"
            >
              {loading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <FaGithub className="h-3.5 w-3.5" aria-hidden="true" />
              )}
              <span>
                {loading
                  ? t("Connecting to GitHub...")
                  : t("Continue with GitHub")}
              </span>
            </button>
          )}

          <div className="mt-5 border-t border-white/[0.05] pt-4 text-center">
            <p className="text-xs leading-5 text-zinc-500">
              {t(
                "By continuing, you authorize FlowOps to access your GitHub repositories and workflows.",
              )}
            </p>
          </div>
        </section>
      </main>
    </div>
  );
};
