"""Wrapper MLflow — tracking des runs et Model Registry.

Centralise l'accès à MLflow :
    * création/récupération d'expériences ;
    * démarrage de runs (paramètres, métriques, artefacts) ;
    * enregistrement des modèles sklearn dans le Model Registry ;
    * bascule d'une version vers le stage Production ;
    * chargement du modèle Production (version active).
"""
from __future__ import annotations

import logging
import os

import mlflow
from mlflow.tracking import MlflowClient

from mlops.config import (
    MLFLOW_REGISTRY_MODEL_NAMES,
    MLFLOW_STAGE_PRODUCTION,
    MLFLOW_TRACKING_URI,
)

logger = logging.getLogger(__name__)

os.environ.setdefault("MLFLOW_DISABLE_AGENT_HINT", "1")
mlflow.set_tracking_uri(MLFLOW_TRACKING_URI)


def get_client() -> MlflowClient:
    return MlflowClient(tracking_uri=MLFLOW_TRACKING_URI)


def ensure_experiment(name: str) -> str:
    """Crée si besoin l'expérience et retourne son identifiant."""
    client = get_client()
    try:
        exp = client.get_experiment_by_name(name)
    except Exception:
        exp = None
    if exp is None:
        return client.create_experiment(name)
    return exp.experiment_id


def registry_name(kind: str) -> str:
    """Nom du modèle enregistré (flowops-duration-model / flowops-failure-model)."""
    return MLFLOW_REGISTRY_MODEL_NAMES[kind]


def log_model_version(kind: str, model, run_id: str, artifact_path: str = "model",
                      tags: dict | None = None) -> int | None:
    """Enregistre le modèle dans le Model Registry et retourne la version.

    Source du modèle : le run MLflow courant + l'artefact ``model``.
    """
    client = get_client()
    name = registry_name(kind)
    source = f"{run_id}/{artifact_path}"

    # Crée le registered model à la première version
    try:
        client.create_registered_model(name, tags=tags or {})
    except Exception:
        pass  # le modèle existe déjà

    try:
        version = client.create_model_version(
            name=name, source=source, run_id=run_id,
            tags=tags or {},
        )
    except Exception as exc:  # pragma: no cover - dépend de la configuration MLflow
        logger.warning("Impossible d'enregistrer '%s' : %s", name, exc)
        return None
    return version.version


def transition_to_production(kind: str, version: int) -> None:
    """Bascule une version du Model Registry vers le stage Production."""
    client = get_client()
    name = registry_name(kind)
    try:
        client.transition_model_version_stage(name, version, MLFLOW_STAGE_PRODUCTION)
        logger.info("%s version %s -> stage Production", name, version)
    except Exception as exc:
        logger.warning("Transition impossible (%s v%s) : %s", name, version, exc)


def get_production_version(kind: str) -> dict | None:
    """Retourne les infos de la version Production du modèle (ou None)."""
    name = registry_name(kind)
    client = get_client()
    try:
        versions = client.search_model_versions(f"name = '{name}'")
    except Exception:
        versions = []
    prod = [v for v in versions if v.current_stage == MLFLOW_STAGE_PRODUCTION]
    if not prod:
        prod = [v for v in versions if v.tags.get("stage") == "production"]
    if not prod:
        return None
    latest = max(prod, key=lambda v: int(v.version))
    return {
        "name": name,
        "version": int(latest.version),
        "stage": "production",
        "run_id": latest.run_id,
        "status": latest.status,
    }


def get_run_metrics(run_id: str) -> dict:
    client = get_client()
    try:
        run = client.get_run(run_id)
        return {k: v.value for k, v in run.data.metrics.items()}
    except Exception:
        return {}


def log_registered_model(model_info, kind: str) -> int | None:
    """Enregistre le modèle loggé dans le registry (variante simple)."""
    name = registry_name(kind)
    client = get_client()
    try:
        client.create_registered_model(name)
    except Exception:
        pass
    try:
        version = client.create_model_version(
            model_name=name, source=model_info.model_uri,
            run_id=model_info.run_id,
        )
        return version.version
    except Exception as exc:
        logger.warning("Enregistrement échoué : %s", exc)
        return None