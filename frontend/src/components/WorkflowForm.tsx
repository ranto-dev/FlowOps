import React, { useState, useEffect } from "react";
import {
  Plus,
  Trash2,
  Terminal,
  Globe,
  Cpu,
  FolderOpen,
  Code,
  Package,
} from "lucide-react";
import type { WorkflowConfig, Step } from "../@types/workflow";

interface WorkflowFormProps {
  activeConfig: WorkflowConfig;
  onChangeConfig: (updated: WorkflowConfig) => void;
  onGenerate: () => void;
  loading: boolean;
}

export const WorkflowForm: React.FC<WorkflowFormProps> = ({
  activeConfig,
  onChangeConfig,
  onGenerate,
  loading,
}) => {
  const [localConfig, setLocalConfig] = useState<WorkflowConfig>(activeConfig);

  useEffect(() => {
    setLocalConfig(activeConfig);
  }, [activeConfig]);

  const updateField = (field: keyof WorkflowConfig, value: any) => {
    const updated = { ...localConfig, [field]: value };
    setLocalConfig(updated);
    onChangeConfig(updated);
  };

  const addStep = (type: "run" | "uses") => {
    const newStep: Step = {
      id: Date.now().toString(),
      name:
        type === "uses"
          ? "Fetch Repository Action"
          : "Execute Multi-line Script",
      type: type,
      content:
        type === "uses"
          ? "actions/checkout@v4"
          : 'echo "Line 1"\necho "Line 2"\nnpm run build',
      env: "",
    };
    const updatedSteps = [...localConfig.steps, newStep];
    updateField("steps", updatedSteps);
  };

  const updateStep = (id: string, field: keyof Step, value: any) => {
    const updatedSteps = localConfig.steps.map((step) =>
      step.id === id ? { ...step, [field]: value } : step,
    );
    updateField("steps", updatedSteps);
  };

  const removeStep = (id: string) => {
    const updatedSteps = localConfig.steps.filter((step) => step.id !== id);
    updateField("steps", updatedSteps);
  };

  return (
    <div className="w-full lg:w-7/12 bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-800 space-y-6 max-h-[85vh] overflow-y-auto text-left">
      {/* Target File Block */}
      <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl space-y-4">
        <h3 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2">
          <FolderOpen className="w-4 h-4 text-indigo-500" /> Explorateur &
          Fichiers Targets
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">
              Nom du fichier de config
            </label>
            <input
              type="text"
              value={localConfig.filename}
              onChange={(e) => updateField("filename", e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-lg focus:ring-2 focus:ring-indigo-500 text-slate-800 dark:text-white"
              placeholder="ci-cd.yml"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">
              Nom du Pipeline (Workflow Name)
            </label>
            <input
              type="text"
              value={localConfig.name}
              onChange={(e) => updateField("name", e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-lg focus:ring-2 focus:ring-indigo-500 text-slate-800 dark:text-white"
            />
          </div>
        </div>
      </div>

      {/* Triggers */}
      <div className="border border-slate-100 dark:border-slate-800 p-4 rounded-xl space-y-4">
        <h3 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2">
          <Globe className="w-4 h-4 text-indigo-500" /> Événements Déclencheurs
          (Triggers)
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">
              Stratégie d'événement
            </label>
            <select
              value={localConfig.on_event}
              onChange={(e) => updateField("on_event", e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-lg text-slate-800 dark:text-white"
            >
              <option value="push">Git Push</option>
              <option value="pull_request">Pull Request</option>
              <option value="workflow_dispatch">Déclenchement Manuel</option>
            </select>
          </div>
          {["push", "pull_request"].includes(localConfig.on_event) && (
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">
                Branches de filtrage
              </label>
              <input
                type="text"
                value={localConfig.branches}
                onChange={(e) => updateField("branches", e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-lg text-slate-800 dark:text-white"
                placeholder="main, dev, feature/*"
              />
            </div>
          )}
        </div>
      </div>

      {/* Infrastructure Matrice Globalisée */}
      <div className="border border-slate-100 dark:border-slate-800 p-4 rounded-xl space-y-4">
        <h3 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2">
          <Cpu className="w-4 h-4 text-indigo-500" /> Matrice Polyvalente &
          Infra (Matrix Strategy)
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">
              Machine (runs-on)
            </label>
            <select
              value={localConfig.runs_on}
              onChange={(e) => updateField("runs_on", e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-lg text-slate-800 dark:text-white"
            >
              <option value="ubuntu-latest">ubuntu-latest (Linux)</option>
              <option value="windows-latest">windows-latest (Windows)</option>
              <option value="macos-latest">macos-latest (Mac)</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">
              Clé de matrice libre
            </label>
            <input
              type="text"
              value={localConfig.matrix_key}
              onChange={(e) => updateField("matrix_key", e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-lg text-slate-800 dark:text-white font-mono"
              placeholder="Ex: python-version, go-version"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">
              Versions / Cibles
            </label>
            <input
              type="text"
              value={localConfig.matrix_values}
              onChange={(e) => updateField("matrix_values", e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-lg text-slate-800 dark:text-white font-mono"
              placeholder="Ex: 3.10, 3.11, 3.12"
            />
          </div>
        </div>
      </div>

      {/* Sequence of Custom Steps */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <Terminal className="w-4 h-4 text-indigo-500" /> Séquence Infinie
            d'Étapes (Steps Workspace)
          </h3>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => addStep("uses")}
              className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white font-semibold text-[11px] rounded-lg flex items-center gap-1 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" /> + Action (uses)
            </button>
            <button
              type="button"
              onClick={() => addStep("run")}
              className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-[11px] rounded-lg flex items-center gap-1 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" /> + Script Shell (run)
            </button>
          </div>
        </div>

        <div className="space-y-4 max-h-[400px] overflow-y-auto pr-1">
          {localConfig.steps.map((step, index) => (
            <div
              key={step.id}
              className="p-4 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-800/10 space-y-3"
            >
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-indigo-600 bg-indigo-50 dark:bg-indigo-950 px-2 py-0.5 rounded">
                    #{index + 1}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase flex items-center gap-1 ${
                      step.type === "uses"
                        ? "bg-amber-100 text-amber-800"
                        : "bg-blue-100 text-blue-800"
                    }`}
                  >
                    {step.type === "uses" ? (
                      <Package className="w-3 h-3" />
                    ) : (
                      <Code className="w-3 h-3" />
                    )}
                    {step.type}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => removeStep(step.id)}
                  className="text-slate-400 hover:text-red-500 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-slate-400 mb-0.5">
                    Nom d'affichage de la tâche
                  </label>
                  <input
                    type="text"
                    value={step.name}
                    onChange={(e) =>
                      updateStep(step.id, "name", e.target.value)
                    }
                    className="w-full px-2.5 py-1.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs rounded text-slate-800 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-400 mb-0.5">
                    {step.type === "uses"
                      ? "Référence de l'action (uses)"
                      : "Script Shell Multi-lignes (run)"}
                  </label>
                  {step.type === "uses" ? (
                    <input
                      type="text"
                      value={step.content}
                      onChange={(e) =>
                        updateStep(step.id, "content", e.target.value)
                      }
                      className="w-full px-2.5 py-1.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono rounded text-slate-700 dark:text-slate-300"
                    />
                  ) : (
                    <textarea
                      rows={3}
                      value={step.content}
                      onChange={(e) =>
                        updateStep(step.id, "content", e.target.value)
                      }
                      className="w-full px-2.5 py-1.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono rounded text-slate-700 dark:text-slate-300 focus:ring-1 focus:ring-indigo-500"
                      placeholder="echo 'Première commande'\ncd source/\nnpm run test"
                    />
                  )}
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-400 mb-0.5">
                    Variables d'Environnement de l'étape (Optionnel, format :
                    K=V par ligne)
                  </label>
                  <textarea
                    rows={2}
                    value={step.env || ""}
                    onChange={(e) => updateStep(step.id, "env", e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono rounded text-slate-500 focus:ring-1 focus:ring-indigo-500"
                    placeholder="NODE_ENV=production&#10;API_KEY=secret_token_123"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <button
        type="button"
        onClick={onGenerate}
        disabled={loading}
        className="w-full py-3 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 text-white font-semibold text-sm rounded-xl shadow-lg transition-all disabled:opacity-50"
      >
        {loading
          ? "Compilation de l'architecture..."
          : "Generate Enterprise Configuration"}
      </button>
    </div>
  );
};
