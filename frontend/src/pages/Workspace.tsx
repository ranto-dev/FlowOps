import React, { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
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
  AlertCircle,
  BookOpen,
  GitBranch,
  Search,
} from "lucide-react";
import { WorkflowForm } from "../components/WorkflowForm";
import { YamlPreview } from "../components/YamlPreview";
import { History } from "../components/History";
import { PredictionPanel } from "../components/PredictionPanel";
import LogoImage from "../assets/flowops.svg";
import { useToast } from "../components/ui/useToast";
import { ConfirmDialog } from "../components/ui/ConfirmDialog";
import { Modal } from "../components/ui/Modal";
import { Breadcrumbs } from "../components/ui/Breadcrumbs";
import { Button } from "../components/ui/Button";
import { Badge } from "../components/ui/Badge";
import { Card } from "../components/ui/Card";
import { Field, Input, Select, Textarea } from "../components/ui/Field";
import { cn } from "../lib/utils";
import { EmptyState, LoadingState } from "../components/ui/States";
import { PreferenceControls } from "../components/ui/PreferenceControls";
import { usePreferences } from "../lib/usePreferences";
import type { FlowOpsWorkflowConfig } from "../@types/workflow";
import { apiFetch, clearSession, errorDetail, getToken, isApiError } from "../lib/api";
import type {
  ExecuteResponse,
  GenerateWorkflowResponse,
  GitHubRepo,
  Project,
  SaveWorkflowResponse,
} from "../@types/api";

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
  const { t } = usePreferences();
  const [activeTab, setActiveTab] = useState<"projects" | "history" | "help">(
    "projects",
  );
  const [profileOpen, setProfileOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const username = localStorage.getItem("flowops_user") || "Developer";
  const avatarUrl = localStorage.getItem("flowops_avatar");
  const token = getToken();

  // --- DATABASE & API STATES ---
  const [projects, setProjects] = useState<Project[]>([]);
  const [gitRepos, setGitRepos] = useState<GitHubRepo[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [projectQuery, setProjectQuery] = useState("");
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
      const data = await apiFetch<Project[]>("/api/projects");
      setProjects(data);
    } catch (err) {
      // Un 401 a déjà déclenché la déconnexion centralisée dans apiFetch.
      if (isApiError(err) && err.status === 401) return;
      toast.error(
        "Impossible de charger les projets",
        errorDetail(err, "Le serveur est peut-être arrêté."),
      );
    } finally {
      setLoadingProjects(false);
    }
  }, [toast]);

  const fetchGitHubRepos = useCallback(async () => {
    try {
      setGitRepos(await apiFetch<GitHubRepo[]>("/api/github/repositories"));
    } catch (err) {
      if (isApiError(err) && err.status === 401) return;
      toast.error(
        t("Repositories unavailable"),
        errorDetail(err, t("Could not load your GitHub repositories.")),
      );
    }
  }, [toast, t]);

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
    clearSession();
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
      const createdProject = await apiFetch<Project>("/api/projects", {
        method: "POST",
        body: {
          name: newProjName.trim(),
          description: newProjDesc.trim() || "",
          repository: selectedRepo,
        },
      });

      closeModal();
      await fetchProjects();
      toast.success(
        "Projet créé",
        `« ${createdProject.name} » est prêt. Configurez son workflow.`,
      );
      initWorkflowConfig(createdProject);
    } catch (err) {
      toast.error(
        isApiError(err) ? "Création refusée" : "Échec de communication",
        errorDetail(err, "Impossible de joindre le serveur."),
      );
    } finally {
      setIsCreating(false);
    }
  };

  const confirmDeleteProject = async () => {
    if (!projectToDelete) return;
    setIsDeleting(true);
    try {
      await apiFetch<void>(`/api/projects/${projectToDelete.id}`, {
        method: "DELETE",
      });
      toast.success(
        "Projet supprimé",
        `« ${projectToDelete.name} » a été retiré de la base.`,
      );
      setProjectToDelete(null);
      fetchProjects();
    } catch (err) {
      toast.error(
        isApiError(err) ? "Suppression impossible" : "Erreur de communication",
        errorDetail(err, "Impossible de joindre le serveur pendant la suppression."),
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
      const data = await apiFetch<ExecuteResponse>(
        `/api/projects/${projectId}/execute`,
        { method: "POST" },
      );

      if (data.status === "success") {
        toast.success(
          "Workflow déclenché",
          `${projectName} — ${data.message}`,
        );
        setActiveTab("history");
      } else {
        toast.error(
          "Échec du déclenchement",
          data.message || "Erreur inconnue.",
        );
      }
    } catch (err) {
      toast.error(
        "Workflow non déclenché",
        errorDetail(err, "Impossible de joindre le runner d'exécution."),
      );
    } finally {
      setExecutingProjectId(null);
    }
  };

  const saveWorkflow = async () => {
    if (!targetProject || !activeConfig) return;
    try {
      await apiFetch<SaveWorkflowResponse>(
        `/api/projects/${targetProject.id}/workflow`,
        { method: "POST", body: activeConfig },
      );

      toast.success(
        "Workflow enregistré",
        `Le workflow de « ${targetProject.name} » a été sauvegardé.`,
      );
      setIsConfiguringWorkflow(false);
      fetchProjects();
    } catch (err) {
      toast.error(
        isApiError(err) ? "Enregistrement impossible" : "Erreur de communication",
        errorDetail(err, "Impossible de sauvegarder le workflow."),
      );
    }
  };

  const generateWorkflow = async () => {
    if (!activeConfig) return;
    setViewState("loading");
    try {
      const data = await apiFetch<GenerateWorkflowResponse>(
        "/api/generate-workflow",
        { method: "POST", body: activeConfig, auth: false },
      );
      if (!data.yaml) {
        throw new Error("Réponse invalide du compilateur.");
      }
      setCompiledYaml(data.yaml);
      setViewState("preview");
    } catch (err) {
      toast.error(
        "Génération impossible",
        errorDetail(err, "Le serveur n'a pas pu compiler le workflow."),
      );
      setViewState("form");
    }
  };

  const switchTab = (tab: "projects" | "history" | "help") => {
    setActiveTab(tab);
    setIsConfiguringWorkflow(false);
    setMobileNavOpen(false);
  };

  const NAV_TABS: {
    key: "projects" | "history" | "help";
    label: string;
    icon: React.ReactNode;
  }[] = [
    { key: "projects", label: "Projects", icon: <FolderGit2 className="w-4 h-4" /> },
    { key: "history", label: "History", icon: <HistoryIcon className="w-4 h-4" /> },
    { key: "help", label: "Help", icon: <HelpCircle className="w-4 h-4" /> },
  ];

  const visibleProjects = projects.filter((project) => {
    const query = projectQuery.trim().toLocaleLowerCase();
    return (
      !query ||
      project.name.toLocaleLowerCase().includes(query) ||
      project.repository.toLocaleLowerCase().includes(query) ||
      project.description.toLocaleLowerCase().includes(query)
    );
  });

  return (
    <div className="flex min-h-screen flex-col bg-canvas font-sans text-ink">
      {/* ================= HEADER ================= */}
      <header className="sticky top-0 z-30 border-b border-line bg-canvas px-4 py-3 sm:px-6">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => {
              switchTab("projects");
              setProfileOpen(false);
            }}
            className="flex items-center gap-2 rounded-md"
            aria-label="FlowOps projects"
          >
            <img src={LogoImage} className="h-7 w-auto" alt="FlowOps Logo" />
            <span className="text-base font-semibold text-ink">FlowOps</span>
          </button>

          {/* Navigation Tabs (desktop) */}
          <nav className="hidden items-center gap-1 md:flex">
            {NAV_TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => switchTab(tab.key)}
                className={cn(
                  "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                  activeTab === tab.key
                    ? "bg-accent/15 text-accent-ink"
                    : "text-ink-muted hover:bg-surface-2 hover:text-ink",
                )}
              >
                {tab.icon}
                {t(tab.label)}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <PreferenceControls compact />
            {/* Mobile menu toggle */}
            <button
              onClick={() => setMobileNavOpen((v) => !v)}
              className="rounded-md p-2 text-ink-muted transition-colors hover:bg-surface-2 hover:text-ink md:hidden"
              aria-label={mobileNavOpen ? "Close navigation" : "Open navigation"}
            >
              {mobileNavOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </button>

            {/* User Profile & Actions */}
            <div className="relative">
              <button
                onClick={() => setProfileOpen((v) => !v)}
                aria-haspopup="menu"
                aria-expanded={profileOpen}
                className={cn(
                  "overflow-hidden rounded-full ring-2 transition-colors",
                  profileOpen ? "ring-accent" : "ring-transparent hover:ring-line-strong",
                )}
              >
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={username}
                    className="h-8 w-8 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-8 w-8 items-center justify-center bg-accent/15 text-accent-ink">
                    <User className="h-4 w-4" />
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
                    className="absolute right-0 top-12 z-50 w-60 rounded-lg border border-line bg-surface p-2 shadow-lg"
                  >
                    <div className="flex items-center gap-3 border-b border-line px-3 py-2.5">
                      {avatarUrl ? (
                        <img
                          src={avatarUrl}
                          alt={username}
                          className="h-9 w-9 rounded-full border border-line-strong object-cover"
                        />
                      ) : (
                        <div className="flex h-9 w-9 items-center justify-center rounded-full border border-accent/30 bg-accent/15 text-accent-ink">
                          <User className="h-4 w-4" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-ink">
                          {username}
                        </p>
                        <p className="flex items-center gap-1 text-xs text-success">
                          <span className="inline-block h-1.5 w-1.5 rounded-full bg-success" />
                          {t("Connected")}
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
                        className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium text-danger transition-colors hover:bg-danger/10"
                      >
                        <LogOut className="h-4 w-4" /> {t("Sign out")}
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
          <div className="mt-3 border-t border-line pb-2 pt-2 md:hidden">
            <nav className="flex flex-col gap-1">
              {NAV_TABS.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => switchTab(tab.key)}
                  className={cn(
                    "flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    activeTab === tab.key
                      ? "bg-accent/15 text-accent-ink"
                      : "text-ink-muted hover:bg-surface-2 hover:text-ink",
                  )}
                >
                  {tab.icon}
                  {t(tab.label)}
                </button>
              ))}
            </nav>
          </div>
        )}
      </header>

      {/* ================= CONTENU PRINCIPAL ================= */}
      <main className="mx-auto w-full max-w-7xl flex-1 px-6 py-8">
        {/* TAB 1: PROJECTS */}
        {activeTab === "projects" && !isConfiguringWorkflow && (
          <div className="space-y-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-semibold text-ink">
                  {t("Projects")}
                </h2>
                <p className="mt-1 text-sm text-ink-muted">
                  {t("Project overview")}
                </p>
              </div>

              <Button onClick={() => setIsModalOpen(true)}>
                <Plus className="h-4 w-4" /> {t("New project")}
              </Button>
            </div>

            {loadingProjects ? (
              <LoadingState label={`${t("Loading projects")}...`} />
            ) : projects.length === 0 ? (
              <EmptyState
                title={t("No projects found")}
                description={t("Click New project to connect a GitHub repository.")}
              />
            ) : (
              <>
                <div className="relative max-w-md">
                  <Search
                    className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-subtle"
                    aria-hidden="true"
                  />
                  <Input
                    type="search"
                    value={projectQuery}
                    onChange={(event) => setProjectQuery(event.currentTarget.value)}
                    placeholder={t("Search projects")}
                    aria-label={t("Search projects")}
                    className="pl-9"
                  />
                </div>
                {visibleProjects.length === 0 ? (
                  <EmptyState
                    title={t("No projects found")}
                    description={t("Try another name or repository.")}
                  />
                ) : (
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    {visibleProjects.map((p) => (
                      <Card key={p.id} className="flex flex-col gap-4 p-5">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Badge className="font-mono">ID: {p.id.slice(-6)}</Badge>
                            {p.has_workflow ? (
                              <Badge tone="purple" dot>
                                {t("Pipeline active")}
                              </Badge>
                            ) : (
                              <Badge>{t("No workflow")}</Badge>
                            )}
                          </div>

                          <h3 className="text-base font-semibold text-ink">
                            {p.name}
                          </h3>

                          <p className="text-sm text-ink-muted">
                            {p.description || t("No description provided.")}
                          </p>

                          <div className="flex items-center gap-1.5 pt-1 font-mono text-xs text-ink-muted">
                            <GitBranch className="h-3.5 w-3.5 text-ink-subtle" />
                            <span>{t("Repository:")}</span>
                            <span className="text-accent-ink">{p.repository}</span>
                          </div>
                        </div>

                        <div className="flex shrink-0 items-center gap-2">
                          {p.has_workflow ? (
                            <>
                              <Button
                                variant="secondary"
                                size="sm"
                                onClick={() =>
                                  triggerWorkflowExecution(p.id, p.name)
                                }
                                disabled={executingProjectId !== null}
                              >
                                {executingProjectId === p.id ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                  <Play className="h-3.5 w-3.5" />
                                )}
                                {t("Run")}
                              </Button>

                              <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => initWorkflowConfig(p)}
                                disabled={executingProjectId !== null}
                              >
                                <Sliders className="h-3.5 w-3.5" /> {t("Edit workflow")}
                              </Button>
                            </>
                          ) : (
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => initWorkflowConfig(p)}
                              disabled={executingProjectId !== null}
                            >
                              <Sliders className="h-3.5 w-3.5" /> {t("Create workflow")}
                            </Button>
                          )}

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setProjectToDelete(p)}
                            disabled={executingProjectId !== null}
                            className="ml-auto hover:text-danger"
                            title={t("Delete project")}
                            aria-label={`${t("Delete")} ${p.name}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* WORKFLOW CONFIGURATION VIEW */}
        {activeTab === "projects" && isConfiguringWorkflow && targetProject && (
          <div className="space-y-4">
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
              <Breadcrumbs
                items={[
                  {
                    label: t("Projects"),
                    onClick: () => setIsConfiguringWorkflow(false),
                  },
                  { label: targetProject.name },
                  { label: viewState === "preview" ? t("YAML preview") : t("Configuration") },
                ]}
              />

              <Button variant="ghost" size="sm" onClick={() => setIsConfiguringWorkflow(false)}>
                <ArrowLeft className="h-4 w-4" /> {t("Back to dashboard")}
              </Button>
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
                />
              </>
            )}

            {viewState === "loading" && (
              <LoadingState label={t("Compiling workflow configuration to YAML...")} />
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

        {/* TAB 3: HELP CENTER */}
        {activeTab === "help" && (
          <Card as="section" className="space-y-4 p-6">
            <div className="flex items-center gap-2 text-ink">
              <BookOpen className="h-5 w-5 text-accent-ink" />
              <h3 className="text-xl font-semibold">{t("Documentation and best practices")}</h3>
            </div>
            <div className="max-w-3xl space-y-3 text-sm text-ink-muted">
              <p>
                {t("FlowOps helps you model CI/CD workflows in low-code, publish them to a GitHub repository, and inspect runner executions.")}
              </p>
              <div className="flex items-start gap-2 rounded-lg border border-warning/30 bg-warning/10 p-4 text-xs text-warning">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                <span>
                  <span className="font-semibold">{t("Prerequisite:")}</span>{" "}
                {t("A local or remote MongoDB instance on port")}
                <code className="rounded-md bg-warning/10 px-1 py-0.5 font-mono font-semibold">
                  27017
                </code>{" "}
                {t("and the backend service must be available before triggering runs.")}
                </span>
              </div>
              <Link
                to="/docs"
                className="inline-flex items-center gap-2 font-medium text-accent-ink hover:text-ink"
              >
                {t("View documentation")} <ArrowLeft className="h-3.5 w-3.5 rotate-180" />
              </Link>
            </div>
          </Card>
        )}
      </main>

      {/* ================= MODAL DE CRÉATION DE PROJET ================= */}
      <Modal
        open={isModalOpen}
        onClose={closeModal}
        title={t("New project")}
        description={t("Connect a GitHub repository to configure an automated workflow.")}
        icon={
          <div className="rounded-md bg-accent/15 p-2 text-accent-ink">
            <FolderGit2 className="h-5 w-5" />
          </div>
        }
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={closeModal}>
              {t("Cancel")}
            </Button>
            <Button
              size="sm"
              form="create-project-form"
              type="submit"
              loading={isCreating}
            >
              {isCreating ? t("Creating...") : (
                <>
                  <Plus className="h-3.5 w-3.5" /> {t("Initialize")}
                </>
              )}
            </Button>
          </>
        }
      >
        <form id="create-project-form" onSubmit={createProject} className="space-y-4">
          <Field label={`${t("Project name")} *`}>
            {(id) => (
              <Input
                id={id}
                type="text"
                value={newProjName}
                onChange={(e) => setNewProjName(e.target.value)}
                placeholder="e.g. Production API"
                required
              />
            )}
          </Field>

          <Field label={`${t("GitHub repository")} *`}>
            {(id) => (
              <Select
                id={id}
                value={selectedRepo}
                onChange={(e) => setSelectedRepo(e.target.value)}
                className="font-mono"
              >
                <option value="">
                  {gitRepos.length === 0
                    ? `-- ${t("No repositories available")} --`
                    : `-- ${t("Select a GitHub repository")} --`}
                </option>
                {gitRepos.map((repo) => (
                  <option key={repo.id} value={repo.full_name}>
                    {repo.full_name}
                  </option>
                ))}
              </Select>
            )}
          </Field>

          <Field label={t("Description")}>
            {(id) => (
              <Textarea
                id={id}
                rows={3}
                value={newProjDesc}
                onChange={(e) => setNewProjDesc(e.target.value)}
                className="resize-none"
                placeholder={t("Optional project details...")}
              />
            )}
          </Field>
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
        title={t("Delete this project?")}
        confirmLabel={t("Delete")}
        description={
          <>
            Le projet{" "}
            <span className="font-semibold text-ink">
              « {projectToDelete?.name} »
            </span>{" "}
            {t("and all its workflows will be permanently removed. This action cannot be undone.")}
          </>
        }
      />

      {/* ================= DIALOGUE DE DÉCONNEXION ================= */}
      <ConfirmDialog
        open={logoutConfirmOpen}
        onClose={() => setLogoutConfirmOpen(false)}
        onConfirm={handleLogout}
        title={t("Sign out?")}
        confirmLabel={t("Sign out")}
        description={t("You will need to authenticate with GitHub again to access your workspace.")}
      />
    </div>
  );
};