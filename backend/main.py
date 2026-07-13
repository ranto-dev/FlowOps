from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import yaml

app = FastAPI(title="FlowOps Core Engine", version="6.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class LiteralStr(str):
    pass

def literal_presenter(dumper, data):
    if '\n' in data:
        return dumper.represent_scalar('tag:yaml.org,2002:str', data, style='|')
    return dumper.represent_scalar('tag:yaml.org,2002:str', data)

yaml.add_representer(LiteralStr, literal_presenter)

# --- ARCHITECTURE GRADUELLE DE FLOWOPS ---

class LowCodeStep(BaseModel):
    id: str
    name: str
    type: str # "checkout" | "setup-node" | "npm" | "docker" | "custom-run" | "upload-artifact"
    # Paramètres dynamiques injectés selon le type
    node_version: Optional[str] = None
    npm_command: Optional[str] = None
    docker_image: Optional[str] = None
    docker_registry: Optional[str] = None
    custom_script: Optional[str] = None
    artifact_path: Optional[str] = None
    step_if: Optional[str] = None # Condition au niveau de la step

class LowCodeJob(BaseModel):
    id: str
    name: str
    runs_on: str = "ubuntu-latest"
    needs: List[str] = [] # Gère le chaînage des Jobs
    matrix_key: Optional[str] = None
    matrix_values: Optional[str] = None
    job_if: Optional[str] = None # Condition au niveau du job
    steps: List[LowCodeStep]

class FlowOpsWorkflowSchema(BaseModel):
    filename: str
    name: str
    on_events: List[str] # push, pull_request, workflow_dispatch
    branches: str # Séparés par des virgules
    global_env: Optional[str] = None # KEY=VAL par ligne
    jobs: List[LowCodeJob]

def compile_flowops_workflow(config: FlowOpsWorkflowSchema) -> dict:
    # 1. Gestion des Déclencheurs (Triggers)
    event_dict = {}
    branch_list = [b.strip() for b in config.branches.split(",") if b.strip()]
    
    for event in config.on_events:
        if event in ["push", "pull_request"] and branch_list:
            event_dict[event] = {"branches": branch_list}
        else:
            event_dict[event] = {}

    # 2. Variables d'Environnement Globales
    global_env_dict = {}
    if config.global_env:
        for line in config.global_env.split("\n"):
            if "=" in line:
                k, v = line.split("=", 1)
                global_env_dict[k.strip()] = v.strip()

    # 3. Compilations des Jobs
    jobs_dict = {}
    for j in config.jobs:
        job_spec: Dict[str, Any] = {"runs-on": j.runs_on}
        
        if j.needs:
            job_spec["needs"] = j.needs
            
        if j.job_if:
            job_spec["if"] = j.job_if

        # Matrice
        if j.matrix_key and j.matrix_values:
            vals = [v.strip() for v in j.matrix_values.split(",") if v.strip()]
            if vals:
                job_spec["strategy"] = {"matrix": {j.matrix_key.strip(): vals}}

        # Traduction des steps FlowOps en YAML officiel
        compiled_steps = []
        for s in j.steps:
            step_entry = {"name": s.name}
            if s.step_if:
                step_entry["if"] = s.step_if

            if s.type == "checkout":
                step_entry["uses"] = "actions/checkout@v4"
            elif s.type == "setup-node":
                step_entry["uses"] = "actions/setup-node@v4"
                version_val = f"${{{{ matrix.{j.matrix_key} }}}}" if j.matrix_key and "node" in j.matrix_key.lower() else (int(s.node_version) if s.node_version and s.node_version.isdigit() else 20)
                step_entry["with"] = {"node-version": version_val, "cache": "npm"}
            elif s.type == "npm":
                step_entry["run"] = f"npm {s.npm_command}"
            elif s.type == "upload-artifact":
                step_entry["uses"] = "actions/upload-artifact@v4"
                step_entry["with"] = {"name": "production-artifacts", "path": s.artifact_path or "dist/"}
            elif s.type == "docker":
                reg = "" if s.docker_registry == "dockerhub" else "ghcr.io/"
                path = f"{reg}${{{{ github.repository_owner }}}}/{s.docker_image}:latest"
                script = f"docker build -t {s.docker_image} .\ndocker tag {s.docker_image} {path}\ndocker push {path}"
                step_entry["run"] = LiteralStr(script)
            elif s.type == "custom-run":
                text = s.custom_script.replace('\r\n', '\n') if s.custom_script else "echo 'Hello FlowOps'"
                step_entry["run"] = LiteralStr(text) if '\n' in text else text.strip()

            compiled_steps.append(step_entry)

        job_spec["steps"] = compiled_steps
        # Nettoyage du nom pour le YAML (pas d'espaces dans l'ID du job)
        job_id = j.name.lower().replace(" ", "-").replace("'", "-")
        jobs_dict[job_id] = job_spec

    output = {
        "name": config.name,
        "on": event_dict,
    }
    if global_env_dict:
        output["env"] = global_env_dict
        
    output["jobs"] = jobs_dict
    return output

@app.post("/api/generate-workflow")
async def generate_workflow(config: FlowOpsWorkflowSchema):
    try:
        wf_dict = compile_flowops_workflow(config)
        yaml_content = yaml.dump(wf_dict, sort_keys=False, default_flow_style=False, allow_unicode=True)
        return {"filename": config.filename, "yaml": yaml_content}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))