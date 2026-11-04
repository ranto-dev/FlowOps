import React, { useState, useEffect } from "react";
import {
  Trash2,
  Settings,
  Layers,
  Play,
  Plus,
  CheckCircle2,
} from "lucide-react";
import type {
  FlowOpsWorkflowConfig,
  LowCodeJob,
  LowCodeStep,
} from "../@types/workflow";
import { usePreferences } from "../lib/usePreferences";
import { cn } from "../lib/utils";
import { Button } from "./ui/Button";
import { Field, Input, Select, Textarea } from "./ui/Field";

interface WorkflowFormProps {
  activeConfig: FlowOpsWorkflowConfig;
  onChangeConfig: (updated: FlowOpsWorkflowConfig) => void;
  onGenerate: () => void;
  loading: boolean;
}

export const WorkflowForm: React.FC<WorkflowFormProps> = ({
  activeConfig,
  onChangeConfig,
  onGenerate,
  loading,
}) => {
  const { t } = usePreferences();
  const [config, setConfig] = useState<FlowOpsWorkflowConfig>(activeConfig);
  const [activeJobId, setActiveJobId] = useState<string>("");

  useEffect(() => {
    setConfig(activeConfig);
    if (activeConfig.jobs.length > 0 && !activeJobId) {
      setActiveJobId(activeConfig.jobs[0].id);
    }
  }, [activeConfig, activeJobId]);

  const updateGlobal = <K extends keyof FlowOpsWorkflowConfig>(
    field: K,
    value: FlowOpsWorkflowConfig[K],
  ) => {
    const updated = { ...config, [field]: value } as FlowOpsWorkflowConfig;
    setConfig(updated);
    onChangeConfig(updated);
  };

  const handleEventToggle = (event: string) => {
    const current = [...config.on_events];
    const index = current.indexOf(event);
    if (index > -1) current.splice(index, 1);
    else current.push(event);
    updateGlobal("on_events", current);
  };

  const addJob = () => {
    const newId = `job-${Date.now()}`;
    const newJob: LowCodeJob = {
      id: newId,
      name: `Job ${config.jobs.length + 1}`,
      runs_on: "ubuntu-latest",
      needs: [],
      steps: [],
    };
    const updatedJobs = [...config.jobs, newJob];
    setConfig({ ...config, jobs: updatedJobs });
    onChangeConfig({ ...config, jobs: updatedJobs });
    setActiveJobId(newId);
  };

  const updateJobField = <K extends keyof LowCodeJob>(
    jobId: string,
    field: K,
    value: LowCodeJob[K],
  ) => {
    const updatedJobs = config.jobs.map((j) =>
      j.id === jobId ? ({ ...j, [field]: value } as LowCodeJob) : j,
    );
    const updatedConfig = { ...config, jobs: updatedJobs };
    setConfig(updatedConfig);
    onChangeConfig(updatedConfig);
  };

  const removeJob = (jobId: string) => {
    const updatedJobs = config.jobs.filter((j) => j.id !== jobId);
    const updatedConfig = { ...config, jobs: updatedJobs };
    setConfig(updatedConfig);
    onChangeConfig(updatedConfig);
    if (activeJobId === jobId && updatedJobs.length > 0) {
      setActiveJobId(updatedJobs[0].id);
    }
  };

  const addStepToActiveJob = (type: LowCodeStep["type"]) => {
    if (!activeJobId) return;
    const defs: Partial<LowCodeStep> = { type };
    let name = "Custom step";

    if (type === "checkout") name = "Checkout Repository";
    if (type === "setup-node") {
      name = "Setup NodeJS Env";
      defs.node_version = "22";
    }
    if (type === "npm") {
      name = "Run NPM script";
      defs.npm_command = "install";
    }
    if (type === "docker") {
      name = "Build Production Container";
      defs.docker_image = "api-service";
      defs.docker_registry = "dockerhub";
    }
    if (type === "upload-artifact") {
      name = "Archive Build Artifacts";
      defs.artifact_path = "dist/";
    }
    if (type === "custom-run") {
      name = "Execute Shell commands";
      defs.custom_script = "echo 'FlowOps run'";
    }

    const newStep: LowCodeStep = {
      id: `step-${Date.now()}`,
      name,
      type,
      ...defs,
    };
    const updatedJobs = config.jobs.map((j) =>
      j.id === activeJobId ? { ...j, steps: [...j.steps, newStep] } : j,
    );
    const updatedConfig = { ...config, jobs: updatedJobs };
    setConfig(updatedConfig);
    onChangeConfig(updatedConfig);
  };

  const updateStepField = <K extends keyof LowCodeStep>(
    stepId: string,
    field: K,
    value: LowCodeStep[K],
  ) => {
    const updatedJobs = config.jobs.map((j) => {
      if (j.id === activeJobId) {
        return {
          ...j,
          steps: j.steps.map((s) =>
            s.id === stepId ? ({ ...s, [field]: value } as LowCodeStep) : s,
          ),
        };
      }
      return j;
    });
    const updatedConfig = { ...config, jobs: updatedJobs };
    setConfig(updatedConfig);
    onChangeConfig(updatedConfig);
  };

  const removeStepFromActiveJob = (stepId: string) => {
    const updatedJobs = config.jobs.map((j) =>
      j.id === activeJobId
        ? { ...j, steps: j.steps.filter((s) => s.id !== stepId) }
        : j,
    );
    const updatedConfig = { ...config, jobs: updatedJobs };
    setConfig(updatedConfig);
    onChangeConfig(updatedConfig);
  };

  const selectedJob = config.jobs.find((j) => j.id === activeJobId);

  return (
    <div
      aria-busy={loading}
      className="w-full rounded-lg border border-line bg-surface p-6 text-left"
    >
      <fieldset
        disabled={loading}
        className="min-w-0 space-y-6 border-0 p-0"
      >
      <div className="flex justify-end border-b border-line pb-4">
        <Button
          type="button"
          size="lg"
          onClick={onGenerate}
          loading={loading}
          className="w-full sm:w-auto"
        >
          {!loading && <Play className="h-3.5 w-3.5 fill-current" />}
          {loading
            ? t("Compiling configuration...")
            : t("Generate workflow YAML")}
        </Button>
      </div>

      {/* SECTION 1 */}
      <section className="space-y-4 rounded-lg border border-line bg-surface-2/40 p-4">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-ink">
          <Settings className="h-4 w-4 text-accent-ink" /> 1.{" "}
          {t("Pipeline configuration")}
        </h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label={t("Workflow filename")}>
            {(id) => (
              <Input
                id={id}
                type="text"
                value={config.filename}
                onChange={(e) => updateGlobal("filename", e.target.value)}
                className="font-mono"
                placeholder="production-pipeline.yaml"
              />
            )}
          </Field>
          <Field label={t("Display name")}>
            {(id) => (
              <Input
                id={id}
                type="text"
                value={config.name}
                onChange={(e) => updateGlobal("name", e.target.value)}
                placeholder="Workflow Name"
              />
            )}
          </Field>
        </div>

        <div className="space-y-1.5">
          <span className="block text-sm font-medium text-ink">
            {t("Trigger events")}
          </span>
          <div className="flex flex-wrap gap-4 rounded-md border border-line bg-surface p-3">
            {["push", "pull_request", "workflow_dispatch"].map((ev) => (
              <label
                key={ev}
                className="flex cursor-pointer select-none items-center gap-2 text-sm text-ink"
              >
                <input
                  type="checkbox"
                  checked={config.on_events.includes(ev)}
                  onChange={() => handleEventToggle(ev)}
                  className="h-4 w-4 rounded accent-accent"
                />
                {ev}
              </label>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label={t("Branch filter")}>
            {(id) => (
              <Input
                id={id}
                type="text"
                value={config.branches}
                onChange={(e) => updateGlobal("branches", e.target.value)}
                className="font-mono"
                placeholder="main, develop"
              />
            )}
          </Field>
          <Field label={`${t("Global environment variables")} (\`env\` KEY=VALUE)`}>
            {(id) => (
              <Input
                id={id}
                type="text"
                value={config.global_env}
                onChange={(e) => updateGlobal("global_env", e.target.value)}
                className="font-mono"
                placeholder="NODE_ENV=production"
              />
            )}
          </Field>
        </div>
      </section>

      {/* SECTION 2 */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-ink">
            <Layers className="h-4 w-4 text-accent-ink" /> 2.{" "}
            {t("Jobs and orchestration")}
          </h3>
          <Button type="button" size="sm" variant="secondary" onClick={addJob}>
            <Plus className="h-3.5 w-3.5" /> {t("Add job")}
          </Button>
        </div>

        <div className="flex flex-wrap gap-2 border-b border-line pb-3">
          {config.jobs.map((j) => (
            <div
              key={j.id}
              className={cn(
                "flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm font-medium transition-colors",
                j.id === activeJobId
                  ? "border-accent/30 bg-accent/15 text-accent-ink"
                  : "border-line-strong bg-surface text-ink-muted hover:bg-surface-2 hover:text-ink",
              )}
            >
              <button
                type="button"
                onClick={() => setActiveJobId(j.id)}
                className="min-w-0 truncate text-left"
                aria-pressed={j.id === activeJobId}
              >
                {j.name}
              </button>
              <button
                type="button"
                onClick={() => removeJob(j.id)}
                className="shrink-0 rounded text-ink-subtle transition-colors hover:text-danger"
                aria-label={`${t("Delete")} ${j.name}`}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* SECTION 3 */}
      {selectedJob && (
        <section className="space-y-4 rounded-lg border border-line bg-surface p-4">
          <h4 className="text-sm font-semibold text-ink">{selectedJob.name}</h4>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Field label={t("Job name")}>
              {(id) => (
                <Input
                  id={id}
                  type="text"
                  value={selectedJob.name}
                  onChange={(e) =>
                    updateJobField(selectedJob.id, "name", e.target.value)
                  }
                />
              )}
            </Field>
            <Field label={t("Runner")}>
              {(id) => (
                <Select
                  id={id}
                  value={selectedJob.runs_on}
                  onChange={(e) =>
                    updateJobField(selectedJob.id, "runs_on", e.target.value)
                  }
                >
                  <option value="ubuntu-latest">ubuntu-latest (Linux)</option>
                  <option value="windows-latest">windows-latest (Windows)</option>
                  <option value="macos-latest">macos-latest (Mac)</option>
                </Select>
              )}
            </Field>
            <Field label={`${t("Dependencies")} (\`needs\`)`}>
              {(id) => (
                <Input
                  id={id}
                  type="text"
                  value={selectedJob.needs.join(", ")}
                  onChange={(e) =>
                    updateJobField(
                      selectedJob.id,
                      "needs",
                      e.target.value
                        .split(",")
                        .map((n) => n.trim())
                        .filter(Boolean),
                    )
                  }
                  className="font-mono"
                  placeholder="e.g. build"
                />
              )}
            </Field>
          </div>

          <div className="grid grid-cols-1 gap-4 rounded-md border border-line bg-surface-2/40 p-3 sm:grid-cols-2">
            <Field label={t("Matrix key")}>
              {(id) => (
                <Input
                  id={id}
                  type="text"
                  value={selectedJob.matrix_key || ""}
                  onChange={(e) =>
                    updateJobField(selectedJob.id, "matrix_key", e.target.value)
                  }
                  className="font-mono"
                  placeholder="e.g. node-version"
                />
              )}
            </Field>
            <Field label={t("Matrix values (comma-separated)")}>
              {(id) => (
                <Input
                  id={id}
                  type="text"
                  value={selectedJob.matrix_values || ""}
                  onChange={(e) =>
                    updateJobField(
                      selectedJob.id,
                      "matrix_values",
                      e.target.value,
                    )
                  }
                  className="font-mono"
                  placeholder="e.g. 18, 20, 22"
                />
              )}
            </Field>
          </div>

          <div className="space-y-3 border-t border-line pt-4">
            <div className="flex flex-col items-start justify-between gap-2 sm:flex-row sm:items-center">
              <span className="text-sm font-semibold text-ink">
                {t("Workflow steps")}
              </span>
              <div className="flex flex-wrap gap-1.5">
                {STEP_TYPES.map((type) => (
                  <Button
                    key={type}
                    type="button"
                    size="sm"
                    variant="secondary"
                    onClick={() => addStepToActiveJob(type)}
                  >
                    <Plus className="h-3.5 w-3.5" /> {t(stepTypeLabels[type])}
                  </Button>
                ))}
              </div>
            </div>

            <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
              {selectedJob.steps.map((step, idx) => (
                <div
                  key={step.id}
                  className="space-y-2 rounded-md border border-line bg-surface-2/50 p-3"
                >
                  <div className="flex items-center justify-between text-sm font-medium text-ink">
                    <span className="flex items-center gap-2">
                      <CheckCircle2 className="h-3.5 w-3.5 text-accent-ink" />{" "}
                      {idx + 1}. {step.name}
                    </span>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      className="h-7 px-2"
                      aria-label={`${t("Delete")} ${step.name}`}
                      onClick={() => removeStepFromActiveJob(step.id)}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>

                  {step.type === "setup-node" && (
                    <Select
                      aria-label={t("Set up Node.js")}
                      value={step.node_version}
                      onChange={(e) =>
                        updateStepField(step.id, "node_version", e.target.value)
                      }
                    >
                      <option value="18">Node Runtime v18.x</option>
                      <option value="20">Node Runtime v20.x</option>
                      <option value="22">Node Runtime v22.x</option>
                    </Select>
                  )}

                  {step.type === "npm" && (
                    <Select
                      aria-label={t("Run npm")}
                      value={step.npm_command}
                      onChange={(e) =>
                        updateStepField(step.id, "npm_command", e.target.value)
                      }
                      className="font-mono"
                    >
                      <option value="install">
                        {t("npm install (standard install)")}
                      </option>
                      <option value="ci">
                        {t("npm ci (clean CI install)")}
                      </option>
                      <option value="run lint">
                        {t("npm run lint (static analysis)")}
                      </option>
                      <option value="test">
                        {t("npm test (test suite)")}
                      </option>
                      <option value="run build">
                        {t("npm run build (production build)")}
                      </option>
                    </Select>
                  )}

                  {step.type === "docker" && (
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        type="text"
                        aria-label={t("Image name")}
                        value={step.docker_image}
                        onChange={(e) =>
                          updateStepField(
                            step.id,
                            "docker_image",
                            e.target.value,
                          )
                        }
                        className="font-mono"
                        placeholder={t("Image name")}
                      />
                      <Select
                        aria-label={t("Build Docker image")}
                        value={step.docker_registry}
                        onChange={(e) =>
                          updateStepField(
                            step.id,
                            "docker_registry",
                            e.target.value,
                          )
                        }
                      >
                        <option value="dockerhub">Docker Hub</option>
                        <option value="ghcr">GitHub Packages (GHCR)</option>
                      </Select>
                    </div>
                  )}

                  {step.type === "custom-run" && (
                    <Textarea
                      rows={2}
                      aria-label={t("Run a shell command")}
                      value={step.custom_script}
                      onChange={(e) =>
                        updateStepField(
                          step.id,
                          "custom_script",
                          e.target.value,
                        )
                      }
                      className="font-mono"
                      placeholder={t("Run a shell command")}
                    />
                  )}

                  {step.type === "upload-artifact" && (
                    <Input
                      type="text"
                      aria-label={t("Artifact path (e.g. dist/)")}
                      value={step.artifact_path ?? ""}
                      onChange={(e) =>
                        updateStepField(
                          step.id,
                          "artifact_path",
                          e.target.value,
                        )
                      }
                      className="font-mono"
                      placeholder={t("Artifact path (e.g. dist/)")}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
      </fieldset>
    </div>
  );
};

const stepTypeLabels: Record<LowCodeStep["type"], string> = {
  checkout: "Checkout",
  "setup-node": "Set up Node.js",
  npm: "Run npm",
  docker: "Build Docker image",
  "upload-artifact": "Upload artifact",
  "custom-run": "Custom command",
};

const STEP_TYPES: LowCodeStep["type"][] = [
  "checkout",
  "setup-node",
  "npm",
  "docker",
  "upload-artifact",
  "custom-run",
];
