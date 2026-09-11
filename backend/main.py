import asyncio
import base64
import datetime
import json
import os
from typing import Annotated

import httpx
import yaml
from bson import ObjectId
from compiler import compile_flowops_workflow
from config import setup_cors
from dotenv import load_dotenv
from fastapi import FastAPI, Header, HTTPException, Path, Request
from fastapi.responses import StreamingResponse
from helper import format_project
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel
from schemas import FlowOpsWorkflowSchema
from sse_starlette.sse import EventSourceResponse

load_dotenv()

app = FastAPI()

WORKFLOWS_DIR = os.path.join(
    os.path.dirname(os.path.abspath(__file__)), "generated_workflows"
)
os.makedirs(WORKFLOWS_DIR, exist_ok=True)

setup_cors(app)

# --- MODULE MLOPS (prédiction, tracking, monitoring) ---
from mlops.api import router as mlops_router

app.include_router(mlops_router)

# --- INITIALISATION DE MONGODB ---
MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017/")
# On se connecte à la base de données nommée "flowops_db"
client = AsyncIOMotorClient(MONGO_URI)
db = client["flowops_db"]
projects_collection = db["projects"]

# Base de données en mémoire pour FlowOps pour l'utilisateur
USERS_DB = {}

# --- CONFIGURATION GITHUB OAUTH (issue de l'environnement) ---
GITHUB_CLIENT_ID = os.getenv("GITHUB_CLIENT_ID", "").strip()
GITHUB_CLIENT_SECRET = os.getenv("GITHUB_CLIENT_SECRET", "").strip()

GITHUB_CONFIG_READY = bool(GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET)
GITHUB_CONFIG_MISSING_MSG = (
    "GitHub OAuth App is not configured. "
    "Set GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET in backend/.env "
    "(see backend/.env.example)."
)


# --- OUTILS AUTH: EXTRACTION DU TOKEN BEARER ---
def _extract_bearer_token(authorization: str | None) -> str | None:
    """Extrait le token GitHub OAuth depuis l'en-tête Authorization."""
    if not authorization or not authorization.startswith("Bearer "):
        return None
    return authorization.split(" ", 1)[1].strip()


# --- RÉSOLUTION DE L'UTILISATEUR GITHUB DEPUIS LE TOKEN ---
# Cache en mémoire (token -> (github_id, username, avatar_url, expires_at))
# pour éviter d'appeler l'API GitHub à chaque requête utilisateur.
_GITHUB_USER_CACHE: dict[str, tuple[str, str, str, float]] = {}
_GITHUB_USER_CACHE_TTL = 600  # secondes


async def _resolve_github_user(token: str) -> tuple[str, str, str]:
    """Retourne (github_id, username, avatar_url) pour le token donné.

    Résout l'identité directement auprès de GitHub (impossible à falsifier)
    et met en cache le résultat pendant quelques minutes.
    """
    from time import time

    cached = _GITHUB_USER_CACHE.get(token)
    if cached and cached[3] > time():
        github_id, username, avatar_url, _ = cached
        return github_id, username, avatar_url

    async with httpx.AsyncClient(timeout=20.0) as client:
        user_response = await client.get(
            "https://api.github.com/user",
            headers={"Authorization": f"token {token}", "Accept": "application/json"},
        )

    if user_response.status_code != 200:
        raise HTTPException(
            status_code=401,
            detail="GitHub Access Token expired or invalid. Please re-authenticate.",
        )

    user_data = user_response.json()
    github_id = str(user_data.get("id"))
    username = user_data.get("login", "")
    avatar_url = user_data.get("avatar_url", "")

    if not github_id or github_id == "None":
        raise HTTPException(
            status_code=401,
            detail="Unable to resolve GitHub user profile. Please re-authenticate.",
        )

    _GITHUB_USER_CACHE[token] = (
        github_id,
        username,
        avatar_url,
        time() + _GITHUB_USER_CACHE_TTL,
    )
    return github_id, username, avatar_url


def _ensure_owner(project: dict, github_id: str) -> None:
    """Lève une 404 si le projet n'appartient pas à l'utilisateur connecté."""
    if str(project.get("github_id", "")) != github_id:
        raise HTTPException(status_code=404, detail="Project not found in database")


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
        "missing_env_vars": (
            []
            if GITHUB_CONFIG_READY
            else [
                var
                for var in ("GITHUB_CLIENT_ID", "GITHUB_CLIENT_SECRET")
                if not os.getenv(var, "").strip()
            ]
        ),
        "message": None if GITHUB_CONFIG_READY else GITHUB_CONFIG_MISSING_MSG,
    }


# Demander un code d'activation d'appareil à l'API GitHub (Device Flow)
@app.post("/api/auth/device-code")
async def get_device_code():
    if not GITHUB_CONFIG_READY:
        raise HTTPException(status_code=500, detail=GITHUB_CONFIG_MISSING_MSG)

    async with httpx.AsyncClient(timeout=20.0) as client:
        response = await client.post(
            "https://github.com/login/device/code",
            headers={"Accept": "application/json"},
            data={"client_id": GITHUB_CLIENT_ID, "scope": "user repo workflow"},
        )
        if response.status_code != 200:
            raise HTTPException(
                status_code=500, detail="Cannot connect to GitHub Device Flow API"
            )
        return response.json()


# Polling adaptatif pour vérifier si l'utilisateur a validé l'autorisation sur GitHub.
# Dès que GitHub répond avec un access_token, l'utilisateur est connecté.
@app.post("/api/auth/check-login")
async def check_login(req: LoginCheckRequest):
    if not GITHUB_CONFIG_READY:
        raise HTTPException(status_code=500, detail=GITHUB_CONFIG_MISSING_MSG)

    async with httpx.AsyncClient(timeout=20.0) as client:
        response = await client.post(
            "https://github.com/login/oauth/access_token",
            headers={"Accept": "application/json"},
            data={
                "client_id": GITHUB_CLIENT_ID,
                "client_secret": GITHUB_CLIENT_SECRET,
                "device_code": req.device_code,
                "grant_type": "urn:ietf:params:oauth:grant-type:device_code",
            },
        )

        data = response.json()
        print(
            "--- GITHUB ANSWER ---", data
        )  # Log de surveillance dans ton terminal backend

        # Cas d'attente utilisateur standard
        if "error" in data:
            return {"status": "pending", "error": data["error"]}

        if "access_token" not in data:
            return {"status": "pending", "error": "waiting_user_validation"}

        access_token = data["access_token"]

        # Récupération du profil utilisateur GitHub via l'API sécurisée
        user_response = await client.get(
            "https://api.github.com/user",
            headers={
                "Authorization": f"token {access_token}",
                "Accept": "application/json",
            },
        )
        user_data = user_response.json()
        github_id = str(user_data.get("id"))
        username = user_data.get("login")
        avatar_url = user_data.get("avatar_url")

        if not github_id or github_id == "None":
            return {"status": "pending", "error": "failed_to_fetch_user_profile"}

        # Gestion Inscription / Connexion en BDD mémoire
        is_new_user = False
        if github_id not in USERS_DB:
            USERS_DB[github_id] = {"username": username, "avatar_url": avatar_url}
            is_new_user = True

        return {
            "status": "success",
            "token": access_token,
            "github_id": github_id,
            "username": username,
            "avatar_url": avatar_url,
            "is_new_user": is_new_user,
        }


# recuperer les repo de l'utilisateur courrant
@app.get("/api/github/repositories")
async def get_github_repositories(
    authorization: Annotated[str | None, Header()] = None,
):
    token = _extract_bearer_token(authorization)
    if not token:
        raise HTTPException(
            status_code=401, detail="Missing or invalid GitHub Access Token"
        )

    async with httpx.AsyncClient(timeout=20.0) as client:
        response = await client.get(
            "https://api.github.com/user/repos?per_page=100&sort=updated",
            headers={"Authorization": f"token {token}", "Accept": "application/json"},
        )
        if response.status_code != 200:
            raise HTTPException(
                status_code=400, detail="Failed to fetch repositories from GitHub"
            )

        repos = response.json()
        return [{"id": r["id"], "full_name": r["full_name"]} for r in repos]


"""
GESTION DES PROJETS
"""


# creation d'un projet (rattaché à l'utilisateur GitHub connecté)
@app.post("/api/projects")
async def create_project(
    req: ProjectCreateRequest,
    authorization: Annotated[str | None, Header()] = None,
):
    token = _extract_bearer_token(authorization)
    if not token:
        raise HTTPException(status_code=401, detail="Missing GitHub Access Token")

    github_id, username, _ = await _resolve_github_user(token)

    new_project = {
        "name": req.name.strip(),
        "description": req.description.strip(),
        "repository": req.repository.strip(),
        "github_id": github_id,
        "created_by": username,
        "has_workflow": False,
        "created_at": datetime.datetime.utcnow(),
        "updated_at": datetime.datetime.utcnow(),
    }

    # Insertion dans MongoDB
    result = await projects_collection.insert_one(new_project)
    inserted_project = await projects_collection.find_one({"_id": result.inserted_id})
    return format_project(inserted_project)


# Liste les projets du seul utilisateur connecté, triés par ordre descendant
@app.get("/api/projects")
async def list_projects(
    authorization: Annotated[str | None, Header()] = None,
):
    token = _extract_bearer_token(authorization)
    if not token:
        raise HTTPException(status_code=401, detail="Missing GitHub Access Token")

    github_id, _, _ = await _resolve_github_user(token)

    projects_list = []

    cursor = projects_collection.find({"github_id": github_id}).sort("updated_at", -1)

    async for document in cursor:
        projects_list.append(format_project(document))

    return projects_list


# supprimer un projet par son ID (uniquement si l'utilisateur en est le propriétaire)
@app.delete("/api/projects/{project_id}")
async def delete_project(
    project_id: str,
    authorization: Annotated[str | None, Header()] = None,
):
    token = _extract_bearer_token(authorization)
    if not token:
        raise HTTPException(status_code=401, detail="Missing GitHub Access Token")

    github_id, _, _ = await _resolve_github_user(token)

    try:
        obj_id = ObjectId(project_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Format d'ID de projet invalide.")

    project = await projects_collection.find_one({"_id": obj_id})
    if not project:
        raise HTTPException(status_code=404, detail="Projet introuvable.")

    _ensure_owner(project, github_id)

    result = await projects_collection.delete_one({"_id": obj_id})

    # Si le projet n'existait pas
    if result.deleted_count == 0:
        raise HTTPException(
            status_code=404, detail="Projet introuvable, impossible de le supprimer."
        )

    return {
        "status": "success",
        "message": f"Project {project_id} successfully deleted from database.",
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
    project_id: str = Path(
        ..., description="L'identifiant hexadécimal MongoDB du projet"
    ),
    config: FlowOpsWorkflowSchema = None,
    authorization: Annotated[str | None, Header()] = None,
):
    token = _extract_bearer_token(authorization)
    if not token:
        raise HTTPException(status_code=401, detail="Missing GitHub Access Token")

    github_id, _, _ = await _resolve_github_user(token)

    # 1. Vérification de la validité de l'ID et existence dans MongoDB
    if not ObjectId.is_valid(project_id):
        raise HTTPException(status_code=400, detail="Invalid MongoDB ObjectId format")

    project = await db.projects.find_one({"_id": ObjectId(project_id)})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found in database")

    _ensure_owner(project, github_id)

    try:
        # 2. Compilation du schéma FlowOps vers le dictionnaire au format GitHub Actions
        wf_dict = compile_flowops_workflow(config)
        yaml_content = yaml.dump(
            wf_dict, sort_keys=False, default_flow_style=False, allow_unicode=True
        )

        # 3. Préparation sécurisée des répertoires locaux ciblés par Projet
        project_dir = os.path.join(WORKFLOWS_DIR, project_id)
        os.makedirs(project_dir, exist_ok=True)

        # Nettoyage et uniformisation du nom de fichier
        base_name = (
            config.filename
            if config.filename.endswith((".yml", ".yaml"))
            else f"{config.filename}.yaml"
        )
        file_path = os.path.join(project_dir, base_name)

        # 4. Écriture locale du fichier YAML
        with open(file_path, "w", encoding="utf-8") as f:
            f.write(yaml_content)

        # 5. Sauvegarde de la configuration brute JSON (utile pour recharger le formulaire plus tard)
        config_path = os.path.join(project_dir, "config.json")
        with open(config_path, "w", encoding="utf-8") as f:
            json.dump(
                config.model_dump() if hasattr(config, "model_dump") else config.dict(),
                f,
                indent=4,
                ensure_ascii=False,
            )

        # 6. Mise à jour du flag du projet directement dans MongoDB
        await db.projects.update_one(
            {"_id": ObjectId(project_id)},
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
async def execute_project_workflow(
    project_id: str = Path(
        ..., description="L'identifiant hexadécimal MongoDB du projet"
    ),
    authorization: Annotated[str | None, Header()] = None,
):
    """
    Déclencheur d'exécution séquentiel :
    1. Récupère le projet depuis MongoDB pour extraire le dépôt lié.
    2. Lit la configuration locale (config.json) et le fichier YAML compilé.
    3. Commit & Push le fichier YAML sur GitHub (.github/workflows/).
    4. Envoie le signal Repository Dispatch pour lancer l'action GitHub.
    """
    # ─── VALIDATION DU TOKEN DE CONNEXION ───
    token = _extract_bearer_token(authorization)
    if not token:
        raise HTTPException(
            status_code=401,
            detail="Missing or invalid GitHub Access Token. Please log in again.",
        )

    github_id, _, _ = await _resolve_github_user(token)

    # ─── 1. RÉCUPÉRATION DU PROJET DEPUIS MONGODB ───
    try:
        project = await db.projects.find_one({"_id": ObjectId(project_id)})
    except Exception:
        raise HTTPException(
            status_code=400, detail="Invalid project ID format (must be hex string)"
        )

    if not project:
        raise HTTPException(status_code=404, detail="Project not found in database")

    _ensure_owner(project, github_id)

    repo = project.get("repository")
    if not repo:
        raise HTTPException(
            status_code=400,
            detail="No GitHub repository linked to this project in database",
        )

    # Sécurité : Si l'utilisateur a entré une URL complète au lieu de 'pseudo/repo', on extrait le slug
    if "github.com/" in repo:
        repo = repo.split("github.com/")[-1].strip("/")
    elif "github.com:" in repo:
        repo = repo.split("github.com:")[-1].replace(".git", "").strip("/")

    # ─── 2. RÉCUPÉRATION DE LA CONFIGURATION ET DU YAML LOCAL ───
    project_dir = os.path.join(WORKFLOWS_DIR, project_id)
    config_path = os.path.join(project_dir, "config.json")

    if not os.path.exists(config_path):
        raise HTTPException(
            status_code=404,
            detail="Local config.json file not found. Please save your workflow configuration first.",
        )

    with open(config_path, "r", encoding="utf-8") as f:
        config_data = json.load(f)

    # Récupération du nom du fichier YAML cible depuis config.json (ou premier .yaml présent)
    yaml_filename = config_data.get("filename")
    if not yaml_filename:
        yaml_files = [
            f for f in os.listdir(project_dir) if f.endswith((".yaml", ".yml"))
        ]
        if not yaml_files:
            raise HTTPException(
                status_code=400,
                detail="No compiled workflow YAML file found for this project in local storage.",
            )
        yaml_filename = yaml_files[0]

    yaml_path = os.path.join(project_dir, yaml_filename)
    if not os.path.exists(yaml_path):
        raise HTTPException(
            status_code=400,
            detail=f"Workflow YAML file ({yaml_filename}) missing from server storage.",
        )

    with open(yaml_path, "r", encoding="utf-8") as f:
        yaml_content = f.read()

    # En-têtes d'authentification pour l'API GitHub REST v3
    headers = {
        "Authorization": f"token {token}",
        "Accept": "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
    }

    async with httpx.AsyncClient(timeout=30.0) as client:
        # ─── ÉTAPE 3 : PUSH DU FICHIER SUR GITHUB (.github/workflows/) ───
        github_contents_url = f"https://api.github.com/repos/{repo}/contents/.github/workflows/{yaml_filename}"

        # Vérification si le fichier existe déjà pour récupérer son 'sha' (obligatoire pour éditer un fichier existant)
        sha = None
        check_res = await client.get(github_contents_url, headers=headers)

        if check_res.status_code == 200:
            sha = check_res.json().get("sha")
        elif check_res.status_code == 404:
            # Si 404, le fichier n'existe pas encore ou le token manque de droits d'écriture sur les dépôts privés
            pass
        elif check_res.status_code == 401:
            raise HTTPException(
                status_code=401, detail="GitHub Access Token expired or invalid"
            )

        # Encodage requis par GitHub (Contenu textuel -> Octets UTF-8 -> Base64 standard -> Chaîne de caractères)
        encoded_content = base64.b64encode(yaml_content.encode("utf-8")).decode("utf-8")

        push_payload = {
            "message": f"ci(flowops): update/create workflow {yaml_filename} via FlowOps Studio",
            "content": encoded_content,
            "branch": "main",  # Change par "master" si ton dépôt utilise l'ancienne nomenclature
        }
        if sha:
            push_payload["sha"] = sha

        push_res = await client.put(
            github_contents_url, headers=headers, json=push_payload
        )

        if push_res.status_code not in [200, 201]:
            # Traitement explicite des erreurs d'authentification ou d'arborescence GitHub
            error_detail = push_res.text
            try:
                error_detail = push_res.json().get("message", push_res.text)
            except Exception:
                pass

            if push_res.status_code == 404:
                raise HTTPException(
                    status_code=404,
                    detail=f"GitHub returned 404 Not Found during file push to '{repo}'. "
                    f"Verify that the repository exists, that your account has write access, "
                    f"and that your GitHub token has BOTH 'repo' and 'workflow' scopes checked.",
                )
            raise HTTPException(
                status_code=400,
                detail=f"Failed to push YAML file to GitHub: {error_detail} (Status: {push_res.status_code})",
            )

        # ─── ÉTAPE 4 : ENVOI DU REPOSITORY DISPATCH TRIGGER ───
        github_dispatch_url = f"https://api.github.com/repos/{repo}/dispatches"

        dispatch_res = await client.post(
            github_dispatch_url,
            headers=headers,
            json={
                "event_type": "flowops_trigger",
                "client_payload": {
                    "project_name": project.get("name", "FlowOps Project"),
                    "triggered_by": "FlowOps Dashboard",
                },
            },
        )

        # HTTP 204 = Succès sans retour de contenu (comportement normal du Repository Dispatch)
        if dispatch_res.status_code == 204:
            return {
                "status": "success",
                "message": f"Configuration file '{yaml_filename}' was successfully committed to branch 'main' "
                f"and execution event ('flowops_trigger') dispatched to {repo}!",
            }
        else:
            error_msg = dispatch_res.text
            try:
                error_msg = dispatch_res.json().get("message", dispatch_res.text)
            except Exception:
                pass
            raise HTTPException(
                status_code=400,
                detail=f"YAML file pushed successfully, but Dispatch signal failed: {error_msg} (Status: {dispatch_res.status_code})",
            )


# systeme de logs


# Récupère l'historique des exécutions (workflow runs) GitHub Actions pour un projet.
@app.get("/api/projects/{project_id}/runs")
async def get_project_workflow_runs(
    project_id: str = Path(..., description="ID MongoDB du projet"),
    authorization: Annotated[str | None, Header()] = None,
):
    token = _extract_bearer_token(authorization)
    if not token:
        raise HTTPException(status_code=401, detail="Token GitHub invalide ou manquant")

    github_id, _, _ = await _resolve_github_user(token)

    if not ObjectId.is_valid(project_id):
        raise HTTPException(status_code=400, detail="Format d'ID de projet invalide")

    project = await db.projects.find_one({"_id": ObjectId(project_id)})
    if not project or not project.get("repository"):
        raise HTTPException(
            status_code=404, detail="Projet ou dépôt associé introuvable"
        )

    _ensure_owner(project, github_id)

    repo = project.get("repository")
    if "github.com/" in repo:
        repo = repo.split("github.com/")[-1].strip("/")
    elif "github.com:" in repo:
        repo = repo.split("github.com:")[-1].replace(".git", "").strip("/")

    headers = {
        "Authorization": f"token {token}",
        "Accept": "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
    }

    async with httpx.AsyncClient(timeout=20.0) as client:
        res = await client.get(
            f"https://api.github.com/repos/{repo}/actions/runs?per_page=10",
            headers=headers,
        )
        if res.status_code != 200:
            raise HTTPException(
                status_code=res.status_code,
                detail=f"Impossible de récupérer les exécutions depuis GitHub: {res.text}",
            )

        runs_data = res.json().get("workflow_runs", [])

        # Formater les données
        runs = []
        for r in runs_data:
            runs.append(
                {
                    "id": str(r["id"]),
                    "name": r.get("name") or r.get("display_title", "Workflow Run"),
                    "status": r.get("status"),  # queued, in_progress, completed
                    "conclusion": r.get(
                        "conclusion"
                    ),  # success, failure, cancelled, None
                    "event": r.get("event"),
                    "branch": r.get("head_branch"),
                    "commit_sha": r.get("head_sha", "")[:7],
                    "created_at": r.get("created_at"),
                    "updated_at": r.get("updated_at"),
                    "html_url": r.get("html_url"),
                }
            )

        return {"project_id": project_id, "repository": repo, "runs": runs}


# Récupère les détails des jobs et des étapes (steps) pour une exécution donnée.
@app.get("/api/projects/{project_id}/runs/{run_id}/jobs")
async def get_run_jobs(
    project_id: str,
    run_id: str,
    authorization: Annotated[str | None, Header()] = None,
):
    token = _extract_bearer_token(authorization)
    if not token:
        raise HTTPException(status_code=401, detail="Token GitHub invalide ou manquant")

    github_id, _, _ = await _resolve_github_user(token)

    if not ObjectId.is_valid(project_id):
        raise HTTPException(status_code=400, detail="Format ID invalide")

    project = await db.projects.find_one({"_id": ObjectId(project_id)})
    if not project or not project.get("repository"):
        raise HTTPException(status_code=404, detail="Projet introuvable")

    _ensure_owner(project, github_id)

    repo = project.get("repository")
    if "github.com/" in repo:
        repo = repo.split("github.com/")[-1].strip("/")

    headers = {
        "Authorization": f"token {token}",
        "Accept": "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
    }

    async with httpx.AsyncClient(timeout=20.0) as client:
        res = await client.get(
            f"https://api.github.com/repos/{repo}/actions/runs/{run_id}/jobs",
            headers=headers,
        )
        if res.status_code != 200:
            raise HTTPException(
                status_code=res.status_code,
                detail="Erreur de récupération des jobs GitHub",
            )

        jobs_data = res.json().get("jobs", [])
        jobs = []
        for j in jobs_data:
            steps = []
            for s in j.get("steps", []):
                steps.append(
                    {
                        "name": s.get("name"),
                        "status": s.get("status"),
                        "conclusion": s.get("conclusion"),
                        "number": s.get("number"),
                        "started_at": s.get("started_at"),
                        "completed_at": s.get("completed_at"),
                    }
                )

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
async def get_job_logs(
    project_id: str,
    run_id: str,
    job_id: str,
    authorization: Annotated[str | None, Header()] = None,
):
    token = _extract_bearer_token(authorization)
    if not token:
        raise HTTPException(status_code=401, detail="Token GitHub invalide ou manquant")

    github_id, _, _ = await _resolve_github_user(token)

    if not ObjectId.is_valid(project_id):
        raise HTTPException(status_code=400, detail="Format ID invalide")

    project = await db.projects.find_one({"_id": ObjectId(project_id)})
    if not project or not project.get("repository"):
        raise HTTPException(status_code=404, detail="Projet introuvable")

    _ensure_owner(project, github_id)

    repo = project.get("repository")
    if "github.com/" in repo:
        repo = repo.split("github.com/")[-1].strip("/")

    headers = {
        "Authorization": f"token {token}",
        "Accept": "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
    }

    async with httpx.AsyncClient(timeout=30.0, follow_redirects=True) as client:
        res = await client.get(
            f"https://api.github.com/repos/{repo}/actions/jobs/{job_id}/logs",
            headers=headers,
        )

        if res.status_code == 404:
            return {
                "logs": "Les logs ne sont pas encore disponibles sur GitHub (exécution en cours de démarrage...)"
            }

        if res.status_code != 200:
            return {
                "logs": f"Impossible de charger les logs (Statut HTTP {res.status_code})"
            }

        # Nettoyage basique des horodatages ANSI de GitHub
        raw_logs = res.text
        return {"logs": raw_logs}
