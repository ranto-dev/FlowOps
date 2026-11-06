import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  FolderGit2,
  History as HistoryIcon,
  HelpCircle,
  ArrowLeft,
  ChevronRight,
} from "lucide-react";
import { WorkflowForm } from "../components/WorkflowForm";
import { YamlPreview } from "../components/YamlPreview";
import { History } from "../components/History";
import { AppShell, type ShellNavSection } from "../components/layout/AppShell";
import { PredictionPanel } from "../components/PredictionPanel";
import LogoImage from "../assets/logo-flowOps-transparent.png";
import { useToast } from "../components/ui/useToast";
import { ConfirmDialog } from "../components/ui/ConfirmDialog";
import { ProfileMenu } from "../components/workspace/ProfileMenu";
import { ProjectsView } from "../components/workspace/ProjectsView";
import { HelpView } from "../components/workspace/HelpView";
import {
  CreateProjectModal,
  type NewProjectValues,
} from "../components/workspace/CreateProjectModal";
import { PageHeader } from "../components/ui/PageHeader";
import { Button } from "../components/ui/Button";
import { cn } from "../lib/utils";
import { usePreferences } from "../lib/usePreferences";
import type { FlowOpsWorkflowConfig } from "../@types/workflow";
import { getSessionProfile } from "../lib/session";
import { apiFetch, clearSession, errorDetail, getToken, isApiError } from "../lib/api";
import type {
  ExecuteResponse,
  GenerateWorkflowResponse,
  GitHubRepo,
  PredictionSnapshot,
  Project,
  SaveWorkflowResponse,
} from "../@types/api";

type StoredConfig = FlowOpsWorkflowConfig;

export const Workspace: React.FC = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const { t } = usePreferences();
  const [activeTab, setActiveTab] = useState<"projects" | "history" | "help">(
    "projects",
  );

  const profile = getSessionProfile();
  const username = profile.username || "Developer";
  const avatarUrl = profile.avatarUrl;
  const token = getToken();

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
  const [prediction, setPrediction] = useState<PredictionSnapshot>({
    status: "pending",
    prediction: null,
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [viewState, setViewState] = useState<"form" | "preview">("form");

  const fetchProjects = useCallback(async () => {
    try {
      const data = await apiFetch<Project[]>("/api/projects");
      setProjects(data);
    } catch (err) {
      // Un 401 a déjà déclenché la déconnexion centralisée dans apiFetch.
      if (isApiError(err) && err.status === 401) return;
      toast.error(
        t("Couldn't load your projects"),
        errorDetail(err, t("The server may be down.")),
      );
    } finally {
      setLoadingProjects(false);
    }
  }, [toast, t]);

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

  const handleLogout = () => {
    clearSession();
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
          steps: [{ id: "s-1", name: "Checkout Source", type: "checkout" }],
        },
      ],
    });
    setCompiledYaml(null);
    setPrediction({ status: "pending", prediction: null });
    setIsConfiguringWorkflow(true);
    setViewState("form");
  };

  const createProject = async (values: NewProjectValues): Promise<boolean> => {
    setIsCreating(true);
    try {
      const createdProject = await apiFetch<Project>("/api/projects", {
        method: "POST",
        body: values,
      });

      setIsModalOpen(false);
      await fetchProjects();
      toast.success(
        t("Project created"),
        t("{name} is ready. Set up its workflow.", { name: createdProject.name }),
      );
      initWorkflowConfig(createdProject);
      return true;
    } catch (err) {
      toast.error(
        isApiError(err) ? t("Couldn't create the project") : t("Connection problem"),
        errorDetail(err, t("Can't reach the server.")),
      );
      return false;
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
        t("Project deleted"),
        t("{name} was removed.", { name: projectToDelete.name }),
      );
      setProjectToDelete(null);
      fetchProjects();
    } catch (err) {
      toast.error(
        isApiError(err) ? t("Couldn't delete the project") : t("Connection problem"),
        errorDetail(err, t("Can't reach the server to delete this project.")),
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
        t("Session expired"),
        t("Your GitHub token expired. Sign in again."),
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
          t("Workflow triggered"),
          `${projectName} — ${data.message}`,
        );
        setActiveTab("history");
      } else {
        toast.error(
          t("Couldn't trigger the workflow"),
          data.message || t("Unknown error."),
        );
      }
    } catch (err) {
      toast.error(
        t("Workflow not triggered"),
        errorDetail(err, t("Can't reach the runner.")),
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
        t("Workflow saved"),
        t("The workflow for {name} is saved.", { name: targetProject.name }),
      );
      setIsConfiguringWorkflow(false);
      fetchProjects();
    } catch (err) {
      toast.error(
        isApiError(err) ? t("Couldn't save the workflow") : t("Connection problem"),
        errorDetail(err, t("Couldn't save the workflow.")),
      );
    }
  };

  const generateWorkflow = async () => {
    if (!activeConfig || isGenerating) return;
    setIsGenerating(true);
    try {
      const data = await apiFetch<GenerateWorkflowResponse>(
        "/api/generate-workflow",
        { method: "POST", body: activeConfig, auth: false },
      );
      if (!data.yaml) {
        throw new Error(t("Invalid compiler response."));
      }
      setCompiledYaml(data.yaml);
      setViewState("preview");
    } catch (err) {
      toast.error(
        t("Couldn't generate the YAML"),
        errorDetail(err, t("The server couldn't compile this workflow.")),
      );
      setViewState("form");
    } finally {
      setIsGenerating(false);
    }
  };

  const switchTab = (tab: "projects" | "history" | "help") => {
    setActiveTab(tab);
    setIsConfiguringWorkflow(false);
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

  const renderBrand = () => (
    <button
      type="button"
      onClick={() => switchTab("projects")}
      className="flex w-full min-w-0 items-center gap-2.5 rounded-md p-1.5 text-left transition-colors hover:bg-surface-2/70 focus-visible:outline-2 focus-visible:outline-accent-ink"
      aria-label={t("FlowOps projects")}
    >
      <img src={LogoImage} className="h-7 w-7 object-contain" alt="" />
      <span className="text-base font-semibold text-ink">FlowOps</span>
    </button>
  );

  const renderBreadcrumbs = () => {
    const activeLabel =
      activeTab === "projects"
        ? t("Projects")
        : activeTab === "history"
          ? t("History")
          : t("Help");
    const segments = [
      {
        label: t("Workspace"),
        onClick: () => switchTab("projects"),
      },
      {
        label: activeLabel,
        onClick: isConfiguringWorkflow
          ? () => setIsConfiguringWorkflow(false)
          : undefined,
      },
      ...(isConfiguringWorkflow && targetProject
        ? [
            { label: targetProject.name },
            {
              label:
                viewState === "preview"
                  ? t("YAML preview")
                  : t("Configuration"),
            },
          ]
        : []),
    ];

    return (
      <nav aria-label={t("Breadcrumb")} className="min-w-0">
        <ol className="flex min-w-0 items-center gap-1.5 text-sm">
          {segments.map((segment, index) => {
            const current = index === segments.length - 1;
            return (
              <li
                key={`${segment.label}-${index}`}
                className="flex min-w-0 items-center gap-2"
              >
                {index > 0 && (
                  <ChevronRight
                    className="h-3.5 w-3.5 shrink-0 text-ink-subtle"
                    aria-hidden="true"
                  />
                )}
                {segment.onClick && !current ? (
                  <button
                    type="button"
                    onClick={segment.onClick}
                    className="truncate rounded-sm text-ink-muted transition-colors hover:text-ink focus-visible:outline-2 focus-visible:outline-accent-ink"
                  >
                    {segment.label}
                  </button>
                ) : (
                  <span
                    className={cn(
                      "truncate",
                      current
                        ? "font-medium text-ink"
                        : "text-ink-muted",
                    )}
                    aria-current={current ? "page" : undefined}
                  >
                    {segment.label}
                  </span>
                )}
              </li>
            );
          })}
        </ol>
      </nav>
    );
  };

  const navSections: ShellNavSection[] = [
    {
      id: "workspace",
      items: NAV_TABS.map((tab) => ({
        id: tab.key,
        label: t(tab.label),
        icon: tab.icon,
        active: activeTab === tab.key,
        onSelect: () => switchTab(tab.key),
      })),
    },
  ];

  return (
    <>
    <AppShell
      brand={renderBrand()}
      sections={navSections}
      breadcrumb={renderBreadcrumbs()}
      actions={
        <ProfileMenu
          username={username}
          avatarUrl={avatarUrl}
          onSignOut={() => setLogoutConfirmOpen(true)}
        />
      }
      labels={{
        navigation: t("Workspace navigation"),
        openMenu: t("Open navigation"),
        closeMenu: t("Close navigation"),
      }}
    >
        {/* TAB 1: PROJECTS */}
        {activeTab === "projects" && !isConfiguringWorkflow && (
          <ProjectsView
            projects={projects}
            loading={loadingProjects}
            executingId={executingProjectId}
            onCreate={() => setIsModalOpen(true)}
            onRun={(p) => triggerWorkflowExecution(p.id, p.name)}
            onEdit={initWorkflowConfig}
            onDelete={setProjectToDelete}
          />
        )}

        {/* WORKFLOW CONFIGURATION VIEW */}
        {activeTab === "projects" && isConfiguringWorkflow && targetProject && (
          <div className="space-y-4">
            <PageHeader
              title={viewState === "preview" ? t("YAML preview") : t("Configuration")}
              description={`${targetProject.name} · ${targetProject.repository}`}
              actions={
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsConfiguringWorkflow(false)}
                >
                  <ArrowLeft className="h-4 w-4" /> {t("Back to dashboard")}
                </Button>
              }
            />

            {activeConfig && (
              <div
                className={
                  viewState === "form"
                    ? "grid items-start gap-4 lg:grid-cols-[minmax(0,1.7fr)_minmax(18rem,1fr)]"
                    : "hidden"
                }
                aria-hidden={viewState !== "form"}
              >
                <WorkflowForm
                  activeConfig={activeConfig}
                  onChangeConfig={setActiveConfig}
                  onGenerate={generateWorkflow}
                  loading={isGenerating}
                />

                <div className="lg:sticky lg:top-[4.5rem]">
                  <PredictionPanel
                    config={activeConfig}
                    repository={targetProject.repository}
                    onPredictionChange={setPrediction}
                  />
                </div>
              </div>
            )}

            {viewState === "preview" && activeConfig && (
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
                onSaveToServer={saveWorkflow}
                saveStatus={null}
                prediction={prediction}
              />
            )}
          </div>
        )}

        {/* TAB 2: HISTORY & LOGS */}
        {activeTab === "history" && (
          <div className="space-y-6">
            <PageHeader
              title={t("History")}
              description={t("Run history and available job logs")}
            />
            <History />
          </div>
        )}

        {/* TAB 3: HELP CENTER */}
        {activeTab === "help" && <HelpView />}
    </AppShell>

      <CreateProjectModal
        open={isModalOpen}
        repos={gitRepos}
        creating={isCreating}
        onClose={() => setIsModalOpen(false)}
        onSubmit={createProject}
      />

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
    </>
  );
};