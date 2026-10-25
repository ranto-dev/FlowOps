"""API FlowOps — point d'entrée d'exécution (``uvicorn main:app``).

L'objet ``app`` provient de ``app.main.create_app()`` : CORS, cycle de vie
(index Mongo, fermeture du client HTTP GitHub), conversion des erreurs
métier et routeur MLOps y sont montés.

Les briques transverses sont déportées dans ``app/`` :
    * ``app.settings``        — configuration (.env) ;
    * ``app.dependencies``    — jeton, identité, propriété de projet ;
    * ``app.github_client``   — appelant HTTP GitHub poolé ;
    * ``app.github_auth``     — Device Flow + cache d'identité ;
    * ``app.storage``         — YAML compilé / config.json locaux.

Les routes métier ci-dessous migreront vers ``app/routers/`` (voir AGENTS.md).
"""
import datetime

import yaml
from bson import ObjectId
from compiler import compile_flowops_workflow
from fastapi import HTTPException
from helper import format_project
from pydantic import BaseModel
from schemas import FlowOpsWorkflowSchema

from app import storage
from app.database import projects_collection
from app.dependencies import CurrentUserDep, OwnedProjectDep
from app.github_auth import exchange_device_code, request_device_code
from app.github_client import (
    create_dispatch,
    get_job_logs as fetch_job_logs,
    list_repositories,
    list_run_jobs,
    list_workflow_runs,
    normalize_repo_slug,
    push_workflow_file,
)
# Importe app.settings (charge backend/.env) puis réexporte l'objet app.
from app.main import app  # noqa: F401
from app.settings import (
    GITHUB_CONFIG_MISSING_MSG,
    GITHUB_CONFIG_READY,
    GITHUB_MISSING_VARS,
)

# Base de données en mémoire pour FlowOps (inscription/connexion).
# À basculer dans MongoDB — voir AGENTS.md (Phase « persistance users »).
USERS_DB = {}


# Declaration de BaseModel
class LoginCheckRequest(BaseModel):
    device_code: str


class ProjectCreateRequest(BaseModel):
    name: str
    description: str
    repository: str


"""
AUTHENTIFICATION
"""


# Vérifie si l'application FlowOps est correctement configurée côté GitHub
@app.get("/api/auth/status")
async def auth_status():
    return {
        "configured": GITHUB_CONFIG_READY,
        "missing_env_vars": [] if GITHUB_CONFIG_READY else GITHUB_MISSING_VARS,
        "message": None if GITHUB_CONFIG_READY else GITHUB_CONFIG_MISSING_MSG,
    }


# Demander un code d'activation d'appareil à l'API GitHub (Device Flow)
@app.post("/api/auth/device-code")
async def get_device_code():
    if not GITHUB_CONFIG_READY:
        raise HTTPException(status_code=500, detail=GITHUB_CONFIG_MISSING_MSG)
    return await request_device_code()


# Polling adaptatif pour vérifier si l'utilisateur a validé l'autorisation sur GitHub.
# Dès que GitHub répond avec un access_token, l'utilisateur est connecté.
@app.post("/api/auth/check-login")
async def check_login(req: LoginCheckRequest):
    if not GITHUB_CONFIG_READY:
        raise HTTPException(status_code=500, detail=GITHUB_CONFIG_MISSING_MSG)

    result = await exchange_device_code(req.device_code)
    if result["status"] == "pending":
        return {"status": "pending", "error": result["error"]}

    github_id = result["github_id"]
    username = result["username"]
    avatar_url = result["avatar_url"]

    # Gestion Inscription / Connexion en BDD mémoire
    is_new_user = False
    if github_id not in USERS_DB:
        USERS_DB[github_id] = {"username": username, "avatar_url": avatar_url}
        is_new_user = True

    return {
        "status": "success",
        "token": result["access_token"],
        "github_id": github_id,
        "username": username,
        "avatar_url": avatar_url,
        "is_new_user": is_new_user,
    }


# recuperer les repo de l'utilisateur courrant
@app.get("/api/github/repositories")
async def get_github_repositories(user: CurrentUserDep):
    repos = await list_repositories(user.token)
    return [{"id": r["id"], "full_name": r["full_name"]} for r in repos]


"""
GESTION DES PROJETS
"""


# creation d'un projet (rattaché à l'utilisateur GitHub connecté)
@app.post("/api/projects")
async def create_project(req: ProjectCreateRequest, user: CurrentUserDep):
    new_project = {
        "name": req.name.strip(),
        "description": req.description.strip(),
        "repository": req.repository.strip(),
        "github_id": user.github_id,
        "created_by": user.username,
        "has_workflow": False,
        # Datetimes explicites en UTC (datetime.utcnow() est déprécié depuis 3.12)
        "created_at": datetime.datetime.now(datetime.timezone.utc),
        "updated_at": datetime.datetime.now(datetime.timezone.utc),
    }

    # Insertion dans MongoDB
    result = await projects_collection.insert_one(new_project)
    inserted_project = await projects_collection.find_one({"_id": result.inserted_id})
    return format_project(inserted_project)


# Liste les projets du seul utilisateur connecté, triés par ordre descendant
@app.get("/api/projects")
async def list_projects(user: CurrentUserDep):
    projects_list = []

    cursor = (
        projects_collection.find({"github_id": user.github_id})
        .sort("updated_at", -1)
    )

    async for document in cursor:
        projects_list.append(format_project(document))

    return projects_list


# supprimer un projet par son ID (uniquement si l'utilisateur en est le propriétaire)
@app.delete("/api/projects/{project_id}")
async def delete_project(owned: OwnedProjectDep):
    result = await projects_collection.delete_one({"_id": ObjectId(owned.project_id)})

    # Si le projet n'existait plus (course avec une autre suppression)
    if result.deleted_count == 0:
        raise HTTPException(
            status_code=404, detail="Projet introuvable, impossible de le supprimer."
        )

    return {
        "status": "success",
        "message": f"Project {owned.project_id} successfully deleted from database.",
    }


"""
WORKFLOW
"""


# generation du workflow
@app.post("/api/generate-workflow")
async def generate_workflow(config: FlowOpsWorkflowSchema):
    try:
        wf_dict = compile_flowops_workflow(config)
        yaml_content = yaml.dump(
            wf_dict, sort_keys=False, default_flow_style=False, allow_unicode=True
        )
        return {"filename": config.filename, "yaml": yaml_content}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# sauvegarder un workflow (uniquement pour un projet appartenant à l'utilisateur)
@app.post("/api/projects/{project_id}/workflow")
async def save_project_workflow(
    config: FlowOpsWorkflowSchema,
    owned: OwnedProjectDep,
):
    try:
        # 1. Compilation du schéma FlowOps vers le dictionnaire au format GitHub Actions
        wf_dict = compile_flowops_workflow(config)
        yaml_content = yaml.dump(
            wf_dict, sort_keys=False, default_flow_style=False, allow_unicode=True
        )

        # 2. Écriture locale (YAML compilé + config.json brute) dans le dossier du projet
        base_name = storage.save_workflow(
            owned.project_id,
            config.filename,
            yaml_content,
            config.model_dump(),
        )

        # 3. Mise à jour du flag du projet directement dans MongoDB
        await projects_collection.update_one(
            {"_id": ObjectId(owned.project_id)},
            {"$set": {"has_workflow": True, "yaml_filename": base_name}},
        )

        return {
            "status": "success",
            "message": "Workflow saved locally in project directory",
            "yaml_filename": base_name,
        }

    except Exception as e:
        import traceback

        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Internal Server Error: {str(e)}")


"""
Execute workflow
"""


@app.post("/api/projects/{project_id}/execute")
async def execute_project_workflow(owned: OwnedProjectDep):
    """
    Déclencheur d'exécution séquentiel :
    1. Récupère le projet depuis MongoDB pour extraire le dépôt lié.
    2. Lit la configuration locale (config.json) et le fichier YAML compilé.
    3. Commit & Push le fichier YAML sur GitHub (.github/workflows/).
    4. Envoie le signal Repository Dispatch pour lancer l'action GitHub.

    Les erreurs GitHub/stockage sont levées en ServiceError et converties en
    réponses JSON par le handler de ``app.main.create_app()``.
    """
    project = owned.project
    user = owned.user

    # ─── 1. RÉCUPÉRATION DU DÉPÔT CIBLE ───
    repo = project.get("repository")
    if not repo:
        raise HTTPException(
            status_code=400,
            detail="No GitHub repository linked to this project in database",
        )

    # Sécurité : si l'utilisateur a entré une URL complète, on extrait le slug
    repo = normalize_repo_slug(repo)

    # ─── 2. RÉCUPÉRATION DE LA CONFIGURATION ET DU YAML LOCAL ───
    config_data = storage.load_config(owned.project_id)
    yaml_path = storage.resolve_yaml_file(owned.project_id, config_data.get("filename"))
    yaml_filename = yaml_path.name
    yaml_content = yaml_path.read_text(encoding="utf-8")

    # ─── ÉTAPE 3 : PUSH DU FICHIER SUR GITHUB (.github/workflows/) ───
    await push_workflow_file(user.token, repo, yaml_filename, yaml_content)

    # ─── ÉTAPE 4 : ENVOI DU REPOSITORY DISPATCH TRIGGER ───
    await create_dispatch(user.token, repo, project.get("name", "FlowOps Project"))

    return {
        "status": "success",
        "message": f"Configuration file '{yaml_filename}' was successfully committed to branch 'main' "
        f"and execution event ('flowops_trigger') dispatched to {repo}!",
    }


# systeme de logs


# Récupère l'historique des exécutions (workflow runs) GitHub Actions pour un projet.
@app.get("/api/projects/{project_id}/runs")
async def get_project_workflow_runs(owned: OwnedProjectDep):
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


# Récupère les détails des jobs et des étapes (steps) pour une exécution donnée.
@app.get("/api/projects/{project_id}/runs/{run_id}/jobs")
async def get_run_jobs(owned: OwnedProjectDep, run_id: str):
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


# Télécharge et renvoie le texte brut des logs pour un job donné.
@app.get("/api/projects/{project_id}/runs/{run_id}/jobs/{job_id}/logs")
async def get_job_logs(owned: OwnedProjectDep, run_id: str, job_id: str):
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
