import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Check, CheckCircle2, Copy, Loader2 } from "lucide-react";
import { FaGithub } from "react-icons/fa6";
import { apiFetch, isApiError } from "../lib/api";
import type {
  AuthStatus,
  CheckLoginResponse,
  DeviceCodeInfo,
} from "../@types/api";
import { Button } from "../components/ui/Button";
import { ErrorState } from "../components/ui/States";
import { PreferenceControls } from "../components/ui/PreferenceControls";
import { usePreferences } from "../lib/usePreferences";
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
    <div className="relative isolate flex min-h-screen flex-col bg-canvas text-ink antialiased">
      <div className="bg-grid absolute inset-0 -z-10" aria-hidden="true" />
      <div className="aurora aurora-violet left-1/2 top-[-10rem] -z-10 h-[30rem] w-[48rem] -translate-x-1/2" aria-hidden="true" />
      <header className="relative z-10 shrink-0">
        <div className="mx-auto flex h-16 w-full items-center justify-between px-4 sm:px-8">
          <Link
            to="/"
            className="inline-flex items-center gap-2.5 rounded-md text-ink transition-opacity hover:opacity-80 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent-ink"
            aria-label={t("FlowOps home")}
          >
            <img src={Logo} alt="" className="h-8 w-8" />
            <span className="text-base font-semibold tracking-tight">
              FlowOps
            </span>
          </Link>
          <PreferenceControls compact />
        </div>
      </header>

      <main className="relative z-0 flex flex-1 items-center justify-center px-4 py-10 sm:px-8 sm:py-14">
        <section className="glass-strong w-full max-w-md rounded-xl border p-6 sm:p-10">
          <div className="mb-7 text-center">
            <h1 className="text-gradient text-3xl font-semibold leading-tight tracking-tight">
              {isWaiting
                ? t("Authorize on GitHub")
                : authState === "success"
                  ? t("Sign-in successful!")
                  : t("Sign in to FlowOps")}
            </h1>
            <p className="mx-auto mt-3 max-w-xs text-sm text-ink-muted">
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
            <div className="mb-4">
              <ErrorState message={errorMessage} />
            </div>
          )}

          {authState === "success" && (
            <div
              className="mb-4 flex items-center gap-2.5 rounded-lg border border-success/30 bg-success/10 px-4 py-3 text-sm text-success"
              role="status"
            >
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>{t("Successfully connected to GitHub.")}</span>
            </div>
          )}

          {isWaiting && deviceInfo ? (
            <div className="space-y-4">
              <div className="rounded-lg border border-line bg-surface p-4 text-center">
                <p className="mb-4 text-xs text-ink-muted">
                  {t(
                    "Copy this code. It is pre-filled on GitHub, but you can also enter it manually.",
                  )}
                </p>
                <div className="flex items-center justify-center gap-3">
                  <code className="rounded-md border border-line bg-code px-4 py-3 font-mono text-2xl font-semibold tabular-nums text-ink">
                    {deviceInfo.user_code}
                  </code>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={copyCode}
                    className="w-9 px-0"
                    aria-label={t("Copy activation code")}
                    title={t("Copy activation code")}
                  >
                    {copied ? (
                      <Check className="h-4 w-4 text-success" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <Button
                type="button"
                size="lg"
                variant="brand"
                onClick={openGithub}
                disabled={asking}
                className="w-full"
              >
                <FaGithub className="h-4 w-4" aria-hidden="true" />
                <span>{t("Continue with GitHub")}</span>
              </Button>

              <p
                className="flex items-center justify-center gap-2 pt-1 text-xs text-ink-subtle"
                role="status"
              >
                <Loader2 className="h-3.5 w-3.5 animate-spin text-accent-ink" />
                {t("Waiting for GitHub authorization…")}
              </p>
            </div>
          ) : (
            <Button
              type="button"
              size="lg"
              variant="brand"
              onClick={startDeviceFlow}
              loading={loading}
              disabled={authState === "success"}
              className="w-full"
            >
              {!loading && <FaGithub className="h-4 w-4" aria-hidden="true" />}
              <span>
                {loading
                  ? t("Connecting to GitHub...")
                  : t("Continue with GitHub")}
              </span>
            </Button>
          )}

          <div className="mt-5 border-t border-line pt-4 text-center">
            <p className="text-xs text-ink-subtle">
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
