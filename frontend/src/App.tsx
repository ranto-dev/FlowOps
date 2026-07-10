import { useState } from "react";
import { WorkflowForm } from "./components/WorkflowForm";
import { YamlPreview } from "./components/YamlPreview";
import type { WorkflowConfig, WorkflowStep } from "./@types/workflow";
import { Sparkles } from "lucide-react";

function App() {
  const [generatedYaml, setGeneratedYaml] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerateConfiguration = async (
    config: WorkflowConfig & { steps: WorkflowStep[] },
  ) => {
    setLoading(true);
    setError(null);
    setGeneratedYaml(null);

    try {
      const response = await fetch(
        "http://localhost:8000/api/generate-workflow",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(config),
        },
      );

      if (!response.ok) {
        throw new Error(`Erreur serveur : ${response.status}`);
      }

      const data = await response.json();

      if (data && data.yaml) {
        setGeneratedYaml(data.yaml); // Met à jour la preview avec le vrai YAML
      } else {
        throw new Error("Le format de réponse du serveur est incorrect.");
      }
    } catch (err: any) {
      console.error("Détail de l'erreur interceptée :", err);
      setError(err.message || "Impossible de joindre le serveur backend.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300 py-12 px-4 sm:px-6 lg:px-8 flex flex-col items-center">
      {/* Header */}
      <header className="text-center mb-12 max-w-xl">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 text-xs font-semibold rounded-full mb-3 border border-indigo-100 dark:border-indigo-900/30">
          <Sparkles className="w-3.5 h-3.5 fill-current" /> Interface v1.0
          Standard Base
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          GitHub Actions{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-500">
            Low-Code
          </span>{" "}
          Builder
        </h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          Configurez graphiquement vos pipelines CI/CD simples et obtenez
          instantanément un code YAML propre et valide.
        </p>
      </header>

      {/* Main Workspace Layout */}
      <main className="w-full max-w-5xl flex flex-col lg:flex-row items-center lg:items-start justify-center gap-8">
        <WorkflowForm
          onGenerate={handleGenerateConfiguration}
          loading={loading}
        />
        <YamlPreview yaml={generatedYaml} loading={loading} error={error} />
      </main>
    </div>
  );
}

export default App;
