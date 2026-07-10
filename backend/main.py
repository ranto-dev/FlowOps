from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Optional
import yaml

app = FastAPI(
    title="GitHub Actions Low-Code Backend",
    description="API pour générer des fichiers de configuration YAML pour GitHub Actions",
    version="1.0.0"
)

# Configuration du CORS pour autoriser le Frontend (React/Vite)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- MODÈLES DE DONNÉES (Pydantic) ---

class WorkflowStepSchema(BaseModel):
    id: str
    name: str
    uses: Optional[str] = None
    run: Optional[str] = None

class WorkflowConfigSchema(BaseModel):
    name: str = Field(..., example="CI Pipeline")
    on: str = Field(..., example="push")
    steps: List[WorkflowStepSchema]


# --- FORMATEUR YAML PERSONNALISÉ ---
# GitHub Actions préfère conserver l'ordre exact des blocs (name, on, jobs...)
# Cette fonction structure le dictionnaire Python avant la conversion en YAML.
def build_github_actions_dict(config: WorkflowConfigSchema) -> dict:
    formatted_steps = []
    
    for step in config.steps:
        step_dict = {"name": step.name}
        if step.uses:
            step_dict["uses"] = step.uses
        elif step.run:
            step_dict["run"] = step.run
        formatted_steps.append(step_dict)

    # Structure standard d'un workflow GitHub Actions de base
    workflow_dict = {
        "name": config.name,
        "on": {
            config.on: {} # Génère 'push:' ou 'pull_request:'
        },
        "jobs": {
            "build-and-test": {
                "runs-on": "ubuntu-latest",
                "steps": formatted_steps
            }
        }
    }
    return workflow_dict


# --- ENDPOINTS ---

@app.get("/")
def read_root():
    return {"status": "online", "message": "Backend low-code prêt à générer vos workflows"}


@app.post("/api/generate-workflow")
async def generate_workflow(config: WorkflowConfigSchema):
    try:
        # 1. Structurer les données reçues au format officiel GitHub Actions
        github_actions_data = build_github_actions_dict(config)
        
        # 2. Convertir le dictionnaire Python en chaîne de caractères YAML
        # sort_keys=False permet de garder l'ordre logique défini ci-dessus
        yaml_content = yaml.dump(github_actions_data, sort_keys=False, default_flow_style=False, allow_unicode=True)
        
        # 3. Retourner le résultat au frontend
        return {"yaml": yaml_content}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur lors de la génération : {str(e)}")
