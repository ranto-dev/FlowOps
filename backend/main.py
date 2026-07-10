from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import yaml

app = FastAPI(title="GitHub Actions Enterprise Backend", version="3.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- REPRÉSENTATION DU STYLE MULTI-LIGNES EN PYYAML ---
class LiteralStr(str):
    pass

def literal_presenter(dumper, data):
    """Force PyYAML à utiliser le bloc '|' pour les chaînes contenant des retours à la ligne."""
    if '\n' in data:
        return dumper.represent_scalar('tag:yaml.org,2002:str', data, style='|')
    return dumper.represent_scalar('tag:yaml.org,2002:str', data)

yaml.add_representer(LiteralStr, literal_presenter)

# --- MODÈLES DE DONNÉES ENRICHIS ---

class StepSchema(BaseModel):
    id: str
    name: str
    type: str  # "run" ou "uses"
    content: str  # Le script multi-lignes OU la chaîne d'action (ex: actions/checkout@v4)
    env: Optional[str] = None  # Chaîne au format KEY=VAL, une par ligne

class WorkflowConfigSchema(BaseModel):
    filename: str
    name: str
    on_event: str
    branches: Optional[str] = None
    runs_on: str
    matrix_key: Optional[str] = None    # Ex: "python-version" ou "os"
    matrix_values: Optional[str] = None # Ex: "3.9, 3.10, 3.11"
    steps: List[StepSchema]

def build_enterprise_workflow(config: WorkflowConfigSchema) -> dict:
    # 1. Déclencheurs
    event_dict = {}
    if config.branches and config.on_event in ["push", "pull_request"]:
        event_dict[config.on_event] = {
            "branches": [b.strip() for b in config.branches.split(",") if b.strip()]
        }
    else:
        event_dict[config.on_event] = {}

    # 2. Setup du Job principal
    job_spec: Dict[str, Any] = {
        "runs-on": config.runs_on
    }

    # Matrice Générique (Non limitée à Node.js)
    if config.matrix_key and config.matrix_values:
        vals = [v.strip() for v in config.matrix_values.split(",") if v.strip()]
        if vals:
            job_spec["strategy"] = {
                "matrix": {
                    config.matrix_key.strip(): vals
                }
            }

    # 3. Parsing des Étapes Dynamiques
    steps_list = []
    for s in config.steps:
        step_entry = {"name": s.name}
        
        if s.type == "uses":
            step_entry["uses"] = s.content.strip()
        else:
            # Si le script fait plusieurs lignes, on le convertit en LiteralStr pour le '|'
            text = s.content.replace('\r\n', '\n')
            step_entry["run"] = LiteralStr(text) if '\n' in text else text.strip()

        # Parsing de l'environnement de l'étape
        if s.env:
            step_env_dict = {}
            for line in s.env.split('\n'):
                if '=' in line:
                    k, v = line.split('=', 1)
                    step_env_dict[k.strip()] = v.strip()
            if step_env_dict:
                step_entry["env"] = step_env_dict

        steps_list.append(step_entry)

    job_spec["steps"] = steps_list

    return {
        "name": config.name,
        "on": event_dict,
        "jobs": {
            "pipeline-execution": job_spec
        }
    }

@app.post("/api/generate-workflow")
async def generate_workflow(config: WorkflowConfigSchema):
    try:
        wf_dict = build_enterprise_workflow(config)
        yaml_content = yaml.dump(wf_dict, sort_keys=False, default_flow_style=False, allow_unicode=True)
        return {
            "filename": config.filename if config.filename.endswith((".yml", ".yaml")) else f"{config.filename}.yml",
            "yaml": yaml_content
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))