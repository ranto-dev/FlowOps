import type { DocPage } from "../types";
import { code, h2, ol, p, table, tip, ul, warning } from "./blocks";

export const advanced: DocPage[] = [
  {
    slug: "dev-troubleshooting",
    title: "Developer Troubleshooting",
    navTitle: "Troubleshooting",
    description: "Fix MongoDB, GitHub token, OAuth, execution and port problems.",
    keywords: ["error", "401", "500", "mongo", "port", "cors"],
    blocks: [
      h2("MongoDB is unreachable"),
      p("Symptoms: project endpoints fail while `/api/auth/status` still works (the API boots without MongoDB)."),
      code(
        "bash",
        `docker ps --filter name=flowops-mongo
docker logs --tail 50 flowops-mongo
docker start flowops-mongo`,
      ),
      p("Also check that `MONGO_URI` contains the credentials defined in `backend/mongo-docker.sh`."),
      h2("OAuth is not configured"),
      p(
        "`POST /api/auth/device-code` returns 500 when `GITHUB_CLIENT_ID` or `GITHUB_CLIENT_SECRET` is empty. `GET /api/auth/status` lists the missing variables. Restart the API after editing `.env`.",
      ),
      h2("401 — token expired or revoked"),
      p("The web app logs you out automatically on a 401. Sign in again. Identity lookups are cached for 10 minutes."),
      h2("Execute fails"),
      table(
        ["Symptom", "Cause"],
        ["400 — no repository linked", "The project has no `repository`"],
        ["404 from GitHub", "Repository not found or no access"],
        ["400 on push or dispatch", "Token lacks `repo` and `workflow` scopes, or the branch is not `main`"],
        ["Storage error", "No workflow saved for the project yet"],
      ),
      h2("Logs are empty"),
      p("`available: false` means GitHub has no log yet. Retry once the job has started."),
      h2("Port conflicts"),
      table(
        ["Port", "Service"],
        ["5173", "Vite dev server (the allowed CORS origin)"],
        ["8000", "FastAPI"],
        ["27017", "MongoDB"],
        ["5000", "MLflow UI"],
      ),
      code("bash", "ss -ltnp | grep -E ':(5173|8000|27017)'"),
      warning(
        "If you serve the frontend from another origin, add it to `CORS_ORIGINS`; otherwise the browser blocks every API call.",
        "CORS",
      ),
      h2("Predictions fail"),
      p("Make sure models exist, then retry:"),
      code("bash", "cd backend\nvenv/bin/python -m mlops.pipeline --sample"),
    ],
  },
  {
    slug: "development",
    title: "Development",
    description: "Commands, checks and conventions for contributing to FlowOps.",
    keywords: ["tests", "ruff", "pytest", "eslint", "contributing"],
    blocks: [
      h2("Backend checks"),
      code(
        "bash",
        `cd backend
venv/bin/ruff check .
venv/bin/python -m pytest
venv/bin/python -m pytest tests/test_routes.py::test_name   # single test`,
      ),
      h2("Frontend checks"),
      code("bash", "cd frontend\npnpm lint\npnpm exec tsc -b\npnpm build"),
      h2("Conventions"),
      ul(
        "New routes go in `backend/app/routers/*.py` and are mounted in `create_app()` — never in `backend/main.py`.",
        "Environment variables are read only in `app/settings.py`.",
        "Keep the per-user isolation: return 404 both for missing and not-owned projects.",
        "Frontend imports are relative (no path aliases) and API calls use `lib/api.ts`.",
        "Comments and commit messages are written in French.",
      ),
      h2("Adding a step type"),
      p("The step type is a closed set. Update every place that dispatches on it:"),
      ol(
        "`backend/compiler.py` — YAML emission",
        "`backend/mlops/features/engineering.py` — ML features (keep train/serve parity)",
        "`frontend/src/@types/workflow.ts` — type declaration",
        "`frontend/src/components/WorkflowForm.tsx` — form fields",
      ),
      h2("Editing this documentation"),
      p(
        "Pages are data. Content lives in `src/docs/content/*.ts`, the sidebar in `src/docs/navigation.ts`. Adding a page is two steps:",
      ),
      ol(
        "Add a `DocPage` to a content file (see `blocks.ts` for the block helpers).",
        "Reference its `slug` in `navigation.ts`.",
      ),
      tip("Headings get anchors automatically and are indexed by the search; no extra wiring is needed."),
    ],
  },
];
