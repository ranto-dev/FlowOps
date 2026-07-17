# backend/main.py
from fastapi import FastAPI, HTTPException, Header
import yaml
import os
import httpx
from pydantic import BaseModel
from dotenv import load_dotenv
from config import setup_cors
from schemas import FlowOpsWorkflowSchema
from compiler import compile_flowops_workflow
from typing import Annotated
import json
import base64

load_dotenv()

app = FastAPI(title="FlowOps Core Engine", version="6.0.0")

WORKFLOWS_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "workflows")
os.makedirs(WORKFLOWS_DIR, exist_ok=True)

setup_cors(app)

USERS_DB = {}

# load DOTENV
GITHUB_CLIENT_ID = os.getenv("GITHUB_CLIENT_ID", "ton_client_id_global")


class LoginCheckRequest(BaseModel):
    device_code: str


class ProjectCreateRequest(BaseModel):
    name: str
    description: str
    repository: str


"""
AUTHENTIFICATION
"""


# Demander un code d'activation d'appareil à l'API GitHub
@app.post("/api/auth/device-code")
async def get_device_code():
    client_id = os.getenv("GITHUB_CLIENT_ID")
    if not client_id:
        raise HTTPException(
            status_code=500, detail="Backend GITHUB_CLIENT_ID is not configured."
        )

    async with httpx.AsyncClient(timeout=20.0) as client:
        response = await client.post(
            "https://github.com/login/device/code",
            headers={"Accept": "application/json"},
            data={"client_id": client_id, "scope": "user repo"},
        )
        if response.status_code != 200:
            raise HTTPException(
                status_code=500, detail="Cannot connect to GitHub Device Flow API"
            )
        return response.json()


# Polling adaptatif pour vérifier si l'utilisateur a validé sur GitHub
@app.post("/api/auth/check-login")
async def check_login(req: LoginCheckRequest):
    client_id = os.getenv("GITHUB_CLIENT_ID")
    client_secret = os.getenv("GITHUB_CLIENT_SECRET")

    async with httpx.AsyncClient(timeout=20.0) as client:
        response = await client.post(
            "https://github.com/login/oauth/access_token",
            headers={"Accept": "application/json"},
            data={
                "client_id": client_id,
                "client_secret": client_secret,
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
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=401, detail="Missing or invalid GitHub Access Token"
        )

    token = authorization.split(" ")[1]
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


# creation d'un projet
@app.post("/api/projects")
async def create_project(req: ProjectCreateRequest):
    # Crée un dossier projet et sauvegarde ses métadonnées
    project_id = f"proj_{int(os.getpid())}_{os.urandom(2).hex()}"  # ID Unique
    project_dir = os.path.join(WORKFLOWS_DIR, project_id)
    os.makedirs(project_dir, exist_ok=True)

    metadata = {
        "id": project_id,
        "name": req.name,
        "description": req.description,
        "repository": req.repository,
        "has_workflow": False,
    }

    with open(os.path.join(project_dir, "metadata.json"), "w") as f:
        json.dump(metadata, f, indent=4)

    return metadata


# Liste tous les projets triés par ordre descendant
@app.get("/api/projects")
async def list_projects():
    projects_list = []
    if not os.path.exists(WORKFLOWS_DIR):
        return []

    for project_id in os.listdir(WORKFLOWS_DIR):
        meta_path = os.path.join(WORKFLOWS_DIR, project_id, "metadata.json")
        if os.path.exists(meta_path):
            with open(meta_path, "r") as f:
                try:
                    meta_data = json.load(f)
                    # On utilise la date de modification du fichier pour le tri réel
                    meta_data["_updated"] = os.path.getmtime(meta_path)
                    projects_list.append(meta_data)
                except:
                    continue

    # Tri par ordre décroissant (le plus récent en premier)
    projects_list.sort(key=lambda x: x["_updated"], reverse=True)

    # Nettoyage de la clé technique de tri avant envoi
    for p in projects_list:
        p.pop("_updated", None)
    return projects_list


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

# sauvegarder un workflow
@app.post("/api/save-workflow")
async def save_workflow(config: FlowOpsWorkflowSchema):
    try:
        wf_dict = compile_flowops_workflow(config)
        yaml_content = yaml.dump(
            wf_dict, sort_keys=False, default_flow_style=False, allow_unicode=True
        )

        # Création sécurisée du dossier racine backend/generated/
        target_dir = os.path.join(
            os.path.dirname(os.path.abspath(__file__)), "generated"
        )
        os.makedirs(target_dir, exist_ok=True)

        # Nettoyage extension
        base_name = (
            config.filename
            if config.filename.endswith((".yml", ".yaml"))
            else f"{config.filename}.yaml"
        )
        file_path = os.path.join(target_dir, base_name)

        with open(file_path, "w", encoding="utf-8") as f:
            f.write(yaml_content)

        return {"status": "success", "saved_path": file_path}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/projects/{project_id}/workflow")
async def save_project_workflow(
    project_id: str,
    config: FlowOpsWorkflowSchema,
    authorization: Annotated[str | None, Header()] = None,
):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=401, detail="Missing or invalid GitHub Access Token"
        )

    token = authorization.split(" ")[1]
    project_dir = os.path.join(WORKFLOWS_DIR, project_id)
    meta_path = os.path.join(project_dir, "metadata.json")

    if not os.path.exists(meta_path):
        raise HTTPException(status_code=404, detail="Project folder not found")

    try:
        wf_dict = compile_flowops_workflow(config)
        yaml_content = yaml.dump(
            wf_dict, sort_keys=False, default_flow_style=False, allow_unicode=True
        )

        base_name = (
            config.filename
            if config.filename.endswith((".yml", ".yaml"))
            else f"{config.filename}.yaml"
        )
        file_path = os.path.join(project_dir, base_name)

        with open(file_path, "w", encoding="utf-8") as f:
            f.write(yaml_content)

        config_path = os.path.join(project_dir, "config.json")
        with open(config_path, "w", encoding="utf-8") as f:
            json.dump(
                config.model_dump() if hasattr(config, "model_dump") else config.dict(),
                f,
                indent=4,
            )

        with open(meta_path, "r", encoding="utf-8") as f:
            meta_data = json.load(f)

        repo = meta_data.get("repository")
        if not repo:
            raise HTTPException(
                status_code=400, detail="No GitHub repository linked to this project"
            )

        # Encodage sécurisé en Base64 du YAML compilé
        utf8_bytes = yaml_content.encode("utf-8")
        encoded_content = base64.b64encode(utf8_bytes).decode("utf-8")

        github_file_url = f"https://api.github.com/repos/{repo}/contents/.github/workflows/{base_name}"

        async with httpx.AsyncClient(timeout=20.0) as client:
            headers = {
                "Authorization": f"token {token}",
                "Accept": "application/vnd.github+json",
                "User-Agent": "FlowOps-App",
            }

            # Étape A : Détecter si le fichier existe déjà pour récupérer le SHA
            sha = None
            try:
                get_res = await client.get(github_file_url, headers=headers)
                if get_res.status_code == 200:
                    sha = get_res.json().get("sha")
            except Exception as e:
                print(
                    f"[Warning] Failed to check existing workflow file on GitHub: {e}"
                )

            # Étape B : Préparer le payload du commit
            # Ne force PAS "branch": "main" si le dépôt est vierge (sans commit)
            # GitHub créera le fichier sur la branche par défaut (main ou master) automatiquement.
            payload = {
                "message": f"ci(flowops): sync {base_name} workflow pipeline",
                "content": encoded_content,
            }
            if sha:
                payload["sha"] = (
                    sha  # Obligatoire uniquement pour mettre à jour un fichier existant
                )

            # Étape C : Écriture sur GitHub (PUT)
            put_res = await client.put(github_file_url, headers=headers, json=payload)

            if put_res.status_code not in [200, 201]:
                error_response = (
                    put_res.json()
                    if put_res.headers.get("content-type", "").startswith(
                        "application/json"
                    )
                    else put_res.text
                )
                print(
                    f"[GitHub API Error] Status: {put_res.status_code}, Detail: {error_response}"
                )

                # Explication claire si le dépôt est vide
                if put_res.status_code == 404:
                    raise HTTPException(
                        status_code=400,
                        detail="GitHub returned 404. Ensure your repository is not completely empty (create at least one commit or a README.md on GitHub first) and that your OAuth App Token has the 'repo' scope.",
                    )

                raise HTTPException(
                    status_code=400,
                    detail=f"GitHub API rejected the file: {error_response}",
                )

        # 4. Finalisation locale
        meta_data["has_workflow"] = True
        meta_data["yaml_filename"] = base_name

        with open(meta_path, "w", encoding="utf-8") as f:
            json.dump(meta_data, f, indent=4)

        return {"status": "success", "yaml": yaml_content}

    except HTTPException as he:
        raise he
    except Exception as e:
        import traceback

        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Internal Server Error: {str(e)}")


@app.post("/api/projects/{project_id}/execute")
async def execute_project_workflow(
    project_id: str, authorization: Annotated[str | None, Header()] = None
):
    """
    Déclenche l'exécution du workflow sur le dépôt GitHub de l'utilisateur
    via l'API GitHub Repository Dispatch.
    """
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=401, detail="Missing or invalid GitHub Access Token"
        )

    token = authorization.split(" ")[1]

    # 1. Récupérer les métadonnées du projet pour connaître le dépôt lié
    project_dir = os.path.join(WORKFLOWS_DIR, project_id)
    meta_path = os.path.join(project_dir, "metadata.json")

    if not os.path.exists(meta_path):
        raise HTTPException(status_code=404, detail="Project not found")

    with open(meta_path, "r", encoding="utf-8") as f:
        project_data = json.load(f)

    repo = project_data.get("repository")  # Exemple: "mon-pseudo/mon-repo"
    if not repo:
        raise HTTPException(
            status_code=400, detail="No GitHub repository linked to this project"
        )

    # 2. Envoyer la requête de déclenchement à l'API GitHub
    # L'événement "flowops_trigger" doit correspondre à celui attendu dans le YAML
    async with httpx.AsyncClient(timeout=20.0) as client:
        github_dispatch_url = f"https://api.github.com/repos/{repo}/dispatches"

        response = await client.post(
            github_dispatch_url,
            headers={
                "Authorization": f"token {token}",
                "Accept": "application/vnd.github+json",
                "X-GitHub-Api-Version": "2022-11-28",
            },
            json={
                "event_type": "flowops_trigger",  # Le nom du signal d'activation
                "client_payload": {
                    "project_name": project_data.get("name"),
                    "triggered_by": "FlowOps Dashboard",
                },
            },
        )

        # GitHub renvoie un code 204 No Content si le dispatch est accepté avec succès
        if response.status_code == 204:
            return {
                "status": "success",
                "message": f"Workflow successfully dispatched to {repo}!",
            }
        else:
            # En cas d'erreur (droits insuffisants, mauvais repo, etc.)
            error_msg = response.text
            try:
                error_msg = response.json().get("message", response.text)
            except:
                pass
            raise HTTPException(
                status_code=400,
                detail=f"GitHub API Error: {error_msg} (Status: {response.status_code})",
            )
