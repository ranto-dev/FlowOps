import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Copy,
  ExternalLink,
  FileText,
  Settings,
  ShieldCheck,
  Sparkles,
  Terminal,
  Loader2,
  AlertCircle,
  RefreshCw,
  Server,
} from "lucide-react";
import { FaGithub } from "react-icons/fa6";
import { apiFetch, API_URL } from "../lib/api";
import type { AuthStatus } from "../@types/api";
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
    <div className="setup-shell min-h-screen w-full bg-slate-50 flex flex-col font-sans text-slate-900 antialiased relative overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[350px] bg-purple-100/60 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* HEADER */}
      <header className="w-full max-w-4xl mx-auto flex items-center justify-between py-4 px-4 sm:px-6">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-md shadow-purple-600/20">
            <Terminal className="w-5 h-5" />
          </div>
          <div>
            <span className="text-base font-black tracking-tight flex items-center gap-1.5">
              FlowOps
              <Sparkles className="w-3.5 h-3.5 text-purple-600" />
            </span>
            <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">
              {t("One-time setup")}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <PreferenceControls compact />
          <button
            type="button"
            onClick={checkConfig}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-600 hover:text-purple-700 bg-white border border-slate-200/80 rounded-xl shadow-sm transition-all hover:border-purple-200"
          >
            <RefreshIcon spinning={status === "checking"} />
            {t("Check again")}
          </button>
        </div>
      </header>

      <main className="w-full max-w-4xl mx-auto px-4 sm:px-6 py-6 pb-16">
        {/* BANNER DE STATUT */}
        {status === "checking" && (
          <div className="mb-6 p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm flex items-center gap-3 text-sm text-slate-600">
            <Loader2 className="w-5 h-5 text-purple-600 animate-spin" />
            {t("Checking GitHub configuration...")}
          </div>
        )}

        {status === "ready" && (
          <div className="mb-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-bold text-emerald-800">
                {t("GitHub is configured")}
              </p>
              <p className="text-emerald-700">
                {t("The backend detected your GitHub OAuth App. You can now sign in.")}
              </p>
              <button
                onClick={() => navigate("/auth")}
                className="mt-3 inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-sm"
              >
                {t("Go to sign in")}
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {status === "error" && (
          <div
            className="mb-6 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"
            role="alert"
          >
            <AlertCircle className="mt-0.5 size-5 shrink-0 text-red-600" />
            <div>
              <p className="font-bold">{t("Could not check GitHub configuration")}</p>
              <p className="mt-1">{t("The backend is unavailable. Check that it is running, then try again.")}</p>
            </div>
          </div>
        )}

        {status === "not_configured" && (
          <div className="mb-6 p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-bold text-amber-800">
                {t("GitHub OAuth App is not configured")}
              </p>
              <p className="text-amber-700">
                {t("The backend could not find these environment variables:")}
                <span className="font-mono font-bold">
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
        <div className="bg-white border border-slate-200/80 rounded-3xl shadow-xl shadow-slate-200/60 p-8 sm:p-10 space-y-8">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 text-[10px] font-black tracking-widest text-purple-600 bg-purple-50 px-3 py-1 rounded-full uppercase border border-purple-100">
              <ShieldCheck className="w-3.5 h-3.5" />
              {t("Configuration required")}
            </div>
            <h1 className="text-2xl font-black tracking-tight">
              {t("Connect FlowOps to your GitHub account")}
            </h1>
            <p className="text-sm text-slate-500 leading-relaxed max-w-xl">
              {t("FlowOps uses GitHub OAuth Device Flow to securely connect to your repositories. Create your own GitHub OAuth App and add its credentials to your local backend configuration.")}
              {" "}
              {t("Credentials are provided through environment variables and are not hard-coded in the source.")}
            </p>
          </div>

          <ol className="space-y-3">
            {steps.map((step, i) => (
              <li
                key={step.title}
                className="flex items-start gap-3.5 bg-slate-50/80 border border-slate-100 rounded-2xl p-4"
              >
                <div className="flex flex-col items-center shrink-0">
                  <span className="w-7 h-7 rounded-full bg-purple-600 text-white text-xs font-black flex items-center justify-center shadow-sm">
                    {i + 1}
                  </span>
                  {i < steps.length - 1 && (
                    <span className="w-px flex-1 bg-purple-200 my-1" />
                  )}
                </div>
                <div className="pt-0.5">
                  <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
                    <span className="text-purple-600">{step.icon}</span>
                    {t(step.title)}
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed mt-1">
                    {t(step.description)}
                  </p>
                </div>
              </li>
            ))}
          </ol>

          <div className="space-y-4">
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">
              {t("Reference files")}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {copyBlocks.map((block) => (
                <div
                  key={block.key}
                  className="bg-slate-900 rounded-2xl p-4 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      {block.label}
                    </span>
                    <button
                      onClick={() => handleCopy(block.content, block.key)}
                      className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-colors"
                      title={t("Copy")}
                    >
                      {copiedId === block.key ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                  <pre className="font-mono text-[11px] text-emerald-300 whitespace-pre-wrap break-all leading-relaxed">
                    {block.content}
                  </pre>
                </div>
              ))}
            </div>
          </div>

          {copyError && (
            <p className="text-sm text-red-600" role="alert">
              {t("Copy failed. Please check clipboard permissions.")}
            </p>
          )}

          <div className="flex flex-col sm:flex-row items-stretch justify-between gap-4 bg-purple-50/60 border border-purple-100 rounded-2xl p-5">
            <div className="space-y-1">
              <h3 className="text-sm font-black text-slate-900">
                {t("Create my GitHub OAuth App")}
              </h3>
              <p className="text-xs text-slate-500">
                {t("Creating an OAuth App is free.")}
              </p>
            </div>
            <a
              href="https://github.com/settings/developers"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-md"
            >
              <ExternalLink className="w-3.5 h-3.5 text-purple-400" />
              {t("Open GitHub Developers")}
            </a>
          </div>
        </div>

        <div className="mt-8 flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-purple-600 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            {t("Back")}
          </button>
          <button
            onClick={() => navigate("/auth")}
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-purple-600 transition-colors"
          >
            {t("Go to sign in")}
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </main>
    </div>
  );
};

const RefreshIcon: React.FC<{ spinning: boolean }> = ({ spinning }) =>
  spinning ? (
    <Loader2 className="w-3.5 h-3.5 animate-spin" />
  ) : (
    <RefreshCw className="w-3.5 h-3.5" />
  );