import React, { useMemo, useState } from "react";
import { Plus, Search } from "lucide-react";
import type { Project } from "../../@types/api";
import { Button } from "../ui/Button";
import { Input } from "../ui/Field";
import { PageHeader } from "../ui/PageHeader";
import { EmptyState, LoadingState } from "../ui/States";
import { usePreferences } from "../../lib/usePreferences";
import { ProjectCard } from "./ProjectCard";

export interface ProjectsViewProps {
  projects: Project[];
  loading: boolean;
  executingId: string | null;
  onCreate: () => void;
  onRun: (project: Project) => void;
  onEdit: (project: Project) => void;
  onDelete: (project: Project) => void;
}

/** Onglet « Projects » : indicateurs, recherche et grille de projets. */
export const ProjectsView: React.FC<ProjectsViewProps> = ({
  projects,
  loading,
  executingId,
  onCreate,
  onRun,
  onEdit,
  onDelete,
}) => {
  const { t } = usePreferences();
  const [query, setQuery] = useState("");

  const visible = useMemo(() => {
    const q = query.trim().toLocaleLowerCase();
    if (!q) return projects;
    return projects.filter(
      (p) =>
        p.name.toLocaleLowerCase().includes(q) ||
        p.repository.toLocaleLowerCase().includes(q) ||
        p.description.toLocaleLowerCase().includes(q),
    );
  }, [projects, query]);

  const newProjectButton = (
    <Button onClick={onCreate} className="shrink-0">
      <Plus className="h-4 w-4" /> {t("New project")}
    </Button>
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("Projects")}
        description={t("Project overview")}
        actions={projects.length > 0 ? newProjectButton : undefined}
      />

      {loading ? (
        <LoadingState label={`${t("Loading projects")}...`} />
      ) : projects.length === 0 ? (
        <EmptyState
          title={t("No projects found")}
          description={t("Connect a GitHub repository to get started.")}
          action={newProjectButton}
        />
      ) : (
        <>
          <div className="relative w-full sm:max-w-md">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-subtle"
              aria-hidden="true"
            />
            <Input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.currentTarget.value)}
              placeholder={t("Search projects")}
              aria-label={t("Search projects")}
              className="pl-9"
            />
          </div>

          {visible.length === 0 ? (
            <EmptyState
              title={t("No projects found")}
              description={t("Try another name or repository.")}
            />
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {visible.map((project, index) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  index={index}
                  executingId={executingId}
                  onRun={onRun}
                  onEdit={onEdit}
                  onDelete={onDelete}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};
