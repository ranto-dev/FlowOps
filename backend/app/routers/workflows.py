"""Routes de compilation, de stockage et d'exécution des workflows.

Routes :
    * ``POST /api/generate-workflow``          — compilation (prévisualisation) ;
    * ``POST /api/projects/{id}/workflow``     — compilation + écriture locale ;
    * ``POST /api/projects/{id}/execute``      — push GitHub + repository dispatch.

Les erreurs GitHub/stockage sont levées en ``ServiceError`` (voire
``HTTPException``) et sérialisées en ``{"detail": ...}`` par le handler de
``app.main.create_app()``.
"""
from __future__ import annotations

import logging

import yaml
from bson import ObjectId
from fastapi import APIRouter, HTTPException

from app import storage
from app.database import projects_collection
from app.dependencies import OwnedProjectDep
from app.github_client import create_dispatch, normalize_repo_slug, push_workflow_file
from compiler import compile_flowops_workflow
from schemas import FlowOpsWorkflowSchema

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("/api/generate-workflow")
async def generate_workflow(config: FlowOpsWorkflowSchema):
    """Compile le schéma FlowOps en YAML GitHub Actions (prévisualisation)."""
    try:
        wf_dict = compile_flowops_workflow(config)
        yaml_content = yaml.dump(
            wf_dict, sort_keys=False, default_flow_style=False, allow_unicode=True
        )
        return {"filename": config.filename, "yaml": yaml_content}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/api/projects/{project_id}/workflow")
async def save_project_workflow(
    config: FlowOpsWorkflowSchema,
    owned: OwnedProjectDep,
):
    """Compile et sauvegarde un workflow pour un projet appartenant à l'utilisateur."""
    try:
        # 1. Compilation du schéma FlowOps vers le dictionnaire au format GitHub Actions
        wf_dict = compile_flowops_workflow(config)
        yaml_content = yaml.dump(
            wf_dict, sort_keys=False, default_flow_style=False, allow_unicode=True
        )

        # 2. Écriture locale (YAML compilé + config.json brute) dans le dossier du projet
        base_name = storage.save_workflow(
            owned.project_id,
            config.filename,
            yaml_content,
            config.model_dump(),
        )

        # 3. Mise à jour du flag du projet directement dans MongoDB
        await projects_collection.update_one(
            {"_id": ObjectId(owned.project_id)},
            {"$set": {"has_workflow": True, "yaml_filename": base_name}},
        )

        return {
            "status": "success",
            "message": "Workflow saved locally in project directory",
            "yaml_filename": base_name,
        }

    except Exception as exc:
        logger.exception("Échec de sauvegarde du workflow du projet %s", owned.project_id)
        raise HTTPException(status_code=500, detail=f"Internal Server Error: {str(exc)}")


@router.post("/api/projects/{project_id}/execute")
async def execute_project_workflow(owned: OwnedProjectDep):
    """
    Déclencheur d'exécution séquentiel :
    1. Récupère le projet depuis MongoDB pour extraire le dépôt lié.
    2. Lit la configuration locale (config.json) et le fichier YAML compilé.
    3. Commit & Push le fichier YAML sur GitHub (.github/workflows/).
    4. Envoie le signal Repository Dispatch pour l'action GitHub.
    """
    project = owned.project
    user = owned.user

    # ─── 1. RÉCUPÉRATION DU DÉPÔT CIBLE ───
    repo = project.get("repository")
    if not repo:
        raise HTTPException(
            status_code=400,
            detail="No GitHub repository linked to this project in database",
        )

    # Sécurité : si l'utilisateur a entré une URL complète, on extrait le slug
    repo = normalize_repo_slug(repo)

    # ─── 2. RÉCUPÉRATION DE LA CONFIGURATION ET DU YAML LOCAL ───
    config_data = storage.load_config(owned.project_id)
    yaml_path = storage.resolve_yaml_file(owned.project_id, config_data.get("filename"))
    yaml_filename = yaml_path.name
    yaml_content = yaml_path.read_text(encoding="utf-8")

    # ─── ÉTAPE 3 : PUSH DU FICHIER SUR GITHUB (.github/workflows/) ───
    await push_workflow_file(user.token, repo, yaml_filename, yaml_content)

    # ─── ÉTAPE 4 : ENVOI DU REPOSITORY DISPATCH TRIGGER ───
    await create_dispatch(user.token, repo, project.get("name", "FlowOps Project"))

    return {
        "status": "success",
        "message": f"Configuration file '{yaml_filename}' was successfully committed to branch 'main' "
        f"and execution event ('flowops_trigger') dispatched to {repo}!",
    }
