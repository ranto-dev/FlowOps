# backend/compiler.py
import yaml
from typing import Dict, Any
from schemas import FlowOpsWorkflowSchema

class LiteralStr(str):
    pass

def literal_presenter(dumper, data):
    if '\n' in data:
        return dumper.represent_scalar('tag:yaml.org,2002:str', data, style='|')
    return dumper.represent_scalar('tag:yaml.org,2002:str', data)

yaml.add_representer(LiteralStr, literal_presenter)

def compile_flowops_workflow(config: FlowOpsWorkflowSchema) -> dict:
    event_dict = {}
    branch_list = [b.strip() for b in config.branches.split(",") if b.strip()]
    
    # 1. On compile les événements classiques choisis par l'utilisateur (push, pull_request, etc.)
    for event in config.on_events:
        if event in ["push", "pull_request"] and branch_list:
            event_dict[event] = {"branches": branch_list}
        else:
            event_dict[event] = {}

    # 2. CONFIGURATION DU DISPATCH : On force l'écoute de l'événement d'API FlowOps
    # Cela permet au bouton "Execute Workflow" de fonctionner quoi qu'il arrive
    event_dict["repository_dispatch"] = {
        "types": ["flowops_trigger"]
    }

    global_env_dict = {}
    if config.global_env:
        for line in config.global_env.split("\n"):
            if "=" in line:
                k, v = line.split("=", 1)
                global_env_dict[k.strip()] = v.strip()

    jobs_dict = {}
    for j in config.jobs:
        job_spec: Dict[str, Any] = {"runs-on": j.runs_on}
        
        if j.needs:
            job_spec["needs"] = j.needs
            
        if j.job_if:
            job_spec["if"] = j.job_if

        if j.matrix_key and j.matrix_values:
            vals = [v.strip() for v in j.matrix_values.split(",") if v.strip()]
            if vals:
                job_spec["strategy"] = {"matrix": {j.matrix_key.strip(): vals}}

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
                text = s.custom_script.replace('\r\n', '\n') if s.custom_script else "echo 'FlowOps Script Running'"
                step_entry["run"] = LiteralStr(text) if '\n' in text else text.strip()

            compiled_steps.append(step_entry)

        job_spec["steps"] = compiled_steps
        job_id = j.name.lower().replace(" ", "-").replace("'", "-")
        jobs_dict[job_id] = job_spec

    output = {"name": config.name, "on": event_dict}
    if global_env_dict:
        output["env"] = global_env_dict
    output["jobs"] = jobs_dict
    
    return output