"""Fonctions utilitaires partagées par les routeurs."""
from __future__ import annotations

from typing import Any


def format_project(project: dict[str, Any]) -> dict[str, Any]:
    """Projette un document Mongo vers la forme API consommée par le frontend.

    Args:
        project: Document de la collection ``projects`` (avec ``_id`` en ObjectId).

    Returns:
        Dictionnaire avec ``id`` en chaîne (les ObjectId ne sont pas JSON).
    """
    return {
        # Convertit l'ObjectId en simple chaîne de caractères
        "id": str(project["_id"]),
        "name": project["name"],
        "description": project["description"],
        "repository": project["repository"],
        "has_workflow": project.get("has_workflow", False),
        "yaml_filename": project.get("yaml_filename", None),
    }
