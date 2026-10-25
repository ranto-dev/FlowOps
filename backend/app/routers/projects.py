"""Routes CRUD des projets (collection Mongo ``projects``).

Toutes les routes sont isolées par utilisateur : ``CurrentUserDep`` résout
l'identité GitHub, ``OwnedProjectDep`` vérifie la propriété (404 sinon).

Routes :
    * ``POST   /api/projects``         — création ;
    * ``GET    /api/projects``         — liste triée par dernière modification ;
    * ``DELETE /api/projects/{id}``    — suppression.
"""
from __future__ import annotations

import datetime

from bson import ObjectId
from fastapi import APIRouter, HTTPException

from app.database import projects_collection
from app.dependencies import CurrentUserDep, OwnedProjectDep
from app.schemas import ProjectCreateRequest
from app.utils import format_project

router = APIRouter()


@router.post("/api/projects")
async def create_project(req: ProjectCreateRequest, user: CurrentUserDep):
    """Crée un projet rattaché à l'utilisateur GitHub connecté."""
    new_project = {
        "name": req.name.strip(),
        "description": req.description.strip(),
        "repository": req.repository.strip(),
        "github_id": user.github_id,
        "created_by": user.username,
        "has_workflow": False,
        # Datetimes explicites en UTC (datetime.utcnow() est déprécié depuis 3.12)
        "created_at": datetime.datetime.now(datetime.timezone.utc),
        "updated_at": datetime.datetime.now(datetime.timezone.utc),
    }

    # Insertion dans MongoDB
    result = await projects_collection.insert_one(new_project)
    inserted_project = await projects_collection.find_one({"_id": result.inserted_id})
    return format_project(inserted_project)


@router.get("/api/projects")
async def list_projects(user: CurrentUserDep):
    """Liste les projets du seul utilisateur connecté, triés par ordre descendant."""
    projects_list = []

    cursor = (
        projects_collection.find({"github_id": user.github_id})
        .sort("updated_at", -1)
    )

    async for document in cursor:
        projects_list.append(format_project(document))

    return projects_list


@router.delete("/api/projects/{project_id}")
async def delete_project(owned: OwnedProjectDep):
    """Supprime un projet (uniquement s'il appartient à l'utilisateur)."""
    result = await projects_collection.delete_one({"_id": ObjectId(owned.project_id)})

    # Si le projet n'existait plus (course avec une autre suppression)
    if result.deleted_count == 0:
        raise HTTPException(
            status_code=404, detail="Projet introuvable, impossible de le supprimer."
        )

    return {
        "status": "success",
        "message": f"Project {owned.project_id} successfully deleted from database.",
    }
