# AGENTS.md

FlowOps — GitHub Actions workflow builder (low-code) + MLOps prediction module.
Two independent apps, no monorepo tooling, no CI. Backend has pytest + ruff
(added on `refactor/structure-app`); frontend relies on eslint + `tsc -b`.

## Repo shape

- `backend/` — Python FastAPI, single venv at `backend/venv/` (currently Python 3.14; docs say ≥3.12).
  Entrypoint `backend/main.py` (`app`) is a **thin shim**: it only re-exports the instance built by
  `backend/app/main.py::create_app()`, which mounts CORS, the lifespan (Mongo indexes + HTTP client
  shutdown), the `ServiceError` handler and `app/routers/*` + `mlops/api.py` (at `/api/mlops`).
- `backend/app/` — application package (all route logic lives here):
  `settings.py` (only place reading env/`.env`), `database.py` (Motor client + indexes),
  `dependencies.py` (`CurrentUserDep`, `OwnedProjectDep`), `exceptions.py` (`ServiceError`),
  `github_client.py` (shared `httpx` client + GitHub calls), `github_auth.py` (Device Flow + identity
  cache), `storage.py` (`generated_workflows/` access), `schemas.py` (API request models),
  `utils.py` (`format_project`), `routers/{auth,projects,workflows,logs}.py`.
- `frontend/` — React 19 + Vite 7 + TS 5.8 + Tailwind 4. Entrypoint `frontend/src/main.tsx`.
- `docs/MLOPS.md` — MLOps architecture reference (French). Trust code over this doc; it has stale commands (see below).
- Comments, docs and commit messages are in **French**; match that style.
- Branches: `develop`, `main`, `features`, and `refactor/structure-app` (current; one commit per
  refactoring phase). No PR/CI conventions to follow.

### Backend wiring

- Auth = GitHub OAuth **Device Flow**. Clients send `Authorization: Bearer <github token>`;
  identity is resolved against GitHub by `app.github_auth.resolve_user()` (cached 10 min) and
  injected via `app.dependencies.CurrentUserDep`. Mongo projects are isolated per user by
  `app.dependencies.get_owned_project()` (404 on both "missing" and "not yours") — keep that
  invariant when adding endpoints.
- Most `/api/*` endpoints 401 without a Bearer token; GitHub/storage failures are raised as
  `ServiceError` (`app/exceptions.py`) and serialised to `{"detail": ...}` by the handler in
  `create_app()` — same JSON shape as `HTTPException`.
- `compiler.py` compiles `FlowOpsWorkflowSchema` → GitHub Actions YAML and **always injects
  `repository_dispatch: types: [flowops_trigger]`** (that's what the Execute button relies on).
- Flow: save YAML → `backend/generated_workflows/<project_id>/{config.json,*.yaml}` (gitignored)
  → commit/push to `.github/workflows/` in the target repo → repository_dispatch.
- Users are persisted in Mongo collection `users` (upsert on login, unique `github_id` index);
  `is_new_user` in the login response is `upserted_id is not None`.
- Mongo via `backend/mongo-docker.sh` (container `flowops-mongo`,
  `flowops_admin` / `flowops_secret_password`). `.env.example` shows `MONGO_URI` **without**
  credentials; with the docker container you must use the credentials from `mongo-docker.sh`
  (that's what the real `backend/.env` does). Startup does **not** require Mongo: index creation
  is best-effort with a 3 s cap (`app/database.py`).
- `.env` files (backend and frontend) are gitignored; copy from `.env.example`. GitHub OAuth
  app credentials are mandatory for login (`GET /api/auth/status` reports whether they're set).

### MLOps module (`backend/mlops/`)

- All config lives in `backend/mlops/config.py` (paths, features, validation thresholds); it calls
  `load_dotenv()` itself so CLI runs work standalone.
- MLflow: sqlite at `backend/mlruns/mlflow.db` (gitignored). The env var is deliberately
  `FLOWOPS_MLFLOW_TRACKING_URI`, **not** `MLFLOW_TRACKING_URI`. Thresholds overridable via `MLOPS_*`.
- `mlops/models/**` (joblib) and `mlops/data/**` (csv/png/json) **are committed** — pipeline runs
  rewrite them, so a pipeline run produces git diffs.
- Train/serve feature parity is enforced by `features/engineering.py`; don't change features in one path only.
- `print()` stays in the CLI-facing modules (etl, training, evaluation, validator, collector,
  pipeline) — it *is* their output. Server-side paths (`app/`, `mlops/tracking/`) use `logging`.

## Commands

Run backend commands from `backend/` with the venv interpreter:

```bash
venv/bin/ruff check .                  # lint (E4/E7/E9/F + I, config dans pyproject.toml)
venv/bin/python -m pytest              # 14 tests: contrat HTTP + compiler
venv/bin/uvicorn main:app --reload --port 8000
venv/bin/python -m mlops.pipeline --sample        # full 8-step pipeline
venv/bin/python -m mlops.pipeline --skip-train    # ETL + features only
venv/bin/python -m mlops.etl.pipeline             # individual steps
venv/bin/python -m mlops.training.train_duration
venv/bin/python -m mlops.training.train_failure
venv/bin/python -m mlops.evaluation.evaluate      # NOTE: docs say `mlops.evaluation.evaluate_all` — that module does not exist
venv/bin/python -m mlops.validation.validator
venv/bin/python -m mlops.collection.collector --repo owner/repo --token ghp_xxx
```

Frontend — use **pnpm** (`pnpm-lock.yaml` is the lockfile; `frontend/README.md`'s `npm install` is stale,
and npm would create a competing `package-lock.json`):

```bash
pnpm install
pnpm dev            # http://localhost:5173
pnpm lint           # eslint .
pnpm exec tsc -b    # typecheck only
pnpm build          # tsc -b && vite build
```

Verification before finishing changes:
- frontend → `pnpm lint` && `pnpm exec tsc -b` (both pass; `noUnusedLocals` /
  `noUnusedParameters` / `strict` are on, so dead imports break the build);
- backend → `venv/bin/ruff check .` && `venv/bin/python -m pytest` (both pass), plus a smoke
  `uvicorn main:app` + curl on `/api/auth/status`, `/api/projects` (401 without token),
  `/api/mlops/status`, `/api/generate-workflow`.

## Gotchas

- Root `.gitignore` ignores `*.txt` and `*.yml`. Consequence: `backend/requirements.txt` and any
  future `.github/workflows/*.yml` are **silently untracked** — `git status` won't show them.
  Name new YAML files `.yaml`, and `git add -f` if a `.txt` must be committed.
- `backend/venv/`, `backend/mlruns/`, `backend/generated*/`, `node_modules`, `dist` are ignored —
  never commit them; never rebuild `venv` from scratch without saying so.
- **Never add routes to `backend/main.py`** (shim): declare them in the relevant
  `backend/app/routers/*.py` and mount the router in `app/main.py::create_app()`.
- Env vars must only be read in `backend/app/settings.py` (it loads `backend/.env` first);
  anything importing `app.settings` transitively gets the loaded config.
- Frontend has **no path aliases** (no tsconfig `paths`) — relative imports only.
- API calls go through `frontend/src/lib/api.ts` (`apiFetch`, `ApiError`, auto-logout on 401) with
  contract types in `frontend/src/@types/api.ts`. Use it instead of raw `fetch`; CORS in
  `backend/app/settings.py` is locked to `http://localhost:5173`.
- Two component trees with different naming: `src/components/ui/*` (PascalCase app UI) and
  `src/components/landing/*` (marketing page, lowercase shadcn-style files + `landing/ui/`).
  `pages/LandingPage.tsx` imports only from `components/landing/`; the old top-level marketing
  components (Hero, Features, Footer, …) were deleted in favor of it.
- Auth guard routes live in `frontend/src/App.tsx` (`ProtectedRoute` / `PublicOnlyRoute`, token in
  localStorage key `flowops_token`) — new routes must use them.
- Step `type` values are a closed set (`checkout`, `setup-node`, `npm`, `upload-artifact`, `docker`,
  `custom-run`) dispatched by if/elif chains in `backend/compiler.py` (YAML emission) and
  `backend/mlops/features/engineering.py` (ML features), and declared in
  `frontend/src/@types/workflow.ts` + `frontend/src/components/WorkflowForm.tsx`.
  Adding a type means updating all of them.
