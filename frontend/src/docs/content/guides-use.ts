import type { DocPage } from "../types";
import { code, h2, note, ol, p, table, tip, ul, warning } from "./blocks";

/** Onglet « Guides » — section « Guides » (pas à pas d'utilisation). */
export const guidesUse: DocPage[] = [
  {
    slug: "sign-in",
    title: "Sign in with GitHub",
    description: "How the sign-in works, what you see, and how to sign out or revoke access.",
    keywords: ["login", "device code", "authorize", "sign out", "session", "token"],
    blocks: [
      h2("How it works"),
      p(
        "FlowOps uses GitHub's **device sign-in**: instead of typing a password into FlowOps, you confirm the sign-in on GitHub itself.",
      ),
      ol(
        "Open FlowOps and choose to sign in. A short **code** is displayed.",
        "Open the GitHub verification link shown on the page.",
        "Enter the code and review the permissions requested (see [What you need](/docs/requirements)).",
        "Authorize. FlowOps detects it automatically and opens your workspace.",
      ),
      note("FlowOps never sees your GitHub password."),
      h2("If the code expires"),
      p("The code is valid for a short time only. If it expires before you authorize, start the sign-in again to get a new one."),
      h2("Your session"),
      p(
        "Your session is kept in your browser. If GitHub stops accepting it (for example because you revoked access), FlowOps signs you out and asks you to sign in again.",
      ),
      h2("Sign out"),
      p("Open the menu in the workspace header and choose **Sign out**. You will need to authenticate with GitHub again to come back."),
      h2("Revoke access"),
      p("In GitHub, open **Settings → Applications → Authorized OAuth Apps**, find FlowOps and revoke it."),
    ],
  },
  {
    slug: "projects",
    title: "Create and manage projects",
    description: "A project links one GitHub repository to one workflow. Create, open and delete projects.",
    keywords: ["project", "repository", "new project", "delete", "workspace"],
    blocks: [
      h2("What is a project?"),
      p(
        "A project connects **one GitHub repository** to **one workflow configuration**. It lives in the **Projects** tab of your workspace, and only you can see your projects.",
      ),
      h2("Create a project"),
      ol(
        "Choose **New project**.",
        "Enter a **Project name**, for example `Production API`.",
        "Pick a repository in **GitHub repository**. The list shows the repositories your account can access.",
        "Optionally add a **Description**.",
        "Choose **Initialize**.",
      ),
      note(
        "If the list is empty or shows an error, your GitHub account may have no accessible repository, or your session needs to be renewed. See [Troubleshooting](/docs/troubleshooting).",
      ),
      h2("What a project card shows"),
      ul(
        "The project name, description and linked repository.",
        "**No workflow** — nothing configured yet. Choose **Create workflow**.",
        "**Pipeline active** — a workflow is saved. Choose **Edit workflow** to change it, or **Run** to start it.",
      ),
      p("Use **Search projects** to filter the list by name or repository."),
      h2("Delete a project"),
      p("Choose **Delete** on the card and confirm. The project and its saved workflow configuration are removed from FlowOps. This cannot be undone."),
      warning(
        "Deleting a project does **not** remove a workflow file that was already published to your repository. Delete `.github/workflows/<file>` in GitHub if you want it gone.",
        "Your repository is not touched",
      ),
    ],
  },
  {
    slug: "build-workflow",
    title: "Build a workflow",
    description: "A guided tour of the configuration form, from triggers to jobs and steps.",
    keywords: ["form", "configuration", "trigger", "branch", "environment variables", "job", "runner", "needs", "matrix", "generate"],
    blocks: [
      p(
        "Open a project and choose **Create workflow** (or **Edit workflow**). The form has two parts: **Pipeline configuration** and **Jobs and orchestration**.",
      ),
      h2("Pipeline configuration"),
      table(
        ["Field", "What to enter"],
        ["**Workflow filename**", "The file created in your repository, e.g. `ci.yaml`"],
        ["**Workflow name**", "The name GitHub displays for the workflow"],
        ["**Trigger events**", "When the workflow starts: `push`, `pull_request`, `workflow_dispatch`"],
        ["**Branch filter**", "Branches that trigger it, comma-separated, e.g. `main, develop`"],
        ["**Global environment variables**", "One `NAME=value` per line, available to every job"],
      ),
      tip(
        "Whatever you choose, FlowOps always adds a hidden trigger so the **Run** button can start the workflow on demand. See [How FlowOps works with GitHub](/docs/how-it-works).",
      ),
      h2("Jobs and orchestration"),
      p("A **job** is a group of steps that run together on one machine. Choose **Add job** to create one."),
      table(
        ["Field", "What it does"],
        ["**Job name**", "Identifies the job, e.g. `build` or `deploy`"],
        ["**Runner**", "The machine: `ubuntu-latest` (Linux), `windows-latest` or `macos-latest`"],
        ["**Dependencies**", "Jobs that must succeed first. Without any, jobs run in parallel"],
        ["**Matrix key / Matrix values**", "Run the same job several times with different values, e.g. `node-version` with `18, 20, 22`"],
      ),
      h2("Workflow steps"),
      p(
        "Inside a job, add **steps**: the individual actions, executed in order. Each step has a **Display name** and a type. Choosing the right type is covered in [Choose your steps](/docs/choose-steps).",
      ),
      h2("Generate the YAML"),
      p("When you are done, choose **Generate workflow YAML**. FlowOps compiles the form and opens the preview. See [Preview and save](/docs/preview-and-save)."),
      h2("Forecast before you run"),
      p("While you configure, a panel can estimate the run time and the risk of failure. See [Understand predictions](/docs/understand-predictions)."),
    ],
  },
  {
    slug: "choose-steps",
    title: "Choose your steps",
    description: "The six step types, what each one does and when to use it.",
    keywords: ["checkout", "node", "npm", "docker", "artifact", "shell", "custom", "script", "step types"],
    blocks: [
      p("Every step in a job is one of six types."),
      table(
        ["Step", "Use it to…", "You provide"],
        ["**Checkout**", "Get your repository's code onto the runner. Almost every job starts with it.", "Nothing"],
        ["**Set up Node.js**", "Install a Node.js version", "Version: 18, 20 or 22"],
        ["**Run npm**", "Run an npm command", "`npm install`, `npm ci`, `npm run lint`, `npm test` or `npm run build`"],
        ["**Build Docker image**", "Build an image and push it to a registry", "Image name and registry (Docker Hub or GitHub Packages)"],
        ["**Upload artifact**", "Keep files produced by the job (build output, reports)", "A path, e.g. `dist/`"],
        ["**Custom command**", "Anything else", "Your command or script"],
      ),
      h2("Good to know"),
      ul(
        "**Order matters.** Put **Checkout** first, then setup, then install, then test and build.",
        "**`npm ci` vs `npm install`.** Prefer `npm ci` in pipelines: it installs exactly what your lockfile says and is faster and more reproducible.",
        "**Matrix and Node.js.** If the job has a matrix key containing `node` (such as `node-version`), the **Set up Node.js** step automatically uses the matrix value.",
      ),
      warning(
        "The **Build Docker image** step builds, tags and pushes the image, but it does **not** sign in to the registry. Add a **Custom command** step before it that logs in, using a secret from your repository settings. See the [Docker recipe](/docs/recipes).",
        "Docker needs a login",
      ),
    ],
  },
  {
    slug: "recipes",
    title: "Recipes",
    description: "Ready-to-use setups for the most common pipelines.",
    keywords: ["example", "node", "ci", "matrix", "docker", "deploy", "main", "template"],
    blocks: [
      h2("Node.js continuous integration"),
      p("Check every change: lint, test and build."),
      ul(
        "**Trigger events**: `push` and `pull_request` · **Branch filter**: `main`",
        "**Job** `build` on `ubuntu-latest`",
        "**Steps**: Checkout → Set up Node.js (20) → `npm ci` → `npm run lint` → `npm test` → `npm run build`",
      ),
      h2("Test on several Node.js versions"),
      p("Make sure your code works on all the versions you support."),
      ul(
        "Same job as above, plus **Matrix key** `node-version` and **Matrix values** `18, 20, 22`.",
        "The key contains `node`, so **Set up Node.js** automatically uses each value. The job runs three times in parallel.",
      ),
      h2("Only run on the main branch"),
      ul(
        "Set **Branch filter** to `main`.",
        "Keep `push` and `pull_request` as **Trigger events**: both will then only react to the `main` branch.",
      ),
      h2("Deploy only after the tests pass"),
      ul(
        "Create a second job `deploy`.",
        "In **Dependencies**, select `build`: `deploy` waits for it and is skipped if it fails.",
        "Add your deployment as a **Custom command** step, and set the **Branch filter** to `main` so deployments only follow the main branch.",
      ),
      h2("Build and push a Docker image"),
      ol(
        "Create a job `docker` that depends on `build`.",
        "Add **Checkout**.",
        "Add a **Custom command** step that signs in to the registry. For GitHub Packages: `echo \"${{ secrets.GITHUB_TOKEN }}\" | docker login ghcr.io -u ${{ github.actor }} --password-stdin`",
        "Add a **Build Docker image** step with your **Image name** and the registry **GitHub Packages (GHCR)**.",
      ),
      code(
        "yaml",
        `  docker:
    runs-on: ubuntu-latest
    needs:
      - build
    steps:
      - name: Checkout Repository
        uses: actions/checkout@v4
      - name: Registry login
        run: echo "\${{ secrets.GITHUB_TOKEN }}" | docker login ghcr.io -u \${{ github.actor }} --password-stdin
      - name: Build and push
        run: |
          docker build -t my-app .
          docker tag my-app ghcr.io/\${{ github.repository_owner }}/my-app:latest
          docker push ghcr.io/\${{ github.repository_owner }}/my-app:latest`,
        "Resulting job (simplified)",
      ),
      note("Pushing to GitHub Packages with `GITHUB_TOKEN` can also require the workflow to have package write permission in your repository settings."),
      h2("Keep the build output"),
      ul(
        "After `npm run build`, add an **Upload artifact** step with the path `dist/`.",
        "The files are attached to the run on GitHub, where you can download them.",
      ),
    ],
  },
  {
    slug: "preview-and-save",
    title: "Preview and save the YAML",
    description: "Read the generated YAML, then save it to your project.",
    keywords: ["yaml", "preview", "save", "reconfigure", "generate", "edit"],
    blocks: [
      h2("Review before publishing"),
      p(
        "After **Generate workflow YAML**, FlowOps shows the **YAML preview**: the exact file that will be published. You do not need to understand every line, but it is worth a quick read: triggers at the top, then jobs, then the steps of each job.",
      ),
      h2("Save"),
      p("Choose **Save workflow**. It is stored in your project, and the project card switches to **Pipeline active**. Saving does not publish anything to GitHub yet."),
      h2("Change something"),
      p("Choose **Reconfigure** to go back to the form, adjust it, then generate the YAML again. **New workflow** starts a fresh configuration. The breadcrumb at the top lets you return to your project or the project list."),
      h2("Edit later"),
      p("At any time, choose **Edit workflow** on the project card to reopen the form."),
      tip("The preview and the published file come from the same generator, so what you read is what you get."),
    ],
  },
  {
    slug: "run-workflow",
    title: "Run a workflow",
    description: "What happens when you choose Run, and what you see on GitHub afterwards.",
    keywords: ["execute", "run", "trigger", "publish", "commit", "dispatch"],
    blocks: [
      h2("Start a run"),
      p("On a project card showing **Pipeline active**, choose **Run**."),
      h2("What FlowOps does"),
      ol(
        "Publishes your workflow file to `.github/workflows/` in the linked repository, on the `main` branch. This appears as a commit in your repository history.",
        "Sends GitHub an event that starts the workflow.",
        "Takes you to the **History** tab so you can follow the run.",
      ),
      note("GitHub, not FlowOps, runs your jobs. A run may stay **Queued** for a few seconds before it starts."),
      h2("What you will see on GitHub"),
      ul(
        "A commit named like `ci(flowops): update/create workflow ci.yaml via FlowOps Studio` on `main`.",
        "The workflow listed under the **Actions** tab of your repository.",
        "A run for each execution, with the same logs FlowOps shows you.",
      ),
      h2("Every time you run"),
      p("The file is updated if it already exists, so changes you made in FlowOps are always what runs. Edits made by hand to that file in GitHub are overwritten."),
      warning(
        "If your `main` branch is protected against direct commits, GitHub may refuse the publication and the run will not start. See [Troubleshooting](/docs/troubleshooting).",
        "Protected branches",
      ),
    ],
  },
  {
    slug: "monitor-runs",
    title: "Monitor runs and read logs",
    description: "Follow your runs, drill into a job and read its logs.",
    keywords: ["history", "logs", "status", "failed", "succeeded", "queued", "running", "job", "steps", "copy"],
    blocks: [
      h2("Open the history"),
      p("Go to the **History** tab and choose a project. **Recent runs** lists its latest executions, most recent first. Use **Refresh** to update the list."),
      h2("Statuses"),
      table(
        ["Status", "Meaning"],
        ["**Queued**", "Waiting for a machine to be available"],
        ["**Running**", "In progress"],
        ["**Succeeded**", "Every step passed"],
        ["**Failed**", "At least one step failed — open the logs to see which"],
      ),
      p("Each run also shows its trigger, the **Branch**, the **Commit**, and when it was **Updated**. **Open on GitHub** takes you to the run on github.com."),
      h2("Jobs and steps"),
      p("Select a run to see **Jobs and steps**, with the result of each step. Use **Back to runs** to return to the list."),
      h2("Read the logs"),
      ol(
        "In **Jobs and steps**, select a job.",
        "Its logs appear below.",
        "Use **Copy logs** to copy them, or **Scroll to bottom** to jump to the latest lines.",
      ),
      h2("Finding why a run failed"),
      ul(
        "Open the failed job and scroll to the first red or error line: later errors are often consequences of it.",
        "Check the step name just above it to know which part of your pipeline failed.",
        "Fix the cause, then choose **Run** again.",
      ),
      note(
        "**Job logs are not available yet.** GitHub only provides logs once a job has started. Wait a few seconds and refresh.",
        "Logs are empty?",
      ),
    ],
  },
  {
    slug: "understand-predictions",
    title: "Understand predictions",
    description: "How FlowOps estimates run time and failure risk, and how to use these numbers.",
    keywords: ["prediction", "duration", "risk", "forecast", "failure", "machine learning", "estimate"],
    blocks: [
      h2("What you get"),
      p("While you configure a workflow, FlowOps can show two estimates for it:"),
      ul(
        "**Estimated duration**, in seconds — how long a run is likely to take.",
        "**Failure risk**, as a percentage — how likely a run is to fail.",
      ),
      h2("Reading the risk"),
      table(
        ["Failure risk", "Level", "What to do"],
        ["0 % – 30 %", "Low", "Nothing special"],
        ["30 % – 70 %", "Medium", "Check that tests and build steps are present and sensible"],
        ["70 % – 100 %", "High", "Review the configuration before running; expect failures"],
      ),
      h2("How it is calculated"),
      p(
        "Two models look at the shape of your workflow — number of jobs and steps, whether it builds, tests or deploys, how it is triggered, the runner — and at the past runs of the repository when available.",
      ),
      h2("Keep in mind"),
      ul(
        "These are **estimates**, not promises.",
        "The models ship trained on **sample data**. Until they are retrained on real runs, treat the numbers as indicative.",
        "A prediction needs the prediction service to be available. If it is not, the rest of FlowOps works normally.",
      ),
      tip("The estimates become more useful as your repository builds up run history."),
    ],
  },
];
