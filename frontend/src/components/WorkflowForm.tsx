import React, { useState, useEffect } from "react";
import {
  Trash2,
  Layers,
  Settings,
} from "lucide-react";
import type {
  FlowOpsWorkflowConfig,
  LowCodeJob,
  LowCodeStep,
} from "../@types/workflow";

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
  const [config, setConfig] = useState<FlowOpsWorkflowConfig>(activeConfig);
  const [activeJobId, setActiveJobId] = useState<string>("");

  useEffect(() => {
    setConfig(activeConfig);
    if (activeConfig.jobs.length > 0 && !activeJobId) {
      setActiveJobId(activeConfig.jobs[0].id);
    }
  }, [activeConfig]);

  const updateGlobal = (field: keyof FlowOpsWorkflowConfig, value: any) => {
    const updated = { ...config, [field]: value };
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

  // --- LOGIQUE DES JOBS ---
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

  const updateJobField = (
    jobId: string,
    field: keyof LowCodeJob,
    value: any,
  ) => {
    const updatedJobs = config.jobs.map((j) =>
      j.id === jobId ? { ...j, [field]: value } : j,
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

  // --- LOGIQUE DES STEPS (Dans le Job Actif) ---
  const addStepToActiveJob = (type: LowCodeStep["type"]) => {
    if (!activeJobId) return;
    let defs: Partial<LowCodeStep> = { type };
    let name = "Custom step";

    if (type === "checkout") name = "📥 Checkout Repository";
    if (type === "setup-node") {
      name = "🟢 Setup NodeJS Env";
      defs.node_version = "20";
    }
    if (type === "npm") {
      name = "📦 Run NPM script";
      defs.npm_command = "ci";
    }
    if (type === "docker") {
      name = "🐳 Build Production Container";
      defs.docker_image = "api-service";
      defs.docker_registry = "dockerhub";
    }
    if (type === "upload-artifact") {
      name = "💾 Archive Build Artifacts";
      defs.artifact_path = "dist/";
    }
    if (type === "custom-run") {
      name = "⚙️ Execute Shell commands";
      defs.custom_script = "echo 'FlowOps Script Running'";
    }

    const newStep: LowCodeStep = {
      id: `step-${Date.now()}`,
      name,
      type,
      ...defs,
    };

    const updatedJobs = config.jobs.map((j) => {
      if (j.id === activeJobId) return { ...j, steps: [...j.steps, newStep] };
      return j;
    });

    const updatedConfig = { ...config, jobs: updatedJobs };
    setConfig(updatedConfig);
    onChangeConfig(updatedConfig);
  };

  const updateStepField = (
    stepId: string,
    field: keyof LowCodeStep,
    value: any,
  ) => {
    const updatedJobs = config.jobs.map((j) => {
      if (j.id === activeJobId) {
        return {
          ...j,
          steps: j.steps.map((s) =>
            s.id === stepId ? { ...s, [field]: value } : s,
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
    const updatedJobs = config.jobs.map((j) => {
      if (j.id === activeJobId)
        return { ...j, steps: j.steps.filter((s) => s.id !== stepId) };
      return j;
    });
    const updatedConfig = { ...config, jobs: updatedJobs };
    setConfig(updatedConfig);
    onChangeConfig(updatedConfig);
  };

  const selectedJob = config.jobs.find((j) => j.id === activeJobId);

  return (
    <div className="w-full lg:w-7/12 bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-800 space-y-6 max-h-[85vh] overflow-y-auto text-left">
      {/* 1. CONFIGURATION GÉNÉRALE DU WORKFLOW */}
      <div className="bg-slate-50 dark:bg-slate-800/30 p-4 rounded-xl space-y-3">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wide flex items-center gap-2">
          <Settings className="w-4 h-4 text-indigo-500" /> 1. Configuration
          Générale (Workflow Level)
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <input
            type="text"
            value={config.filename}
            onChange={(e) => updateGlobal("filename", e.target.value)}
            className="p-2 border rounded-lg text-xs font-mono"
            placeholder="ci.yml"
          />
          <input
            type="text"
            value={config.name}
            onChange={(e) => updateGlobal("name", e.target.value)}
            className="p-2 border rounded-lg text-xs"
            placeholder="Workflow Name"
          />
        </div>

        {/* Checkboxes modernisées pour les déclencheurs */}
        <div className="flex gap-4 pt-1">
          {["push", "pull_request", "workflow_dispatch"].map((ev) => (
            <label
              key={ev}
              className="flex items-center gap-1.5 text-xs text-slate-600 font-medium cursor-pointer"
            >
              <input
                type="checkbox"
                checked={config.on_events.includes(ev)}
                onChange={() => handleEventToggle(ev)}
                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              {ev}
            </label>
          ))}
        </div>
        <input
          type="text"
          value={config.branches}
          onChange={(e) => updateGlobal("branches", e.target.value)}
          className="w-full p-2 border rounded-lg text-xs font-mono mt-1"
          placeholder="Branches (ex: main, develop)"
        />

        {/* Variables d'env globales */}
        <textarea
          rows={1}
          value={config.global_env}
          onChange={(e) => updateGlobal("global_env", e.target.value)}
          className="w-full p-2 border rounded-lg text-xs font-mono"
          placeholder="Variables d'Env globales (ex: NODE_ENV=production)"
        />
      </div>

      {/* 2. ARCHITECTURE DES JOBS (ONGLETS DYNAMIQUES) */}
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wide flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-500" /> 2. Orchestration des
            Jobs (`needs`)
          </h3>
          <button
            type="button"
            onClick={addJob}
            className="px-2 py-1 bg-indigo-600 text-white font-bold text-[10px] rounded-lg hover:bg-indigo-700 transition-colors"
          >
            + Ajouter Job
          </button>
        </div>

        {/* Liste horizontale des onglets de Jobs */}
        <div className="flex flex-wrap gap-2 border-b pb-2">
          {config.jobs.map((j) => (
            <div
              key={j.id}
              className={`flex items-center gap-2 p-1.5 px-3 rounded-lg border text-xs font-semibold cursor-pointer transition-all ${
                j.id === activeJobId
                  ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                  : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
              }`}
            >
              <span onClick={() => setActiveJobId(j.id)}>{j.name}</span>
              <Trash2
                className="w-3.5 h-3.5 text-slate-400 hover:text-red-400"
                onClick={(e) => {
                  e.stopPropagation();
                  removeJob(j.id);
                }}
              />
            </div>
          ))}
        </div>
      </div>

      {/* 3. CONFIGURATION DU JOB SÉLECTIONNÉ */}
      {selectedJob && (
        <div className="border border-slate-200 rounded-xl p-4 bg-white space-y-4 shadow-sm animate-fadeIn">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                Nom du Job
              </label>
              <input
                type="text"
                value={selectedJob.name}
                onChange={(e) =>
                  updateJobField(selectedJob.id, "name", e.target.value)
                }
                className="w-full p-1.5 border rounded-lg text-xs font-semibold"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                Système (Runner)
              </label>
              <select
                value={selectedJob.runs_on}
                onChange={(e) =>
                  updateJobField(selectedJob.id, "runs_on", e.target.value)
                }
                className="w-full p-1.5 border rounded-lg text-xs"
              >
                <option value="ubuntu-latest">ubuntu-latest</option>
                <option value="windows-latest">windows-latest</option>
                <option value="macos-latest">macos-latest</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                Dépend de (`needs`)
              </label>
              <input
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
                className="w-full p-1.5 border rounded-lg text-xs font-mono"
                placeholder="Ex: build"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 bg-slate-50 p-2.5 rounded-lg">
            <input
              type="text"
              value={selectedJob.matrix_key || ""}
              onChange={(e) =>
                updateJobField(selectedJob.id, "matrix_key", e.target.value)
              }
              className="p-1.5 border rounded text-xs font-mono"
              placeholder="Clé Matrice (ex: node-version)"
            />
            <input
              type="text"
              value={selectedJob.matrix_values || ""}
              onChange={(e) =>
                updateJobField(selectedJob.id, "matrix_values", e.target.value)
              }
              className="p-1.5 border rounded text-xs font-mono"
              placeholder="Valeurs (ex: 18, 20, 22)"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-0.5">
              Condition du Job (`if` optionnel)
            </label>
            <input
              type="text"
              value={selectedJob.job_if || ""}
              onChange={(e) =>
                updateJobField(selectedJob.id, "job_if", e.target.value)
              }
              className="w-full p-1.5 border rounded text-xs font-mono"
              placeholder="ex: github.ref == 'refs/heads/main'"
            />
          </div>

          {/* COMPOSITION DES STEPS DU JOB */}
          <div className="space-y-3 pt-2 border-t">
            <div className="flex justify-between items-center flex-wrap gap-2">
              <span className="text-xs font-bold text-slate-800">
                Séquence des Steps
              </span>
              <div className="flex gap-1 flex-wrap">
                {[
                  "checkout",
                  "setup-node",
                  "npm",
                  "docker",
                  "upload-artifact",
                  "custom-run",
                ].map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => addStepToActiveJob(type as any)}
                    className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold rounded capitalize border"
                  >
                    + {type}
                  </button>
                ))}
              </div>
            </div>

            {/* Render des étapes empilées */}
            <div className="space-y-3 max-h-[250px] overflow-y-auto pr-1">
              {selectedJob.steps.map((step, idx) => (
                <div
                  key={step.id}
                  className="p-3 border rounded-lg bg-slate-50/50 space-y-2 relative"
                >
                  <div className="flex justify-between items-center text-xs font-bold text-indigo-600">
                    <span>
                      {idx + 1}. {step.name}
                    </span>
                    <Trash2
                      className="w-3.5 h-3.5 text-slate-400 hover:text-red-500 cursor-pointer"
                      onClick={() => removeStepFromActiveJob(step.id)}
                    />
                  </div>

                  {step.type === "setup-node" && (
                    <select
                      value={step.node_version}
                      onChange={(e) =>
                        updateStepField(step.id, "node_version", e.target.value)
                      }
                      className="w-full p-1 border rounded text-xs"
                    >
                      <option value="18">v18.x</option>
                      <option value="20">v20.x</option>
                      <option value="22">v22.x</option>
                    </select>
                  )}

                  {step.type === "npm" && (
                    <select
                      value={step.npm_command}
                      onChange={(e) =>
                        updateStepField(step.id, "npm_command", e.target.value)
                      }
                      className="w-full p-1 border rounded text-xs font-mono"
                    >
                      <option value="ci">
                        npm ci (Clean Install pour production)
                      </option>
                      <option value="install">npm install</option>
                      <option value="run lint">npm run lint</option>
                      <option value="test">npm test</option>
                      <option value="run build">npm run build</option>
                    </select>
                  )}

                  {step.type === "upload-artifact" && (
                    <input
                      type="text"
                      value={step.artifact_path}
                      onChange={(e) =>
                        updateStepField(
                          step.id,
                          "artifact_path",
                          e.target.value,
                        )
                      }
                      className="w-full p-1 border rounded text-xs font-mono"
                      placeholder="Dossier cible (ex: dist/ ou build/)"
                    />
                  )}

                  {step.type === "docker" && (
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        value={step.docker_image}
                        onChange={(e) =>
                          updateStepField(
                            step.id,
                            "docker_image",
                            e.target.value,
                          )
                        }
                        className="p-1 border rounded text-xs font-mono"
                        placeholder="Image Name"
                      />
                      <select
                        value={step.docker_registry}
                        onChange={(e) =>
                          updateStepField(
                            step.id,
                            "docker_registry",
                            e.target.value,
                          )
                        }
                        className="p-1 border rounded text-xs"
                      >
                        <option value="dockerhub">Docker Hub</option>
                        <option value="ghcr">GitHub CR</option>
                      </select>
                    </div>
                  )}

                  {step.type === "custom-run" && (
                    <textarea
                      rows={2}
                      value={step.custom_script}
                      onChange={(e) =>
                        updateStepField(
                          step.id,
                          "custom_script",
                          e.target.value,
                        )
                      }
                      className="w-full p-1 border rounded text-xs font-mono"
                      placeholder="Entrez vos scripts multi-lignes ici..."
                    />
                  )}

                  <input
                    type="text"
                    value={step.step_if || ""}
                    onChange={(e) =>
                      updateStepField(step.id, "step_if", e.target.value)
                    }
                    className="w-full p-1 border rounded text-[10px] font-mono"
                    placeholder="Condition de l'étape (if: success() etc.)"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={onGenerate}
        disabled={loading}
        className="w-full py-2.5 bg-indigo-600 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-md transition-all"
      >
        {loading ? "Calcul d'Architecture..." : "Compiler la Pipeline FlowOps"}
      </button>
    </div>
  );
};
