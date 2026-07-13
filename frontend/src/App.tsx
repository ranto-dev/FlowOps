import { useState } from "react";
import { Header } from "./components/Header";
import { Footer } from "./components/Footer";
import { WorkflowForm } from "./components/WorkflowForm";
import { YamlPreview } from "./components/YamlPreview";
import type { FlowOpsWorkflowConfig, VirtualFile } from "./@types/workflow";
import { Loader2 } from "lucide-react";

// CONFIGURATION INITIALE STANDARD VALIDÉE EXIGÉE
const DEFAULT_NODE_PIPELINE: FlowOpsWorkflowConfig = {
  filename: "production-pipeline.yaml",
  name: "NodeJS Continuous Integration Stack",
  on_events: ["push"],
  branches: "main", // Branche de base imposée à "main"
  global_env: "NODE_ENV=production",
  jobs: [
    {
      id: "j-build-test",
      name: "build-and-test",
      runs_on: "ubuntu-latest",
      needs: [],
      matrix_key: "node-version",
      matrix_values: "20, 22",
      steps: [
        { id: "s-checkout", name: "📥 Checkout Source Code", type: "checkout" },
        {
          id: "s-node",
          name: "🟢 Load Node Virtual Environment",
          type: "setup-node",
          node_version: "22",
        },
        {
          id: "s-install",
          name: "📦 Install dependencies packages",
          type: "npm",
          npm_command: "install",
        },
        {
          id: "s-test",
          name: "🧪 Lancement des suites de tests",
          type: "npm",
          npm_command: "test",
        },
      ],
    },
  ],
};

function App() {
  const [activeConfig, setActiveConfig] = useState<FlowOpsWorkflowConfig>(
    DEFAULT_NODE_PIPELINE,
  );
  const [compiledYaml, setCompiledYaml] = useState<string | null>(null);
  const [view, setView] = useState<"form" | "loading" | "preview">("form");
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  const handleGenerate = async () => {
    setView("loading");
    setSaveStatus(null);

    try {
      const response = await fetch(
        "http://localhost:8000/api/generate-workflow",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(activeConfig),
        },
      );

      if (!response.ok) throw new Error();
      const data = await response.json();

      // Petite temporisation pour savourer l'effet de chargement devant le jury
      setTimeout(() => {
        setCompiledYaml(data.yaml);
        setView("preview");
      }, 1000);
    } catch (err) {
      setView("form");
      alert("Erreur de communication avec le moteur backend.");
    }
  };

  const handleSaveToServer = async () => {
    setSaveStatus(null);
    try {
      const response = await fetch("http://localhost:8000/api/save-workflow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(activeConfig),
      });
      if (!response.ok) throw new Error();
      const data = await response.json();
      setSaveStatus(
        `Fichier sauvegardé avec succès dans : backend/generated/${activeConfig.filename}`,
      );
    } catch (err) {
      alert("Impossible d'enregistrer le fichier sur le serveur.");
    }
  };

  const handleNewWorkflow = () => {
    setActiveConfig({
      ...DEFAULT_NODE_PIPELINE,
      filename: `pipeline-${Date.now().toString().slice(-4)}.yaml`,
      name: "New FlowOps Project Stack",
    });
    setCompiledYaml(null);
    setSaveStatus(null);
    setView("form");
  };

  const virtualFileObject: VirtualFile = {
    id: "active",
    filename: activeConfig.filename,
    yaml: compiledYaml,
    config: activeConfig,
  };

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans text-slate-900 selection:bg-purple-100">
      <Header />

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex flex-col items-center justify-center">
        {/* ÉCRAN 1 : FORMULAIRE SEUL */}
        {view === "form" && (
          <div className="w-full text-center space-y-2">
            <div className="mb-6">
              <span className="text-[10px] font-extrabold tracking-widest text-purple-600 bg-purple-50 px-3 py-1 rounded-full uppercase border border-purple-100">
                Low-Code Workspace
              </span>
            </div>
            <WorkflowForm
              activeConfig={activeConfig}
              onChangeConfig={setActiveConfig}
              onGenerate={handleGenerate}
              loading={false}
            />
          </div>
        )}

        {/* ÉCRAN INTERMÉDIAIRE : CHARGEMENT EFFECT */}
        {view === "loading" && (
          <div className="flex flex-col items-center justify-center space-y-4 py-20">
            <Loader2 className="w-12 h-12 text-purple-600 animate-spin" />
            <div className="text-center">
              <p className="text-sm font-black tracking-tight text-slate-900">
                Compilation de la topologie FlowOps...
              </p>
              <p className="text-xs text-slate-400 mt-1 font-mono">
                Traduction vers les schémas YAML officiels en cours
              </p>
            </div>
          </div>
        )}

        {/* ÉCRAN 2 : PREVIEW DU CODE SEUL */}
        {view === "preview" && (
          <div className="w-full animate-in fade-in duration-300">
            <YamlPreview
              activeFile={virtualFileObject}
              loading={false}
              onNewWorkflow={handleNewWorkflow}
              onReconfigure={() => setView("form")}
              onSaveToServer={handleSaveToServer}
              saveStatus={saveStatus}
            />
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}

export default App;
