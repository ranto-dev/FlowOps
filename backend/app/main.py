"""Création de l'application FastAPI FlowOps.

``create_app()`` assemble la partie transverse : middlewares (CORS), routeur
MLOps, cycle de vie. Les routes métier restent déclarées dans ``backend/main.py``
le temps de leur extraction vers ``app/routers/`` (voir AGENTS.md).

Ordre d'import critique : ``app.settings`` est importé en premier, il charge
``backend/.env`` avant que quiconque lise l'environnement (dont
``mlops.config``, qui fige ses valeurs à l'import).
"""
from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.settings import CORS_ORIGINS, WORKFLOWS_DIR  # noqa: F401  (WORKFLOWS_DIR est créé au import)

# Routeur MLOps : doit être importé après app.settings (lit l'environnement).
from mlops.api import router as mlops_router


def create_app() -> FastAPI:
    """Construit une instance d'application prête à servir l'API FlowOps.

    Returns:
        L'application FastAPI (CORS + ``/api/mlops/*`` montés).
    """
    app = FastAPI(title="FlowOps API", version="1.0.0")

    app.add_middleware(
        CORSMiddleware,
        allow_origins=CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(mlops_router)
    return app


# Instance unique exportée : `uvicorn main:app` (voir backend/main.py).
app = create_app()
