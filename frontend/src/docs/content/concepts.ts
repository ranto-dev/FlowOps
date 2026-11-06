import type { DocPage } from "../types";
import { code, h2, note, ol, p, table, ul, warning } from "./blocks";

export const concepts: DocPage[] = [
  {
    slug: "architecture",
    title: "Architecture",
    description: "How the frontend, API, database, GitHub and the ML engine fit together.",
    keywords: ["fastapi", "mongodb", "layers"],
    blocks: [
      h2("Overview"),
      code(
        "text",
        `React (5173)  ──HTTP + Bearer token──▶  FastAPI (8000)
                                              │
                    ┌─────────────────────────┼──────────────────────┐
                    ▼                         ▼                      ▼
                 MongoDB               GitHub REST API         MLOps engine
            users · projects        contents · dispatches     scikit-learn · MLflow`,
        "Request path",
      ),
      h2("Backend"),
      p(
        "`backend/main.py` is a thin shim that re-exports the application built by `app.main.create_app()`. That factory mounts CORS, the lifespan (Mongo indexes, HTTP client shutdown), the error handler and the routers.",
      ),
      table(
        ["Module", "Responsibility"],
        ["`app/routers/*`", "Route logic: auth, projects, workflows, logs"],
        ["`mlops/api.py`", "MLOps routes, mounted at `/api/mlops`"],
        ["`app/dependencies.py`", "`CurrentUserDep` and `OwnedProjectDep`"],
        ["`app/github_client.py`", "Shared HTTP client and GitHub calls"],
        ["`app/github_auth.py`", "Device Flow and identity cache"],
        ["`app/storage.py`", "Access to `generated_workflows/`"],
        ["`compiler.py`", "FlowOps schema to GitHub Actions YAML"],
      ),
      h2("Errors"),
      p(
        "GitHub and storage failures are raised as `ServiceError` and serialised by a global handler to `{ \"detail\": ... }`, the same shape as FastAPI's `HTTPException`.",
      ),
      h2("Frontend"),
      p(
        "All API calls go through `src/lib/api.ts` (`apiFetch`, `ApiError`). A 401 response clears the session and logs the user out. Routes and their guards are declared in `src/App.tsx`.",
      ),
    ],
  },
  {
    slug: "projects-repositories",
    title: "Projects & Repositories",
    description: "How projects are stored in MongoDB and linked to GitHub repositories.",
    keywords: ["mongodb", "isolation", "repository"],
    blocks: [
      h2("The project record"),
      p("A project links a name and description to a GitHub repository and tracks whether a workflow was saved."),
      table(
        ["Field", "Description"],
        ["`name`, `description`", "Free text provided at creation"],
        ["`repository`", "Target repository, `owner/name`"],
        ["`github_id`, `created_by`", "Owner of the project"],
        ["`has_workflow`", "`true` once a workflow was saved"],
        ["`yaml_filename`", "File name of the saved workflow"],
        ["`created_at`, `updated_at`", "UTC timestamps; lists are sorted by `updated_at`"],
      ),
      h2("Per-user isolation"),
      p(
        "Every project endpoint resolves the project through `OwnedProjectDep`. A project that does not exist and a project that belongs to someone else both return **404**, so identifiers cannot be probed.",
      ),
      h2("Repository format"),
      p(
        "The repository is stored as typed by the user. When it is used, a full GitHub URL is normalised to its `owner/name` slug.",
      ),
      h2("Listing your repositories"),
      p("`GET /api/github/repositories` returns the repositories your token can access (`id` and `full_name`)."),
    ],
  },
  {
    slug: "authentication",
    title: "Authentication",
    description: "GitHub OAuth Device Flow, Bearer tokens and identity resolution.",
    keywords: ["oauth", "device flow", "token", "login"],
    blocks: [
      h2("Device Flow"),
      ol(
        "The frontend calls `POST /api/auth/device-code` and shows the returned user code.",
        "The user authorises the app on GitHub.",
        "The frontend polls `POST /api/auth/check-login` with the `device_code` until it succeeds.",
        "The response contains the GitHub access token, which the frontend stores in `localStorage` (`flowops_token`) for 30 days of inactivity (sliding expiry, see `lib/session.ts`), so GitHub sign-in and its two-factor step are not repeated on every visit.",
      ),
      h2("Authenticated requests"),
      code("bash", 'curl http://localhost:8000/api/projects \\\n  -H "Authorization: Bearer $GITHUB_TOKEN"'),
      p(
        "The backend resolves the token against GitHub and caches the identity for 10 minutes. A revoked token may therefore keep working briefly.",
      ),
      h2("Users"),
      p(
        "On every successful login the user is upserted in the `users` collection (unique `github_id`). `is_new_user` in the login response is `true` only when the document was created.",
      ),
      h2("Route guards"),
      p(
        "In the frontend, `ProtectedRoute` redirects to `/auth` when no token is stored, and `PublicOnlyRoute` redirects signed-in users to `/workspace`.",
      ),
    ],
  },
  {
    slug: "pipeline-builder",
    title: "Low-Code Pipeline Builder",
    navTitle: "Pipeline Builder",
    description: "Compose workflows with a form and compile them to GitHub Actions YAML.",
    keywords: ["workflow", "form", "jobs", "steps"],
    blocks: [
      h2("Concept"),
      p(
        "The builder edits a **FlowOps schema**: triggers, branches, environment variables and a list of jobs, each with ordered steps. The backend compiler turns that schema into standard GitHub Actions YAML that you can review before saving.",
      ),
      h2("Building blocks"),
      ul(
        "**Workflow** — name, file name, trigger events, branches and global environment variables.",
        "**Jobs** — runner, dependencies (`needs`), optional matrix and condition.",
        "**Steps** — one of six [step types](/docs/step-types), with an optional `if` condition.",
      ),
      h2("Preview and save"),
      p(
        "`POST /api/generate-workflow` returns the YAML without touching GitHub. `POST /api/projects/{id}/workflow` compiles the same way and stores the result for the project.",
      ),
      note(
        "Preview and save use the same compiler, so the preview is exactly what will be committed.",
      ),
      h2("Learn more"),
      ul(
        "[Step Types](/docs/step-types)",
        "[YAML Compilation](/docs/yaml-compilation)",
        "[Workflow Schema reference](/docs/workflow-schema)",
      ),
    ],
  },
  {
    slug: "step-types",
    title: "Step Types",
    description: "The six step types supported by the builder and the YAML each produces.",
    keywords: ["checkout", "setup-node", "npm", "docker", "custom-run", "upload-artifact"],
    blocks: [
      p("The step `type` is a closed set. Each type reads its own fields from the step."),
      table(
        ["Type", "Fields used", "Generated step"],
        ["`checkout`", "—", "`uses: actions/checkout@v4`"],
        ["`setup-node`", "`node_version`", "`uses: actions/setup-node@v4` with `cache: npm`"],
        ["`npm`", "`npm_command`", "`run: npm <command>`"],
        ["`upload-artifact`", "`artifact_path`", "`uses: actions/upload-artifact@v4`"],
        ["`docker`", "`docker_image`, `docker_registry`", "`run:` build, tag and push script"],
        ["`custom-run`", "`custom_script`", "`run:` your script"],
      ),
      h2("setup-node"),
      p(
        "`node_version` is used when numeric, otherwise `20`. If the job defines a matrix key containing `node`, the version comes from the matrix instead.",
      ),
      h2("upload-artifact"),
      p("The artifact is named `production-artifacts`. `artifact_path` defaults to `dist/`."),
      h2("docker"),
      p(
        "The image is pushed to `ghcr.io/<owner>/<image>:latest`, or to Docker Hub when `docker_registry` is `dockerhub`.",
      ),
      code(
        "bash",
        `docker build -t my-app .
docker tag my-app ghcr.io/\${{ github.repository_owner }}/my-app:latest
docker push ghcr.io/\${{ github.repository_owner }}/my-app:latest`,
        "Generated script (GHCR)",
      ),
      h2("custom-run"),
      p("Multi-line scripts are emitted as a YAML block scalar. An empty script falls back to a simple `echo`."),
      warning(
        "Adding a new step type requires changes in the compiler, the ML feature engineering and the frontend types and form. See [Development](/docs/development).",
        "Closed set",
      ),
    ],
  },
  {
    slug: "yaml-compilation",
    title: "YAML Compilation",
    description: "The rules `compiler.py` applies to turn the schema into a workflow file.",
    keywords: ["compiler", "repository_dispatch", "matrix", "env"],
    blocks: [
      h2("Triggers"),
      ul(
        "Each entry of `on_events` becomes a trigger.",
        "For `push` and `pull_request`, the comma-separated `branches` value becomes a branch filter.",
        "A `repository_dispatch` trigger of type `flowops_trigger` is **always added**.",
      ),
      note(
        "The forced `repository_dispatch` trigger is what the **Execute** button relies on, so even push-only workflows can be launched on demand.",
        "Why is there an extra trigger?",
      ),
      h2("Environment"),
      p("`global_env` is parsed line by line as `KEY=value` and emitted as the workflow-level `env` block."),
      h2("Jobs"),
      ul(
        "The job key is the job `name`, lower-cased, with spaces replaced by dashes.",
        "`needs` and `job_if` map to `needs` and `if`.",
        "`matrix_key` and `matrix_values` (comma-separated) produce `strategy.matrix`.",
        "Each step gets its `name`, an optional `if` from `step_if`, then the fields of its [type](/docs/step-types).",
      ),
      h2("Example"),
      code(
        "yaml",
        `name: Release
on:
  push:
    branches:
      - main
  repository_dispatch:
    types:
      - flowops_trigger
jobs:
  test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        node:
          - '18'
          - '20'
    steps:
      - name: Checkout
        uses: actions/checkout@v4`,
      ),
    ],
  },
];
