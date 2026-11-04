# FlowOps Quick Start

FlowOps combines a React workspace, a FastAPI service, GitHub Actions and a
local MLOps pipeline.

## Requirements

- Python 3.12 or newer
- Node.js and pnpm
- MongoDB, for persistent projects
- A GitHub OAuth App for sign-in

## Configure the backend

From the repository root, prepare the backend environment:

```bash
cd backend
cp .env.example .env
```

Set `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET` in `backend/.env`. Configure
`MONGO_URI` for your MongoDB instance. If you use `mongo-docker.sh`, follow the
credentials and connection string in that script.

Install backend dependencies in a Python virtual environment if one is not
already available:

```bash
python3 -m venv venv
venv/bin/pip install -r requirements.txt
```

Start the API:

```bash
venv/bin/python -m uvicorn main:app --reload --port 8000
```

This explicitly uses the backend virtual environment, which includes
dependencies such as `motor`. Avoid running `uvicorn main:app` by itself:
that may start Uvicorn from the system Python, where project dependencies
are not installed.

The backend entry point is `main:app`. Application routes are mounted by
`app/main.py`.

## Configure and start the frontend

In a second terminal, from the repository root:

```bash
cd frontend
pnpm install
pnpm dev
```

Open <http://localhost:5173>. The frontend uses the API at
<http://localhost:8000> during local development.

## Connect GitHub

1. Open `/setup` and create a GitHub OAuth App using its instructions.
2. Add the OAuth credentials to `backend/.env`, then restart the backend.
3. Sign in using GitHub Device Flow and approve the requested access.
4. Create a project and select a repository you can access.

## Create and run a workflow

1. Open a project and add a workflow using the visual builder.
2. Configure triggers, branches, jobs and supported steps.
3. Preview the backend-generated YAML and save the workflow.
4. Run it from the project workspace. FlowOps publishes the workflow file to
   `.github/workflows/` and dispatches a `flowops_trigger` event.
5. Inspect run and job status in History. GitHub job logs are retrieved when
   available; FlowOps does not stream runner output live.

## Run the local MLOps pipeline

From `backend/`, run the reproducible sample pipeline:

```bash
venv/bin/python -m mlops.pipeline --sample
```

The API serves predictions only when compatible models are deployed. See
[`MLOPS.md`](MLOPS.md) for pipeline details and [`API.md`](API.md) for the
HTTP contract.

## Verify the installation

From `backend/`:

```bash
venv/bin/ruff check .
venv/bin/python -m pytest
```

From `frontend/`:

```bash
pnpm lint
pnpm exec tsc -b
pnpm build
```

## Troubleshooting

- **Sign-in is unavailable:** check `GET /api/auth/status`, OAuth credentials,
  and that the backend was restarted after editing `.env`.
- **Projects are not saved:** check MongoDB availability and `MONGO_URI`.
- **Runs do not start:** verify the repository permissions, that the saved
  workflow is present on the default branch, and that the repository accepts
  the `repository_dispatch` event.
- **Predictions are unavailable:** run the MLOps pipeline and check
  `/api/mlops/status` for deployed models.
