# FlowOps API Reference

The FastAPI service is available at `http://localhost:8000` during local
development. Most application routes require a GitHub access token:

```http
Authorization: Bearer <github_access_token>
```

Project endpoints resolve ownership from the authenticated GitHub identity.
Projects owned by another user are returned as not found.

## Authentication and repositories

| Method | Path | Authentication | Purpose |
| --- | --- | --- | --- |
| `GET` | `/api/auth/status` | No | Check whether GitHub OAuth is configured. |
| `POST` | `/api/auth/device-code` | No | Start GitHub Device Flow. |
| `POST` | `/api/auth/check-login` | No | Poll with `{"device_code":"..."}`; returns pending or the user/token on success. |
| `GET` | `/api/github/repositories` | Bearer | List repositories visible to the signed-in user. |

## Projects

| Method | Path | Authentication | Purpose |
| --- | --- | --- | --- |
| `GET` | `/api/projects` | Bearer | List projects owned by the current user. |
| `POST` | `/api/projects` | Bearer | Create a project. |
| `DELETE` | `/api/projects/{project_id}` | Bearer + ownership | Delete a project. |

Create a project with:

```json
{
  "name": "Example",
  "description": "CI workflow for the example repository",
  "repository": "owner/repository"
}
```

## Workflow operations

| Method | Path | Authentication | Purpose |
| --- | --- | --- | --- |
| `POST` | `/api/generate-workflow` | No | Compile a workflow configuration and return `{filename, yaml}`. |
| `POST` | `/api/projects/{project_id}/workflow` | Bearer + ownership | Compile and save the workflow for a project. |
| `POST` | `/api/projects/{project_id}/execute` | Bearer + ownership | Push the saved workflow to GitHub and dispatch `flowops_trigger`. |

The workflow configuration contains `filename`, `name`, `on_events`,
`branches`, optional `global_env`, and `jobs`. A job includes `id`, `name`,
`runs_on`, `needs`, and `steps`. Supported step types are `checkout`,
`setup-node`, `npm`, `docker`, `custom-run`, and `upload-artifact`.

## Runs, jobs and logs

All run routes require a bearer token and project ownership.

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/api/projects/{project_id}/runs` | List GitHub Actions runs for the project's repository. |
| `GET` | `/api/projects/{project_id}/runs/{run_id}/jobs` | Get jobs and steps for a run. |
| `GET` | `/api/projects/{project_id}/runs/{run_id}/jobs/{job_id}/logs` | Retrieve a job's available logs from GitHub. |

If GitHub has not published the logs yet, the logs endpoint returns an empty
`logs` string with `available: false`. An upstream GitHub error is returned as
HTTP 502. Logs are fetched from GitHub; this endpoint is not a live log stream.

## MLOps

The local MLOps router is mounted under `/api/mlops`. It is intended for a
trusted local deployment and does not use the project bearer-token dependency.

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/api/mlops/status` | Model, evaluation, dataset and monitoring status. |
| `GET` | `/api/mlops/models` | Active models, registry and evaluation reports. |
| `POST` | `/api/mlops/predict` | Predict duration and failure risk from a workflow configuration. |
| `POST` | `/api/mlops/retrain` | Run the local training and validation pipeline. |
| `POST` | `/api/mlops/log-actual` | Record actual duration and failure outcome for monitoring. |
| `GET` | `/api/mlops/monitoring` | View prediction monitoring status. |
| `GET` | `/api/mlops/dataset-locations` | Inspect local dataset and model paths. |

Prediction requests accept a workflow-like JSON object with `name`,
`repository`, `on_events`, `branches`, and `jobs`. Missing model artifacts are
reported as unavailable; they are not represented as a zero-risk prediction.

## Errors

FastAPI validation errors use the standard `detail` response. GitHub and
storage service errors are also serialized as `{"detail":"..."}`. Common
statuses include `401` for missing or invalid authentication, `404` for a
missing or non-owned project, and `502` when GitHub cannot provide upstream
data.
