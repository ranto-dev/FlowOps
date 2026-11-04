import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  BookOpen,
  Check,
  ChevronDown,
  ChevronRight,
  Copy,
  Info,
  Lightbulb,
  Menu,
  Moon,
  Search,
  Sun,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

type CalloutTone = "info" | "tip" | "warning";

type Block =
  | { type: "h2"; id: string; text: string }
  | { type: "p"; text: string }
  | { type: "list"; items: string[] }
  | { type: "steps"; items: string[] }
  | { type: "code"; lang: string; title?: string; code: string }
  | { type: "callout"; tone: CalloutTone; title: string; text: string }
  | { type: "table"; head: string[]; rows: string[][] }
  | { type: "diagram"; nodes: { label: string; sub: string }[] };

interface Page {
  id: string;
  title: string;
  summary: string;
  learn: string[];
  blocks: Block[];
  children?: Page[];
}

interface Category {
  id: string;
  title: string;
  pages: Page[];
}

type Theme = "dark" | "light";

const REPO_URL = "https://github.com/ranto-dev/FlowOps";
const VERSION = "v1.0.0";

/* -------------------------------------------------------------------------- */
/*                               Documentation                                */
/* -------------------------------------------------------------------------- */

const CATEGORIES: Category[] = [
  {
    id: "get-started",
    title: "Get Started",
    pages: [
      {
        id: "quick-start",
        title: "Quick Start",
        summary:
          "FlowOps is a low-code builder for GitHub Actions with a built-in MLOps engine. Get it running locally in about five minutes.",
        learn: [
          "What FlowOps does and how its pieces fit together",
          "How to configure the environment and start MongoDB, FastAPI and React",
          "How to sign in with GitHub and verify that the API is healthy",
        ],
        blocks: [
          { type: "h2", id: "what-is-flowops", text: "What is FlowOps?" },
          {
            type: "p",
            text: "You describe a CI/CD pipeline visually, FlowOps compiles it to valid workflow YAML, commits it to your repository and triggers it. It then learns from past runs to forecast how long the next one will take and how likely it is to fail.",
          },
          {
            type: "diagram",
            nodes: [
              { label: "React UI", sub: "Vite · Tailwind" },
              { label: "FastAPI", sub: "REST /api/*" },
              { label: "MongoDB", sub: "Projects · Users" },
              { label: "GitHub", sub: "Repo · Actions" },
              { label: "MLflow", sub: "Models · Metrics" },
            ],
          },
          { type: "h2", id: "configure", text: "Configure the environment" },
          {
            type: "p",
            text: "Create backend/.env with your GitHub OAuth App credentials (Device Flow enabled) and the MongoDB connection string. With the Docker container, the URI must include the container credentials.",
          },
          {
            type: "code",
            lang: "bash",
            title: "backend/.env",
            code: `# GitHub OAuth App (Device Flow)
GITHUB_CLIENT_ID=your_client_id
GITHUB_CLIENT_SECRET=your_client_secret

# MongoDB (identifiants du conteneur flowops-mongo)
MONGO_URI=mongodb://flowops_admin:flowops_secret_password@localhost:27017
MONGO_DB_NAME=flowops`,
          },
          { type: "h2", id: "run", text: "Run the stack" },
          {
            type: "code",
            lang: "bash",
            title: "Three terminals",
            code: `# 1. MongoDB
cd backend && ./mongo-docker.sh

# 2. FastAPI
cd backend
python -m uvicorn main:app --reload --port 8000

# 3. React
cd frontend
pnpm install
pnpm dev   # http://localhost:5173`,
          },
          {
            type: "callout",
            tone: "tip",
            title: "Verify the backend",
            text: "Open http://localhost:8000/api/auth/status — it reports whether your GitHub OAuth credentials are configured.",
          },
          { type: "h2", id: "first-pipeline", text: "Your first pipeline" },
          {
            type: "steps",
            items: [
              "Sign in with GitHub (Device Flow).",
              "Create a project and link it to a repository.",
              "Build the pipeline visually and preview the YAML.",
              "Save to commit it to .github/workflows/, then Execute.",
              "Open the prediction panel to see duration and failure risk.",
            ],
          },
        ],
      },
      {
        id: "installation",
        title: "Installation",
        summary:
          "Prerequisites, local MongoDB, the FastAPI backend and the React frontend, step by step.",
        learn: [
          "Which tools you need before installing",
          "How to run MongoDB locally with Docker",
          "How to set up, lint and test the backend and frontend",
        ],
        blocks: [
          { type: "h2", id: "prerequisites", text: "Prerequisites" },
          {
            type: "list",
            items: [
              "Python 3.12 or newer",
              "Node.js 20+ and pnpm",
              "Docker, for MongoDB",
              "A GitHub OAuth App with Device Flow enabled",
            ],
          },
          { type: "h2", id: "mongodb", text: "Local MongoDB" },
          {
            type: "code",
            lang: "bash",
            code: `docker run -d --name flowops-mongo \\
  -p 27017:27017 \\
  -e MONGO_INITDB_ROOT_USERNAME=flowops_admin \\
  -e MONGO_INITDB_ROOT_PASSWORD=flowops_secret_password \\
  -v flowops-mongo-data:/data/db \\
  mongo:7`,
          },
          {
            type: "callout",
            tone: "info",
            title: "MongoDB is optional at boot",
            text: "The API starts even when MongoDB is down: index creation is best-effort with a 3 s timeout. Project endpoints fail until the database is reachable.",
          },
          { type: "h2", id: "backend", text: "FastAPI backend" },
          {
            type: "code",
            lang: "bash",
            code: `cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt

venv/bin/ruff check .        # lint
venv/bin/python -m pytest    # tests`,
          },
          { type: "h2", id: "frontend", text: "React frontend" },
          {
            type: "code",
            lang: "bash",
            code: `cd frontend
pnpm install
pnpm lint
pnpm exec tsc -b   # typecheck
pnpm build`,
          },
          {
            type: "callout",
            tone: "warning",
            title: "Use pnpm, not npm",
            text: "pnpm-lock.yaml is the source of truth. Running npm install creates a competing package-lock.json.",
          },
          {
            type: "p",
            text: "The backend only accepts browser requests from http://localhost:5173. Change the allowed origin in backend/app/settings.py if you serve the UI elsewhere.",
          },
        ],
      },
    ],
  },
  {
    id: "core-concepts",
    title: "Core Concepts",
    pages: [
      {
        id: "projects-repositories",
        title: "Projects & Repositories",
        summary:
          "A project couples a MongoDB record with a GitHub repository and owns the workflows generated for it.",
        learn: [
          "How a project is stored in MongoDB",
          "How GitHub OAuth identifies you and isolates your projects",
          "How a repository is linked and where workflows are written",
        ],
        blocks: [
          { type: "h2", id: "project-record", text: "The project record" },
          {
            type: "code",
            lang: "json",
            title: "MongoDB · projects",
            code: `{
  "_id": "ObjectId('…')",
  "name": "payments-api",
  "description": "CI for the payments service",
  "repository": "acme/payments-api",
  "created_by": "octocat"
}`,
          },
          { type: "h2", id: "oauth", text: "GitHub OAuth identity" },
          {
            type: "p",
            text: "FlowOps uses the OAuth Device Flow. The browser sends the GitHub access token as a Bearer header; the backend resolves the user against GitHub and caches the identity for 10 minutes. Users are upserted in the users collection on login.",
          },
          { type: "h2", id: "isolation", text: "Per-user isolation" },
          {
            type: "p",
            text: "Every project is scoped to its creator. Requesting a project you do not own returns 404 — the same answer as a project that does not exist — so identifiers cannot be probed.",
          },
          { type: "h2", id: "repo-linkage", text: "Repository linkage" },
          {
            type: "list",
            items: [
              "Repositories are listed from your account via GET /api/github/repositories.",
              "The repository is stored as owner/name on the project.",
              "Saved workflows are written to backend/generated_workflows/<project_id>/ and committed to .github/workflows/ in that repository.",
            ],
          },
        ],
      },
      {
        id: "pipeline-builder",
        title: "Low-Code Pipeline Builder",
        summary:
          "Compose pipelines with a visual form and compile them to GitHub Actions YAML.",
        learn: [
          "The closed set of step types you can compose",
          "How the FlowOps schema is compiled to YAML",
          "Why every workflow listens to repository_dispatch",
        ],
        blocks: [
          { type: "h2", id: "step-types", text: "Step types" },
          {
            type: "table",
            head: ["Type", "Purpose"],
            rows: [
              ["checkout", "Clone the repository (actions/checkout)"],
              ["setup-node", "Install a Node.js version"],
              ["npm", "Run npm scripts (install, test, build…)"],
              ["upload-artifact", "Persist build output"],
              ["docker", "Build or push container images"],
              ["custom-run", "Arbitrary shell command"],
            ],
          },
          { type: "h2", id: "schema", text: "FlowOps schema" },
          {
            type: "code",
            lang: "json",
            title: "Input",
            code: `{
  "filename": "ci.yaml",
  "name": "CI",
  "on_events": ["push"],
  "branches": "main",
  "jobs": [
    {
      "id": "build",
      "runs_on": "ubuntu-latest",
      "steps": [
        { "type": "checkout" },
        { "type": "setup-node", "version": "20" },
        { "type": "npm", "command": "ci" }
      ]
    }
  ]
}`,
          },
          { type: "h2", id: "yaml", text: "Compiled YAML" },
          {
            type: "code",
            lang: "yaml",
            title: "Output",
            code: `name: CI
on:
  push:
    branches: [main]
  repository_dispatch:
    types: [flowops_trigger]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: "20"
      - run: npm ci`,
          },
          {
            type: "callout",
            tone: "info",
            title: "Why repository_dispatch?",
            text: "The compiler always adds a repository_dispatch trigger of type flowops_trigger. This is what the Execute button fires, so even push-only pipelines can be launched on demand.",
          },
        ],
      },
    ],
  },
  {
    id: "mlops-engine",
    title: "MLOps Engine",
    pages: [
      {
        id: "ml-architecture",
        title: "ML Architecture",
        summary:
          "How datasets, models and MLflow tracking fit together in the prediction engine.",
        learn: [
          "Where raw, processed and feature datasets live",
          "How the training pipeline is run and validated",
          "How MLflow tracks and registers models",
        ],
        blocks: [
          { type: "h2", id: "dataset-layout", text: "Dataset layout" },
          {
            type: "code",
            lang: "bash",
            title: "backend/mlops/data/",
            code: `data/
├── raw/          # workflow_runs.csv, jobs.csv, steps.csv, workflow_definitions.csv
├── processed/    # workflow_dataset.csv, prediction_dataset.csv
├── features/     # regression_dataset.csv, classification_dataset.csv
├── evaluation/   # metrics and plots per model
└── monitoring/   # predictions.csv (predicted vs. actual)`,
          },
          {
            type: "callout",
            tone: "info",
            title: "Where is /backend/dataset/?",
            text: "Datasets live under backend/mlops/data/ and trained models (joblib) under backend/mlops/models/. Both are committed, so a pipeline run produces git diffs.",
          },
          { type: "h2", id: "pipeline", text: "The pipeline" },
          {
            type: "code",
            lang: "bash",
            code: `cd backend
venv/bin/python -m mlops.pipeline --sample       # full pipeline on sample data
venv/bin/python -m mlops.pipeline --skip-train   # ETL + features only
venv/bin/python -m mlops.collection.collector --repo owner/repo --token ghp_xxx`,
          },
          { type: "h2", id: "mlflow", text: "MLflow tracking" },
          {
            type: "p",
            text: "Each training run is logged with parameters, metrics and the fitted pipeline. The tracking store is SQLite at backend/mlruns/mlflow.db. Models are registered and the validated version is promoted to Production.",
          },
          {
            type: "code",
            lang: "bash",
            code: `export FLOWOPS_MLFLOW_TRACKING_URI=sqlite:///mlruns/mlflow.db
venv/bin/mlflow ui --backend-store-uri sqlite:///mlruns/mlflow.db --port 5000`,
          },
          {
            type: "callout",
            tone: "warning",
            title: "Variable name",
            text: "The variable is FLOWOPS_MLFLOW_TRACKING_URI on purpose — the standard MLFLOW_TRACKING_URI is ignored.",
          },
        ],
      },
      {
        id: "forecasting",
        title: "Duration & Risk Forecasting",
        summary:
          "Two models run on the same features: one predicts execution duration in seconds, the other the failure risk in percent.",
        learn: [
          "Which models predict duration (s) and failure risk (%)",
          "How risk percentages map to Low, Medium and High",
          "How to close the loop with real outcomes and retraining",
        ],
        blocks: [
          { type: "h2", id: "models", text: "Models" },
          {
            type: "table",
            head: ["Target", "Task", "Candidates"],
            rows: [
              [
                "Duration (s)",
                "Regression",
                "Linear, Ridge, Random Forest, Gradient Boosting",
              ],
              [
                "Failure risk (%)",
                "Classification",
                "Logistic, Random Forest, Gradient Boosting",
              ],
            ],
          },
          { type: "h2", id: "features", text: "Features" },
          {
            type: "p",
            text: "Features come from the workflow definition — number of jobs and steps, step-type mix, triggers — plus historical statistics for the repository. The same code in features/engineering.py serves training and inference, guaranteeing train/serve parity.",
          },
          { type: "h2", id: "risk-levels", text: "Risk levels" },
          {
            type: "table",
            head: ["Failure probability", "Level"],
            rows: [
              ["0 – 30 %", "Low"],
              ["30 – 70 %", "Medium"],
              ["70 – 100 %", "High"],
            ],
          },
          { type: "h2", id: "response", text: "Prediction response" },
          {
            type: "code",
            lang: "json",
            code: `{
  "workflow_name": "CI",
  "duration_seconds": 128.5,
  "failure_probability": 0.23,
  "failure_percentage": 23.0,
  "risk_level": "low"
}`,
          },
          { type: "h2", id: "feedback", text: "Closing the loop" },
          {
            type: "p",
            text: "Each prediction is logged. When the run finishes, report the real duration and outcome with POST /api/mlops/log-actual. FlowOps compares predicted and actual values to monitor drift and decide when to retrain.",
          },
          {
            type: "callout",
            tone: "tip",
            title: "Validation gates",
            text: "A newly trained model is only promoted if it beats the thresholds in mlops/config.py (overridable with MLOPS_* variables).",
          },
        ],
      },
    ],
  },
  {
    id: "api-reference",
    title: "API Reference",
    pages: [
      {
        id: "api",
        title: "API Reference",
        summary:
          "All endpoints are served by FastAPI on http://localhost:8000. Errors always use the shape { \"detail\": \"…\" }.",
        learn: [
          "Which endpoints exist and which ones need authentication",
          "How to authenticate with a GitHub Bearer token",
        ],
        blocks: [
          { type: "h2", id: "overview", text: "Endpoints" },
          {
            type: "table",
            head: ["Endpoint", "Description"],
            rows: [
              ["GET /api/auth/status", "Are OAuth credentials configured?"],
              ["POST /api/auth/device-code", "Start the Device Flow"],
              ["POST /api/auth/check-login", "Poll the Device Flow"],
              ["POST /api/projects", "Create a project"],
              ["GET /api/projects", "List your projects"],
              ["POST /api/generate-workflow", "Compile schema to YAML"],
              ["POST /api/mlops/predict", "Duration and failure risk"],
            ],
          },
          { type: "h2", id: "bearer", text: "Authorization header" },
          {
            type: "code",
            lang: "bash",
            code: `curl http://localhost:8000/api/projects \\
  -H "Authorization: Bearer $GITHUB_TOKEN"`,
          },
          {
            type: "callout",
            tone: "info",
            title: "Public endpoints",
            text: "/api/auth/*, /api/generate-workflow and /api/mlops/status do not require a token. Everything else answers 401 without one.",
          },
        ],
        children: [
          {
            id: "api-auth",
            title: "Authentication",
            summary: "GitHub OAuth Device Flow endpoints.",
            learn: [
              "How to start a Device Flow",
              "How to poll until the user authorizes the app",
            ],
            blocks: [
              { type: "h2", id: "auth-status", text: "GET /api/auth/status" },
              {
                type: "code",
                lang: "bash",
                code: `curl http://localhost:8000/api/auth/status`,
              },
              {
                type: "h2",
                id: "device-code",
                text: "POST /api/auth/device-code",
              },
              {
                type: "p",
                text: "Show the returned user_code to the user and send them to the verification URL.",
              },
              {
                type: "code",
                lang: "bash",
                code: `curl -X POST http://localhost:8000/api/auth/device-code`,
              },
              {
                type: "h2",
                id: "check-login",
                text: "POST /api/auth/check-login",
              },
              {
                type: "p",
                text: "Poll with the device_code until the user authorizes the app. On success the response carries the access token and whether the user is new.",
              },
              {
                type: "code",
                lang: "bash",
                code: `curl -X POST http://localhost:8000/api/auth/check-login \\
  -H "Content-Type: application/json" \\
  -d '{"device_code": "3584d83530557fdd1f46af8289938c8ef79f9dc5"}'`,
              },
            ],
          },
          {
            id: "api-projects",
            title: "Projects",
            summary: "Create, list and delete projects.",
            learn: [
              "How to create and list projects",
              "How to read workflow runs and logs",
            ],
            blocks: [
              { type: "h2", id: "create", text: "POST /api/projects" },
              {
                type: "code",
                lang: "bash",
                code: `curl -X POST http://localhost:8000/api/projects \\
  -H "Authorization: Bearer $GITHUB_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "payments-api",
    "description": "CI for the payments service",
    "repository": "acme/payments-api"
  }'`,
              },
              { type: "h2", id: "list", text: "GET /api/projects" },
              {
                type: "code",
                lang: "bash",
                code: `curl http://localhost:8000/api/projects \\
  -H "Authorization: Bearer $GITHUB_TOKEN"`,
              },
              {
                type: "h2",
                id: "delete",
                text: "DELETE /api/projects/{project_id}",
              },
              {
                type: "p",
                text: "Returns 404 if the project does not exist or belongs to another user.",
              },
              { type: "h2", id: "runs", text: "Runs and logs" },
              {
                type: "table",
                head: ["Endpoint", "Description"],
                rows: [
                  ["GET /api/projects/{id}/runs", "Workflow runs"],
                  ["GET /api/projects/{id}/runs/{run_id}/jobs", "Jobs of a run"],
                  [
                    "GET /api/projects/{id}/runs/{run_id}/jobs/{job_id}/logs",
                    "Raw logs of a job",
                  ],
                ],
              },
            ],
          },
          {
            id: "api-workflows",
            title: "Generate Workflow",
            summary: "Compile, save and execute workflows.",
            learn: [
              "How to preview YAML without touching GitHub",
              "How to save and execute a workflow",
            ],
            blocks: [
              {
                type: "h2",
                id: "generate",
                text: "POST /api/generate-workflow",
              },
              {
                type: "code",
                lang: "bash",
                code: `curl -X POST http://localhost:8000/api/generate-workflow \\
  -H "Content-Type: application/json" \\
  -d '{
    "filename": "ci.yaml",
    "name": "CI",
    "on_events": ["push"],
    "branches": "main",
    "jobs": [{ "id": "build", "runs_on": "ubuntu-latest",
               "steps": [{ "type": "checkout" }] }]
  }'`,
              },
              {
                type: "code",
                lang: "json",
                title: "Response",
                code: `{ "filename": "ci.yaml", "yaml": "name: CI\\non:\\n  push: …" }`,
              },
              {
                type: "h2",
                id: "save",
                text: "POST /api/projects/{project_id}/workflow",
              },
              {
                type: "p",
                text: "Compiles the schema, stores it locally and commits it to .github/workflows/ in the linked repository.",
              },
              {
                type: "h2",
                id: "execute",
                text: "POST /api/projects/{project_id}/execute",
              },
              {
                type: "p",
                text: "Fires a repository_dispatch event (flowops_trigger) to launch the workflow.",
              },
            ],
          },
          {
            id: "api-predictions",
            title: "Predictions",
            summary: "Prediction, monitoring and retraining endpoints.",
            learn: [
              "How to request a duration and risk forecast",
              "How to report actual outcomes",
            ],
            blocks: [
              {
                type: "callout",
                tone: "info",
                title: "Path prefix",
                text: "The prediction endpoint is POST /api/mlops/predict — the MLOps router is mounted under /api/mlops.",
              },
              { type: "h2", id: "predict", text: "POST /api/mlops/predict" },
              {
                type: "code",
                lang: "bash",
                code: `curl -X POST http://localhost:8000/api/mlops/predict \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "CI",
    "repository": "acme/payments-api",
    "on_events": ["push"],
    "branches": "main",
    "jobs": [{ "id": "build", "steps": [{ "type": "checkout" },
                                          { "type": "npm" }] }]
  }'`,
              },
              {
                type: "code",
                lang: "json",
                title: "Response",
                code: `{
  "workflow_name": "CI",
  "duration_seconds": 128.5,
  "failure_probability": 0.23,
  "failure_percentage": 23.0,
  "risk_level": "low",
  "logged": true
}`,
              },
              { type: "h2", id: "log-actual", text: "POST /api/mlops/log-actual" },
              {
                type: "code",
                lang: "bash",
                code: `curl -X POST http://localhost:8000/api/mlops/log-actual \\
  -H "Content-Type: application/json" \\
  -d '{
    "workflow_name": "CI",
    "repository": "acme/payments-api",
    "duration_seconds": 141.2,
    "failed": false
  }'`,
              },
              { type: "h2", id: "others", text: "Other MLOps endpoints" },
              {
                type: "table",
                head: ["Endpoint", "Description"],
                rows: [
                  ["GET /api/mlops/status", "Pipeline state and active models"],
                  ["GET /api/mlops/models", "Production models and evaluations"],
                  ["GET /api/mlops/monitoring", "Predicted vs. actual tracking"],
                  ["POST /api/mlops/retrain", "Re-run the pipeline"],
                ],
              },
              {
                type: "callout",
                tone: "warning",
                title: "Model not deployed",
                text: "If no model has been trained yet, prediction fails. Run python -m mlops.pipeline --sample first.",
              },
            ],
          },
        ],
      },
    ],
  },
  {
    id: "advanced",
    title: "Advanced",
    pages: [
      {
        id: "troubleshooting",
        title: "Troubleshooting",
        summary: "Fix common MongoDB, GitHub token and port errors.",
        learn: [
          "How to diagnose MongoDB connection failures",
          "What to do when your GitHub token expires",
          "Which ports FlowOps uses and how to resolve conflicts",
        ],
        blocks: [
          { type: "h2", id: "mongodb", text: "MongoDB connection errors" },
          {
            type: "p",
            text: "Symptoms: project endpoints return 500, or logs show ServerSelectionTimeoutError or Authentication failed.",
          },
          {
            type: "code",
            lang: "bash",
            code: `docker ps --filter name=flowops-mongo
docker logs --tail 50 flowops-mongo
docker start flowops-mongo`,
          },
          {
            type: "p",
            text: "Also check that MONGO_URI includes the credentials from mongo-docker.sh.",
          },
          { type: "h2", id: "token", text: "GitHub token expiry (401)" },
          {
            type: "p",
            text: "When GitHub rejects the token the API answers 401 and the web app logs you out automatically. Sign in again through the Device Flow. Identity lookups are cached for 10 minutes, so a revoked token may keep working briefly.",
          },
          { type: "h2", id: "ports", text: "Port conflicts" },
          {
            type: "table",
            head: ["Port", "Service"],
            rows: [
              ["5173", "Vite dev server (also the only allowed CORS origin)"],
              ["8000", "FastAPI"],
              ["27017", "MongoDB"],
              ["5000", "MLflow UI"],
            ],
          },
          {
            type: "code",
            lang: "bash",
            code: `ss -ltnp | grep -E ':(5173|8000|27017)'
python -m uvicorn main:app --reload --port 8001`,
          },
          {
            type: "callout",
            tone: "warning",
            title: "Changing the API port",
            text: "If you move the backend, update the API base URL in the frontend .env, and keep the UI on port 5173 or update CORS in backend/app/settings.py.",
          },
        ],
      },
      {
        id: "faq",
        title: "FAQ",
        summary: "Short answers to frequent questions.",
        learn: ["Answers about YAML editing, private repositories and accuracy"],
        blocks: [
          { type: "h2", id: "faq-yaml", text: "Can I edit the generated YAML?" },
          {
            type: "p",
            text: "Yes, it is a normal workflow file in your repository. Saving again from FlowOps overwrites it.",
          },
          { type: "h2", id: "faq-private", text: "Do private repositories work?" },
          {
            type: "p",
            text: "Yes, as long as the GitHub account you sign in with has write access to the repository.",
          },
          { type: "h2", id: "faq-accuracy", text: "How accurate are predictions?" },
          {
            type: "p",
            text: "Accuracy improves with real run history. Collect data from your repository and retrain; the monitoring view shows drift between predicted and actual values.",
          },
        ],
      },
    ],
  },
];

/** Pages à plat (parent puis enfants) avec leur catégorie, pour la pagination. */
const FLAT_PAGES = CATEGORIES.flatMap((cat) =>
  cat.pages.flatMap((p) =>
    [p, ...(p.children ?? [])].map((page) => ({
      page,
      category: cat,
      parent: page === p ? null : p,
    })),
  ),
);

/* -------------------------------------------------------------------------- */
/*                                  Helpers                                   */
/* -------------------------------------------------------------------------- */

function pageToMarkdown(page: Page): string {
  const lines: string[] = [`# ${page.title}`, "", page.summary, ""];
  if (page.learn.length > 0) {
    lines.push("## You will learn", "", ...page.learn.map((l) => `- ${l}`), "");
  }
  for (const b of page.blocks) {
    switch (b.type) {
      case "h2":
        lines.push(`## ${b.text}`, "");
        break;
      case "p":
        lines.push(b.text, "");
        break;
      case "list":
        lines.push(...b.items.map((i) => `- ${i}`), "");
        break;
      case "steps":
        lines.push(...b.items.map((i, n) => `${n + 1}. ${i}`), "");
        break;
      case "code":
        lines.push("```" + b.lang, b.code, "```", "");
        break;
      case "callout":
        lines.push(`> **${b.title}** — ${b.text}`, "");
        break;
      case "table":
        lines.push(
          `| ${b.head.join(" | ")} |`,
          `| ${b.head.map(() => "---").join(" | ")} |`,
          ...b.rows.map((r) => `| ${r.join(" | ")} |`),
          "",
        );
        break;
      case "diagram":
        lines.push(b.nodes.map((n) => n.label).join(" → "), "");
        break;
    }
  }
  return lines.join("\n");
}

const TOKEN_RE =
  /(#.*$)|("(?:[^"\\]|\\.)*")|(\b(?:curl|docker|pip|python|pnpm|cd|export|source|ss|name|on|jobs|runs-on|steps|uses|with|run)\b(?=[\s:]))|(\B-{1,2}[a-zA-Z][\w-]*)|(\b\d+(?:\.\d+)?\b)/gm;

const TOKEN_CLASSES = [
  "text-slate-500 italic",
  "text-emerald-300",
  "text-purple-300",
  "text-sky-300",
  "text-amber-300",
];

function highlight(code: string): ReactNode[] {
  const out: ReactNode[] = [];
  let last = 0;
  let key = 0;
  for (const m of code.matchAll(TOKEN_RE)) {
    const index = m.index ?? 0;
    if (index > last) out.push(code.slice(last, index));
    const group = m.findIndex((g, i) => i > 0 && g !== undefined) - 1;
    out.push(
      <span key={key++} className={TOKEN_CLASSES[group]}>
        {m[0]}
      </span>,
    );
    last = index + m[0].length;
  }
  if (last < code.length) out.push(code.slice(last));
  return out;
}

/** Met en `code` les tokens qui ressemblent à des routes, chemins ou variables. */
const INLINE_CODE_RE =
  /((?:GET|POST|DELETE|PUT) \/[\w/{}.-]+|\/api\/[\w/{}.*-]+|[\w./-]+\/[\w./<>{}-]+|\b[A-Z][A-Z0-9]*_[A-Z0-9_]+\b|\b[a-z_]+\.(?:py|csv|yaml|json|db|sh)\b|\b[a-z]+_[a-z_]+\b|\.github\/workflows\/|\bpython -m [\w.]+)/g;

function RichText({ text }: { text: string }) {
  return (
    <>
      {text.split(INLINE_CODE_RE).map((part, i) =>
        i % 2 === 1 ? (
          <code
            key={i}
            className="rounded-md bg-purple-50 px-1.5 py-0.5 font-mono text-[0.85em] text-purple-700 dark:bg-slate-800 dark:text-purple-300"
          >
            {part}
          </code>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </>
  );
}

/* -------------------------------------------------------------------------- */
/*                                Sub-components                              */
/* -------------------------------------------------------------------------- */

interface CopyProps {
  copied: string | null;
  onCopy: (id: string, text: string) => void;
}

function CodeBlock({
  id,
  lang,
  title,
  code,
  copied,
  onCopy,
}: CopyProps & { id: string; lang: string; title?: string; code: string }) {
  const done = copied === id;
  return (
    <div className="my-5 overflow-hidden rounded-2xl border border-slate-700/60 bg-[#0b1120] shadow-lg">
      <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900/80 px-4 py-2">
        <div className="flex items-center gap-2">
          <span className="rounded-md bg-purple-500/15 px-2 py-0.5 font-mono text-[11px] font-medium uppercase tracking-wide text-purple-300">
            {lang}
          </span>
          {title && <span className="text-xs text-slate-400">{title}</span>}
        </div>
        <button
          type="button"
          onClick={() => onCopy(id, code)}
          aria-label="Copy code"
          className="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-slate-400 transition hover:bg-slate-800 hover:text-white"
        >
          {done ? (
            <>
              <Check className="h-3.5 w-3.5 text-emerald-400" /> Copied
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5" /> Copy
            </>
          )}
        </button>
      </div>
      <pre className="overflow-x-auto p-4 text-[13px] leading-relaxed text-slate-200 [scrollbar-color:#475569_transparent] [scrollbar-width:thin]">
        <code className="font-mono">{highlight(code)}</code>
      </pre>
    </div>
  );
}

const CALLOUT_STYLES: Record<
  CalloutTone,
  { box: string; icon: LucideIcon; iconClass: string }
> = {
  info: {
    box: "border-sky-200 bg-sky-50 dark:border-sky-500/30 dark:bg-sky-500/10",
    icon: Info,
    iconClass: "text-sky-600 dark:text-sky-400",
  },
  tip: {
    box: "border-purple-200 bg-purple-50 dark:border-purple-500/30 dark:bg-purple-500/10",
    icon: Lightbulb,
    iconClass: "text-purple-600 dark:text-purple-400",
  },
  warning: {
    box: "border-amber-200 bg-amber-50 dark:border-amber-500/30 dark:bg-amber-500/10",
    icon: AlertTriangle,
    iconClass: "text-amber-600 dark:text-amber-400",
  },
};

function Diagram({ nodes }: { nodes: { label: string; sub: string }[] }) {
  return (
    <div className="my-6 flex flex-col gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-4 md:flex-row md:items-center dark:border-slate-700/60 dark:bg-slate-800/40">
      {nodes.map((n, i) => (
        <div key={n.label} className="flex flex-1 items-center gap-2">
          <div className="flex-1 rounded-xl border border-purple-200 bg-white px-3 py-3 text-center shadow-sm dark:border-purple-500/30 dark:bg-slate-900">
            <div className="text-sm font-semibold text-slate-900 dark:text-slate-50">
              {n.label}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400">
              {n.sub}
            </div>
          </div>
          {i < nodes.length - 1 && (
            <ChevronRight className="hidden h-4 w-4 shrink-0 text-purple-400 md:block" />
          )}
        </div>
      ))}
    </div>
  );
}

/** lucide-react n'expose plus les logos de marque : SVG inline. */
function GithubMark() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" aria-hidden>
      <path d="M12 .5a11.5 11.5 0 0 0-3.64 22.41c.58.11.79-.25.79-.56v-2c-3.2.7-3.88-1.37-3.88-1.37-.52-1.33-1.28-1.69-1.28-1.69-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.19 1.76 1.19 1.03 1.76 2.69 1.25 3.35.96.1-.74.4-1.25.73-1.54-2.55-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.28 1.19-3.09-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.17 1.18a11 11 0 0 1 5.77 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.83 1.19 3.09 0 4.42-2.69 5.39-5.25 5.68.41.36.78 1.06.78 2.14v3.17c0 .31.21.68.8.56A11.5 11.5 0 0 0 12 .5Z" />
    </svg>
  );
}

function CopyPageButton({
  copied,
  onClick,
  className = "",
}: {
  copied: boolean;
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-1.5 rounded-full border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:border-purple-500 hover:text-purple-600 dark:border-slate-700 dark:text-slate-300 dark:hover:border-purple-400 dark:hover:text-purple-300 ${className}`}
    >
      {copied ? (
        <Check className="h-4 w-4 text-emerald-500" />
      ) : (
        <Copy className="h-4 w-4" />
      )}
      {copied ? "Copied" : "Copy page"}
    </button>
  );
}

/* -------------------------------------------------------------------------- */
/*                                Main component                              */
/* -------------------------------------------------------------------------- */

export default function DocumentationHub() {
  const [activeSection, setActiveSection] = useState("quick-start");
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    () => new Set(["get-started"]),
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [copied, setCopied] = useState<string | null>(null);
  const [theme, setTheme] = useState<Theme>("dark");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [activeHeading, setActiveHeading] = useState<string | null>(null);

  const searchRef = useRef<HTMLInputElement>(null);
  const copyTimer = useRef<number | undefined>(undefined);

  const isMac =
    typeof navigator !== "undefined" && /mac/i.test(navigator.platform);

  const currentIndex = Math.max(
    0,
    FLAT_PAGES.findIndex((f) => f.page.id === activeSection),
  );
  const { page, category, parent } = FLAT_PAGES[currentIndex];
  const prev = currentIndex > 0 ? FLAT_PAGES[currentIndex - 1].page : null;
  const next =
    currentIndex < FLAT_PAGES.length - 1
      ? FLAT_PAGES[currentIndex + 1].page
      : null;

  const headings = useMemo(
    () =>
      page.blocks.filter(
        (b): b is Extract<Block, { type: "h2" }> => b.type === "h2",
      ),
    [page],
  );

  const q = searchQuery.trim().toLowerCase();

  /* Filtrage temps réel : titre, résumé, titres internes, enfants. */
  const filteredCategories = useMemo(() => {
    if (!q) return CATEGORIES;
    const matches = (p: Page) =>
      p.title.toLowerCase().includes(q) ||
      p.summary.toLowerCase().includes(q) ||
      p.blocks.some((b) => b.type === "h2" && b.text.toLowerCase().includes(q));
    return CATEGORIES.map((c) => ({
      ...c,
      pages: c.pages.flatMap((p): Page[] => {
        const children = (p.children ?? []).filter(matches);
        if (!matches(p) && children.length === 0) return [];
        return [{ ...p, children: matches(p) ? p.children : children }];
      }),
    })).filter((c) => c.pages.length > 0);
  }, [q]);

  const toggle = useCallback((id: string) => {
    setExpandedCategories((prevSet) => {
      const nextSet = new Set(prevSet);
      if (nextSet.has(id)) nextSet.delete(id);
      else nextSet.add(id);
      return nextSet;
    });
  }, []);

  const copy = useCallback((id: string, text: string) => {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        setCopied(id);
        window.clearTimeout(copyTimer.current);
        copyTimer.current = window.setTimeout(() => setCopied(null), 2000);
      })
      .catch(() => setCopied(null));
  }, []);

  const goTo = useCallback((id: string) => {
    const target = FLAT_PAGES.find((f) => f.page.id === id);
    if (target) {
      setExpandedCategories((s) => {
        const n = new Set(s);
        n.add(target.category.id);
        if (target.parent) n.add(target.parent.id);
        return n;
      });
    }
    setActiveSection(id);
    setActiveHeading(null);
    setMobileNavOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  /* Raccourcis : Ctrl/⌘ K ou "/" pour la recherche, Échap pour fermer le tiroir. */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const typing =
        document.activeElement instanceof HTMLInputElement ||
        document.activeElement instanceof HTMLTextAreaElement;
      if (
        (e.key.toLowerCase() === "k" && (e.ctrlKey || e.metaKey)) ||
        (e.key === "/" && !typing)
      ) {
        e.preventDefault();
        searchRef.current?.focus();
      }
      if (e.key === "Escape") setMobileNavOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => () => window.clearTimeout(copyTimer.current), []);

  /* Scroll-spy de la table des matières. */
  useEffect(() => {
    const els = headings
      .map((h) => document.getElementById(h.id))
      .filter((el): el is HTMLElement => el !== null);
    if (els.length === 0) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.find((e) => e.isIntersecting);
        if (visible) setActiveHeading(visible.target.id);
      },
      { rootMargin: "-90px 0px -65% 0px" },
    );
    els.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [headings, page.id]);

  const renderBlock = (b: Block, i: number) => {
    const key = `${page.id}-${i}`;
    switch (b.type) {
      case "h2":
        return (
          <h2
            key={key}
            id={b.id}
            className="mt-12 scroll-mt-24 text-2xl font-semibold leading-snug tracking-tight text-slate-900 dark:text-slate-50"
          >
            {b.text}
          </h2>
        );
      case "p":
        return (
          <p
            key={key}
            className="my-4 leading-7 text-slate-600 dark:text-slate-300"
          >
            <RichText text={b.text} />
          </p>
        );
      case "list":
        return (
          <ul key={key} className="my-4 space-y-2">
            {b.items.map((item, n) => (
              <li
                key={n}
                className="flex gap-2.5 leading-7 text-slate-600 dark:text-slate-300"
              >
                <span className="mt-3 h-1.5 w-1.5 shrink-0 rounded-full bg-purple-500" />
                <span>
                  <RichText text={item} />
                </span>
              </li>
            ))}
          </ul>
        );
      case "steps":
        return (
          <ol key={key} className="my-4 space-y-3">
            {b.items.map((item, n) => (
              <li
                key={n}
                className="flex gap-3 leading-7 text-slate-600 dark:text-slate-300"
              >
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-purple-600 text-xs font-semibold text-white">
                  {n + 1}
                </span>
                <span>
                  <RichText text={item} />
                </span>
              </li>
            ))}
          </ol>
        );
      case "code":
        return (
          <CodeBlock
            key={key}
            id={key}
            lang={b.lang}
            title={b.title}
            code={b.code}
            copied={copied}
            onCopy={copy}
          />
        );
      case "callout": {
        const s = CALLOUT_STYLES[b.tone];
        const Icon = s.icon;
        return (
          <div
            key={key}
            className={`my-5 flex gap-3 rounded-2xl border p-4 ${s.box}`}
          >
            <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${s.iconClass}`} />
            <div>
              <div className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                {b.title}
              </div>
              <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">
                <RichText text={b.text} />
              </p>
            </div>
          </div>
        );
      }
      case "table":
        return (
          <div
            key={key}
            className="my-5 overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-700/60"
          >
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-900 dark:bg-slate-800/60 dark:text-slate-50">
                <tr>
                  {b.head.map((h) => (
                    <th key={h} className="px-4 py-2.5 font-semibold">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-600 dark:divide-slate-700/60 dark:text-slate-300">
                {b.rows.map((row, r) => (
                  <tr key={r}>
                    {row.map((cell, c) => (
                      <td key={c} className="px-4 py-2.5">
                        {c === 0 ? (
                          <code className="font-mono text-[13px] text-purple-700 dark:text-purple-300">
                            {cell}
                          </code>
                        ) : (
                          cell
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      case "diagram":
        return <Diagram key={key} nodes={b.nodes} />;
    }
  };

  /* ------------------------------ Sidebar ------------------------------- */
  const itemClass = (active: boolean) =>
    `flex w-full items-center justify-between rounded-lg px-3 py-1.5 text-left text-sm transition ${
      active
        ? "bg-purple-600/10 font-medium text-purple-600 dark:text-purple-400"
        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/60 dark:hover:text-slate-100"
    }`;

  const sidebar = (
    <nav aria-label="Documentation" className="space-y-5 pb-10">
      {filteredCategories.length === 0 && (
        <p className="px-3 text-sm text-slate-500 dark:text-slate-400">
          No result for “{searchQuery}”.
        </p>
      )}
      {filteredCategories.map((cat) => {
        const open = !!q || expandedCategories.has(cat.id);
        return (
          <div key={cat.id}>
            <button
              type="button"
              onClick={() => toggle(cat.id)}
              aria-expanded={open}
              className="flex w-full items-center justify-between px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-slate-500 hover:text-slate-900 dark:text-slate-500 dark:hover:text-slate-200"
            >
              {cat.title}
              {open ? (
                <ChevronDown className="h-3.5 w-3.5" />
              ) : (
                <ChevronRight className="h-3.5 w-3.5" />
              )}
            </button>
            <AnimatePresence initial={false}>
              {open && (
                <motion.ul
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="mt-1 space-y-0.5 overflow-hidden"
                >
                  {cat.pages.map((p) => {
                    const kids = p.children ?? [];
                    const pageOpen = !!q || expandedCategories.has(p.id);
                    return (
                      <li key={p.id}>
                        <div className="flex items-center">
                          <button
                            type="button"
                            onClick={() => {
                              goTo(p.id);
                              if (kids.length > 0) toggle(p.id);
                            }}
                            aria-current={
                              p.id === activeSection ? "page" : undefined
                            }
                            className={itemClass(p.id === activeSection)}
                          >
                            {p.title}
                            {kids.length > 0 &&
                              (pageOpen ? (
                                <ChevronDown className="h-3.5 w-3.5 opacity-70" />
                              ) : (
                                <ChevronRight className="h-3.5 w-3.5 opacity-70" />
                              ))}
                          </button>
                        </div>
                        <AnimatePresence initial={false}>
                          {kids.length > 0 && pageOpen && (
                            <motion.ul
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.18 }}
                              className="ml-4 mt-0.5 space-y-0.5 overflow-hidden border-l border-slate-200 pl-2 dark:border-slate-700/60"
                            >
                              {kids.map((c) => (
                                <li key={c.id}>
                                  <button
                                    type="button"
                                    onClick={() => goTo(c.id)}
                                    aria-current={
                                      c.id === activeSection ? "page" : undefined
                                    }
                                    className={itemClass(c.id === activeSection)}
                                  >
                                    {c.title}
                                  </button>
                                </li>
                              ))}
                            </motion.ul>
                          )}
                        </AnimatePresence>
                      </li>
                    );
                  })}
                </motion.ul>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </nav>
  );

  const scrollbar =
    "[scrollbar-color:#475569_transparent] [scrollbar-width:thin] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-slate-600";

  return (
    <div
      data-theme={theme}
      className="min-h-screen bg-white text-slate-600 dark:bg-[#0f172a] dark:text-slate-300"
    >
      {/* ----------------------------- Top bar ----------------------------- */}
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/85 backdrop-blur dark:border-slate-800 dark:bg-[#0f172a]/85">
        <div className="mx-auto flex h-14 max-w-[90rem] items-center gap-3 px-4">
          <button
            type="button"
            className="rounded-md p-1.5 text-slate-600 hover:bg-slate-100 lg:hidden dark:text-slate-300 dark:hover:bg-slate-800"
            onClick={() => setMobileNavOpen((o) => !o)}
            aria-label="Toggle navigation"
          >
            {mobileNavOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </button>

          <button
            type="button"
            onClick={() => goTo("quick-start")}
            className="flex items-center gap-2 font-semibold text-slate-900 dark:text-slate-50"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-purple-500 to-purple-700 text-white">
              <BookOpen className="h-4 w-4" />
            </span>
            <span className="hidden sm:inline">FlowOps</span>
            <span className="rounded-full bg-purple-600/10 px-2 py-0.5 text-xs font-medium text-purple-600 dark:text-purple-400">
              {VERSION}
            </span>
          </button>

          <div className="relative mx-auto w-full max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              ref={searchRef}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search"
              aria-label="Search documentation"
              className="w-full rounded-full border border-slate-200 bg-slate-50 py-2 pl-9 pr-16 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-50"
            />
            {searchQuery ? (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                aria-label="Clear search"
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-0.5 text-slate-400 hover:text-slate-200"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            ) : (
              <kbd className="absolute right-3 top-1/2 hidden -translate-y-1/2 rounded border border-slate-300 px-1.5 text-[10px] text-slate-500 sm:block dark:border-slate-600 dark:text-slate-400">
                {isMac ? "⌘K" : "Ctrl K"}
              </kbd>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            <CopyPageButton
              copied={copied === "page"}
              onClick={() => copy("page", pageToMarkdown(page))}
              className="hidden md:flex"
            />
            <a
              href={REPO_URL}
              target="_blank"
              rel="noreferrer"
              aria-label="GitHub repository"
              className="rounded-full p-2 text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-50"
            >
              <GithubMark />
            </a>
            <button
              type="button"
              onClick={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}
              aria-label="Toggle theme"
              className="rounded-full p-2 text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-50"
            >
              {theme === "dark" ? (
                <Sun className="h-5 w-5" />
              ) : (
                <Moon className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-[90rem] px-4">
        {/* --------------------------- Desktop sidebar ---------------------- */}
        <aside
          className={`sticky top-14 hidden h-[calc(100vh-3.5rem)] w-64 shrink-0 overflow-y-auto scroll-smooth border-r border-slate-200 py-6 pr-3 lg:block dark:border-slate-800 ${scrollbar}`}
        >
          {sidebar}
        </aside>

        {/* --------------------------- Mobile drawer ------------------------ */}
        <AnimatePresence>
          {mobileNavOpen && (
            <>
              <motion.div
                key="backdrop"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 top-14 z-30 bg-slate-950/60 lg:hidden"
                onClick={() => setMobileNavOpen(false)}
              />
              <motion.aside
                key="drawer"
                initial={{ x: "-100%" }}
                animate={{ x: 0 }}
                exit={{ x: "-100%" }}
                transition={{ type: "spring", stiffness: 320, damping: 32 }}
                className={`fixed bottom-0 left-0 top-14 z-40 w-72 overflow-y-auto bg-white p-4 shadow-xl dark:bg-[#0f172a] lg:hidden ${scrollbar}`}
              >
                {sidebar}
              </motion.aside>
            </>
          )}
        </AnimatePresence>

        {/* ----------------------------- Content ---------------------------- */}
        <main className="min-w-0 flex-1 py-8 lg:px-10">
          <AnimatePresence mode="wait">
            <motion.article
              key={page.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="mx-auto max-w-3xl"
            >
              <div className="mb-3 flex flex-wrap items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-purple-600 dark:text-purple-400">
                <span>Learn FlowOps</span>
                <ChevronRight className="h-3 w-3" />
                <span>{category.title}</span>
                {parent && (
                  <>
                    <ChevronRight className="h-3 w-3" />
                    <span>{parent.title}</span>
                  </>
                )}
                <ChevronRight className="h-3 w-3" />
                <span className="text-slate-500 dark:text-slate-400">
                  {page.title}
                </span>
              </div>

              <div className="flex items-start justify-between gap-4">
                <h1 className="text-4xl font-bold leading-tight tracking-tight text-slate-900 dark:text-slate-50">
                  {page.title}
                </h1>
                <CopyPageButton
                  copied={copied === "page"}
                  onClick={() => copy("page", pageToMarkdown(page))}
                  className="mt-1 shrink-0"
                />
              </div>
              <p className="mt-4 text-lg leading-8 text-slate-600 dark:text-slate-300">
                <RichText text={page.summary} />
              </p>

              {page.learn.length > 0 && (
                <div className="mt-8 rounded-2xl border border-slate-200 bg-slate-50 p-6 dark:border-slate-700/60 dark:bg-slate-800/60">
                  <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
                    You will learn
                  </h2>
                  <ul className="mt-3 space-y-2">
                    {page.learn.map((item) => (
                      <li
                        key={item}
                        className="flex gap-2.5 leading-7 text-slate-600 dark:text-slate-300"
                      >
                        <span className="mt-3 h-1.5 w-1.5 shrink-0 rounded-full bg-purple-500" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div>{page.blocks.map(renderBlock)}</div>

              <div className="mt-14 grid gap-4 border-t border-slate-200 pt-6 sm:grid-cols-2 dark:border-slate-800">
                {prev ? (
                  <button
                    type="button"
                    onClick={() => goTo(prev.id)}
                    className="rounded-2xl border border-slate-200 p-4 text-left transition hover:border-purple-500 hover:bg-purple-600/10 dark:border-slate-700/60"
                  >
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      Previous
                    </div>
                    <div className="font-medium text-slate-900 dark:text-slate-50">
                      {prev.title}
                    </div>
                  </button>
                ) : (
                  <span />
                )}
                {next && (
                  <button
                    type="button"
                    onClick={() => goTo(next.id)}
                    className="rounded-2xl border border-slate-200 p-4 text-right transition hover:border-purple-500 hover:bg-purple-600/10 dark:border-slate-700/60"
                  >
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      Next
                    </div>
                    <div className="font-medium text-slate-900 dark:text-slate-50">
                      {next.title}
                    </div>
                  </button>
                )}
              </div>
            </motion.article>
          </AnimatePresence>
        </main>

        {/* ---------------------------- On this page ------------------------ */}
        <aside
          className={`sticky top-14 hidden h-[calc(100vh-3.5rem)] w-56 shrink-0 overflow-y-auto py-8 xl:block ${scrollbar}`}
        >
          {headings.length > 0 && (
            <>
              <div className="mb-3 text-[11px] font-bold uppercase tracking-widest text-slate-500">
                On this page
              </div>
              <ul className="space-y-1 border-l border-slate-200 dark:border-slate-800">
                {headings.map((h) => {
                  const active = activeHeading === h.id;
                  return (
                    <li key={h.id}>
                      <button
                        type="button"
                        onClick={() => {
                          document
                            .getElementById(h.id)
                            ?.scrollIntoView({ behavior: "smooth" });
                          setActiveHeading(h.id);
                        }}
                        className={`-ml-px block w-full border-l py-1 pl-3 text-left text-[13px] transition ${
                          active
                            ? "border-purple-500 font-medium text-purple-600 dark:text-purple-400"
                            : "border-transparent text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
                        }`}
                      >
                        {h.text}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </>
          )}
        </aside>
      </div>
    </div>
  );
}
