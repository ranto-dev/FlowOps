import type { DocPage } from "../types";
import { code, h2, note, ol, p, table, ul, warning } from "./blocks";

export const workflows: DocPage[] = [
  {
    slug: "running-workflows",
    title: "Running Workflows",
    description: "What happens when you save and execute a workflow.",
    keywords: ["execute", "dispatch", "commit", "push", "save"],
    blocks: [
      h2("Save"),
      p(
        "`POST /api/projects/{project_id}/workflow` compiles the schema, writes `config.json` and the YAML under `backend/generated_workflows/<project_id>/`, and marks the project with `has_workflow` and `yaml_filename`.",
      ),
      h2("Execute"),
      p("`POST /api/projects/{project_id}/execute` runs these steps in order:"),
      ol(
        "Reads the project and its linked repository (400 if none is linked).",
        "Loads the saved configuration and compiled YAML.",
        "Commits the file to `.github/workflows/<filename>` on the **`main`** branch, creating or updating it.",
        "Sends a `repository_dispatch` event of type `flowops_trigger`, with `project_name` and `triggered_by` in the client payload.",
      ),
      code(
        "yaml",
        `on:
  repository_dispatch:
    types:
      - flowops_trigger`,
        "Trigger always present in compiled workflows",
      ),
      h2("Requirements"),
      table(
        ["Requirement", "Why"],
        ["`repo` and `workflow` scopes", "Commit workflow files and dispatch events"],
        ["Write access to the repository", "The commit is made with your token"],
        ["A `main` branch", "The commit targets `main` (hard-coded)"],
        ["A saved workflow", "Execute reads it from `generated_workflows/`"],
      ),
      warning(
        "Repositories whose default branch is `master` are not supported by the commit step as it is today.",
        "Default branch",
      ),
      note("Execute does not wait for the run. Follow it in [Runs and Logs](/docs/runs-and-logs)."),
    ],
  },
  {
    slug: "runs-and-logs",
    title: "Runs and Logs",
    description: "Browse GitHub Actions runs, jobs and job logs for a project.",
    keywords: ["history", "status", "conclusion", "jobs"],
    blocks: [
      h2("Runs"),
      p(
        "`GET /api/projects/{id}/runs` returns the workflow runs of the linked repository. Each run exposes:",
      ),
      ul(
        "`id`, `name`, `event`, `branch` and the short `commit_sha`",
        "`status` — `queued`, `in_progress` or `completed`",
        "`conclusion` — `success`, `failure`, `cancelled`, or `null` while running",
        "`created_at`, `updated_at` and `html_url` (the run on GitHub)",
      ),
      h2("Jobs"),
      p("`GET /api/projects/{id}/runs/{run_id}/jobs` returns the jobs of a run and their steps."),
      h2("Logs"),
      p("`GET /api/projects/{id}/runs/{run_id}/jobs/{job_id}/logs` returns the raw job log."),
      code(
        "json",
        `{
  "logs": "",
  "available": false,
  "message": "Les logs ne sont pas encore disponibles sur GitHub. Réessayez après le démarrage du job."
}`,
        "Logs not available yet",
      ),
      note(
        "GitHub only provides logs once a job has started. A not-yet-available log is a normal response (`available: false`), not an error.",
      ),
    ],
  },
];
