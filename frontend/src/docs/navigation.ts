import type { NavSection } from "./types";

export const DOCS_CONFIG = {
  name: "FlowOps",
  version: "v1.0.0",
  basePath: "/docs",
  homeSlug: "what-is-flowops",
  developerHomeSlug: "developer-overview",
  repoUrl: "https://github.com/ranto-dev/FlowOps",
  appUrl: "/workspace",
};

/**
 * Structure de la sidebar. Pour ajouter / déplacer / retirer une page :
 * éditer ce tableau (les titres viennent des pages référencées par `slug`).
 */
export const NAVIGATION: NavSection[] = [
  // ───────────── Onglet « Guides » : utilisation de l'application ─────────────
  {
    id: "start-here",
    tab: "guides",
    title: "Start here",
    items: [
      { slug: "what-is-flowops" },
      { slug: "why-flowops" },
      { slug: "requirements" },
      { slug: "app-tour" },
      { slug: "quick-start" },
    ],
  },
  {
    id: "guides",
    tab: "guides",
    title: "Guides",
    items: [
      { slug: "sign-in" },
      { slug: "projects" },
      { slug: "build-workflow" },
      { slug: "choose-steps" },
      { slug: "recipes" },
      { slug: "preview-and-save" },
      { slug: "run-workflow" },
      { slug: "monitor-runs" },
      { slug: "understand-predictions" },
    ],
  },
  {
    id: "how-it-works",
    tab: "guides",
    title: "How it works",
    items: [{ slug: "how-it-works" }, { slug: "security-privacy" }, { slug: "limits" }],
  },
  {
    id: "help",
    tab: "guides",
    title: "Help",
    items: [{ slug: "faq" }, { slug: "troubleshooting" }, { slug: "glossary" }],
  },

  // ───────────── Onglet « For developers » : technique ─────────────
  {
    id: "dev-setup",
    tab: "developers",
    title: "Setup",
    items: [
      { slug: "developer-overview" },
      { slug: "local-setup" },
      { slug: "installation" },
      { slug: "configuration" },
    ],
  },
  {
    id: "dev-concepts",
    tab: "developers",
    title: "Core Concepts",
    items: [
      { slug: "architecture" },
      { slug: "projects-repositories" },
      { slug: "authentication" },
      {
        slug: "pipeline-builder",
        children: [{ slug: "step-types" }, { slug: "yaml-compilation" }],
      },
      { slug: "running-workflows" },
      { slug: "runs-and-logs" },
    ],
  },
  {
    id: "mlops-engine",
    tab: "developers",
    title: "MLOps Engine",
    items: [
      { slug: "ml-architecture" },
      { slug: "data-pipeline" },
      { slug: "forecasting" },
      { slug: "mlflow-tracking" },
      { slug: "monitoring-retraining" },
    ],
  },
  {
    id: "api-reference",
    tab: "developers",
    title: "API Reference",
    items: [
      { slug: "api-overview" },
      { slug: "api-authentication" },
      { slug: "api-projects" },
      { slug: "api-workflows" },
      { slug: "api-runs-logs" },
      { slug: "api-mlops" },
    ],
  },
  {
    id: "dev-advanced",
    tab: "developers",
    title: "Advanced",
    items: [{ slug: "dev-troubleshooting" }, { slug: "development" }],
  },
  {
    id: "reference",
    tab: "developers",
    title: "Reference",
    items: [
      { slug: "workflow-schema" },
      { slug: "environment-variables" },
      { slug: "cli-reference" },
    ],
  },
];

export const TAB_LABELS = {
  guides: "Guides",
  developers: "For developers",
} as const;
