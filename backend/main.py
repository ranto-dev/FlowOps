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

load_dotenv()

app = FastAPI(title="FlowOps Core Engine", version="6.0.0")

# 1. Ajoute bien ces deux lignes juste ici :
WORKFLOWS_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "workflows")
os.makedirs(WORKFLOWS_DIR, exist_ok=True)

setup_cors(app)

# Base de données en mémoire pour FlowOps
USERS_DB = {}

# Ton application FlowOps utilise un Client ID global (fourni par l'API GitHub)
# Pour le Device Flow, le Client ID suffit et peut être configuré de manière globale pour ton app
GITHUB_CLIENT_ID = os.getenv("GITHUB_CLIENT_ID", "ton_client_id_global")

class LoginCheckRequest(BaseModel):
    device_code: str

class ProjectCreateRequest(BaseModel):
    name: str
    description: str
    repository: str

@app.post("/api/auth/device-code")
async def get_device_code():
    """Étape 1: Demander un code d'activation d'appareil à l'API GitHub"""
    client_id = os.getenv("GITHUB_CLIENT_ID")
    if not client_id:
        raise HTTPException(status_code=500, detail="Backend GITHUB_CLIENT_ID is not configured.")
        
    async with httpx.AsyncClient() as client:
        response = await client.post(
            "https://github.com/login/device/code",
            headers={"Accept": "application/json"},
            data={
                "client_id": client_id,
                "scope": "user repo"
            }
        )
        if response.status_code != 200:
            raise HTTPException(status_code=500, detail="Cannot connect to GitHub Device Flow API")
        return response.json()

@app.post("/api/auth/check-login")
async def check_login(req: LoginCheckRequest):
    """Étape 2: Polling adaptatif pour vérifier si l'utilisateur a validé sur GitHub"""
    client_id = os.getenv("GITHUB_CLIENT_ID")
    client_secret = os.getenv("GITHUB_CLIENT_SECRET")
    
    async with httpx.AsyncClient() as client:
        response = await client.post(
            "https://github.com/login/oauth/access_token",
            headers={"Accept": "application/json"},
            data={
                "client_id": client_id,
                "client_secret": client_secret,
                "device_code": req.device_code,
                "grant_type": "urn:ietf:params:oauth:grant-type:device_code"
            }
        )
        
        data = response.json()
        print("--- GITHUB ANSWER ---", data) # Log de surveillance dans ton terminal backend

        # Cas d'attente utilisateur standard
        if "error" in data:
            return {"status": "pending", "error": data["error"]}
            
        if "access_token" not in data:
            return {"status": "pending", "error": "waiting_user_validation"}
            
        access_token = data["access_token"]
        
        # Étape 3: Récupération du profil utilisateur GitHub via l'API sécurisée
        user_response = await client.get(
            "https://api.github.com/user",
            headers={
                "Authorization": f"token {access_token}",
                "Accept": "application/json"
            }
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
            USERS_DB[github_id] = {
                "username": username,
                "avatar_url": avatar_url
            }
            is_new_user = True
            
        return {
            "status": "success",
            "token": access_token,
            "github_id": github_id,
            "username": username,
            "avatar_url": avatar_url,
            "is_new_user": is_new_user
        }
# --- NOUVELLE ROUTE : RÉCUPÉRER LES REPOS DE L'UTILISATEUR ---
@app.get("/api/github/repositories")
async def get_github_repositories(authorization: Annotated[str | None, Header()] = None):
    """Récupère la liste des dépôts GitHub de l'utilisateur connecté"""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid GitHub Access Token")
    
    token = authorization.split(" ")[1]
    async with httpx.AsyncClient() as client:
        response = await client.get(
            "https://api.github.com/user/repos?per_page=100&sort=updated",
            headers={"Authorization": f"token {token}", "Accept": "application/json"}
        )
        if response.status_code != 200:
            raise HTTPException(status_code=400, detail="Failed to fetch repositories from GitHub")
        
        repos = response.json()
        return [{"id": r["id"], "full_name": r["full_name"]} for r in repos]

# --- GESTION PERSISTANTE DES PROJETS (CRUD DISQUE) ---
@app.post("/api/projects")
async def create_project(req: ProjectCreateRequest):
    """Crée un dossier projet et sauvegarde ses métadonnées"""
    project_id = f"proj_{int(os.getpid())}_{os.urandom(2).hex()}" # ID Unique
    project_dir = os.path.join(WORKFLOWS_DIR, project_id)
    os.makedirs(project_dir, exist_ok=True)
    
    metadata = {
        "id": project_id,
        "name": req.name,
        "description": req.description,
        "repository": req.repository,
        "has_workflow": False
    }
    
    with open(os.path.join(project_dir, "metadata.json"), "w") as f:
        json.dump(metadata, f, indent=4)
        
    return metadata

@app.get("/api/projects")
async def list_projects():
    """Liste tous les projets triés par ordre inverse (Descendant)"""
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
    for p in projects_list: p.pop("_updated", None)
    return projects_list

@app.post("/api/generate-workflow")
async def generate_workflow(config: FlowOpsWorkflowSchema):
    try:
        wf_dict = compile_flowops_workflow(config)
        yaml_content = yaml.dump(wf_dict, sort_keys=False, default_flow_style=False, allow_unicode=True)
        return {"filename": config.filename, "yaml": yaml_content}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/save-workflow")
async def save_workflow(config: FlowOpsWorkflowSchema):
    try:
        wf_dict = compile_flowops_workflow(config)
        yaml_content = yaml.dump(wf_dict, sort_keys=False, default_flow_style=False, allow_unicode=True)
        
        # Création sécurisée du dossier racine backend/generated/
        target_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "generated")
        os.makedirs(target_dir, exist_ok=True)
        
        # Nettoyage extension
        base_name = config.filename if config.filename.endswith((".yml", ".yaml")) else f"{config.filename}.yaml"
        file_path = os.path.join(target_dir, base_name)
        
        with open(file_path, "w", encoding="utf-8") as f:
            f.write(yaml_content)
            
        return {"status": "success", "saved_path": file_path}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/projects/{project_id}/workflow")
async def save_project_workflow(project_id: str, config: FlowOpsWorkflowSchema):
    """
    Compile le workflow via ton compilateur et le sauvegarde 
    dans le dossier persistant du projet cible
    """
    project_dir = os.path.join(WORKFLOWS_DIR, project_id)
    meta_path = os.path.join(project_dir, "metadata.json")
    
    if not os.path.exists(meta_path):
        raise HTTPException(status_code=404, detail="Project folder not found")
        
    try:
        # 1. Utilisation de ta fonction de compilation d'origine !
        wf_dict = compile_flowops_workflow(config)
        yaml_content = yaml.dump(wf_dict, sort_keys=False, default_flow_style=False, allow_unicode=True)
        
        # 2. Nettoyage du nom de fichier
        base_name = config.filename if config.filename.endswith((".yml", ".yaml")) else f"{config.filename}.yaml"
        file_path = os.path.join(project_dir, base_name)
        
        # 3. Écriture physique du fichier YAML compilé dans le dossier du projet
        with open(file_path, "w", encoding="utf-8") as f:
            f.write(yaml_content)
            
        # 4. Mise à jour du fichier metadata.json pour notifier que le projet a maintenant un workflow actif
        with open(meta_path, "r", encoding="utf-8") as f:
            meta_data = json.load(f)
        
        meta_data["has_workflow"] = True
        meta_data["yaml_filename"] = base_name
        
        with open(meta_path, "w", encoding="utf-8") as f:
            json.dump(meta_data, f, indent=4)
            
        return {
            "status": "success", 
            "saved_path": file_path,
            "yaml": yaml_content
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))