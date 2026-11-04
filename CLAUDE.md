# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

FlowOps = low-code GitHub Actions workflow builder + MLOps prediction module (duration / failure risk).
Two independent apps (`backend/` FastAPI, `frontend/` React 19 + Vite + Tailwind 4), no monorepo tooling, no CI.
`AGENTS.md` holds the detailed reference (kept up to date) — read it for anything not covered here.
Comments, docs and commit messages are in **French**; match that.

## Commands

Backend (run from `backend/`, venv interpreter at `venv/bin/`; never rebuild the venv without saying so):

```bash
venv/bin/ruff check .                      # lint
venv/bin/python -m pytest                  # all tests
venv/bin/python -m pytest tests/test_routes.py::test_name   # single test
venv/bin/python -m uvicorn main:app --reload --port 8000
./mongo-docker.sh                          # MongoDB container (flowops-mongo)

venv/bin/python -m mlops.pipeline --sample       # full 8-step ML pipeline
venv/bin/python -m mlops.pipeline --skip-train   # ETL + features only
venv/bin/python -m mlops.evaluation.evaluate     # (docs say evaluate_all: wrong)
```

Frontend (run from `frontend/`, **pnpm only** — npm would create a competing lockfile):

```bash
pnpm dev                # http://localhost:5173
pnpm lint               # eslint
pnpm exec tsc -b        # typecheck (strict, noUnusedLocals/Parameters)
pnpm build
```

Before finishing: backend → ruff + pytest pass; frontend → lint + `tsc -b` pass.
(`tsc -b` currently has 2 pre-existing unused-import errors in `landing/Hero.tsx` and `landing/Navbar.tsx`.)

## Architecture

**Backend wiring.** `backend/main.py` is a shim re-exporting `app.main.create_app()`. Never add routes there:
declare them in `backend/app/routers/{auth,projects,workflows,logs}.py`, mounted in `create_app()`;
the MLOps router (`mlops/api.py`) is mounted at `/api/mlops`. Only `app/settings.py` reads env/`.env`.
`ServiceError` (`app/exceptions.py`) is serialised to `{"detail": ...}`, same shape as `HTTPException`.

**Auth & isolation.** GitHub OAuth Device Flow; clients send `Authorization: Bearer <github token>`,
resolved against GitHub by `app.github_auth.resolve_user()` (10 min cache) → `CurrentUserDep`.
Projects are per-user via `OwnedProjectDep`/`get_owned_project()`, which returns 404 for both "missing" and
"not yours" — keep that invariant on new endpoints.

**Workflow flow.** `compiler.py` compiles `FlowOpsWorkflowSchema` → GitHub Actions YAML and always injects
`repository_dispatch: types: [flowops_trigger]` (the Execute button depends on it). Save → YAML under
`backend/generated_workflows/<project_id>/` (gitignored) → commit to `.github/workflows/` of the target repo → dispatch.
Step `type` is a closed set (`checkout`, `setup-node`, `npm`, `upload-artifact`, `docker`, `custom-run`) handled by
if/elif chains in `compiler.py` and `mlops/features/engineering.py`, and declared in
`frontend/src/@types/workflow.ts` + `components/WorkflowForm.tsx`. Adding a type means updating all of them.

**MLOps (`backend/mlops/`).** Config in `mlops/config.py` (paths, features, thresholds; `MLOPS_*` overrides).
Data in `mlops/data/{raw,processed,features,evaluation,monitoring}`, models (joblib) in `mlops/models/` — both
**committed**, so pipeline runs produce git diffs. Train/serve parity lives in `features/engineering.py`: never change
features in one path only. MLflow store: sqlite `backend/mlruns/mlflow.db`, env var is `FLOWOPS_MLFLOW_TRACKING_URI`
(not `MLFLOW_TRACKING_URI`). Prediction endpoint is `POST /api/mlops/predict`. `print()` is fine in CLI modules;
server paths (`app/`, `mlops/tracking/`) use `logging`.

**Mongo.** Startup does not require it (index creation best-effort, 3 s cap). `.env.example` omits the credentials the
docker container needs (see `mongo-docker.sh`).

**Frontend.** No path aliases — relative imports only. All API calls go through `src/lib/api.ts` (`apiFetch`,
`ApiError`, auto-logout on 401) with types in `src/@types/api.ts`; don't use raw `fetch`. Routes and the
`ProtectedRoute`/`PublicOnlyRoute` guards are in `src/App.tsx` (token in localStorage `flowops_token`); new routes must
use them. Two component trees: `components/ui/*` (PascalCase app UI) and `components/landing/*` (marketing, used only by
`pages/LandingPage.tsx`). Design system: **dark theme only**, one violet accent, no gradients. Colours come from the semantic tokens declared in
`src/main.css` (`@theme`): `bg-canvas|surface|surface-2|code`, `border-line|line-strong`, `text-ink|ink-muted|ink-subtle`,
`bg-accent` / `text-accent-ink`, and `success|warning|danger|info` for states only. Never use raw palette colours
(`slate-*`, `purple-*`, `bg-white`…), `dark:` variants, `rounded-xl+`, or hex values in classes. Reuse `components/ui/*`
(`Button`, `Card`, `Badge`, `Input`/`Select`/`Textarea`/`Field`, `StatusBadge`, `CodeSurface`, `Modal`, `Toast`…) instead of
hand-styling. Fonts (Inter + JetBrains Mono) are self-hosted via `@fontsource-variable/*`.
`lucide-react` v1 has no brand icons (no `Github`) — use inline SVG.

**Documentation (`/docs`).** Data-driven: sidebar in `src/docs/navigation.ts` (two tabs: `guides` = end-user usage,
`developers` = technical), pages in `src/docs/content/*.ts` (typed blocks, helpers in `blocks.ts`), UI in
`src/components/docs/*`. Guides must describe the real UI labels (check `WorkflowForm.tsx` / `Workspace.tsx` / `History.tsx`).

## Gotchas

- Root `.gitignore` ignores `*.txt` and `*.yml`: `backend/requirements.txt` and any `.yml` are silently untracked.
  Name new YAML files `.yaml`; use `git add -f` for a `.txt`.
- `venv/`, `mlruns/`, `generated*/`, `node_modules`, `dist`, `.env` files are gitignored — never commit them.
- CORS is locked to `http://localhost:5173` (`app/settings.py`).
- Docs under `docs/` (MLOPS.md etc.): trust the code over them where they disagree.
