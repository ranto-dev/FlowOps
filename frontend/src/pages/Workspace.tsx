import React, { useState, useEffect, useCallback } from "react";
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
  Menu,
  X,
  Play,
  Loader2,
  BookOpen,
  GitBranch,
  BrainCircuit,
} from "lucide-react";
import { WorkflowForm } from "../components/WorkflowForm";
import { YamlPreview } from "../components/YamlPreview";
import { History } from "../components/History";
import { PredictionPanel } from "../components/PredictionPanel";
import { MlopsCenter } from "../components/MlopsCenter";
import LogoImage from "../assets/logo-flowOps-transparent.png";
import { useToast } from "../components/ui/useToast";
import { ConfirmDialog } from "../components/ui/ConfirmDialog";
import { Modal } from "../components/ui/Modal";
import { Breadcrumbs } from "../components/ui/Breadcrumbs";
import { Button } from "../components/ui/Button";
import { EmptyState, LoadingState } from "../components/ui/States";
import type { FlowOpsWorkflowConfig } from "../@types/workflow";

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

interface StoredConfig {
  filename: string;
  name: string;
  on_events: string[];
  branches: string;
  global_env: string;
  jobs: FlowOpsWorkflowConfig["jobs"];
}

export const Workspace: React.FC = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const [activeTab, setActiveTab] = useState<
    "projects" | "history" | "mlops" | "help"
  >("projects");
  const [profileOpen, setProfileOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const username = localStorage.getItem("flowops_user") || "Developer";
  const avatarUrl = localStorage.getItem("flowops_avatar");
  const token = localStorage.getItem("flowops_token");
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

  // --- DATABASE & API STATES ---
  const [projects, setProjects] = useState<Project[]>([]);
  const [gitRepos, setGitRepos] = useState<GitHubRepo[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [executingProjectId, setExecutingProjectId] = useState<string | null>(
    null,
  );

  // --- MODAL & FORM CREATION STATES ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newProjName, setNewProjName] = useState("");
  const [newProjDesc, setNewProjDesc] = useState("");
  const [selectedRepo, setSelectedRepo] = useState("");

  // --- DELETE CONFIRMATION ---
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // --- LOGOUT CONFIRMATION ---
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);

  // --- WORKFLOW CONFIG STATES ---
  const [isConfiguringWorkflow, setIsConfiguringWorkflow] = useState(false);
  const [targetProject, setTargetProject] = useState<Project | null>(null);
  const [activeConfig, setActiveConfig] = useState<StoredConfig | null>(null);
  const [compiledYaml, setCompiledYaml] = useState<string | null>(null);
  const [viewState, setViewState] = useState<"form" | "loading" | "preview">(
    "form",
  );

  const fetchProjects = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/projects`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setProjects(data);
      }
    } catch {
      toast.error(
        "Impossible de charger les projets",
        "Le serveur est peut-être arrêté.",
      );
    } finally {
      setLoadingProjects(false);
    }
  }, [API_URL, token, toast]);

  const fetchGitHubRepos = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/github/repositories`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setGitRepos(data);
      }
    } catch {
      // silencieux : le sélecteur de repo affichera la liste vide
    }
  }, [API_URL, token]);

  useEffect(() => {
    fetchProjects();
    fetchGitHubRepos();
  }, [fetchProjects, fetchGitHubRepos]);

  useEffect(() => {
    if (!profileOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setProfileOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [profileOpen]);

  const handleLogout = () => {
    localStorage.clear();
    navigate("/auth", { replace: true });
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setNewProjName("");
    setNewProjDesc("");
    setSelectedRepo("");
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
          steps: [{ id: "s-1", name: "Checkout Source", type: "checkout" }],
        },
      ],
    });
    setCompiledYaml(null);
    setIsConfiguringWorkflow(true);
    setViewState("form");
  };

  const createProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjName.trim() || !selectedRepo) {
      toast.error(
        "Informations incomplètes",
        "Renseignez le nom du projet et sélectionnez un dépôt GitHub.",
      );
      return;
    }

    setIsCreating(true);

    try {
      const res = await fetch(`${API_URL}/api/projects`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: newProjName.trim(),
          description: newProjDesc.trim() || "",
          repository: selectedRepo,
        }),
      });

      if (res.ok) {
        const createdProject = await res.json();
        closeModal();
        await fetchProjects();
        toast.success(
          "Projet créé",
          `« ${createdProject.name} » est prêt. Configurez son workflow.`,
        );
        initWorkflowConfig(createdProject);
      } else {
        const errorData = await res.json().catch(() => null);
        toast.error(
          "Création refusée",
          errorData?.detail
            ? JSON.stringify(errorData.detail)
            : "Le serveur a rejeté la requête.",
        );
      }
    } catch {
      toast.error(
        "Échec de communication",
        "Impossible de joindre le serveur.",
      );
    } finally {
      setIsCreating(false);
    }
  };

  const confirmDeleteProject = async () => {
    if (!projectToDelete) return;
    setIsDeleting(true);
    try {
      const res = await fetch(
        `${API_URL}/api/projects/${projectToDelete.id}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (res.ok) {
        toast.success(
          "Projet supprimé",
          `« ${projectToDelete.name} » a été retiré de la base.`,
        );
        setProjectToDelete(null);
        fetchProjects();
      } else {
        toast.error(
          "Suppression impossible",
          "Le serveur a refusé la suppression.",
        );
      }
    } catch {
      toast.error(
        "Erreur de communication",
        "Impossible de joindre le serveur pendant la suppression.",
      );
    } finally {
      setIsDeleting(false);
    }
  };

  const triggerWorkflowExecution = async (
    projectId: string,
    projectName: string,
  ) => {
    if (!token) {
      toast.error(
        "Session expirée",
        "Votre jeton GitHub a expiré. Ré-authentifiez-vous.",
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
        toast.success(
          "Workflow déclenché",
          `${projectName} — ${data.message}`,
        );
        setActiveTab("history");
      } else {
        toast.error(
          "Échec du déclenchement",
          data.detail || "Erreur inconnue.",
        );
      }
    } catch {
      toast.error(
        "Workflow non déclenché",
        "Impossible de joindre le runner d'exécution.",
      );
    } finally {
      setExecutingProjectId(null);
    }
  };

  const saveWorkflow = async () => {
    if (!targetProject || !activeConfig) return;
    try {
      const res = await fetch(
        `${API_URL}/api/projects/${targetProject.id}/workflow`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(activeConfig),
        },
      );

      if (res.ok) {
        toast.success(
          "Workflow enregistré",
          `Le workflow de « ${targetProject.name} » a été sauvegardé.`,
        );
        setIsConfiguringWorkflow(false);
        fetchProjects();
      } else {
        toast.error(
          "Enregistrement impossible",
          "Le serveur a refusé de sauvegarder le workflow.",
        );
      }
    } catch {
      toast.error(
        "Erreur de communication",
        "Impossible de sauvegarder le workflow.",
      );
    }
  };

  const generateWorkflow = async () => {
    if (!activeConfig) return;
    setViewState("loading");
    try {
      const res = await fetch(`${API_URL}/api/generate-workflow`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(activeConfig),
      });
      const data = await res.json();
      if (!res.ok || !data.yaml) {
        toast.error(
          "Génération impossible",
          data.detail || "Le serveur n'a pas pu compiler le workflow.",
        );
        setViewState("form");
        return;
      }
      setCompiledYaml(data.yaml);
      setViewState("preview");
    } catch {
      toast.error("Erreur de communication", "Génération du workflow échouée.");
      setViewState("form");
    }
  };

  const switchTab = (tab: "projects" | "history" | "mlops" | "help") => {
    setActiveTab(tab);
    setIsConfiguringWorkflow(false);
    setMobileNavOpen(false);
  };

  const NAV_TABS: {
    key: "projects" | "history" | "mlops" | "help";
    label: string;
    icon: React.ReactNode;
  }[] = [
    { key: "projects", label: "Projets", icon: <FolderGit2 className="w-4 h-4" /> },
    { key: "history", label: "Historique", icon: <HistoryIcon className="w-4 h-4" /> },
    { key: "mlops", label: "MLflow", icon: <BrainCircuit className="w-4 h-4" /> },
    { key: "help", label: "Aide", icon: <HelpCircle className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen bg-slate-50/50 flex flex-col font-sans text-slate-800">
      {/* ================= HEADER HORIZONTAL (NAVBAR) ================= */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-6 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div
            onClick={() => {
              switchTab("projects");
              setProfileOpen(false);
            }}
            className="flex items-center gap-2 cursor-pointer group"
          >
            <img src={LogoImage} className="h-8 w-auto" alt="FlowOps Logo" />
            <span className="font-black text-lg tracking-tight text-slate-900 group-hover:text-purple-600 transition-colors">
              FlowOps
            </span>
          </div>

          {/* Navigation Tabs (desktop) */}
          <nav className="hidden md:flex items-center gap-6">
            {NAV_TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => switchTab(tab.key)}
                className={`group relative flex items-center gap-1.5 py-2 text-xs font-bold tracking-wide transition-colors duration-200 ${
                  activeTab === tab.key
                    ? "text-purple-700"
                    : "text-slate-600 hover:text-purple-700"
                }`}
              >
                {tab.icon}
                {tab.label}
                <span
                  className={`absolute -bottom-0.5 left-0 h-[2px] w-full rounded-full bg-purple-600 origin-left transition-transform duration-300 ${
                    activeTab === tab.key
                      ? "scale-x-100"
                      : "scale-x-0 group-hover:scale-x-100"
                  }`}
                />
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            {/* Mobile menu toggle */}
            <button
              onClick={() => setMobileNavOpen((v) => !v)}
              className="md:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors"
              aria-label={mobileNavOpen ? "Fermer le menu" : "Ouvrir le menu"}
            >
              {mobileNavOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>

            {/* User Profile & Actions */}
            <div className="relative">
              <button
                onClick={() => setProfileOpen((v) => !v)}
                aria-haspopup="menu"
                aria-expanded={profileOpen}
                className={`rounded-full overflow-hidden ring-2 ring-offset-2 ring-offset-white transition-all duration-200 ${
                  profileOpen
                    ? "ring-purple-500"
                    : "ring-transparent hover:ring-purple-300"
                }`}
              >
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={username}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-8 h-8 bg-purple-100 text-purple-600 flex items-center justify-center">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </button>

              {profileOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setProfileOpen(false)}
                  />
                  <div
                    role="menu"
                    className="absolute right-0 top-12 z-50 w-60 rounded-2xl bg-white border border-slate-200/80 shadow-xl shadow-slate-200/60 p-2"
                  >
                    <div className="flex items-center gap-3 px-3 py-2.5 border-b border-slate-100">
                      {avatarUrl ? (
                        <img
                          src={avatarUrl}
                          alt={username}
                          className="w-9 h-9 rounded-full border-2 border-purple-200 object-cover"
                        />
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center border-2 border-purple-200">
                          <User className="w-4 h-4" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-xs font-black text-slate-900 truncate">
                          {username}
                        </p>
                        <p className="text-[10px] font-mono font-medium text-emerald-600 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                          Connected
                        </p>
                      </div>
                    </div>

                    <div className="pt-1.5">
                      <button
                        role="menuitem"
                        onClick={() => {
                          setProfileOpen(false);
                          setLogoutConfirmOpen(true);
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-bold text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <LogOut className="w-4 h-4" /> Se déconnecter
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Mobile navigation drawer */}
        {mobileNavOpen && (
          <div className="md:hidden pt-2 pb-4 border-t border-slate-100 mt-3">
            <nav className="flex flex-col gap-1">
              {NAV_TABS.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => switchTab(tab.key)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold transition-colors ${
                    activeTab === tab.key
                      ? "bg-purple-50 text-purple-700"
                      : "text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
        )}
      </header>

      {/* ================= CONTENU PRINCIPAL ================= */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-8">
        {/* TAB 1: PROJECTS */}
        {activeTab === "projects" && !isConfiguringWorkflow && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                  Projets
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Configurez des pipelines, déclenchez des workflows et suivez
                  vos dépôts GitHub.
                </p>
              </div>

              <Button onClick={() => setIsModalOpen(true)}>
                <Plus className="w-4 h-4" /> Nouveau projet
              </Button>
            </div>

            {loadingProjects ? (
              <LoadingState label="Chargement des projets..." />
            ) : projects.length === 0 ? (
              <EmptyState
                title="Aucun projet trouvé"
                description='Cliquez sur « Nouveau projet » pour relier un dépôt GitHub.'
                action={
                  <Button onClick={() => setIsModalOpen(true)} variant="primary">
                    <Plus className="w-3.5 h-3.5" /> Créer un projet
                  </Button>
                }
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {projects.map((p) => (
                  <div
                    key={p.id}
                    className="p-5 bg-white border border-slate-200/80 rounded-2xl hover:border-purple-300 hover:shadow-md transition-all duration-200 flex flex-col gap-4 relative overflow-hidden group"
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
                            <span className="w-1.5 h-1.5 rounded-full bg-purple-600 inline-block animate-pulse" />
                            Pipeline actif
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold bg-slate-100 text-slate-500 px-2 py-0.5 rounded-md">
                            Aucun workflow
                          </span>
                        )}
                      </div>

                      <h3 className="text-lg font-black text-slate-900 tracking-tight">
                        {p.name}
                      </h3>

                      <p className="text-xs text-slate-500 font-medium">
                        {p.description || "Aucune description fournie."}
                      </p>

                      <div className="flex items-center gap-1.5 text-xs text-slate-600 font-mono pt-1">
                        <GitBranch className="w-3.5 h-3.5 text-slate-400" />
                        <span>Repository:</span>
                        <span className="text-purple-600 font-bold">
                          {p.repository}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {p.has_workflow ? (
                        <>
                          <Button
                            variant="success"
                            size="sm"
                            onClick={() =>
                              triggerWorkflowExecution(p.id, p.name)
                            }
                            disabled={executingProjectId !== null}
                          >
                            {executingProjectId === p.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Play className="w-3.5 h-3.5 fill-current" />
                            )}
                            Run
                          </Button>

                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => initWorkflowConfig(p)}
                            disabled={executingProjectId !== null}
                          >
                            <Sliders className="w-3.5 h-3.5" /> Éditer le
                            workflow
                          </Button>
                        </>
                      ) : (
                        <Button
                          size="sm"
                          onClick={() => initWorkflowConfig(p)}
                          disabled={executingProjectId !== null}
                        >
                          <Sliders className="w-3.5 h-3.5" /> Créer un workflow
                        </Button>
                      )}

                      <button
                        onClick={() => setProjectToDelete(p)}
                        disabled={executingProjectId !== null}
                        className="ml-auto p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all disabled:opacity-40"
                        title="Supprimer le projet"
                        aria-label={`Supprimer ${p.name}`}
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
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <Breadcrumbs
                items={[
                  {
                    label: "Projets",
                    onClick: () => setIsConfiguringWorkflow(false),
                  },
                  { label: targetProject.name },
                  { label: viewState === "preview" ? "Aperçu YAML" : "Configuration" },
                ]}
              />

              <button
                onClick={() => setIsConfiguringWorkflow(false)}
                className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-purple-600 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" /> Retour au tableau de bord
              </button>
            </div>

            {viewState === "form" && activeConfig && (
              <>
                <WorkflowForm
                  activeConfig={activeConfig}
                  onChangeConfig={setActiveConfig}
                  onGenerate={generateWorkflow}
                  loading={false}
                />

                <PredictionPanel
                  config={activeConfig as unknown as Record<string, unknown>}
                  repository={targetProject.repository}
                  apiUrl={API_URL}
                />
              </>
            )}

            {viewState === "loading" && (
              <div className="py-24 text-center space-y-4 border border-slate-200/80 rounded-2xl bg-white">
                <Loader2 className="w-8 h-8 text-purple-600 animate-spin mx-auto" />
                <p className="text-xs font-bold text-slate-600 font-mono tracking-wide">
                  Compilation de la configuration vers le YAML...
                </p>
              </div>
            )}

            {viewState === "preview" && activeConfig && (
              <YamlPreview
                activeFile={{
                  id: targetProject.id,
                  filename: activeConfig.filename,
                  yaml: compiledYaml,
                  config: activeConfig as FlowOpsWorkflowConfig,
                }}
                loading={false}
                onNewWorkflow={() => {
                  setIsConfiguringWorkflow(false);
                  fetchProjects();
                }}
                onReconfigure={() => setViewState("form")}
                onSaveToServer={saveWorkflow}
                saveStatus={null}
              />
            )}
          </div>
        )}

        {/* TAB 2: HISTORY & LOGS */}
        {activeTab === "history" && (
          <History />
        )}

        {/* TAB MLFLOW */}
        {activeTab === "mlops" && (
          <MlopsCenter apiUrl={API_URL} token={token} />
        )}

        {/* TAB 3: HELP CENTER */}
        {activeTab === "help" && (
          <div className="space-y-4 p-6 border border-slate-200/80 rounded-2xl bg-white shadow-sm">
            <div className="flex items-center gap-2 text-slate-900 font-black text-lg">
              <BookOpen className="w-5 h-5 text-purple-600" />
              <h3>Documentation & bonnes pratiques</h3>
            </div>
            <div className="text-xs text-slate-600 space-y-3 font-medium leading-relaxed max-w-3xl">
              <p>
                FlowOps permet de modéliser des pipelines CI/CD en low-code,
                de les déployer sur un dépôt GitHub et de suivre l'exécution
                des runners en temps réel.
              </p>
              <div className="p-4 bg-amber-50 border border-amber-200/80 rounded-xl text-amber-800 font-mono text-[11px] leading-relaxed">
                <span className="font-bold">⚠ Prérequis :</span> une instance
                MongoDB locale ou distante sur le port{" "}
                <code className="bg-amber-100 px-1 py-0.5 rounded font-bold">
                  27017
                </code>{" "}
                et le service backend accessible avant de déclencher des
                exécutions.
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ================= MODAL DE CRÉATION DE PROJET ================= */}
      <Modal
        open={isModalOpen}
        onClose={closeModal}
        title="Nouveau projet"
        description="Reliez un dépôt GitHub pour configurer un pipeline automatisé."
        icon={
          <div className="p-2 bg-purple-100 text-purple-600 rounded-xl">
            <FolderGit2 className="w-5 h-5" />
          </div>
        }
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={closeModal}>
              Annuler
            </Button>
            <Button
              size="sm"
              form="create-project-form"
              type="submit"
              loading={isCreating}
            >
              {isCreating ? "Création..." : (
                <>
                  <Plus className="w-3.5 h-3.5" /> Initialiser
                </>
              )}
            </Button>
          </>
        }
      >
        <form id="create-project-form" onSubmit={createProject} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider">
              Nom du projet <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={newProjName}
              onChange={(e) => setNewProjName(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:bg-white focus:border-purple-500 focus:ring-2 focus:ring-purple-100 transition-all font-medium text-slate-800"
              placeholder="Ex : Production API"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider">
              Dépôt GitHub <span className="text-red-500">*</span>
            </label>
            <select
              value={selectedRepo}
              onChange={(e) => setSelectedRepo(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:bg-white focus:border-purple-500 focus:ring-2 focus:ring-purple-100 transition-all font-mono text-slate-700"
            >
              <option value="">
                {gitRepos.length === 0
                  ? "-- Aucun dépôt disponible --"
                  : "-- Sélectionner un dépôt GitHub --"}
              </option>
              {gitRepos.map((repo) => (
                <option key={repo.id} value={repo.full_name}>
                  {repo.full_name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider">
              Description
            </label>
            <textarea
              rows={3}
              value={newProjDesc}
              onChange={(e) => setNewProjDesc(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:bg-white focus:border-purple-500 focus:ring-2 focus:ring-purple-100 transition-all font-medium text-slate-800 resize-none"
              placeholder="Détails optionnels sur ce projet..."
            />
          </div>
        </form>
      </Modal>

      {/* ================= DIALOGUE DE SUPPRESSION ================= */}
      <ConfirmDialog
        open={projectToDelete !== null}
        onClose={() => {
          if (!isDeleting) setProjectToDelete(null);
        }}
        onConfirm={confirmDeleteProject}
        danger
        loading={isDeleting}
        title="Supprimer le projet ?"
        confirmLabel="Supprimer"
        description={
          <>
            Le projet{" "}
            <span className="font-black text-slate-900">
              « {projectToDelete?.name} »
            </span>{" "}
            et tous ses workflows seront définitivement retirés de la base de
            données. Cette action est irréversible.
          </>
        }
      />

      {/* ================= DIALOGUE DE DÉCONNEXION ================= */}
      <ConfirmDialog
        open={logoutConfirmOpen}
        onClose={() => setLogoutConfirmOpen(false)}
        onConfirm={handleLogout}
        title="Se déconnecter ?"
        confirmLabel="Se déconnecter"
        description="Vous devrez vous ré-authentifier avec GitHub pour accéder à nouveau au workspace."
      />
    </div>
  );
};