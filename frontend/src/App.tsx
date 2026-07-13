// frontend/src/App.tsx
import { useState } from "react";
import { WorkflowForm } from "./components/WorkflowForm";
import { YamlPreview } from "./components/YamlPreview";
import type { FlowOpsWorkflowConfig, VirtualFile } from "./@types/workflow";

const COMPLEX_FLOWOPS_INITIAL: FlowOpsWorkflowConfig = {
  filename: "production-pipeline.yml",
  name: "FlowOps Advanced Suite",
  on_events: ["push"],
  branches: "main",
  global_env: "PROJECT_NAME=FlowOpsCore",
  jobs: [
    {
      id: "j-build",
      name: "Build And Test",
      runs_on: "ubuntu-latest",
      needs: [],
      matrix_key: "node-version",
      matrix_values: "20, 22",
      steps: [
        { id: "s-1", name: "📥 Clone Repository", type: "checkout" },
        { id: "s-2", name: "🟢 Load Node Matrix", type: "setup-node" },
        {
          id: "s-3",
          name: "📦 Secure dependencies installation",
          type: "npm",
          npm_command: "ci",
        },
        {
          id: "s-4",
          name: "🧪 Execute tests suite",
          type: "npm",
          npm_command: "test",
        },
        {
          id: "s-5",
          name: "💾 Save build state",
          type: "upload-artifact",
          artifact_path: "dist/",
        },
      ],
    },
    {
      id: "j-deploy",
      name: "Production Deployment",
      runs_on: "ubuntu-latest",
      needs: ["build-and-test"],
      job_if: "github.ref == 'refs/heads/main'",
      steps: [
        {
          id: "s-6",
          name: "🐳 Package & Ship Container",
          type: "docker",
          docker_image: "flowops-api",
          docker_registry: "ghcr",
        },
      ],
    },
  ],
};

function App() {
  const [files, setFiles] = useState<VirtualFile[]>([
    {
      id: "f-1",
      filename: "production-pipeline.yml",
      yaml: null,
      config: COMPLEX_FLOWOPS_INITIAL,
    },
  ]);
  const [activeFileId, setActiveFileId] = useState<string>("f-1");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const activeFile = files.find((f) => f.id === activeFileId)!;

  const handleUpdateConfig = (updatedConfig: FlowOpsWorkflowConfig) => {
    setFiles((prev) =>
      prev.map((f) =>
        f.id === activeFileId
          ? { ...f, filename: updatedConfig.filename, config: updatedConfig }
          : f,
      ),
    );
  };

  const handleAddFile = () => {
    const newId = `f-${Date.now()}`;
    const filename = `workflow-suite-${files.length + 1}.yml`;
    const newFile: VirtualFile = {
      id: newId,
      filename: filename,
      yaml: null,
      config: {
        ...COMPLEX_FLOWOPS_INITIAL,
        filename: filename,
        name: "New FlowOps Stack",
      },
    };
    setFiles([...files, newFile]);
    setActiveFileId(newId);
  };

  const triggerYamlGeneration = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        "http://localhost:8000/api/generate-workflow",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(activeFile.config),
        },
      );
      if (!response.ok)
        throw new Error("Erreur de traitement sur le serveur FlowOps.");
      const data = await response.json();
      setFiles((prev) =>
        prev.map((f) =>
          f.id === activeFileId ? { ...f, yaml: data.yaml } : f,
        ),
      );
    } catch (err: any) {
      setError(err.message || "Erreur serveur.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-8 px-4 sm:px-6 lg:px-8 flex flex-col items-center">
      <header className="text-center mb-6 max-w-2xl">
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          🚀 Flow<span className="text-indigo-600">Ops</span> Studio
        </h1>
        <p className="mt-1 text-xs text-slate-400">
          Orchestrateur No-Code/Low-Code multi-jobs modulaire basé sur vos
          recherches DevOps.
        </p>
      </header>

      <main className="w-full max-w-7xl flex flex-col lg:flex-row items-stretch justify-center gap-6">
        <WorkflowForm
          activeConfig={activeFile.config}
          onChangeConfig={handleUpdateConfig}
          onGenerate={triggerYamlGeneration}
          loading={loading}
        />
        <YamlPreview
          files={files}
          activeFileId={activeFileId}
          onSelectFile={setActiveFileId}
          onAddFile={handleAddFile}
          loading={loading}
          error={error}
        />
      </main>
    </div>
  );
}

export default App;
