"""Modèles de requête Pydantic de l'API (contrat JSON d'entrée).

Attention : le schéma ``FlowOpsWorkflowSchema`` du reste du projet (éditeur
de workflow) vit dans ``backend/schemas.py``, à côté de ``compiler.py`` —
il est importé tel quel par les routeurs workflow.
"""
from __future__ import annotations

from pydantic import BaseModel


class LoginCheckRequest(BaseModel):
    """Corps de ``POST /api/auth/check-login`` (Device Flow GitHub)."""

    device_code: str


class ProjectCreateRequest(BaseModel):
    """Corps de ``POST /api/projects``."""

    name: str
    description: str
    repository: str
