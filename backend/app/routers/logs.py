"""Routes de suivi des exécutions GitHub Actions (runs, jobs, logs).

Routes :
    * ``GET /api/projects/{id}/runs``                     — historique des exécutions ;
    * ``GET /api/projects/{id}/runs/{run}/jobs``          — jobs + étapes d'un run ;
    * ``GET /api/projects/{id}/runs/{run}/jobs/{job}/logs`` — texte brut des logs.
"""
from __future__ import annotations

from fastapi import APIRouter, HTTPException

from app.dependencies import OwnedProjectDep
from app.github_client import (
    get_job_logs as fetch_job_logs,
)
from app.github_client import (
    list_run_jobs,
    list_workflow_runs,
    normalize_repo_slug,
)

router = APIRouter()


@router.get("/api/projects/{project_id}/runs")
async def get_project_workflow_runs(owned: OwnedProjectDep):
    """Récupère l'historique des exécutions (workflow runs) GitHub Actions."""
    project = owned.project

    if not project.get("repository"):
        raise HTTPException(
            status_code=404, detail="Projet ou dépôt associé introuvable"
        )

    repo = normalize_repo_slug(project["repository"])
    runs_data = await list_workflow_runs(owned.user.token, repo)

    # Formater les données
    runs = []
    for r in runs_data:
        runs.append(
            {
                "id": str(r["id"]),
                "name": r.get("name") or r.get("display_title", "Workflow Run"),
                "status": r.get("status"),  # queued, in_progress, completed
                "conclusion": r.get("conclusion"),  # success, failure, cancelled, None
                "event": r.get("event"),
                "branch": r.get("head_branch"),
                "commit_sha": r.get("head_sha", "")[:7],
                "created_at": r.get("created_at"),
                "updated_at": r.get("updated_at"),
                "html_url": r.get("html_url"),
            }
        )

    return {"project_id": owned.project_id, "repository": repo, "runs": runs}


@router.get("/api/projects/{project_id}/runs/{run_id}/jobs")
async def get_run_jobs(owned: OwnedProjectDep, run_id: str):
    """Récupère les détails des jobs et des étapes (steps) d'une exécution."""
    project = owned.project

    if not project.get("repository"):
        raise HTTPException(status_code=404, detail="Projet introuvable")

    repo = normalize_repo_slug(project["repository"])
    jobs_data = await list_run_jobs(owned.user.token, repo, run_id)

    jobs = []
    for j in jobs_data:
        steps = [
            {
                "name": s.get("name"),
                "status": s.get("status"),
                "conclusion": s.get("conclusion"),
                "number": s.get("number"),
                "started_at": s.get("started_at"),
                "completed_at": s.get("completed_at"),
            }
            for s in j.get("steps", [])
        ]

        jobs.append(
            {
                "id": str(j["id"]),
                "name": j.get("name"),
                "status": j.get("status"),
                "conclusion": j.get("conclusion"),
                "started_at": j.get("started_at"),
                "completed_at": j.get("completed_at"),
                "steps": steps,
            }
        )

    return {"run_id": run_id, "jobs": jobs}


@router.get("/api/projects/{project_id}/runs/{run_id}/jobs/{job_id}/logs")
async def get_job_logs(owned: OwnedProjectDep, run_id: str, job_id: str):
    """Télécharge et renvoie le texte brut des logs d'un job."""
    project = owned.project

    if not project.get("repository"):
        raise HTTPException(status_code=404, detail="Projet introuvable")

    repo = normalize_repo_slug(project["repository"])
    status, raw_logs = await fetch_job_logs(owned.user.token, repo, job_id)

    if status == 404:
        return {
            "logs": "Les logs ne sont pas encore disponibles sur GitHub (exécution en cours de démarrage...)"
        }

    if status != 200:
        return {"logs": f"Impossible de charger les logs (Statut HTTP {status})"}

    # Nettoyage basique des horodatages ANSI de GitHub
    return {"logs": raw_logs}
