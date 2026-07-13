# backend/main.py
from fastapi import FastAPI, HTTPException
import yaml
import os
import httpx
from pydantic import BaseModel
from dotenv import load_dotenv
from config import setup_cors
from schemas import FlowOpsWorkflowSchema
from compiler import compile_flowops_workflow

load_dotenv()

app = FastAPI(title="FlowOps Core Engine", version="6.0.0")
setup_cors(app)

# Base de données en mémoire pour FlowOps
USERS_DB = {}

# Ton application FlowOps utilise un Client ID global (fourni par l'API GitHub)
# Pour le Device Flow, le Client ID suffit et peut être configuré de manière globale pour ton app
GITHUB_CLIENT_ID = os.getenv("GITHUB_CLIENT_ID", "ton_client_id_global")

class LoginCheckRequest(BaseModel):
    device_code: str

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