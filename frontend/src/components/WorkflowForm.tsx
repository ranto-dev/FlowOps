import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Trash2, GitBranch, Terminal, Layers, Play } from "lucide-react";
import type { WorkflowConfig, WorkflowStep } from "../@types/workflow";

interface WorkflowFormProps {
  onGenerate: (config: WorkflowConfig & { steps: WorkflowStep[] }) => void;
  loading: boolean;
}

export const WorkflowForm: React.FC<WorkflowFormProps> = ({
  onGenerate,
  loading,
}) => {
  const [name, setName] = useState<string>("CI Pipeline");
  const [trigger, setTrigger] = useState<string>("push");
  const [steps, setSteps] = useState<WorkflowStep[]>([
    { id: "1", name: "Checkout code", uses: "actions/checkout@v4" },
  ]);

  const addStep = () => {
    const newStep: WorkflowStep = {
      id: Date.now().toString(),
      name: "New Custom Step",
      run: 'echo "Hello World"',
    };
    setSteps([...steps, newStep]);
  };

  const updateStep = (id: string, field: keyof WorkflowStep, value: string) => {
    setSteps(
      steps.map((step) =>
        step.id === id ? { ...step, [field]: value } : step,
      ),
    );
  };

  const removeStep = (id: string) => {
    setSteps(steps.filter((step) => step.id !== id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onGenerate({ name, on: trigger, steps });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full max-w-xl bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-800"
    >
      <div className="flex items-center gap-2 mb-6 border-b border-slate-100 dark:border-slate-800 pb-4">
        <Layers className="w-6 h-6 text-indigo-600" />
        <h2 className="text-xl font-bold text-slate-800 dark:text-white">
          Configuration du Workflow
        </h2>
      </div>

      {/* Configuration Globale */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Nom du Workflow
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-transparent text-slate-800 dark:text-white text-sm"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Déclencheur (Event)
          </label>
          <div className="relative">
            <select
              value={trigger}
              onChange={(e) => setTrigger(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-transparent text-slate-800 dark:text-white text-sm appearance-none"
            >
              <option value="push">Git Push</option>
              <option value="pull_request">Pull Request</option>
            </select>
            <GitBranch className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Section des Steps */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-md font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
            <Terminal className="w-4 h-4 text-indigo-500" /> Étapes du Pipeline
          </h3>
          <button
            type="button"
            onClick={addStep}
            className="flex items-center gap-1 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 font-medium text-xs rounded-lg hover:bg-indigo-100 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> Ajouter une étape
          </button>
        </div>

        {/* Animation de la liste de steps */}
        <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
          <AnimatePresence initial={false}>
            {steps.map((step, index) => (
              <motion.div
                key={step.id}
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{
                  opacity: 0,
                  scale: 0.95,
                  transition: { duration: 0.2 },
                }}
                layout
                className="p-4 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-800/40 relative group"
              >
                <div className="flex justify-between items-start gap-4 mb-3">
                  <span className="text-xs font-bold text-indigo-500 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded">
                    0{index + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeStep(step.id)}
                    className="text-slate-400 hover:text-red-500 p-1 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                      Nom
                    </label>
                    <input
                      type="text"
                      value={step.name}
                      onChange={(e) =>
                        updateStep(step.id, "name", e.target.value)
                      }
                      className="w-full px-2.5 py-1.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-md text-xs text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      required
                    />
                  </div>

                  {step.uses ? (
                    <div>
                      <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                        Action (uses)
                      </label>
                      <input
                        type="text"
                        value={step.uses}
                        onChange={(e) =>
                          updateStep(step.id, "uses", e.target.value)
                        }
                        className="w-full px-2.5 py-1.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-md text-xs text-slate-500 font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>
                  ) : (
                    <div>
                      <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                        Commande (run)
                      </label>
                      <input
                        type="text"
                        value={step.run || ""}
                        onChange={(e) =>
                          updateStep(step.id, "run", e.target.value)
                        }
                        className="w-full px-2.5 py-1.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-md text-xs text-slate-700 dark:text-slate-300 font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* Bouton de Soumission */}
      <button
        type="submit"
        disabled={loading}
        className="w-full py-3 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-semibold text-sm rounded-xl shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
      >
        <Play className="w-4 h-4 fill-current" />
        {loading ? "Génération..." : "Generate Configuration"}
      </button>
    </form>
  );
};
