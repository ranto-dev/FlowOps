"""Routes d'authentification (GitHub Device Flow) et de listing des dépôts.

Routes :
    * ``GET  /api/auth/status``        — configuration OAuth de l'app ;
    * ``POST /api/auth/device-code``   — demande de code d'appareil ;
    * ``POST /api/auth/check-login``   — polling du consentement + profil ;
    * ``GET  /api/github/repositories``— dépôts visibles par l'utilisateur.
"""
from __future__ import annotations

from fastapi import APIRouter, HTTPException

from app import github_auth
from app.dependencies import CurrentUserDep
from app.github_client import list_repositories
from app.schemas import LoginCheckRequest
from app.settings import GITHUB_CONFIG_MISSING_MSG, GITHUB_CONFIG_READY, GITHUB_MISSING_VARS

router = APIRouter()

# Base de données en mémoire pour l'inscription/connexion FlowOps.
# À basculer dans MongoDB — voir AGENTS.md (persistance des users).
USERS_DB: dict[str, dict] = {}


@router.get("/api/auth/status")
async def auth_status():
    """Indique si l'application est correctement configurée côté GitHub."""
    return {
        "configured": GITHUB_CONFIG_READY,
        "missing_env_vars": [] if GITHUB_CONFIG_READY else GITHUB_MISSING_VARS,
        "message": None if GITHUB_CONFIG_READY else GITHUB_CONFIG_MISSING_MSG,
    }


@router.post("/api/auth/device-code")
async def get_device_code():
    """Demande un code d'activation d'appareil à l'API GitHub (Device Flow)."""
    if not GITHUB_CONFIG_READY:
        raise HTTPException(status_code=500, detail=GITHUB_CONFIG_MISSING_MSG)
    return await github_auth.request_device_code()


@router.post("/api/auth/check-login")
async def check_login(req: LoginCheckRequest):
    """Polling adaptatif : valide le consentement et récupère le profil GitHub.

    Dès que GitHub répond avec un ``access_token``, l'utilisateur est connecté
    et son profil est enregistré (inscription ou connexion).
    """
    if not GITHUB_CONFIG_READY:
        raise HTTPException(status_code=500, detail=GITHUB_CONFIG_MISSING_MSG)

    result = await github_auth.exchange_device_code(req.device_code)
    if result["status"] == "pending":
        return {"status": "pending", "error": result["error"]}

    github_id = result["github_id"]
    username = result["username"]
    avatar_url = result["avatar_url"]

    # Gestion Inscription / Connexion en BDD mémoire
    is_new_user = False
    if github_id not in USERS_DB:
        USERS_DB[github_id] = {"username": username, "avatar_url": avatar_url}
        is_new_user = True

    return {
        "status": "success",
        "token": result["access_token"],
        "github_id": github_id,
        "username": username,
        "avatar_url": avatar_url,
        "is_new_user": is_new_user,
    }


@router.get("/api/github/repositories")
async def get_github_repositories(user: CurrentUserDep):
    """Liste les dépôts GitHub accessibles à l'utilisateur connecté."""
    repos = await list_repositories(user.token)
    return [{"id": r["id"], "full_name": r["full_name"]} for r in repos]
