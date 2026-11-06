import React from "react";
import { GitBranch, Loader2, Play, Sliders, Trash2 } from "lucide-react";
import type { Project } from "../../@types/api";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import { usePreferences } from "../../lib/usePreferences";

export interface ProjectCardProps {
  project: Project;
  /** Id du projet en cours d'exécution (désactive les actions de toutes les cartes). */
  executingId: string | null;
  onRun: (project: Project) => void;
  onEdit: (project: Project) => void;
  onDelete: (project: Project) => void;
}

export const ProjectCard: React.FC<ProjectCardProps> = ({
  project,
  executingId,
  onRun,
  onEdit,
  onDelete,
}) => {
  const { t } = usePreferences();
  const busy = executingId !== null;

  return (
    <Card interactive className="flex flex-col gap-4 p-5">
      <div className="space-y-2">
        <div className="flex items-start justify-between gap-3">
          <h3 className="min-w-0 truncate text-base font-semibold text-ink">{project.name}</h3>
          {project.has_workflow ? (
            <Badge tone="purple" dot className="shrink-0">
              {t("Pipeline active")}
            </Badge>
          ) : (
            <Badge className="shrink-0">{t("No workflow")}</Badge>
          )}
        </div>

        <p className="line-clamp-2 text-sm text-ink-muted">
          {project.description || t("No description provided.")}
        </p>

        <div className="flex items-center gap-1.5 pt-1 font-mono text-xs text-ink-muted">
          <GitBranch className="h-3.5 w-3.5 shrink-0 text-ink-subtle" aria-hidden="true" />
          <span className="truncate">{project.repository}</span>
        </div>
      </div>

      <div className="mt-auto flex shrink-0 flex-wrap items-center gap-2 border-t border-line pt-4">
        {project.has_workflow && (
          <Button size="sm" onClick={() => onRun(project)} disabled={busy}>
            {executingId === project.id ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Play className="h-3.5 w-3.5" />
            )}
            {t("Run")}
          </Button>
        )}
        <Button
          variant="secondary"
          size="sm"
          onClick={() => onEdit(project)}
          disabled={busy}
        >
          <Sliders className="h-3.5 w-3.5" />{" "}
          {project.has_workflow ? t("Edit workflow") : t("Create workflow")}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onDelete(project)}
          disabled={busy}
          className="ml-auto hover:text-danger"
          title={t("Delete project")}
          aria-label={`${t("Delete")} ${project.name}`}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </Card>
  );
};
