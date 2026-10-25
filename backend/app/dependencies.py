"""Dépendances FastAPI communes : jeton, identité résolue, propriété de projet.

Ces dépendances centralisent le contrôle d'authentification qui était
dupliqué en tête de chaque route dans ``main.py``. Ordre de résolution
garanti (dépendances déclarées dans cet ordre dans les signatures) :

    1. 401 si l'en-tête ``Authorization: Bearer`` est absent/illégitime ;
    2. 401 si le token est expiré ou le profil GitHub illisible ;
    3. 400 si l'ID de projet n'est pas un ObjectId hexadécimal valide ;
    4. 404 si le projet n'existe pas **ou** n'appartient pas à l'utilisateur
       (même message dans les deux cas : l'isolation par utilisateur ne doit
       pas révéler l'existence des projets d'autrui).
"""
from __future__ import annotations

from dataclasses import dataclass
from typing import Annotated

from bson import ObjectId
from fastapi import Depends, Header, HTTPException, Path

from app import github_auth
from app.database import projects_collection

MISSING_TOKEN_MSG = "Missing or invalid GitHub Access Token. Please log in again."
INVALID_ID_MSG = "Format d'ID de projet invalide"
NOT_FOUND_MSG = "Project not found in database"


@dataclass(frozen=True)
class CurrentUser:
    """Utilisateur GitHub authentifié pour la requête en cours."""

    token: str
    github_id: str
    username: str
    avatar_url: str


@dataclass(frozen=True)
class OwnedProject:
    """Projet chargé depuis Mongo, vérifié comme appartenant à ``user``."""

    project_id: str
    project: dict
    user: CurrentUser


async def get_current_user(
    authorization: Annotated[str | None, Header()] = None,
) -> CurrentUser:
    """Résout l'utilisateur derrière ``Authorization: Bearer <token GitHub>``.

    Raises:
        HTTPException: 401 si le token est absent ou l'identité illisible.
    """
    token = None
    if authorization and authorization.startswith("Bearer "):
        token = authorization.split(" ", 1)[1].strip() or None
    if not token:
        raise HTTPException(status_code=401, detail=MISSING_TOKEN_MSG)

    github_id, username, avatar_url = await github_auth.resolve_user(token)
    return CurrentUser(
        token=token,
        github_id=github_id,
        username=username,
        avatar_url=avatar_url,
    )


async def get_owned_project(
    user: Annotated[CurrentUser, Depends(get_current_user)],
    project_id: str = Path(..., description="L'identifiant hexadécimal MongoDB du projet"),
) -> OwnedProject:
    """Charge un projet et vérifie qu'il appartient à l'utilisateur connecté.

    Raises:
        HTTPException: 400 (ID invalide) ou 404 (inexistant / non propriétaire).
    """
    if not ObjectId.is_valid(project_id):
        raise HTTPException(status_code=400, detail=INVALID_ID_MSG)

    project = await projects_collection.find_one({"_id": ObjectId(project_id)})
    if not project:
        raise HTTPException(status_code=404, detail=NOT_FOUND_MSG)

    # Isolation multi-utilisateurs : 404 identique à « projet inexistant ».
    if str(project.get("github_id", "")) != user.github_id:
        raise HTTPException(status_code=404, detail=NOT_FOUND_MSG)

    return OwnedProject(project_id=project_id, project=project, user=user)


# Alias courts utilisés dans les signatures de routes.
CurrentUserDep = Annotated[CurrentUser, Depends(get_current_user)]
OwnedProjectDep = Annotated[OwnedProject, Depends(get_owned_project)]
