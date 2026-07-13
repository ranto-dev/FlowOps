import React, { useState, useEffect } from "react";
import { Trash2, Settings, Layers, Play, CheckCircle2 } from "lucide-react";
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

  const addStepToActiveJob = (type: LowCodeStep["type"]) => {
    if (!activeJobId) return;
    let defs: Partial<LowCodeStep> = { type };
    let name = "Custom step";

    if (type === "checkout") name = "📥 Checkout Repository";
    if (type === "setup-node") {
      name = "🟢 Setup NodeJS Env";
      defs.node_version = "22";
    }
    if (type === "npm") {
      name = "📦 Run NPM script";
      defs.npm_command = "install";
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
      defs.custom_script = "echo 'FlowOps Run'";
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
    <div className="w-full max-w-3xl mx-auto bg-white p-8 rounded-3xl border border-slate-100 shadow-xl space-y-6 text-left animate-in fade-in zoom-in-95 duration-200">
      {/* SECTION 1 */}
      <div className="bg-slate-50/70 p-5 rounded-2xl space-y-4 border border-slate-100">
        <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
          <Settings className="w-4 h-4 text-purple-600" /> 1. Configuration
          Globale du Pipeline
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">
              Nom de Fichier unique
            </label>
            <input
              type="text"
              value={config.filename}
              onChange={(e) => updateGlobal("filename", e.target.value)}
              className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-mono text-slate-900 focus:outline-none focus:border-purple-500"
              placeholder="production-pipeline.yaml"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">
              Nom d'affichage
            </label>
            <input
              type="text"
              value={config.name}
              onChange={(e) => updateGlobal("name", e.target.value)}
              className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:border-purple-500"
              placeholder="Workflow Name"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block">
            Événements Déclencheurs
          </label>
          <div className="flex gap-4 bg-white p-2.5 rounded-xl border border-slate-100">
            {["push", "pull_request", "workflow_dispatch"].map((ev) => (
              <label
                key={ev}
                className="flex items-center gap-2 text-xs text-slate-900 font-bold cursor-pointer select-none"
              >
                <input
                  type="checkbox"
                  checked={config.on_events.includes(ev)}
                  onChange={() => handleEventToggle(ev)}
                  className="rounded border-slate-300 text-purple-600 focus:ring-purple-500 w-4 h-4"
                />
                {ev}
              </label>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">
              Filtrage des Branches
            </label>
            <input
              type="text"
              value={config.branches}
              onChange={(e) => updateGlobal("branches", e.target.value)}
              className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-mono text-slate-900 focus:outline-none focus:border-purple-500"
              placeholder="main, develop"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">
              Variables Globales (`env` KEY=VAL)
            </label>
            <input
              type="text"
              value={config.global_env}
              onChange={(e) => updateGlobal("global_env", e.target.value)}
              className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-mono text-slate-900 focus:outline-none focus:border-purple-500"
              placeholder="NODE_ENV=production"
            />
          </div>
        </div>
      </div>

      {/* SECTION 2 */}
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <Layers className="w-4 h-4 text-purple-600" /> 2. Orchestration &
            Graphe de Jobs
          </h3>
          <button
            type="button"
            onClick={addJob}
            className="px-3 py-1.5 bg-slate-900 text-white font-bold text-[11px] rounded-xl hover:bg-slate-800 transition-all"
          >
            + Ajouter un Job
          </button>
        </div>

        <div className="flex flex-wrap gap-2 border-b border-slate-100 pb-3">
          {config.jobs.map((j) => (
            <div
              key={j.id}
              className={`flex items-center gap-2.5 p-2 px-4 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                j.id === activeJobId
                  ? "bg-gradient-to-r from-violet-600 to-purple-600 text-white border-transparent shadow-md shadow-purple-500/10"
                  : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
              }`}
            >
              <span onClick={() => setActiveJobId(j.id)}>{j.name}</span>
              <Trash2
                className={`w-3.5 h-3.5 ${j.id === activeJobId ? "text-purple-200 hover:text-white" : "text-slate-400 hover:text-red-500"}`}
                onClick={(e) => {
                  e.stopPropagation();
                  removeJob(j.id);
                }}
              />
            </div>
          ))}
        </div>
      </div>

      {/* SECTION 3 */}
      {selectedJob && (
        <div className="border border-slate-200 rounded-2xl p-5 bg-white space-y-4 shadow-inner/5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                Identifiant unique du Job
              </label>
              <input
                type="text"
                value={selectedJob.name}
                onChange={(e) =>
                  updateJobField(selectedJob.id, "name", e.target.value)
                }
                className="w-full p-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                Runner d'exécution
              </label>
              <select
                value={selectedJob.runs_on}
                onChange={(e) =>
                  updateJobField(selectedJob.id, "runs_on", e.target.value)
                }
                className="w-full p-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 bg-white"
              >
                <option value="ubuntu-latest">ubuntu-latest (Linux)</option>
                <option value="windows-latest">windows-latest (Windows)</option>
                <option value="macos-latest">macos-latest (Mac)</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                Dépendance séquentielle (`needs`)
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
                className="w-full p-2 border border-slate-200 rounded-xl text-xs font-mono text-slate-900"
                placeholder="ex: build"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50/50 p-3 rounded-xl border border-slate-100">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                Clé Matrice de Test
              </label>
              <input
                type="text"
                value={selectedJob.matrix_key || ""}
                onChange={(e) =>
                  updateJobField(selectedJob.id, "matrix_key", e.target.value)
                }
                className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs font-mono"
                placeholder="ex: node-version"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                Valeurs Multi-runtime (séparées par des ,)
              </label>
              <input
                type="text"
                value={selectedJob.matrix_values || ""}
                onChange={(e) =>
                  updateJobField(
                    selectedJob.id,
                    "matrix_values",
                    e.target.value,
                  )
                }
                className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs font-mono"
                placeholder="ex: 18, 20, 22"
              />
            </div>
          </div>

          <div className="space-y-3 pt-3 border-t border-slate-100">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
              <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Séquence d'Épingle des Steps
              </span>
              <div className="flex flex-wrap gap-1.5">
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
                    className="px-2.5 py-1 bg-purple-50 text-purple-700 hover:bg-purple-100 text-[10px] font-bold rounded-lg border border-purple-200/40 capitalize transition-all"
                  >
                    + {type}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
              {selectedJob.steps.map((step, idx) => (
                <div
                  key={step.id}
                  className="p-3.5 border border-slate-150 rounded-xl bg-slate-50/30 space-y-2"
                >
                  <div className="flex justify-between items-center text-xs font-bold text-slate-900">
                    <span className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-purple-600" />{" "}
                      {idx + 1}. {step.name}
                    </span>
                    <Trash2
                      className="w-3.5 h-3.5 text-slate-400 hover:text-red-500 cursor-pointer transition-colors"
                      onClick={() => removeStepFromActiveJob(step.id)}
                    />
                  </div>

                  {step.type === "setup-node" && (
                    <select
                      value={step.node_version}
                      onChange={(e) =>
                        updateStepField(step.id, "node_version", e.target.value)
                      }
                      className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-800"
                    >
                      <option value="18">Node Runtime v18.x</option>
                      <option value="20">Node Runtime v20.x</option>
                      <option value="22">Node Runtime v22.x</option>
                    </select>
                  )}

                  {step.type === "npm" && (
                    <select
                      value={step.npm_command}
                      onChange={(e) =>
                        updateStepField(step.id, "npm_command", e.target.value)
                      }
                      className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs font-mono text-slate-800"
                    >
                      <option value="install">
                        npm install (Installation standard)
                      </option>
                      <option value="ci">
                        npm ci (Installation isolée CI de production)
                      </option>
                      <option value="run lint">
                        npm run lint (Analyse statique de propreté)
                      </option>
                      <option value="test">
                        npm test (Validation d'intégration)
                      </option>
                      <option value="run build">
                        npm run build (Transpilation Webpack/Vite)
                      </option>
                    </select>
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
                        className="p-2 border border-slate-200 bg-white rounded-lg text-xs font-mono"
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
                        className="p-2 border border-slate-200 bg-white rounded-lg text-xs font-bold"
                      >
                        <option value="dockerhub">Docker Hub Central</option>
                        <option value="ghcr">GitHub Packages (GHCR)</option>
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
                      className="w-full p-2 border border-slate-200 bg-white rounded-lg text-xs font-mono"
                      placeholder="Commandes Shell libres..."
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* BOUTON ULTRA DESIGN EN LIÉNAIRE PURPLE-BLUE */}
      <button
        type="button"
        onClick={onGenerate}
        disabled={loading}
        className="w-full py-4 bg-gradient-to-r from-violet-600 via-purple-600 to-blue-500 hover:opacity-95 text-white font-extrabold text-xs uppercase tracking-widest rounded-2xl shadow-lg shadow-purple-600/10 transition-all flex items-center justify-center gap-2"
      >
        <Play className="w-3.5 h-3.5 fill-current" />
        {loading ? "Calcul de la Matrice..." : "Generate Configuration"}
      </button>
    </div>
  );
};
