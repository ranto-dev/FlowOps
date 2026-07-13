import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FolderGit2,
  History,
  HelpCircle,
  LogOut,
  Plus,
  Trash2,
  Sliders,
  ArrowLeft,
} from "lucide-react";
import { WorkflowForm } from "../components/WorkflowForm";
import { YamlPreview } from "../components/YamlPreview";

interface Project {
  id: string;
  name: string;
  description: string;
}

export const Workspace: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"projects" | "history" | "help">(
    "projects",
  );

  // --- ÉTATS CRUD PROJETS ---
  const [projects, setProjects] = useState<Project[]>([
    {
      id: "p-1",
      name: "E-Commerce Frontend",
      description: "React Deployment suite",
    },
  ]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(
    null,
  );
  const [newProjName, setNewProjName] = useState("");
  const [newProjDesc, setNewProjDesc] = useState("");

  // --- ÉTATS CONFIG WORKFLOW (Intégration de l'ancienne feature) ---
  const [isConfiguringWorkflow, setIsConfiguringWorkflow] = useState(false);
  const [activeConfig, setActiveConfig] = useState<any>(null);
  const [compiledYaml, setCompiledYaml] = useState<string | null>(null);
  const [viewState, setViewState] = useState<"form" | "loading" | "preview">(
    "form",
  );

  const handleLogout = () => {
    localStorage.removeItem("flowops_token");
    navigate("/");
  };

  // --- LOGIQUE CRUD ---
  const createProject = () => {
    if (!newProjName.trim()) return;
    const newProj: Project = {
      id: `p-${Date.now()}`,
      name: newProjName,
      description: newProjDesc,
    };
    setProjects([...projects, newProj]);
    setNewProjName("");
    setNewProjDesc("");
  };

  const deleteProject = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setProjects(projects.filter((p) => p.id !== id));
    if (selectedProjectId === id) setSelectedProjectId(null);
  };

  return (
    <div className="flex-1 w-full max-w-7xl mx-auto px-6 py-6 flex flex-col md:flex-row gap-6 text-left">
      {/* BARRE LATÉRALE DE NAVIGATION DU WORKSPACE */}
      <aside className="w-full md:w-64 shrink-0 flex flex-col gap-1 border-r border-slate-100 pr-4">
        <button
          onClick={() => {
            setActiveTab("projects");
            setIsConfiguringWorkflow(false);
          }}
          className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl text-xs font-bold transition-all ${activeTab === "projects" ? "bg-purple-50 text-purple-700" : "text-slate-600 hover:bg-slate-50"}`}
        >
          <FolderGit2 className="w-4 h-4" /> My Projects
        </button>
        <button
          onClick={() => {
            setActiveTab("history");
            setIsConfiguringWorkflow(false);
          }}
          className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl text-xs font-bold transition-all ${activeTab === "history" ? "bg-purple-50 text-purple-700" : "text-slate-600 hover:bg-slate-50"}`}
        >
          <History className="w-4 h-4" /> History & Logs
        </button>
        <button
          onClick={() => {
            setActiveTab("help");
            setIsConfiguringWorkflow(false);
          }}
          className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl text-xs font-bold transition-all ${activeTab === "help" ? "bg-purple-50 text-purple-700" : "text-slate-600 hover:bg-slate-50"}`}
        >
          <HelpCircle className="w-4 h-4" /> Help Center
        </button>
        <hr className="my-2 border-slate-100" />
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-xs font-bold text-red-500 hover:bg-red-50 transition-all"
        >
          <LogOut className="w-4 h-4" /> Logout
        </button>
      </aside>

      {/* ZONE CENTRALE CONTENU DYNAMIQUE */}
      <section className="flex-1 bg-white">
        {/* ONGLET 1: PROJETS */}
        {activeTab === "projects" && !isConfiguringWorkflow && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-xl font-black text-slate-900 tracking-tight">
                  Projects Dashboard
                </h3>
                <p className="text-xs text-slate-400">
                  Manage repositories and assign deployment states
                </p>
              </div>
            </div>

            {/* Formulaire de création Rapide */}
            <div className="p-4 rounded-2xl border border-slate-100 bg-slate-50/50 grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">
                  Project Name
                </label>
                <input
                  type="text"
                  value={newProjName}
                  onChange={(e) => setNewProjName(e.target.value)}
                  className="w-full p-2 text-xs bg-white border rounded-xl"
                  placeholder="My Awesome API"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">
                  Description
                </label>
                <input
                  type="text"
                  value={newProjDesc}
                  onChange={(e) => setNewProjDesc(e.target.value)}
                  className="w-full p-2 text-xs bg-white border rounded-xl"
                  placeholder="Node.js/Docker Backend"
                />
              </div>
              <button
                onClick={createProject}
                className="w-full py-2 bg-slate-900 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1 hover:bg-slate-800 transition-all"
              >
                <Plus className="w-4 h-4" /> Create Project
              </button>
            </div>

            {/* Grille de rendu des projets */}
            <div className="grid grid-cols-1 gap-3">
              {projects.map((p) => (
                <div
                  key={p.id}
                  className="p-5 border border-slate-100 rounded-2xl hover:border-purple-200 hover:shadow-md transition-all flex justify-between items-center bg-white"
                >
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">
                      {p.name}
                    </h4>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {p.description}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        // Initialisation forcée avec notre structure Node préconfigurée
                        setActiveConfig({
                          filename: `${p.name.toLowerCase().replace(/ /g, "-")}-ci.yaml`,
                          name: `${p.name} Pipeline`,
                          on_events: ["push"],
                          branches: "main",
                          global_env: "NODE_ENV=production",
                          jobs: [
                            {
                              id: "j-1",
                              name: "build-and-test",
                              runs_on: "ubuntu-latest",
                              needs: [],
                              steps: [
                                {
                                  id: "s-1",
                                  name: "📥 Checkout Source",
                                  type: "checkout",
                                },
                              ],
                            },
                          ],
                        });
                        setIsConfiguringWorkflow(true);
                        setViewState("form");
                      }}
                      className="px-3 py-1.5 bg-purple-50 text-purple-700 font-bold text-xs rounded-lg border border-purple-100 flex items-center gap-1.5 hover:bg-purple-100"
                    >
                      <Sliders className="w-3.5 h-3.5" /> Configure Workflows
                    </button>
                    <button
                      onClick={(e) => deleteProject(p.id, e)}
                      className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* INTEGRATION DE LA FEATURE PRÉCÉDENTE SI CLICK CONFIGURE WORKFLOW */}
        {activeTab === "projects" && isConfiguringWorkflow && (
          <div className="space-y-4 animate-in zoom-in-95 duration-200">
            <button
              onClick={() => setIsConfiguringWorkflow(false)}
              className="flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-slate-900 mb-2"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Dashboard
            </button>

            {viewState === "form" && (
              <WorkflowForm
                activeConfig={activeConfig}
                onChangeConfig={setActiveConfig}
                onGenerate={async () => {
                  setViewState("loading");
                  const res = await fetch(
                    "http://localhost:8000/api/generate-workflow",
                    {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify(activeConfig),
                    },
                  );
                  const data = await res.json();
                  setTimeout(() => {
                    setCompiledYaml(data.yaml);
                    setViewState("preview");
                  }, 8000);
                }}
                loading={false}
              />
            )}

            {viewState === "loading" && (
              <div className="py-20 text-center space-y-2">
                <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                <p className="text-xs font-bold text-slate-900">
                  Compiling configuration tree...
                </p>
              </div>
            )}

            {viewState === "preview" && (
              <YamlPreview
                activeFile={{
                  id: "1",
                  filename: activeConfig.filename,
                  yaml: compiledYaml,
                  config: activeConfig,
                }}
                loading={false}
                onNewWorkflow={() => setIsConfiguringWorkflow(false)}
                onReconfigure={() => setViewState("form")}
                onSaveToServer={async () => {
                  await fetch("http://localhost:8000/api/save-workflow", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(activeConfig),
                  });
                  alert("Saved successfully inside backend/generated/!");
                }}
                saveStatus={null}
              />
            )}
          </div>
        )}

        {/* ONGLET 2: HISTORIQUES */}
        {activeTab === "history" && (
          <div className="space-y-4 border border-dashed rounded-3xl p-8 text-center text-slate-400 text-xs">
            <History className="w-8 h-8 mx-auto opacity-30 text-purple-600" />
            <p className="font-bold text-slate-700">
              No Execution Logs available
            </p>
            <p className="max-w-xs mx-auto text-[11px]">
              The automatic GitHub Action dispatch trigger execution system is
              scheduled for the next release milestone.
            </p>
          </div>
        )}

        {/* ONGLET 3: HELP */}
        {activeTab === "help" && (
          <div className="space-y-3 p-2">
            <h3 className="text-md font-bold text-slate-900">
              FlowOps Documentation
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              To wire a custom environment block, toggle the matrix values
              within the visual tree. Ensure your GitHub Repository contains
              write access permissions before running the physical export
              system.
            </p>
          </div>
        )}
      </section>
    </div>
  );
};
