"""Création de l'application FastAPI FlowOps.

``create_app()`` assemble la partie transverse : middlewares (CORS),
cycle de vie (index MongoDB, fermeture du client HTTP GitHub), conversion
des erreurs métier en réponses JSON et les routeurs métier
(``app.routers``). Le module racine ``backend/main.py`` se contente de
réexporter l'instance : ``uvicorn main:app`` reste la commande historique.

Ordre d'import critique : ``app.settings`` est importé en premier, il charge
``backend/.env`` avant que quiconque lise l'environnement (dont
``mlops.config``, qui fige ses valeurs à l'import).
"""
from __future__ import annotations

import logging
from contextlib import asynccontextmanager
from typing import TYPE_CHECKING

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app import github_client
from app.database import ensure_indexes
from app.exceptions import ServiceError
from app.routers import auth, logs, projects, workflows
from app.settings import CORS_ORIGINS, WORKFLOWS_DIR  # noqa: F401  (WORKFLOWS_DIR est créé au import)

# Routeur MLOps : doit être importé après app.settings (lit l'environnement).
from mlops.api import router as mlops_router

if TYPE_CHECKING:  # pragma: no cover
    from collections.abc import AsyncIterator

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(_app: FastAPI) -> AsyncIterator[None]:
    """Cycle de vie : index MongoDB à l'ouverture, client HTTP GitHub à la fermeture."""
    await ensure_indexes()  # best-effort (MongoDB peut être absent au démarrage)
    yield
    await github_client.aclose()


def service_error_handler(request: Request, exc: ServiceError) -> JSONResponse:
    """Convertit une ``ServiceError`` en JSON ``{"detail": ...}`` (contrat frontend)."""
    logger.debug("ServiceError sur %s : %s", request.url.path, exc.detail)
    return JSONResponse(status_code=exc.status_code, content={"detail": exc.detail})


def create_app() -> FastAPI:
    """Construit une instance d'application prête à servir l'API FlowOps.

    Returns:
        L'application FastAPI (CORS + ``/api/mlops/*`` montés).
    """
    app = FastAPI(title="FlowOps API", version="1.0.0", lifespan=lifespan)

    app.add_middleware(
        CORSMiddleware,
        allow_origins=CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Erreurs métier (GitHub, stockage) -> même format que HTTPException.
    app.add_exception_handler(ServiceError, service_error_handler)

    # Routeurs métier (URLs exactes portées par chaque module de app/routers/).
    app.include_router(auth.router)
    app.include_router(projects.router)
    app.include_router(workflows.router)
    app.include_router(logs.router)
    app.include_router(mlops_router)
    return app


# Instance unique exportée : `uvicorn main:app` (voir backend/main.py).
app = create_app()
