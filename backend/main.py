# backend/main.py
from fastapi import FastAPI, HTTPException
import yaml
import os
from config import setup_cors
from schemas import FlowOpsWorkflowSchema
from compiler import compile_flowops_workflow

app = FastAPI(title="FlowOps Core Engine", version="6.0.0")
setup_cors(app)

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