// frontend/src/pages/Workspace.tsx
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
  User,
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

  // ─── LECTURE SYNCHRONE DES PARAMÈTRES DU COMPTE GITHUB ───
  const username = localStorage.getItem("flowops_user") || "Developer";
  const avatarUrl = localStorage.getItem("flowops_avatar");

  const [projects, setProjects] = useState<Project[]>([
    {
      id: "p-1",
      name: "E-Commerce Frontend",
      description: "React Deployment suite",
    },
  ]);
  const [newProjName, setNewProjName] = useState("");
  const [newProjDesc, setNewProjDesc] = useState("");

  const [isConfiguringWorkflow, setIsConfiguringWorkflow] = useState(false);
  const [activeConfig, setActiveConfig] = useState<any>(null);
  const [compiledYaml, setCompiledYaml] = useState<string | null>(null);
  const [viewState, setViewState] = useState<"form" | "loading" | "preview">(
    "form",
  );

  // ─── ACTION SECURE DE DÉCONNEXION DE SESSION ───
  const handleLogout = () => {
    localStorage.clear();
    navigate("/auth", { replace: true });
  };

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
  };

  return (
    <div className="flex-1 w-full max-w-7xl mx-auto px-6 py-6 flex flex-col md:flex-row gap-6 text-left">
      {/* SIDEBAR AVEC BLOC PROFIL CONNECTÉ */}
      <aside className="w-full md:w-64 shrink-0 flex flex-col justify-between border-r border-slate-100 pr-4 min-h-[500px]">
        <div className="flex flex-col gap-1">
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
        </div>

        {/* COMPOSANT USER EN BAS DE LA SIDEBAR */}
        <div className="pt-4 border-t border-slate-100 space-y-3">
          <div className="flex items-center gap-3 px-2 py-1.5 bg-slate-50 rounded-2xl border border-slate-100">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={username}
                className="w-8 h-8 rounded-full border border-purple-200"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center">
                <User className="w-4 h-4" />
              </div>
            )}
            <div className="flex flex-col overflow-hidden">
              <span className="text-[11px] font-black text-slate-800 truncate">
                {username}
              </span>
              <span className="text-[9px] font-mono font-bold text-emerald-600 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-pulse"></span>{" "}
                Connected via API
              </span>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-2.5 rounded-xl text-xs font-bold text-red-500 hover:bg-red-50 transition-all border border-transparent hover:border-red-100"
          >
            <LogOut className="w-4 h-4" /> Logout from Session
          </button>
        </div>
      </aside>

      {/* CONTENU CENTRAL DE L'WORKSPACE */}
      <section className="flex-1 bg-white">
        {activeTab === "projects" && !isConfiguringWorkflow && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div>
              <h3 className="text-xl font-black text-slate-900 tracking-tight">
                Projects Dashboard
              </h3>
              <p className="text-xs text-slate-400">
                Manage repositories and assign deployment states
              </p>
            </div>

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

        {/* WORKFLOW CONFIGURATION WORKSPACE INTEGRATION */}
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
                    `${import.meta.env.VITE_API_URL || "http://localhost:8000"}/api/generate-workflow`,
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
                  }, 2000);
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
                  await fetch(
                    `${import.meta.env.VITE_API_URL || "http://localhost:8000"}/api/save-workflow`,
                    {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify(activeConfig),
                    },
                  );
                  alert("Saved successfully!");
                }}
                saveStatus={null}
              />
            )}
          </div>
        )}

        {activeTab === "history" && (
          <div className="space-y-4 border border-dashed rounded-3xl p-8 text-center text-slate-400 text-xs">
            <History className="w-8 h-8 mx-auto opacity-30 text-purple-600" />
            <p className="font-bold text-slate-700">
              No Execution Logs available
            </p>
          </div>
        )}

        {activeTab === "help" && (
          <div className="space-y-3 p-2">
            <h3 className="text-md font-bold text-slate-900">
              FlowOps Documentation
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Ensure your GitHub Repository contains write access permissions
              before running the physical export system.
            </p>
          </div>
        )}
      </section>
    </div>
  );
};
