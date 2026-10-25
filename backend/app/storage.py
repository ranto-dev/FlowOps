"""Stockage local des workflows compilés (``generated_workflows/<project_id>/``).

Chaque projet possède son répertoire :
    * ``<slug>.yaml`` — YAML compilé par ``compiler.py`` (poussé sur GitHub à l'exécution) ;
    * ``config.json`` — configuration brute, pour recharger le formulaire plus tard.

Le dossier est gitignoré (voir AGENTS.md) : il est recréé à chaque save.
Toute absence de fichier lève ``StorageError`` avec le message exact que
l'API renvoyait déjà (contrat API gelé).
"""
from __future__ import annotations

import json
from pathlib import Path
from typing import Any

from app.exceptions import StorageError
from app.settings import WORKFLOWS_DIR


def project_dir(project_id: str) -> Path:
    """Répertoire de stockage d'un projet (créé au besoin par ``save_workflow``)."""
    return WORKFLOWS_DIR / project_id


def save_workflow(
    project_id: str,
    filename: str,
    yaml_content: str,
    config_dump: dict[str, Any],
) -> str:
    """Écrit le YAML compilé et la config JSON du projet.

    Args:
        project_id: Identifiant Mongo du projet.
        filename: Nom de fichier souhaité (``.yaml`` ajouté si l'extension manque).
        yaml_content: YAML compilé à écrire tel quel.
        config_dump: ``config.model_dump()`` à sérialiser en JSON.

    Returns:
        Le nom de fichier finalement écrit (normalisé).
    """
    directory = project_dir(project_id)
    directory.mkdir(parents=True, exist_ok=True)

    base_name = filename if filename.endswith((".yml", ".yaml")) else f"{filename}.yaml"
    (directory / base_name).write_text(yaml_content, encoding="utf-8")
    (directory / "config.json").write_text(
        json.dumps(config_dump, indent=4, ensure_ascii=False),
        encoding="utf-8",
    )
    return base_name


def load_config(project_id: str) -> dict[str, Any]:
    """Charge ``config.json`` du projet.

    Raises:
        StorageError: 404 si absent — l'utilisateur doit d'abord sauvegarder.
    """
    path = project_dir(project_id) / "config.json"
    if not path.exists():
        raise StorageError(
            404,
            "Local config.json file not found. "
            "Please save your workflow configuration first.",
        )
    return json.loads(path.read_text(encoding="utf-8"))


def resolve_yaml_file(project_id: str, preferred_filename: str | None) -> Path:
    """Localise le YAML compilé à exécuter.

    Args:
        project_id: Identifiant Mongo du projet.
        preferred_filename: ``config.json['filename']`` ; si absent, on prend le
            premier ``.yaml``/``.yml`` du répertoire (comportement historique).

    Raises:
        StorageError: 400 si aucun YAML compilé n'existe, ou si le fichier
            annoncé par la config est manquant.
    """
    directory = project_dir(project_id)

    if preferred_filename:
        path = directory / preferred_filename
        if not path.exists():
            raise StorageError(
                400,
                f"Workflow YAML file ({preferred_filename}) missing from server storage.",
            )
        return path

    yaml_files = [p for p in directory.iterdir() if p.suffix in (".yaml", ".yml")]
    if not yaml_files:
        raise StorageError(
            400,
            "No compiled workflow YAML file found for this project in local storage.",
        )
    return yaml_files[0]
