import type { DocPage } from "../types";
import { code, h2, note, ol, p, table, tip, ul, warning } from "./blocks";

export const gettingStarted: DocPage[] = [
  {
    slug: "developer-overview",
    title: "Developer Overview",
    navTitle: "Overview",
    description:
      "FlowOps is a low-code builder for GitHub Actions workflows, with a built-in MLOps module that forecasts run duration and failure risk.",
    keywords: ["overview", "what is flowops"],
    blocks: [
      h2("What is FlowOps?"),
      p(
        "Writing GitHub Actions YAML by hand is slow and error-prone. With FlowOps you fill in a form — triggers, jobs, steps — and the backend compiles it to a valid workflow file, commits it to your repository and triggers it.",
      ),
      h2("Main capabilities"),
      ul(
        "**Low-code builder** — compose jobs and steps visually and preview the generated YAML.",
        "**Projects** — each project links a GitHub repository to its workflow configuration.",
        "**One-click execution** — FlowOps commits the YAML to `.github/workflows/` and sends a `repository_dispatch` event.",
        "**Runs and logs** — browse GitHub Actions runs, jobs and job logs from the workspace.",
        "**Predictions** — a local ML engine estimates duration (seconds) and failure risk (%).",
      ),
      h2("How it works"),
      ol(
        "Sign in with GitHub (OAuth Device Flow).",
        "Create a project linked to a repository.",
        "Build the workflow in the form; the YAML preview updates through the compiler.",
        "Save, then execute: the YAML is pushed and the workflow is dispatched.",
        "Inspect runs and logs, and review the predicted duration and risk.",
      ),
      h2("Components"),
      table(
        ["Component", "Technology", "Role"],
        ["Frontend", "React 19, Vite, Tailwind 4", "Workspace UI, workflow form, documentation"],
        ["Backend", "FastAPI (Python)", "REST API, compiler, GitHub integration"],
        ["Database", "MongoDB", "Users and projects"],
        ["MLOps", "scikit-learn, MLflow", "Training, tracking and inference"],
        ["GitHub", "OAuth, REST API, Actions", "Identity, repository access, execution"],
      ),
      tip(
        "Just want to use FlowOps? Read the [user guides](/docs/what-is-flowops). To run it on your machine, follow [Local Setup](/docs/local-setup).",
      ),
    ],
  },
  {
    slug: "local-setup",
    title: "Local Setup",
    description: "Run FlowOps locally and reach the workspace in a few minutes.",
    keywords: ["setup", "run", "start"],
    blocks: [
      h2("Prerequisites"),
      ul(
        "Python 3.12 or newer",
        "Node.js and [pnpm](https://pnpm.io)",
        "Docker, to run MongoDB",
        "A GitHub OAuth App (see [Configuration](/docs/configuration))",
      ),
      h2("1. Start MongoDB"),
      code("bash", "cd backend\n./mongo-docker.sh", "Terminal 1"),
      h2("2. Start the API"),
      code(
        "bash",
        `cd backend
cp .env.example .env     # then fill in GITHUB_CLIENT_ID / GITHUB_CLIENT_SECRET
venv/bin/python -m uvicorn main:app --reload --port 8000`,
        "Terminal 2",
      ),
      h2("3. Start the frontend"),
      code("bash", "cd frontend\npnpm install\npnpm dev", "Terminal 3"),
      p("Open `http://localhost:5173` and sign in with GitHub."),
      h2("Verify the installation"),
      code("bash", "curl http://localhost:8000/api/auth/status", "Check OAuth configuration"),
      code(
        "json",
        `{
  "configured": true,
  "missing_env_vars": [],
  "message": null
}`,
        "Expected response",
      ),
      note(
        "If `configured` is `false`, the response lists the missing variables. See [Developer Troubleshooting](/docs/dev-troubleshooting).",
      ),
    ],
  },
  {
    slug: "installation",
    title: "Installation",
    description: "Set up MongoDB, the FastAPI backend and the React frontend.",
    keywords: ["docker", "venv", "pip", "pnpm"],
    blocks: [
      h2("MongoDB"),
      p(
        "`backend/mongo-docker.sh` starts a container named `flowops-mongo`. The connection string must then include the container credentials defined in that script.",
      ),
      code("bash", "cd backend\n./mongo-docker.sh\ndocker ps --filter name=flowops-mongo"),
      note(
        "The API starts even if MongoDB is unreachable: index creation is best-effort with a 3 s cap. Project endpoints fail until the database is available.",
      ),
      h2("Backend"),
      code(
        "bash",
        `cd backend
python -m venv venv
venv/bin/pip install -r requirements.txt
venv/bin/pip install -r requirements-dev.txt   # ruff + pytest
venv/bin/python -m uvicorn main:app --reload --port 8000`,
      ),
      h2("Frontend"),
      code("bash", "cd frontend\npnpm install\npnpm dev      # http://localhost:5173"),
      warning(
        "Use **pnpm**. `pnpm-lock.yaml` is the lockfile; running `npm install` creates a competing `package-lock.json`.",
        "pnpm only",
      ),
      h2("Optional: seed the ML models"),
      p(
        "Trained models are committed to the repository. To regenerate them from the demonstration dataset, see [Data Pipeline](/docs/data-pipeline).",
      ),
    ],
  },
  {
    slug: "configuration",
    title: "Configuration",
    description: "Configure the backend environment and the GitHub OAuth App.",
    keywords: ["env", ".env", "oauth", "cors", "mongo_uri"],
    blocks: [
      h2("The .env file"),
      p(
        "Copy `backend/.env.example` to `backend/.env`. All variables are read in one place, `app/settings.py`, after `backend/.env` is loaded.",
      ),
      code(
        "bash",
        `# GitHub OAuth App (required to sign in)
GITHUB_CLIENT_ID=your_client_id
GITHUB_CLIENT_SECRET=your_client_secret

# MongoDB — with the Docker container, include its credentials
MONGO_URI=mongodb://<user>:<password>@localhost:27017/
MONGO_DB_NAME=flowops_db`,
        "backend/.env",
      ),
      p("The full list is in [Environment Variables](/docs/environment-variables)."),
      h2("Create the GitHub OAuth App"),
      ol(
        "Open `https://github.com/settings/developers` and choose **New OAuth App**.",
        "Set the homepage URL to `http://localhost:5173`.",
        "Set the callback URL to `http://localhost:5173/auth` (required by GitHub; the Device Flow does not use it).",
        "Copy the **Client ID** and **Client Secret** into `backend/.env`.",
      ),
      h2("Granted scopes"),
      p(
        "The Device Flow requests the `user`, `repo` and `workflow` scopes. `repo` and `workflow` are needed to commit workflow files and dispatch events.",
      ),
      h2("CORS"),
      p(
        "By default the API accepts browser requests from `http://localhost:5173` and `http://127.0.0.1:5173`. Override with `CORS_ORIGINS` (comma-separated).",
      ),
    ],
  },
];
