import type { DocPage } from "../types";
import { code, h2, h3, note, p, table, warning } from "./blocks";

const BASE = "http://localhost:8000";

export const api: DocPage[] = [
  {
    slug: "api-overview",
    title: "API Overview",
    description: "Base URL, authentication, error format and the list of endpoints.",
    keywords: ["rest", "bearer", "errors", "endpoints"],
    blocks: [
      h2("Base URL"),
      code("text", BASE, "Development"),
      h2("Authentication"),
      p("Send the GitHub access token as a Bearer token. Endpoints marked *public* do not need it."),
      code("bash", `curl ${BASE}/api/projects \\\n  -H "Authorization: Bearer $GITHUB_TOKEN"`),
      h2("Errors"),
      code("json", '{ "detail": "Project not found" }', "Error body"),
      table(
        ["Status", "Meaning"],
        ["`401`", "Missing, invalid or expired GitHub token"],
        ["`404`", "Resource missing — or not owned by you"],
        ["`400`", "GitHub rejected a write (push or dispatch) or no repository is linked"],
        ["`500`", "Server error, GitHub unreachable or OAuth not configured"],
      ),
      h2("Endpoints"),
      table(
        ["Method", "Path", "Auth"],
        ["GET", "`/api/auth/status`", "public"],
        ["POST", "`/api/auth/device-code`", "public"],
        ["POST", "`/api/auth/check-login`", "public"],
        ["GET", "`/api/github/repositories`", "token"],
        ["POST", "`/api/projects`", "token"],
        ["GET", "`/api/projects`", "token"],
        ["DELETE", "`/api/projects/{id}`", "token"],
        ["POST", "`/api/generate-workflow`", "public"],
        ["POST", "`/api/projects/{id}/workflow`", "token"],
        ["POST", "`/api/projects/{id}/execute`", "token"],
        ["GET", "`/api/projects/{id}/runs`", "token"],
        ["GET", "`/api/projects/{id}/runs/{run_id}/jobs`", "token"],
        ["GET", "`/api/projects/{id}/runs/{run_id}/jobs/{job_id}/logs`", "token"],
        ["*", "`/api/mlops/*`", "public"],
      ),
    ],
  },
  {
    slug: "api-authentication",
    title: "Authentication API",
    navTitle: "Authentication",
    description: "Endpoints of the GitHub Device Flow.",
    keywords: ["device-code", "check-login", "status", "repositories"],
    blocks: [
      h2("GET /api/auth/status"),
      p("Reports whether the GitHub OAuth credentials are configured."),
      code("bash", `curl ${BASE}/api/auth/status`),
      code(
        "json",
        `{
  "configured": false,
  "missing_env_vars": ["GITHUB_CLIENT_ID", "GITHUB_CLIENT_SECRET"],
  "message": "GitHub OAuth App is not configured. ..."
}`,
      ),
      h2("POST /api/auth/device-code"),
      p(
        "Starts the Device Flow and returns GitHub's payload (`device_code`, `user_code`, `verification_uri`, `expires_in`, `interval`). Fails with 500 if OAuth is not configured.",
      ),
      code("bash", `curl -X POST ${BASE}/api/auth/device-code`),
      h2("POST /api/auth/check-login"),
      p("Poll with the `device_code` until the user has authorised the application."),
      code(
        "bash",
        `curl -X POST ${BASE}/api/auth/check-login \\
  -H "Content-Type: application/json" \\
  -d '{ "device_code": "<device_code>" }'`,
      ),
      code("json", '{ "status": "pending", "error": "authorization_pending" }', "Still waiting"),
      code(
        "json",
        `{
  "status": "success",
  "token": "gho_...",
  "github_id": 1234567,
  "username": "octocat",
  "avatar_url": "https://avatars.githubusercontent.com/u/1234567",
  "is_new_user": false
}`,
        "Authorised",
      ),
      h2("GET /api/github/repositories"),
      p("Lists the repositories accessible with your token."),
      code("bash", `curl ${BASE}/api/github/repositories \\\n  -H "Authorization: Bearer $GITHUB_TOKEN"`),
      code("json", '[{ "id": 987654, "full_name": "acme/payments-api" }]'),
    ],
  },
  {
    slug: "api-projects",
    title: "Projects API",
    navTitle: "Projects",
    description: "Create, list and delete projects.",
    keywords: ["projects", "crud"],
    blocks: [
      h2("POST /api/projects"),
      code(
        "bash",
        `curl -X POST ${BASE}/api/projects \\
  -H "Authorization: Bearer $GITHUB_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "payments-api",
    "description": "CI for the payments service",
    "repository": "acme/payments-api"
  }'`,
      ),
      code(
        "json",
        `{
  "id": "6650f1c2a1b2c3d4e5f60718",
  "name": "payments-api",
  "description": "CI for the payments service",
  "repository": "acme/payments-api",
  "has_workflow": false,
  "yaml_filename": null
}`,
        "Response",
      ),
      h2("GET /api/projects"),
      p("Returns only your projects, most recently updated first."),
      code("bash", `curl ${BASE}/api/projects \\\n  -H "Authorization: Bearer $GITHUB_TOKEN"`),
      h2("DELETE /api/projects/{project_id}"),
      p("Deletes a project. Returns 404 if it does not exist or is not yours."),
      code("bash", `curl -X DELETE ${BASE}/api/projects/$PROJECT_ID \\\n  -H "Authorization: Bearer $GITHUB_TOKEN"`),
    ],
  },
  {
    slug: "api-workflows",
    title: "Workflows API",
    navTitle: "Workflows",
    description: "Preview, save and execute workflows.",
    keywords: ["generate-workflow", "save", "execute", "yaml"],
    blocks: [
      p("The request body of the first two endpoints is the [workflow schema](/docs/workflow-schema)."),
      h2("POST /api/generate-workflow"),
      p("Compiles the schema and returns the YAML. Nothing is stored and GitHub is not contacted."),
      code(
        "bash",
        `curl -X POST ${BASE}/api/generate-workflow \\
  -H "Content-Type: application/json" \\
  -d '{
    "filename": "ci.yaml",
    "name": "CI",
    "on_events": ["push"],
    "branches": "main",
    "jobs": [{
      "id": "j1", "name": "build", "runs_on": "ubuntu-latest",
      "steps": [{ "id": "s1", "name": "Checkout", "type": "checkout" }]
    }]
  }'`,
      ),
      code("json", '{ "filename": "ci.yaml", "yaml": "name: CI\\non:\\n  push: ..." }', "Response"),
      h2("POST /api/projects/{project_id}/workflow"),
      p("Compiles and stores the workflow for a project you own."),
      code(
        "json",
        `{
  "status": "success",
  "message": "Workflow saved locally in project directory",
  "yaml_filename": "ci.yaml"
}`,
      ),
      h2("POST /api/projects/{project_id}/execute"),
      p("Commits the saved YAML to `.github/workflows/` on `main` and dispatches `flowops_trigger`. No request body."),
      code("bash", `curl -X POST ${BASE}/api/projects/$PROJECT_ID/execute \\\n  -H "Authorization: Bearer $GITHUB_TOKEN"`),
      warning("Requires a token with the `repo` and `workflow` scopes.", "Token scopes"),
    ],
  },
  {
    slug: "api-runs-logs",
    title: "Runs & Logs API",
    navTitle: "Runs & Logs",
    description: "Read GitHub Actions runs, jobs and logs of a project.",
    keywords: ["runs", "jobs", "logs"],
    blocks: [
      h2("GET /api/projects/{project_id}/runs"),
      code("bash", `curl ${BASE}/api/projects/$PROJECT_ID/runs \\\n  -H "Authorization: Bearer $GITHUB_TOKEN"`),
      code(
        "json",
        `{
  "project_id": "6650f1c2a1b2c3d4e5f60718",
  "repository": "acme/payments-api",
  "runs": [{
    "id": "9876543210",
    "name": "CI",
    "status": "completed",
    "conclusion": "success",
    "event": "repository_dispatch",
    "branch": "main",
    "commit_sha": "a1b2c3d",
    "created_at": "2026-11-04T09:12:00Z",
    "updated_at": "2026-11-04T09:14:10Z",
    "html_url": "https://github.com/acme/payments-api/actions/runs/9876543210"
  }]
}`,
      ),
      h2("GET /api/projects/{project_id}/runs/{run_id}/jobs"),
      p("Returns the jobs of a run with their steps."),
      h2("GET /api/projects/{project_id}/runs/{run_id}/jobs/{job_id}/logs"),
      code("json", '{ "logs": "...", "available": true, "message": null }'),
      note("A 502 means GitHub could not provide the logs. `available: false` means they do not exist yet."),
    ],
  },
  {
    slug: "api-mlops",
    title: "MLOps API",
    navTitle: "MLOps",
    description: "Prediction, monitoring and retraining endpoints under `/api/mlops`.",
    keywords: ["predict", "status", "models", "retrain", "log-actual", "monitoring"],
    blocks: [
      table(
        ["Method", "Path", "Description"],
        ["GET", "`/api/mlops/status`", "Active models, evaluations, monitoring and dataset sizes"],
        ["GET", "`/api/mlops/models`", "Active models, registry and evaluations"],
        ["POST", "`/api/mlops/predict`", "Duration and failure risk for a workflow"],
        ["POST", "`/api/mlops/log-actual`", "Attach the real outcome to a prediction"],
        ["GET", "`/api/mlops/monitoring`", "Predicted-versus-actual tracking"],
        ["POST", "`/api/mlops/retrain`", "Run the pipeline and reload models"],
        ["GET", "`/api/mlops/dataset-locations`", "Paths of datasets and models"],
      ),
      h2("POST /api/mlops/predict"),
      p(
        "Accepts a workflow configuration. `name`, `repository`, `on_events`, `branches` and `jobs` are read; extra fields are tolerated.",
      ),
      code(
        "bash",
        `curl -X POST ${BASE}/api/mlops/predict \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "CI",
    "repository": "acme/payments-api",
    "on_events": ["push"],
    "branches": "main",
    "jobs": [{ "name": "build", "runs_on": "ubuntu-latest",
               "steps": [{ "type": "checkout" }, { "type": "npm", "npm_command": "test" }] }]
  }'`,
      ),
      code(
        "json",
        `{
  "workflow_name": "CI",
  "repository": "acme/payments-api",
  "duration_seconds": 128.5,
  "failure_probability": 0.23,
  "failure_percentage": 23.0,
  "risk_level": "low",
  "logged": true
}`,
        "Response (excerpt)",
      ),
      h3("Errors"),
      p("A failed prediction returns 500 with a generic message; the cause is in the server logs. Train the models first with `python -m mlops.pipeline --sample`."),
      h2("POST /api/mlops/log-actual"),
      code(
        "json",
        `{
  "workflow_name": "CI",
  "repository": "acme/payments-api",
  "duration_seconds": 141.2,
  "failed": false
}`,
        "Request body",
      ),
      h2("POST /api/mlops/retrain"),
      p("Runs the complete pipeline, then reloads the models. It can take a while and blocks until finished."),
    ],
  },
];
