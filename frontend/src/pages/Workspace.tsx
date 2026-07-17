import React, { useState, useEffect } from "react";
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
  Play,
  Loader2,
} from "lucide-react";
import { WorkflowForm } from "../components/WorkflowForm";
import { YamlPreview } from "../components/YamlPreview";
import Footer from "../components/Footer";

interface Project {
  id: string; // Stockera l'ObjectId sous forme de string (ex: "64b1f...")
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

  // Charge les projets depuis MongoDB et les repos GitHub
  useEffect(() => {
    fetchProjects();
    fetchGitHubRepos();
  }, []);

  const fetchProjects = async () => {
    try {
      const res = await fetch(`${API_URL}/api/projects`);
      const data = await res.json();
      setProjects(data); // Déjà triés par ordre DESC côté backend (via MongoDB)
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

  // Centralisation de l'initialisation de la configuration par défaut d'un projet
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

        // Après la création, redirection directe vers l'interface de configuration
        initWorkflowConfig(createdProject);

        // Reset des champs du formulaire
        setNewProjName("");
        setNewProjDesc("");
        setSelectedRepo("");
        fetchProjects();
      } else {
        const errorData = await res.json();
        console.error("Backend validation error details:", errorData);
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

  // ─── ACTION RÉELLE D'EXÉCUTION DU WORKFLOW (PUSH + DISPATCH) ───
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
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (res.ok && data.status === "success") {
        alert(`🎉 Success!\n\n${data.message}`);
      } else {
        alert(
          `❌ Workflow Trigger Failed\n\nDetails: ${data.detail || "Unknown error occurred"}`,
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
      <div className="flex-1 w-full max-w-7xl mx-auto px-6 py-6 flex flex-col md:flex-row gap-6 text-left">
        {/* SIDEBAR */}
        <aside className="w-full md:w-64 shrink-0 flex flex-col justify-between border-r border-slate-100 pr-4 min-h-[500px]">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-violet-600 via-purple-600 to-blue-500 flex items-center justify-center text-white font-bold text-xl shadow-md shadow-purple-500/20">
                ∞
              </div>
              <div>
                <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-1">
                  Flow
                  <span className="bg-gradient-to-r from-violet-600 to-blue-500 bg-clip-text text-transparent">
                    Ops
                  </span>
                </h1>
                <p className="text-[10px] text-slate-400 font-medium tracking-wider uppercase">
                  Visual DevOps Studio
                </p>
              </div>
            </div>

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
                  Connected
                </span>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 w-full px-4 py-2.5 rounded-xl text-xs font-bold text-red-500 hover:bg-red-50 transition-all border border-transparent hover:border-red-100"
            >
              <LogOut className="w-4 h-4" /> Want to Logout
            </button>
          </div>
        </aside>

        {/* COMPOSANT CENTRAL */}
        <section className="flex-1 bg-white">
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

              {/* FORMULAIRE DE CRÉATION */}
              <div className="p-5 rounded-2xl border border-slate-100 bg-slate-50/50 grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">
                    Project Name
                  </label>
                  <input
                    type="text"
                    value={newProjName}
                    onChange={(e) => setNewProjName(e.target.value)}
                    className="w-full p-2 text-xs bg-white border rounded-xl"
                    placeholder="E.g., Production API"
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
                    placeholder="Optional description"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">
                    Connected GitHub Repo
                  </label>
                  <select
                    value={selectedRepo}
                    onChange={(e) => setSelectedRepo(e.target.value)}
                    className="w-full p-2 text-xs bg-white border rounded-xl font-mono text-slate-700"
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
                  className="w-full py-2.5 bg-slate-900 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1 hover:bg-slate-800 transition-all uppercase tracking-wider text-[10px]"
                >
                  <Plus className="w-3.5 h-3.5" /> Setup Project
                </button>
              </div>

              {/* LISTE DES PROJETS */}
              {loadingProjects ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-6 h-6 text-purple-600 animate-spin" />
                </div>
              ) : projects.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-xs border border-dashed rounded-2xl">
                  No projects found. Create your first database configuration
                  block above.
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3">
                  {projects.map((p) => (
                    <div
                      key={p.id}
                      className="p-5 border border-slate-100 rounded-2xl hover:border-purple-200 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white shadow-sm"
                    >
                      <div>
                        <span className="text-[9px] font-mono bg-slate-100 px-2 py-0.5 rounded text-slate-500 font-bold uppercase">
                          {p.id}
                        </span>
                        <h4 className="text-sm font-black text-slate-900 mt-1">
                          {p.name}
                        </h4>
                        <p className="text-xs text-slate-400">
                          {p.description}
                        </p>
                        <p className="text-[11px] font-mono text-purple-600 font-bold mt-2">
                          📦 Linked target:{" "}
                          <span className="underline">{p.repository}</span>
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                        {p.has_workflow ? (
                          <>
                            {/* BOUTON EXECUTE WORKFLOW */}
                            <button
                              onClick={() =>
                                triggerWorkflowExecution(p.id, p.name)
                              }
                              disabled={executingProjectId !== null}
                              className="px-3 py-2 bg-emerald-600 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 hover:bg-emerald-700 shadow-sm shadow-emerald-100 transition-all uppercase tracking-wider text-[10px] disabled:opacity-60"
                            >
                              {executingProjectId === p.id ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                <Play className="w-3 h-3 fill-white" />
                              )}
                              Execute
                            </button>

                            {/* BOUTON RE-CONFIGURE WORKFLOW */}
                            <button
                              onClick={() => initWorkflowConfig(p)}
                              disabled={executingProjectId !== null}
                              className="px-3 py-2 bg-slate-100 text-slate-700 font-bold text-xs rounded-xl border border-slate-200 flex items-center gap-1.5 hover:bg-slate-200 transition-all uppercase tracking-wider text-[10px] disabled:opacity-50"
                            >
                              <Sliders className="w-3 h-3" /> Configure
                            </button>
                          </>
                        ) : (
                          /* BOUTON DE CRÉATION INITIALE */
                          <button
                            onClick={() => initWorkflowConfig(p)}
                            disabled={executingProjectId !== null}
                            className="px-3 py-2 bg-purple-50 text-purple-700 font-bold text-xs rounded-xl border border-purple-100 flex items-center gap-1.5 hover:bg-purple-100 transition-all uppercase tracking-wider text-[10px] disabled:opacity-50"
                          >
                            <Sliders className="w-3 h-3" /> Create Workflow
                          </button>
                        )}

                        {/* BOUTON SUPPRIMER */}
                        <button
                          onClick={(e) => deleteProject(p.id, e)}
                          disabled={executingProjectId !== null}
                          className="p-2 text-slate-400 hover:text-red-500 rounded-xl hover:bg-slate-50 transition-all disabled:opacity-40"
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
                  className="flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-slate-900 mb-2"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Cancel and Back
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
                  <div className="py-20 text-center space-y-2">
                    <div className="w-6 h-6 border-2 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                    <p className="text-xs font-bold text-slate-700 font-mono">
                      Compiling workflow configurations...
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
                Ensure your MongoDB container is up and running on port 27017
                before applying pipeline triggers.
              </p>
            </div>
          )}
        </section>
      </div>
      <Footer />
    </>
  );
};
