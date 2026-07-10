import { useState } from "react";
import { WorkflowForm } from "./components/WorkflowForm";
import { YamlPreview } from "./components/YamlPreview";
import type { WorkflowConfig, VirtualFile } from "./@types/workflow";

const PRO_ENTERPRISE_DEFAULT: WorkflowConfig = {
  filename: "ci-matrix.yml",
  name: "Cross-Platform Pipeline",
  on_event: "push",
  branches: "main, development",
  runs_on: "ubuntu-latest",
  matrix_key: "python-version",
  matrix_values: "3.10, 3.11, 3.12",
  steps: [
    {
      id: "step-checkout",
      name: "Initialize and Checkout repository source-code",
      type: "uses",
      content: "actions/checkout@v4",
      env: "",
    },
    {
      id: "step-setup-lang",
      name: "Setup Python runtime target version",
      type: "uses",
      content:
        "actions/setup-python@v5\nwith:\n  python-version: ${{ matrix.python-version }}",
      env: "",
    },
    {
      id: "step-script",
      name: "Install matrix requirements and run complete check suite",
      type: "run",
      content:
        "pip install -r requirements.txt\nflake8 . --count --select=E9,F63,F7,F82 --show-source --statistics\npytest tests/",
      env: "STAGE=Testing\nDEBUG=False",
    },
  ],
};

function App() {
  const [files, setFiles] = useState<VirtualFile[]>([
    {
      id: "f-enterprise",
      filename: "ci-matrix.yml",
      yaml: null,
      config: PRO_ENTERPRISE_DEFAULT,
    },
  ]);
  const [activeFileId, setActiveFileId] = useState<string>("f-enterprise");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const activeFile = files.find((f) => f.id === activeFileId)!;

  const handleUpdateConfig = (updatedConfig: WorkflowConfig) => {
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
    const filename = `pipeline-suite-${files.length + 1}.yml`;
    const newFile: VirtualFile = {
      id: newId,
      filename: filename,
      yaml: null,
      config: {
        ...PRO_ENTERPRISE_DEFAULT,
        filename: filename,
        name: "Automated Build System",
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
        throw new Error(`Échec serveur backend (${response.status}).`);

      const data = await response.json();
      setFiles((prev) =>
        prev.map((f) =>
          f.id === activeFileId ? { ...f, yaml: data.yaml } : f,
        ),
      );
    } catch (err: any) {
      console.error(err);
      setError(
        err.message ||
          "Impossible de joindre le service de compilation Python FastAPI.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-8 px-4 sm:px-6 lg:px-8 flex flex-col items-center">
      <header className="text-center mb-6 max-w-2xl">
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Visual GitHub Actions{" "}
          <span className="text-indigo-600">Enterprise Studio</span>
        </h1>
        <p className="mt-1 text-xs text-slate-400">
          Génération industrielle de scripts multi-lignes, injection de scopes
          d'environnement par tâche et matrices multi-langages.
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
