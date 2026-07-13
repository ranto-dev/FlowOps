from fastapi import FastAPI, HTTPException
import yaml
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