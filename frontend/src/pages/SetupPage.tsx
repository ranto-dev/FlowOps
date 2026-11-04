import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Copy,
  ExternalLink,
  FileText,
  Settings,
  ShieldCheck,
  Terminal,
  Loader2,
  RefreshCw,
  Server,
} from "lucide-react";
import { FaGithub } from "react-icons/fa6";
import { apiFetch, API_URL } from "../lib/api";
import type { AuthStatus } from "../@types/api";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { CodeSurface } from "../components/ui/CodeSurface";
import { ErrorState } from "../components/ui/States";
import { PreferenceControls } from "../components/ui/PreferenceControls";
import { usePreferences } from "../lib/usePreferences";

/**
 * Page d'installation : guide l'utilisateur pour créer son propre GitHub OAuth App
 * et renseigner ses credentials dans le fichier .env du backend.
 */
export const SetupPage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = usePreferences();

  const [status, setStatus] = useState<
    "checking" | "ready" | "not_configured" | "error"
  >(
    "checking",
  );
  const [missingVars, setMissingVars] = useState<string[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copyError, setCopyError] = useState(false);

  const checkConfig = useCallback(async () => {
    setStatus("checking");
    try {
      const data = await apiFetch<AuthStatus>("/api/auth/status", {
        auth: false,
      });
      if (data.configured) {
        setStatus("ready");
      } else {
        setMissingVars(data.missing_env_vars || []);
        setStatus("not_configured");
      }
    } catch {
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    checkConfig();
  }, [checkConfig]);

  const handleCopy = async (text: string, key: string) => {
    setCopyError(false);
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(key);
      window.setTimeout(() => setCopiedId(null), 2000);
    } catch {
      setCopyError(true);
    }
  };

  const steps = [
    {
      icon: <FaGithub className="w-4 h-4" />,
      title: "Create a GitHub OAuth App",
      description:
        "Open https://github.com/settings/developers and click “New OAuth App”.",
    },
    {
      icon: <Settings className="w-4 h-4" />,
      title: "Fill in the application details",
      description:
        "Application name: FlowOps — Homepage URL: http://localhost:5173 — Authorization callback URL: http://localhost:5173/auth (required when creating the app; Device Flow does not use it).",
    },
    {
      icon: <ShieldCheck className="w-4 h-4" />,
      title: "Copy the Client ID and Client Secret",
      description:
        "After creating the app, copy both values shown on the page.",
    },
    {
      icon: <FileText className="w-4 h-4" />,
      title: "Configure backend/.env",
      description:
        "Open backend/.env (create it from backend/.env.example) and add your values to GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET.",
    },
    {
      icon: <Server className="w-4 h-4" />,
      title: "Restart the backend",
      description:
        "Restart uvicorn so the updated environment variables are loaded.",
    },
  ];

  const copyBlocks = [
    {
      key: "env_example",
      label: "backend/.env.example template",
      content: `GITHUB_CLIENT_ID=votre_client_id_github
GITHUB_CLIENT_SECRET=votre_client_secret_github
MONGO_URI=mongodb://localhost:27017/`,
    },
    {
      key: "device_uri",
      label: "OAuth endpoint",
      content: `${API_URL}/api/auth/device-code`,
    },
  ];


  return (
    <div className="flex min-h-screen w-full flex-col bg-canvas text-ink antialiased">
      {/* HEADER */}
      <header className="mx-auto flex w-full max-w-4xl items-center justify-between px-4 py-4 sm:px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-accent text-white">
            <Terminal className="h-5 w-5" />
          </div>
          <div>
            <span className="block text-base font-semibold">FlowOps</span>
            <span className="block text-xs text-ink-subtle">
              {t("One-time setup")}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <PreferenceControls compact />
          <Button type="button" variant="secondary" size="sm" onClick={checkConfig}>
            <RefreshIcon spinning={status === "checking"} />
            {t("Check again")}
          </Button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-4xl px-4 py-6 pb-16 sm:px-6">
        {/* BANNER DE STATUT */}
        {status === "checking" && (
          <Card className="mb-6 flex items-center gap-3 p-4 text-sm text-ink-muted">
            <Loader2 className="h-5 w-5 animate-spin text-accent-ink" />
            {t("Checking GitHub configuration...")}
          </Card>
        )}

        {status === "ready" && (
          <div className="mb-6 flex items-start gap-3 rounded-lg border border-success/30 bg-success/10 p-4">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-success" />
            <div className="text-sm">
              <p className="font-medium text-success">
                {t("GitHub is configured")}
              </p>
              <p className="text-ink-muted">
                {t("The backend detected your GitHub OAuth App. You can now sign in.")}
              </p>
              <Button
                type="button"
                size="sm"
                className="mt-3"
                onClick={() => navigate("/auth")}
              >
                {t("Go to sign in")}
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        )}

        {status === "error" && (
          <div className="mb-6">
            <ErrorState
              message={`${t("Could not check GitHub configuration")}. ${t("The backend is unavailable. Check that it is running, then try again.")}`}
            />
          </div>
        )}

        {status === "not_configured" && (
          <div className="mb-6 flex items-start gap-3 rounded-lg border border-warning/30 bg-warning/10 p-4">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-warning" />
            <div className="text-sm">
              <p className="font-medium text-warning">
                {t("GitHub OAuth App is not configured")}
              </p>
              <p className="text-ink-muted">
                {t("The backend could not find these environment variables:")}
                <span className="font-mono font-medium text-ink">
                  {" "}
                  {missingVars.length > 0
                    ? missingVars.join(", ")
                    : t("none")}{" "}
                </span>
                . {t("Follow the steps below to create your OAuth App.")}
              </p>
            </div>
          </div>
        )}

        {/* CARTE EXPLICATIVE */}
        <Card className="space-y-8 p-6 sm:p-8">
          <div className="space-y-3">
            <Badge tone="purple">
              <ShieldCheck className="h-3.5 w-3.5" />
              {t("Configuration required")}
            </Badge>
            <h1 className="text-2xl font-semibold">
              {t("Connect FlowOps to your GitHub account")}
            </h1>
            <p className="max-w-xl text-sm text-ink-muted">
              {t("FlowOps uses GitHub OAuth Device Flow to securely connect to your repositories. Create your own GitHub OAuth App and add its credentials to your local backend configuration.")}
              {" "}
              {t("Credentials are provided through environment variables and are not hard-coded in the source.")}
            </p>
          </div>

          <ol className="space-y-3">
            {steps.map((step, i) => (
              <li
                key={step.title}
                className="flex items-start gap-4 rounded-lg border border-line bg-surface-2 p-4"
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-semibold text-white">
                  {i + 1}
                </span>
                <div className="pt-0.5">
                  <div className="flex items-center gap-2 text-sm font-medium text-ink">
                    <span className="text-accent-ink">{step.icon}</span>
                    {t(step.title)}
                  </div>
                  <p className="mt-1 text-xs text-ink-muted">
                    {t(step.description)}
                  </p>
                </div>
              </li>
            ))}
          </ol>

          <div className="space-y-4">
            <h2 className="text-base font-semibold text-ink">
              {t("Reference files")}
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {copyBlocks.map((block) => (
                <div key={block.key} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-ink-muted">
                      {block.label}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCopy(block.content, block.key)}
                      title={t("Copy")}
                      aria-label={t("Copy")}
                    >
                      {copiedId === block.key ? (
                        <CheckCircle2 className="h-4 w-4 text-success" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  <CodeSurface className="whitespace-pre-wrap break-all">
                    {block.content}
                  </CodeSurface>
                </div>
              ))}
            </div>
          </div>

          {copyError && (
            <p className="text-sm text-danger" role="alert">
              {t("Copy failed. Please check clipboard permissions.")}
            </p>
          )}

          <div className="flex flex-col items-stretch justify-between gap-4 rounded-lg border border-accent/30 bg-accent/15 p-4 sm:flex-row sm:items-center">
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-ink">
                {t("Create my GitHub OAuth App")}
              </h3>
              <p className="text-xs text-ink-muted">
                {t("Creating an OAuth App is free.")}
              </p>
            </div>
            <a
              href="https://github.com/settings/developers"
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-9 items-center justify-center gap-2 rounded-md bg-accent px-4 text-sm font-medium text-white transition-colors duration-150 hover:bg-accent-hover"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              {t("Open GitHub Developers")}
            </a>
          </div>
        </Card>

        <div className="mt-8 flex items-center justify-between">
          <Button type="button" variant="ghost" size="sm" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-3.5 w-3.5" />
            {t("Back")}
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={() => navigate("/auth")}>
            {t("Go to sign in")}
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </main>
    </div>
  );
};

const RefreshIcon: React.FC<{ spinning: boolean }> = ({ spinning }) =>
  spinning ? (
    <Loader2 className="h-3.5 w-3.5 animate-spin" />
  ) : (
    <RefreshCw className="h-3.5 w-3.5" />
  );
