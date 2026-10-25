"""API FlowOps — point d'entrée d'exécution (``uvicorn main:app``).

L'instance ``app`` est assemblée par ``app.main.create_app()`` : configuration
(``app.settings``), CORS, cycle de vie (index MongoDB, client HTTP GitHub),
conversion des erreurs métier, routeurs métier (``app.routers``) et routeur
MLOps (``mlops.api``).

Ce module ne fait que la réexporter pour que la commande historique
``uvicorn main:app`` continue de fonctionner (cf. AGENTS.md).
"""
from app.main import app  # noqa: F401

__all__ = ["app"]
