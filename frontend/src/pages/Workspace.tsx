import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  FolderGit2,
  History as HistoryIcon,
  HelpCircle,
  LogOut,
  Plus,
  Trash2,
  Sliders,
  ArrowLeft,
  User,
  Play,
  Loader2,
  BookOpen,
} from "lucide-react";
import { WorkflowForm } from "../components/WorkflowForm";
import { YamlPreview } from "../components/YamlPreview";
import { History } from "../components/History";
import Footer from "../components/Footer";

interface Project {
  id: string;
  name: string;
  description: string;
  repository: string;
  has_workflow: boolean;
  yaml_filename?: string;
}

interface GitHubRepo {
  id: number;
  full_name: string;
}

export const Workspace: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"projects" | "history" | "help">(
    "projects",
  );

  const username = localStorage.getItem("flowops_user") || "Developer";
  const avatarUrl = localStorage.getItem("flowops_avatar");
  const token = localStorage.getItem("flowops_token");
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

  // --- ÉTATS DONNÉES BASE DE DONNÉES & API ---
  const [projects, setProjects] = useState<Project[]>([]);
  const [gitRepos, setGitRepos] = useState<GitHubRepo[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [executingProjectId, setExecutingProjectId] = useState<string | null>(
    null,
  );

  // --- ÉTATS FORMULAIRE CRÉATION ---
  const [newProjName, setNewProjName] = useState("");
  const [newProjDesc, setNewProjDesc] = useState("");
  const [selectedRepo, setSelectedRepo] = useState("");

  // --- ÉTATS CONFIG WORKFLOW ---
  const [isConfiguringWorkflow, setIsConfiguringWorkflow] = useState(false);
  const [targetProject, setTargetProject] = useState<Project | null>(null);
  const [activeConfig, setActiveConfig] = useState<any>(null);
  const [compiledYaml, setCompiledYaml] = useState<string | null>(null);
  const [viewState, setViewState] = useState<"form" | "loading" | "preview">(
    "form",
  );

  useEffect(() => {
    fetchProjects();
    fetchGitHubRepos();
  }, []);

  const fetchProjects = async () => {
    try {
      const res = await fetch(`${API_URL}/api/projects`);
      const data = await res.json();
      setProjects(data);
    } catch (err) {
      console.error("Error loading MongoDB projects");
    } finally {
      setLoadingProjects(false);
    }
  };

  const fetchGitHubRepos = async () => {
    try {
      const res = await fetch(`${API_URL}/api/github/repositories`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setGitRepos(data);
      }
    } catch (err) {
      console.error("Failed to sync GitHub repositories");
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate("/auth", { replace: true });
  };

  const initWorkflowConfig = (project: Project) => {
    setTargetProject(project);
    setActiveConfig({
      filename: `${project.name.toLowerCase().replace(/[^a-z0-9]/g, "-")}-ci.yaml`,
      name: `${project.name} Pipeline`,
      on_events: ["push"],
      branches: "main",
      global_env: "NODE_ENV=production",
      jobs: [
        {
          id: "j-1",
          name: "build-and-test",
          runs_on: "ubuntu-latest",
          needs: [],
          steps: [{ id: "s-1", name: "📥 Checkout Source", type: "checkout" }],
        },
      ],
    });
    setIsConfiguringWorkflow(true);
    setViewState("form");
  };

  const createProject = async () => {
    if (!newProjName.trim() || !selectedRepo) {
      alert("Please fill in the project name and select a GitHub Repository.");
      return;
    }

    try {
      const res = await fetch(`${API_URL}/api/projects`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newProjName.trim(),
          description: newProjDesc.trim() || "",
          repository: selectedRepo,
        }),
      });

      if (res.ok) {
        const createdProject = await res.json();
        initWorkflowConfig(createdProject);
        setNewProjName("");
        setNewProjDesc("");
        setSelectedRepo("");
        fetchProjects();
      } else {
        const errorData = await res.json();
        alert(`Server rejected data: ${JSON.stringify(errorData.detail)}`);
      }
    } catch (err) {
      alert("Failed to communicate with the server.");
    }
  };

  const deleteProject = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (
      confirm(
        "Delete this project and all its workflows from MongoDB database?",
      )
    ) {
      try {
        const res = await fetch(`${API_URL}/api/projects/${id}`, {
          method: "DELETE",
        });
        if (res.ok) {
          fetchProjects();
        } else {
          alert("Failed to delete project from server.");
        }
      } catch (err) {
        alert("Communication error during deletion.");
      }
    }
  };

  const triggerWorkflowExecution = async (
    projectId: string,
    projectName: string,
  ) => {
    if (!token) {
      alert(
        "Session expired or missing GitHub access token. Please re-authenticate.",
      );
      return;
    }

    setExecutingProjectId(projectId);

    try {
      const res = await fetch(`${API_URL}/api/projects/${projectId}/execute`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();

      if (res.ok && data.status === "success") {
        alert(`🎉 Success!\n\n${data.message}`);
        // Rediriger automatiquement vers l'onglet des logs pour voir l'avancement en direct
        setActiveTab("history");
      } else {
        alert(
          `❌ Workflow Trigger Failed\n\nDetails: ${data.detail || "Unknown error"}`,
        );
      }
    } catch (err) {
      console.error(err);
      alert("💥 Error: Unable to connect to the backend execution runner.");
    } finally {
      setExecutingProjectId(null);
    }
  };

  return (
    <>
      <div className="flex-1 w-full max-w-7xl mx-auto px-6 py-8 flex flex-col md:flex-row gap-8 text-left">
        {/* SIDEBAR */}
        <aside className="w-full md:w-64 shrink-0 flex flex-col justify-between border-b md:border-b-0 md:border-r border-slate-100 pb-6 md:pb-0 md:pr-6 min-h-[500px]">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center text-white font-black text-xl shadow-lg shadow-purple-500/20">
                ∞
              </div>
              <div>
                <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-1">
                  Flow
                  <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                    Ops
                  </span>
                </h1>
                <p className="text-[10px] text-slate-400 font-bold tracking-wider uppercase">
                  Visual DevOps Studio
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                setActiveTab("projects");
                setIsConfiguringWorkflow(false);
              }}
              className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl text-xs font-bold transition-all duration-200 ${activeTab === "projects" ? "bg-purple-50 text-purple-700 shadow-sm shadow-purple-100/50" : "text-slate-600 hover:bg-slate-50"}`}
            >
              <FolderGit2 className="w-4 h-4" /> My Projects
            </button>
            <button
              onClick={() => {
                setActiveTab("history");
                setIsConfiguringWorkflow(false);
              }}
              className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl text-xs font-bold transition-all duration-200 ${activeTab === "history" ? "bg-purple-50 text-purple-700 shadow-sm shadow-purple-100/50" : "text-slate-600 hover:bg-slate-50"}`}
            >
              <HistoryIcon className="w-4 h-4" /> History & Logs
            </button>
            <button
              onClick={() => {
                setActiveTab("help");
                setIsConfiguringWorkflow(false);
              }}
              className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl text-xs font-bold transition-all duration-200 ${activeTab === "help" ? "bg-purple-50 text-purple-700 shadow-sm shadow-purple-100/50" : "text-slate-600 hover:bg-slate-50"}`}
            >
              <HelpCircle className="w-4 h-4" /> Help Center
            </button>
          </div>

          <div className="pt-4 border-t border-slate-100 space-y-3 mt-6 md:mt-0">
            <div className="flex items-center gap-3 p-2.5 bg-slate-50 rounded-xl border border-slate-100">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={username}
                  className="w-8 h-8 rounded-full border border-purple-200 object-cover"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center font-bold">
                  <User className="w-4 h-4" />
                </div>
              )}
              <div className="flex flex-col overflow-hidden">
                <span className="text-[11px] font-black text-slate-800 truncate">
                  {username}
                </span>
                <span className="text-[9px] font-mono font-bold text-emerald-600 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-pulse"></span>{" "}
                  Connected
                </span>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 w-full px-4 py-2.5 rounded-xl text-xs font-bold text-slate-400 hover:text-red-500 hover:bg-red-50/50 transition-all duration-200 border border-transparent"
            >
              <LogOut className="w-4 h-4" /> Logout Account
            </button>
          </div>
        </aside>

        {/* COMPOSANT CENTRAL */}
        <section className="flex-1 bg-white min-w-0">
          {activeTab === "projects" && !isConfiguringWorkflow && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div>
                <h3 className="text-xl font-black text-slate-900 tracking-tight">
                  Projects Dashboard
                </h3>
                <p className="text-xs text-slate-400">
                  Manage MongoDB records and dispatch automation trees
                </p>
              </div>

              {/* FORMULAIRE DE CRÉATION RETRAVAILLÉ */}
              <div className="p-6 rounded-2xl border border-slate-100 bg-gradient-to-b from-slate-50/70 to-slate-50/20 shadow-inner grid grid-cols-1 lg:grid-cols-4 gap-4 items-end">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                    Project Name
                  </label>
                  <input
                    type="text"
                    value={newProjName}
                    onChange={(e) => setNewProjName(e.target.value)}
                    className="w-full p-2.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100 transition-all font-medium text-slate-800"
                    placeholder="E.g., Production API"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                    Description
                  </label>
                  <input
                    type="text"
                    value={newProjDesc}
                    onChange={(e) => setNewProjDesc(e.target.value)}
                    className="w-full p-2.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100 transition-all font-medium text-slate-800"
                    placeholder="Optional details"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                    Connected GitHub Repo
                  </label>
                  <select
                    value={selectedRepo}
                    onChange={(e) => setSelectedRepo(e.target.value)}
                    className="w-full p-2.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100 transition-all font-mono text-slate-700"
                  >
                    <option value="">-- Choose a Repository --</option>
                    {gitRepos.map((repo) => (
                      <option key={repo.id} value={repo.full_name}>
                        {repo.full_name}
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  onClick={createProject}
                  className="w-full py-2.5 bg-slate-900 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 hover:bg-slate-800 hover:shadow-md transition-all duration-200 uppercase tracking-wider"
                >
                  <Plus className="w-4 h-4" /> Setup Project
                </button>
              </div>

              {/* LISTE DES PROJETS OPTIMISÉE */}
              {loadingProjects ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
                </div>
              ) : projects.length === 0 ? (
                <div className="text-center py-16 text-slate-400 text-xs border border-dashed border-slate-200 rounded-2xl bg-slate-50/30">
                  No projects found. Create your first database configuration
                  block above.
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {projects.map((p) => (
                    <div
                      key={p.id}
                      className="p-5 border border-slate-150 rounded-2xl hover:border-purple-300 hover:shadow-md transition-all duration-200 flex flex-col sm:flex-row sm:items-center justify-between gap-5 bg-white relative overflow-hidden group"
                    >
                      {/* Subtile barre d'accentuation colorée pour les projets configurés */}
                      {p.has_workflow && (
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-purple-500" />
                      )}

                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] font-mono bg-slate-100 px-2 py-0.5 rounded-md text-slate-500 font-bold uppercase">
                            ID: {p.id.slice(-6)}...
                          </span>
                          {p.has_workflow && (
                            <span className="text-[9px] font-bold bg-purple-50 text-purple-700 px-2 py-0.5 rounded-md border border-purple-100/50">
                              Active Pipeline
                            </span>
                          )}
                        </div>
                        <h4 className="text-base font-black text-slate-900 tracking-tight">
                          {p.name}
                        </h4>
                        <p className="text-xs text-slate-400 font-medium max-w-xl">
                          {p.description || "No description provided."}
                        </p>
                        <p className="text-[11px] font-mono text-slate-500 font-medium pt-1">
                          📦 Linked target:{" "}
                          <span className="text-purple-600 font-bold underline decoration-purple-300">
                            {p.repository}
                          </span>
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                        {p.has_workflow ? (
                          <>
                            <button
                              onClick={() =>
                                triggerWorkflowExecution(p.id, p.name)
                              }
                              disabled={executingProjectId !== null}
                              className="px-4 py-2 bg-emerald-600 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 hover:bg-emerald-700 hover:shadow-sm transition-all uppercase tracking-wider disabled:opacity-60"
                            >
                              {executingProjectId === p.id ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Play className="w-3.5 h-3.5 fill-white" />
                              )}
                              Execute
                            </button>

                            <button
                              onClick={() => initWorkflowConfig(p)}
                              disabled={executingProjectId !== null}
                              className="px-4 py-2 bg-slate-50 text-slate-700 font-bold text-xs rounded-xl border border-slate-200 flex items-center gap-1.5 hover:bg-slate-100 transition-all uppercase tracking-wider disabled:opacity-50"
                            >
                              <Sliders className="w-3.5 h-3.5" /> Configure
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => initWorkflowConfig(p)}
                            disabled={executingProjectId !== null}
                            className="px-4 py-2 bg-purple-600 text-white font-bold text-xs rounded-xl shadow-sm hover:bg-purple-700 transition-all uppercase tracking-wider disabled:opacity-50"
                          >
                            <Sliders className="w-3.5 h-3.5 inline mr-1" />{" "}
                            Create Workflow
                          </button>
                        )}

                        <button
                          onClick={(e) => deleteProject(p.id, e)}
                          disabled={executingProjectId !== null}
                          className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all disabled:opacity-40"
                          title="Delete database record"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* VUE DE CONFIGURATION DU WORKFLOW */}
          {activeTab === "projects" &&
            isConfiguringWorkflow &&
            targetProject && (
              <div className="space-y-4 animate-in zoom-in-95 duration-200">
                <button
                  onClick={() => setIsConfiguringWorkflow(false)}
                  className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors mb-4"
                >
                  <ArrowLeft className="w-4 h-4" /> Back to Dashboard
                </button>

                {viewState === "form" && (
                  <WorkflowForm
                    activeConfig={activeConfig}
                    onChangeConfig={setActiveConfig}
                    onGenerate={async () => {
                      setViewState("loading");
                      const res = await fetch(
                        `${API_URL}/api/generate-workflow`,
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
                      }, 1200);
                    }}
                    loading={false}
                  />
                )}

                {viewState === "loading" && (
                  <div className="py-24 text-center space-y-4 border border-slate-100 rounded-3xl bg-slate-50/50">
                    <div className="w-8 h-8 border-3 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                    <p className="text-xs font-bold text-slate-600 font-mono tracking-wide">
                      Compiling visual workflow trees into production-ready
                      standard YAML...
                    </p>
                  </div>
                )}

                {viewState === "preview" && (
                  <YamlPreview
                    activeFile={{
                      id: targetProject.id,
                      filename: activeConfig.filename,
                      yaml: compiledYaml,
                      config: activeConfig,
                    }}
                    loading={false}
                    onNewWorkflow={() => {
                      setIsConfiguringWorkflow(false);
                      fetchProjects();
                    }}
                    onReconfigure={() => setViewState("form")}
                    onSaveToServer={async () => {
                      try {
                        const res = await fetch(
                          `${API_URL}/api/projects/${targetProject.id}/workflow`,
                          {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify(activeConfig),
                          },
                        );

                        if (res.ok) {
                          alert(
                            "Workflow configuration successfully saved to the project workspace directory!",
                          );
                          setIsConfiguringWorkflow(false);
                          fetchProjects();
                        } else {
                          alert("Failed to save workflow file on the server.");
                        }
                      } catch (err) {
                        alert("Communication error while saving the workflow.");
                      }
                    }}
                    saveStatus={null}
                  />
                )}
              </div>
            )}

          {/* ONGLET TELEMETRIE & RUNNER LOGS (History) INTÉGRÉ */}
          {activeTab === "history" && (
            <div className="animate-in fade-in duration-200">
              <History />
            </div>
          )}

          {/* HELP CENTER OPTIMISÉ */}
          {activeTab === "help" && (
            <div className="space-y-4 p-4 border border-slate-100 rounded-3xl bg-gradient-to-b from-slate-50/50 to-white shadow-sm animate-in fade-in duration-200">
              <div className="flex items-center gap-2 text-slate-900 font-black text-base">
                <BookOpen className="w-5 h-5 text-indigo-600" />
                <h3>FlowOps Documentation Hub</h3>
              </div>
              <div className="text-xs text-slate-600 space-y-3 font-medium leading-relaxed max-w-2xl">
                <p>
                  Welcome to the workspace control panel. From here you can spin
                  up dynamic execution pipelines hooks linked directly with your
                  GitHub accounts deployments stacks.
                </p>
                <div className="p-3 bg-amber-50 border border-amber-150 rounded-xl text-amber-800 font-mono text-[11px] leading-normal">
                  <span className="font-bold">⚠️ Local Stack Requirement:</span>{" "}
                  Ensure your MongoDB container instances are running properly
                  on port{" "}
                  <code className="bg-amber-100/80 px-1 py-0.5 rounded font-bold">
                    27017
                  </code>{" "}
                  and that backend API servers handles the incoming payload
                  pipes before firing actions.
                </div>
              </div>
            </div>
          )}
        </section>
      </div>
      <Footer />
    </>
  );
};
