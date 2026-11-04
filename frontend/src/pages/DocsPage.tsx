import { Link } from "react-router-dom";
import { PreferenceControls } from "../components/ui/PreferenceControls";
import { usePreferences } from "../lib/usePreferences";
import {
  Activity,
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  Code2,
  Database,
  ExternalLink,
  GitBranch,
  LayoutDashboard,
  ShieldCheck,
  Sparkles,
  TerminalSquare,
  Workflow,
  Wand2,
} from "lucide-react";

const quickStart = [
  {
    title: "1. Sign in",
    description: "Authenticate with GitHub to secure access to your projects.",
  },
  {
    title: "2. Create a project",
    description: "Connect a repository and provide a name and description.",
  },
  {
    title: "3. Configure a workflow",
    description: "Add jobs and steps, then review the generated YAML.",
  },
  {
    title: "4. Run and inspect",
    description: "Trigger a workflow and inspect its runs and available job logs.",
  },
];

const sections = [
  {
    icon: <Workflow className="h-5 w-5" />,
    title: "Low-code workflow builder",
    description:
      "Build CI/CD workflows without starting from raw YAML. Add jobs, steps and variables through a visual form.",
  },
  {
    icon: <LayoutDashboard className="h-5 w-5" />,
    title: "Centralized project view",
    description:
      "Manage connected repositories and workflow configuration from one focused workspace.",
  },
  {
    icon: <Database className="h-5 w-5" />,
    title: "Runs and job logs",
    description:
      "Inspect workflow runs, their jobs and the logs GitHub makes available for each job.",
  },
  {
    icon: <Activity className="h-5 w-5" />,
    title: "Workflow predictions",
    description:
      "Review locally served duration and failure-risk predictions when a compatible model is deployed.",
  },
];

const faq = [
  {
    title: "Does FlowOps depend on GitHub?",
    text: "Yes. Authentication, repository access and workflow dispatch use GitHub.",
  },
  {
    title: "Is workflow YAML generated automatically?",
    text: "Yes. The backend compiler returns a YAML preview before the workflow is saved.",
  },
  {
    title: "Can jobs be customized?",
    text: "Yes. Add and configure the supported job and step types in the workflow form.",
  },
];

const apiRoutes = [
  ["GET", "/api/auth/status", "Check GitHub OAuth configuration"],
  ["POST", "/api/auth/device-code", "Start GitHub Device Flow"],
  ["POST", "/api/auth/check-login", "Check GitHub authorization status"],
  ["GET", "/api/github/repositories", "List repositories accessible to the signed-in user"],
  ["GET", "/api/projects", "List the signed-in user's projects"],
  ["POST", "/api/projects", "Create a project"],
  ["DELETE", "/api/projects/{id}", "Delete an owned project"],
  ["POST", "/api/generate-workflow", "Compile workflow config to YAML"],
  ["POST", "/api/projects/{id}/workflow", "Save a project workflow"],
  ["POST", "/api/projects/{id}/execute", "Publish and dispatch a workflow"],
  ["GET", "/api/projects/{id}/runs", "List GitHub Actions runs"],
  ["GET", "/api/projects/{id}/runs/{run_id}/jobs", "List jobs and steps for a run"],
  ["GET", "/api/projects/{id}/runs/{run_id}/jobs/{job_id}/logs", "Retrieve available job logs"],
  ["POST", "/api/mlops/predict", "Predict duration and failure risk"],
];

export const DocsPage: React.FC = () => {
  const { language, t } = usePreferences();
  const quickStartDocument =
    language === "fr" ? "/QUICKSTART-FR.md" : "/QUICKSTART.md";
  const apiDocument = language === "fr" ? "/API-FR.md" : "/API.md";
  const mlopsDocument = language === "fr" ? "/MLOPS.md" : "/MLOPS-EN.md";

  return (
    <div className="docs-shell min-h-screen bg-[#050816] text-slate-100 antialiased">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="hero-orb hero-orb-1" />
        <div className="hero-orb hero-orb-2" />
      </div>

      <header className="relative z-10 mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-5 sm:px-6">
        <Link to="/" className="flex items-center gap-3 text-white">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 shadow-[0_0_30px_rgba(168,85,247,0.25)]">
            <TerminalSquare className="h-4 w-4 text-violet-300" />
          </span>
          <span className="text-lg font-black tracking-tight">FlowOps</span>
        </Link>

        <nav className="hidden items-center gap-6 text-sm text-slate-300 md:flex">
          <Link to="/" className="transition hover:text-white">{t("Home")}</Link>
          <a
            href="https://github.com/ranto-dev/FlowOps"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 transition hover:text-white"
          >
            GitHub <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
          </a>
          <Link to="/auth" className="transition hover:text-white">{t("Sign in")}</Link>
          <Link to="/workspace" className="transition hover:text-white">{t("Workspace")}</Link>
        </nav>

        <div className="flex items-center gap-2">
          <PreferenceControls compact />
          <Link
            to="/auth"
            className="inline-flex items-center gap-2 rounded-full border border-violet-400/40 bg-violet-500/10 px-4 py-2 text-sm font-semibold text-violet-100 transition hover:border-violet-300 hover:bg-violet-500/20"
          >
            {t("Get started")}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </header>

      <main className="relative z-10 mx-auto w-full max-w-6xl px-4 pb-20 sm:px-6">
        <section className="pt-10 pb-12 sm:pt-16">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-violet-400/20 bg-violet-500/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.22em] text-violet-200">
            <Sparkles className="h-3.5 w-3.5" />
            {t("Product documentation")}
          </div>

          <div className="grid gap-8 lg:grid-cols-[1.3fr_0.7fr] lg:items-end">
            <div>
              <h1 className="max-w-2xl text-4xl font-black tracking-tight text-white sm:text-5xl">
                {t("A clear, fast and intelligent delivery system.")}
              </h1>
              <p className="mt-5 max-w-xl text-base leading-7 text-slate-300">
                {t("Connect GitHub, build CI/CD workflows visually, and monitor real runs from one focused workspace.")}
              </p>
            </div>

            <div className="glass-panel rounded-3xl p-5">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">{t("Quick start")}</span>
                <span className="rounded-full border border-emerald-400/30 bg-emerald-500/10 px-2 py-1 text-[10px] font-semibold text-emerald-200">
                  {t("Ready")}
                </span>
              </div>
              <pre className="overflow-x-auto rounded-2xl border border-white/10 bg-slate-950/80 p-4 font-mono text-xs text-slate-200">
{`# Backend
cd backend
venv/bin/python -m uvicorn main:app --reload --port 8000

# Frontend (separate terminal)
cd frontend
pnpm dev`}
              </pre>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {quickStart.map((item) => (
            <div key={item.title} className="glass-panel rounded-2xl p-5">
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/12 text-violet-200 ring-1 ring-violet-400/20">
                <CheckCircle2 className="h-4 w-4" />
              </div>
              <h2 className="text-lg font-bold text-white">{t(item.title)}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-300">{t(item.description)}</p>
            </div>
          ))}
        </section>

        <section className="mt-20">
          <div className="mb-8 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">{t("Features")}</p>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-white">{t("Everything you need to ship with confidence")}</h2>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            {sections.map((section) => (
              <article key={section.title} className="glass-panel rounded-3xl p-6 transition duration-300 hover:-translate-y-1 hover:border-violet-400/30">
                <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-500/10 text-violet-200 ring-1 ring-violet-400/20">
                  {section.icon}
                </div>
                <h3 className="text-xl font-bold text-white">{t(section.title)}</h3>
                <p className="mt-3 text-sm leading-7 text-slate-300">{t(section.description)}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-20 grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="glass-panel rounded-3xl p-6 sm:p-8">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-200 ring-1 ring-emerald-400/20">
                <GitBranch className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">{t("Integration")}</p>
                <h3 className="text-2xl font-black text-white">GitHub-first</h3>
              </div>
            </div>

            <ul className="space-y-4 text-sm text-slate-300">
              {[
                t("Secure GitHub OAuth authentication"),
                t("Repositories scoped to the connected user"),
                t("Trigger workflows on push, pull request or manually"),
                t("Traceable workflow run history"),
              ].map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="glass-panel rounded-3xl p-6 sm:p-8">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-violet-500/10 text-violet-200 ring-1 ring-violet-400/20">
                <Code2 className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">{t("In practice")}</p>
                <h3 className="text-2xl font-black text-white">{t("Workflow example")}</h3>
              </div>
            </div>

            <pre className="overflow-x-auto rounded-2xl border border-white/10 bg-slate-950/80 p-4 font-mono text-xs text-slate-200">
{`name: build-and-release
on:
  push:
    branches: [main]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci && npm run build`}
            </pre>
          </div>
        </section>

        <section id="api-reference" className="mt-20 scroll-mt-24">
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">
                {t("Developer reference")}
              </p>
              <h2 className="mt-3 text-3xl font-black tracking-tight text-white">
                {t("API reference")}
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
                {t("Project routes require a GitHub bearer token and enforce project ownership. Prediction endpoints are independent from project administration.")}
              </p>
            </div>
            <div className="flex flex-wrap gap-3 text-sm font-semibold">
              <a className="text-violet-200 underline underline-offset-4" href={quickStartDocument}>
                {t("Quick start guide")}
              </a>
              <a className="text-violet-200 underline underline-offset-4" href={apiDocument}>
                {t("Full API reference")}
              </a>
              <a className="text-violet-200 underline underline-offset-4" href={mlopsDocument}>
                {t("MLOps guide")}
              </a>
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-white/10">
            <table className="w-full min-w-[36rem] text-left text-sm">
              <thead className="bg-slate-900/70 text-xs uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="px-4 py-3">{t("Method")}</th>
                  <th className="px-4 py-3">{t("Endpoint")}</th>
                  <th className="px-4 py-3">{t("Purpose")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10 bg-slate-950/50">
                {apiRoutes.map(([method, path, purpose]) => (
                  <tr key={`${method}-${path}`}>
                    <td className="px-4 py-3 font-mono text-violet-200">{method}</td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-200">{path}</td>
                    <td className="px-4 py-3 text-slate-300">{t(purpose)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-xs leading-5 text-slate-400">
            {t("Workflow logs are fetched from GitHub when available; they are not streamed live. Predictions remain unavailable until compatible local models are deployed.")}
          </p>
        </section>

        <section className="mt-20">
          <div className="mb-8 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">{t("FAQ")}</p>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-white">{t("Frequently asked questions")}</h2>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {faq.map((item) => (
              <div key={item.title} className="glass-panel rounded-2xl p-5">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-sm font-bold text-white">{t(item.title)}</span>
                  <ChevronRight className="h-4 w-4 text-violet-200" />
                </div>
                <p className="text-sm leading-6 text-slate-300">{t(item.text)}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-20">
          <div className="glass-panel overflow-hidden rounded-[28px] p-8 sm:p-10">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-violet-400/20 bg-violet-500/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-violet-200">
                  <Wand2 className="h-3.5 w-3.5" />
                  {t("Ready to ship")}
                </div>
                <h2 className="text-3xl font-black tracking-tight text-white">{t("Upgrade your CI/CD experience.")}</h2>
              </div>

              <div className="flex flex-wrap gap-3">
                <Link
                  to="/auth"
                  className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-slate-200"
                >
                  {t("Sign in")}
                </Link>
                <Link
                  to="/workspace"
                  className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-slate-900/70 px-5 py-2.5 text-sm font-semibold text-white transition hover:border-violet-300/40 hover:bg-slate-800"
                >
                  {t("Open workspace")}
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default DocsPage;
