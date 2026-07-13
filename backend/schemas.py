# backend/schemas.py
from pydantic import BaseModel, Field
from typing import List, Optional

class LowCodeStep(BaseModel):
    id: str
    name: str
    type: str  # "checkout", "setup-node", "npm", "docker", "custom-run", "upload-artifact"
    node_version: Optional[str] = None
    npm_command: Optional[str] = None
    docker_image: Optional[str] = None
    docker_registry: Optional[str] = None
    custom_script: Optional[str] = None
    artifact_path: Optional[str] = None
    step_if: Optional[str] = None

class LowCodeJob(BaseModel):
    id: str
    name: str
    runs_on: str = "ubuntu-latest"
    needs: List[str] = []
    matrix_key: Optional[str] = None
    matrix_values: Optional[str] = None
    job_if: Optional[str] = None
    steps: List[LowCodeStep]

class FlowOpsWorkflowSchema(BaseModel):
    filename: str
    name: str
    on_events: List[str]
    branches: str
    global_env: Optional[str] = None
    jobs: List[LowCodeJob]