"""Création de l'application FastAPI FlowOps.

``create_app()`` assemble la partie transverse : middlewares (CORS),
cycle de vie (index MongoDB, fermeture du client HTTP GitHub), conversion
des erreurs métier en réponses JSON et routeur MLOps. Les routes métier
restent déclarées dans ``backend/main.py`` le temps de leur extraction
vers ``app/routers/`` (voir AGENTS.md).

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

    app.include_router(mlops_router)
    return app


# Instance unique exportée : `uvicorn main:app` (voir backend/main.py).
app = create_app()
