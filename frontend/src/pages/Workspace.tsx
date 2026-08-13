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
  GitBranch,
  Layers,
} from "lucide-react";
import { WorkflowForm } from "../components/WorkflowForm";
import { YamlPreview } from "../components/YamlPreview";
import { History } from "../components/History";
import LogoImage from "../assets/logo-flowOps-transparent.png";

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
    <div className="min-h-screen bg-slate-50/50 flex flex-col font-sans text-slate-800">
      {/* ================= HEADER HORIZONTAL (NAVBAR) ================= */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-200/80 px-6 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          {/* Brand Logo & Name */}
          <div
            onClick={() => {
              setActiveTab("projects");
              setIsConfiguringWorkflow(false);
            }}
            className="flex items-center gap-2 cursor-pointer group"
          >
            <img src={LogoImage} className="h-9 w-auto" alt="FlowOps Logo" />
            <span className="font-black text-xl tracking-tight text-slate-900 group-hover:text-purple-600 transition-colors">
              FlowOps
            </span>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex items-center gap-1 bg-slate-100/70 p-1 rounded-xl border border-slate-200/50">
            <button
              onClick={() => {
                setActiveTab("projects");
                setIsConfiguringWorkflow(false);
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all duration-200 ${
                activeTab === "projects"
                  ? "bg-white text-purple-700 shadow-sm"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50"
              }`}
            >
              <FolderGit2 className="w-4 h-4" /> My Projects
            </button>

            <button
              onClick={() => {
                setActiveTab("history");
                setIsConfiguringWorkflow(false);
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all duration-200 ${
                activeTab === "history"
                  ? "bg-white text-purple-700 shadow-sm"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50"
              }`}
            >
              <HistoryIcon className="w-4 h-4" /> History & Logs
            </button>

            <button
              onClick={() => {
                setActiveTab("help");
                setIsConfiguringWorkflow(false);
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all duration-200 ${
                activeTab === "help"
                  ? "bg-white text-purple-700 shadow-sm"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50"
              }`}
            >
              <HelpCircle className="w-4 h-4" /> Help Center
            </button>
          </nav>

          {/* User Profile & Actions */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2.5 pl-3 pr-2 py-1.5 bg-slate-100/60 rounded-xl border border-slate-200/60">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={username}
                  className="w-7 h-7 rounded-full border border-purple-200 object-cover"
                />
              ) : (
                <div className="w-7 h-7 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center font-bold text-xs">
                  <User className="w-3.5 h-3.5" />
                </div>
              )}
              <div className="flex flex-col text-left">
                <span className="text-[11px] font-bold text-slate-800 leading-tight">
                  {username}
                </span>
                <span className="text-[9px] font-mono font-medium text-emerald-600 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-pulse"></span>
                  Connected
                </span>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all duration-200 border border-transparent"
              title="Logout Account"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* ================= CONTENU PRINCIPAL ================= */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-8">
        {/* TAB 1: PROJECTS */}
        {activeTab === "projects" && !isConfiguringWorkflow && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                  Projects Workspace
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Configure pipelines, trigger automated workflows, and inspect
                  project repositories.
                </p>
              </div>
            </div>

            {/* Formulaire de création de Projet */}
            <div className="p-5 rounded-2xl border border-slate-200/80 bg-white shadow-sm space-y-4">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase tracking-wider">
                <Plus className="w-4 h-4 text-purple-600" /> Create New Project
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-3 items-end">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                    Project Name *
                  </label>
                  <input
                    type="text"
                    value={newProjName}
                    onChange={(e) => setNewProjName(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:bg-white focus:border-purple-500 focus:ring-2 focus:ring-purple-100 transition-all font-medium text-slate-800"
                    placeholder="E.g., Production API"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                    Description
                  </label>
                  <input
                    type="text"
                    value={newProjDesc}
                    onChange={(e) => setNewProjDesc(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:bg-white focus:border-purple-500 focus:ring-2 focus:ring-purple-100 transition-all font-medium text-slate-800"
                    placeholder="Optional details..."
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                    GitHub Repo *
                  </label>
                  <select
                    value={selectedRepo}
                    onChange={(e) => setSelectedRepo(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:bg-white focus:border-purple-500 focus:ring-2 focus:ring-purple-100 transition-all font-mono text-slate-700"
                  >
                    <option value="">-- Select Repository --</option>
                    {gitRepos.map((repo) => (
                      <option key={repo.id} value={repo.full_name}>
                        {repo.full_name}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  onClick={createProject}
                  className="w-full py-2 px-4 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-sm hover:shadow-purple-200 transition-all uppercase tracking-wider h-[38px]"
                >
                  <Plus className="w-4 h-4" /> Initialize
                </button>
              </div>
            </div>

            {/* Liste des projets */}
            {loadingProjects ? (
              <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-slate-200/80">
                <Loader2 className="w-8 h-8 text-purple-600 animate-spin mb-2" />
                <span className="text-xs font-semibold text-slate-500">
                  Loading workspace projects...
                </span>
              </div>
            ) : projects.length === 0 ? (
              <div className="text-center py-16 text-slate-400 text-xs border border-dashed border-slate-200 rounded-2xl bg-white space-y-2">
                <Layers className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="font-medium">No projects found in database.</p>
                <p className="text-[11px] text-slate-400">
                  Create one using the form above to get started.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {projects.map((p) => (
                  <div
                    key={p.id}
                    className="p-5 bg-white border border-slate-200/80 rounded-2xl hover:border-purple-300 hover:shadow-md transition-all duration-200 flex flex-col md:flex-row md:items-center justify-between gap-4 relative overflow-hidden group"
                  >
                    {p.has_workflow && (
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-purple-600" />
                    )}

                    <div className="space-y-1.5 pl-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-bold">
                          ID: {p.id.slice(-6)}
                        </span>
                        {p.has_workflow ? (
                          <span className="text-[10px] font-bold bg-purple-50 text-purple-700 px-2 py-0.5 rounded-md border border-purple-100 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-purple-600 inline-block animate-pulse"></span>
                            Active Pipeline
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold bg-slate-100 text-slate-500 px-2 py-0.5 rounded-md">
                            No Pipeline
                          </span>
                        )}
                      </div>

                      <h3 className="text-lg font-black text-slate-900 tracking-tight">
                        {p.name}
                      </h3>

                      <p className="text-xs text-slate-500 font-medium">
                        {p.description || "No description provided."}
                      </p>

                      <div className="flex items-center gap-1.5 text-xs text-slate-600 font-mono pt-1">
                        <GitBranch className="w-3.5 h-3.5 text-slate-400" />
                        <span>Repository:</span>
                        <span className="text-purple-600 font-bold">
                          {p.repository}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
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
                            Run
                          </button>

                          <button
                            onClick={() => initWorkflowConfig(p)}
                            disabled={executingProjectId !== null}
                            className="px-4 py-2 bg-slate-100 text-slate-700 font-bold text-xs rounded-xl border border-slate-200 flex items-center gap-1.5 hover:bg-slate-200 transition-all uppercase tracking-wider disabled:opacity-50"
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
                          <Sliders className="w-3.5 h-3.5 inline mr-1" />
                          Create Pipeline
                        </button>
                      )}

                      <button
                        onClick={(e) => deleteProject(p.id, e)}
                        disabled={executingProjectId !== null}
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all disabled:opacity-40"
                        title="Delete project"
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

        {/* WORKFLOW CONFIGURATION VIEW */}
        {activeTab === "projects" && isConfiguringWorkflow && targetProject && (
          <div className="space-y-4 animate-in zoom-in-95 duration-200">
            <button
              onClick={() => setIsConfiguringWorkflow(false)}
              className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors mb-2"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Dashboard
            </button>

            {viewState === "form" && (
              <WorkflowForm
                activeConfig={activeConfig}
                onChangeConfig={setActiveConfig}
                onGenerate={async () => {
                  setViewState("loading");
                  const res = await fetch(`${API_URL}/api/generate-workflow`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(activeConfig),
                  });
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
              <div className="py-24 text-center space-y-4 border border-slate-200/80 rounded-2xl bg-white">
                <Loader2 className="w-8 h-8 text-purple-600 animate-spin mx-auto" />
                <p className="text-xs font-bold text-slate-600 font-mono tracking-wide">
                  Compiling visual workflow trees into YAML...
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
                        "Workflow configuration successfully saved to the project!",
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

        {/* TAB 2: HISTORY & LOGS */}
        {activeTab === "history" && (
          <div className="animate-in fade-in duration-200">
            <History />
          </div>
        )}

        {/* TAB 3: HELP CENTER */}
        {activeTab === "help" && (
          <div className="space-y-4 p-6 border border-slate-200/80 rounded-2xl bg-white shadow-sm animate-in fade-in duration-200">
            <div className="flex items-center gap-2 text-slate-900 font-black text-lg">
              <BookOpen className="w-5 h-5 text-purple-600" />
              <h3>FlowOps Documentation & Guidelines</h3>
            </div>
            <div className="text-xs text-slate-600 space-y-3 font-medium leading-relaxed max-w-3xl">
              <p>
                Welcome to FlowOps Workspace. This platform allows you to map
                out custom CI/CD automation pipelines, target repositories from
                GitHub, and monitor runner logs in real-time.
              </p>
              <div className="p-4 bg-amber-50 border border-amber-200/80 rounded-xl text-amber-800 font-mono text-[11px] leading-relaxed">
                <span className="font-bold">
                  ⚠️ Infrastructure Requirement:
                </span>{" "}
                Ensure your local/remote MongoDB instance is operational on port{" "}
                <code className="bg-amber-100 px-1 py-0.5 rounded font-bold">
                  27017
                </code>{" "}
                and the backend service is reachable before executing runner
                triggers.
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
