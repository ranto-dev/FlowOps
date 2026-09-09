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

/**
 * Page d'installation : guide l'utilisateur pour créer son propre GitHub OAuth App
 * et renseigner ses credentials dans le fichier .env du backend.
 */
export const SetupPage: React.FC = () => {
  const navigate = useNavigate();
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

  const [status, setStatus] = useState<"checking" | "ready" | "not_configured">(
    "checking",
  );
  const [missingVars, setMissingVars] = useState<string[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const checkConfig = useCallback(async () => {
    setStatus("checking");
    try {
      const res = await fetch(`${API_URL}/api/auth/status`);
      if (res.ok) {
        const data = await res.json();
        if (data.configured) {
          setStatus("ready");
        } else {
          setMissingVars(data.missing_env_vars || []);
          setStatus("not_configured");
        }
      } else {
        setMissingVars(["GITHUB_CLIENT_ID", "GITHUB_CLIENT_SECRET"]);
        setStatus("not_configured");
      }
    } catch {
      setMissingVars(["GITHUB_CLIENT_ID", "GITHUB_CLIENT_SECRET"]);
      setStatus("not_configured");
    }
  }, [API_URL]);

  useEffect(() => {
    checkConfig();
  }, [checkConfig]);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(key);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const steps = [
    {
      icon: <FaGithub className="w-4 h-4" />,
      title: "Créer un GitHub OAuth App",
      description:
        "Ouvrez https://github.com/settings/developers puis cliquez sur « New OAuth App ».",
    },
    {
      icon: <Settings className="w-4 h-4" />,
      title: "Remplir les champs",
      description:
        "Application name : FlowOps — Homepage URL : http://localhost:5173 — Authorization callback URL : http://localhost:5173/auth",
    },
    {
      icon: <ShieldCheck className="w-4 h-4" />,
      title: "Copier le Client ID et le Client Secret",
      description:
        "Après création de l'app, copiez ces deux valeurs qui s'affichent sur la page.",
    },
    {
      icon: <FileText className="w-4 h-4" />,
      title: "Configurer backend/.env",
      description:
        "Ouvrez le fichier backend/.env (créez-le depuis backend/.env.example) et collez vos valeurs dans GITHUB_CLIENT_ID et GITHUB_CLIENT_SECRET.",
    },
    {
      icon: <Server className="w-4 h-4" />,
      title: "Redémarrer le backend",
      description:
        "Relancez uvicorn pour que les nouvelles variables d'environnement soient prises en compte.",
    },
  ];

  const copyBlocks = [
    {
      key: "env_example",
      label: "Modèle backend/.env.example",
      content: `GITHUB_CLIENT_ID=votre_client_id_github
GITHUB_CLIENT_SECRET=votre_client_secret_github
MONGO_URI=mongodb://localhost:27017/`,
    },
    {
      key: "device_uri",
      label: "Endpoint Device Flow (déjà en place)",
      content: `${API_URL}/api/auth/device-code`,
    },
  ];

  return (
    <div className="min-h-screen w-full bg-slate-50 flex flex-col font-sans text-slate-900 antialiased relative overflow-hidden">
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
              One-time Setup
            </span>
          </div>
        </div>
        <button
          onClick={checkConfig}
          className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-600 hover:text-purple-700 bg-white border border-slate-200/80 rounded-xl shadow-sm transition-all hover:border-purple-200"
        >
          <RefreshIcon spinning={status === "checking"} />
          Recheck
        </button>
      </header>

      <main className="w-full max-w-4xl mx-auto px-4 sm:px-6 py-6 pb-16">
        {/* BANNER DE STATUT */}
        {status === "checking" && (
          <div className="mb-6 p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm flex items-center gap-3 text-sm text-slate-600">
            <Loader2 className="w-5 h-5 text-purple-600 animate-spin" />
            Vérification de la configuration GitHub...
          </div>
        )}

        {status === "ready" && (
          <div className="mb-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-bold text-emerald-800">
                Configuration GitHub valide !
              </p>
              <p className="text-emerald-700">
                Votre GitHub OAuth App est détectée par le backend. Vous pouvez
                maintenant vous authentifier.
              </p>
              <button
                onClick={() => navigate("/auth")}
                className="mt-3 inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-sm"
              >
                Accéder à la connexion
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {status === "not_configured" && (
          <div className="mb-6 p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-bold text-amber-800">
                GitHub OAuth App non configurée
              </p>
              <p className="text-amber-700">
                Le backend ne trouve pas les variables environnement suivantes :
                <span className="font-mono font-bold">
                  {" "}
                  {missingVars.length > 0
                    ? missingVars.join(", ")
                    : "aucune"}{" "}
                </span>
                . Suivez les étapes ci-dessous pour créer votre propre OAuth App.
              </p>
            </div>
          </div>
        )}

        {/* CARTE EXPLICATIVE */}
        <div className="bg-white border border-slate-200/80 rounded-3xl shadow-xl shadow-slate-200/60 p-8 sm:p-10 space-y-8">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 text-[10px] font-black tracking-widest text-purple-600 bg-purple-50 px-3 py-1 rounded-full uppercase border border-purple-100">
              <ShieldCheck className="w-3.5 h-3.5" />
              Configuration requise
            </div>
            <h1 className="text-2xl font-black tracking-tight">
              Connectez FlowOps à votre compte GitHub
            </h1>
            <p className="text-sm text-slate-500 leading-relaxed max-w-xl">
              FlowOps utilise le <strong>GitHub OAuth Device Flow</strong> pour se
              connecter en toute sécurité à vos dépôts. Pour que vous (ou tout
              autre utilisateur) puissiez vous authentifier, créez un{" "}
              <strong>GitHub OAuth App personnel</strong> et renseignez ses
              credentials dans votre configuration locale. Aucune donnée
              sensible n'est codée en dur dans le code source.
            </p>
          </div>

          {/* ÉTAPES PAS-À-PAS */}
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
                    {step.title}
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed mt-1">
                    {step.description}
                  </p>
                </div>
              </li>
            ))}
          </ol>

          {/* BLOCS À COPIER */}
          <div className="space-y-4">
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">
              Fichiers de référence
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
                      title="Copier"
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

          {/* LIEN VERS GITHUB */}
          <div className="flex flex-col sm:flex-row items-stretch justify-between gap-4 bg-purple-50/60 border border-purple-100 rounded-2xl p-5">
            <div className="space-y-1">
              <h3 className="text-sm font-black text-slate-900">
                Créer mon GitHub OAuth App
              </h3>
              <p className="text-xs text-slate-500">
                C'est gratuit et prend moins de 2 minutes.
              </p>
            </div>
            <a
              href="https://github.com/settings/developers"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-md"
            >
              <ExternalLink className="w-3.5 h-3.5 text-purple-400" />
              Ouvrir GitHub Developers
            </a>
          </div>
        </div>

        {/* BOUTON RETOUR */}
        <div className="mt-8 flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-purple-600 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Retour
          </button>
          <button
            onClick={() => navigate("/auth")}
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-purple-600 transition-colors"
          >
            Aller à la connexion
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