"""API FastAPI — endpoints MLOps de FlowOps.

Montés dans ``main.py`` sous le préfixe ``/api/mlops`` :

    GET    /status        état du pipeline, modèles actifs + monitoring
    GET    /models        détails des modèles en production + évaluations
    POST   /predict       prédit durée + risque depuis une config FlowOps
    POST   /retrain       relance le pipeline sur les données collectées
    POST   /log-actual    renseigne la durée/réussite réelle d'une exécution
    GET    /monitoring    suivi des prédictions (logs CSV + drift prédit/réel)
"""
from __future__ import annotations

import json
import logging
from pathlib import Path

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, ConfigDict, Field

from mlops.config import (
    CLASSIFICATION_DATASET_CSV,
    EVALUATION_DIR,
    MODELS_DIR,
    PROCESSED_DIR,
    REGRESSION_DATASET_CSV,
)
from mlops.inference.predictor import ModelNotDeployedError, get_predictor
from mlops.monitoring.tracker import (
    get_status,
    log_actual,
    log_prediction,
)
from mlops.pipeline import run_pipeline

router = APIRouter(prefix="/api/mlops", tags=["mlops"])
logger = logging.getLogger(__name__)


# --- MODÈLES DE REQUÊTE ---
class PredictRequest(BaseModel):
    """Config low-code (stricto sensu FlowOpsWorkflowSchema, tolérant aux
    champs supplémentaires : on_events, branches, jobs[].steps[])."""

    model_config = ConfigDict(extra="allow")

    name: str = "workflow"
    repository: str = ""
    on_events: list[str] = Field(default_factory=lambda: ["push"])
    branches: str = "main"
    jobs: list[dict[str, object]] = Field(default_factory=list)


class LogActualRequest(BaseModel):
    workflow_name: str
    repository: str = ""
    duration_seconds: float | None = None
    failed: bool | None = None


# --- HELPERS ---
def _active_models_info() -> dict:
    from mlops.inference.predictor import _load_production

    info: dict = {}
    for kind in ("duration", "failure"):
        try:
            pipe, meta = _load_production(kind)
            info[kind] = {
                "deployed": True,
                "version": meta.get("version"),
                "algorithm": meta.get("algorithm"),
                "training_date": meta.get("training_date"),
                "dataset_version": meta.get("dataset_version"),
                "threshold": meta.get("threshold"),
                "metrics": (meta.get("metrics") or {}).get("test", {}),
                "mlflow_run_id": meta.get("mlflow_run_id"),
            }
        except ModelNotDeployedError:
            info[kind] = {"deployed": False}
    return info


def _read_evaluation() -> dict:
    out: dict = {}
    for name in ("duration_evaluation.json", "failure_evaluation.json"):
        path = Path(EVALUATION_DIR) / name
        if path.exists():
            try:
                out[name.split("_")[0]] = json.loads(
                    path.read_text(encoding="utf-8")
                )
            except (OSError, json.JSONDecodeError) as exc:
                logger.exception("Rapport MLOps illisible : %s", path.name)
                raise HTTPException(
                    status_code=500,
                    detail="Un rapport d'évaluation MLOps est illisible.",
                ) from exc
    return out


def _count_dataset_rows(path: Path) -> int:
    """Compte les lignes de données CSV en excluant l'en-tête."""
    if not path.exists():
        return 0
    try:
        with path.open(encoding="utf-8") as dataset:
            return max(sum(1 for _ in dataset) - 1, 0)
    except OSError as exc:
        logger.exception("Dataset MLOps illisible : %s", path.name)
        raise HTTPException(
            status_code=500,
            detail="Impossible de lire les datasets MLOps.",
        ) from exc


# --- ENDPOINTS ---
@router.get("/status")
async def mlops_status():
    info = _active_models_info()
    eval_reports = _read_evaluation()
    monitoring = get_status(info)
    return {
        "models": info,
        "evaluations": eval_reports,
        "monitoring": monitoring,
        "data": {
            "regression_rows": _count_dataset_rows(REGRESSION_DATASET_CSV),
            "classification_rows": _count_dataset_rows(CLASSIFICATION_DATASET_CSV),
        },
        "note": (
            "Dataset de démonstration : les modèles ont été entraînés sur des "
            "données synthétiques. Relancez le pipeline sur de vraies données "
            "GitHub via POST /api/mlops/retrain."
        ),
    }


@router.get("/models")
async def mlops_models():
    info = _active_models_info()
    registry = {}
    registry_path = Path(MODELS_DIR) / "registry.json"
    if registry_path.exists():
        registry = json.loads(registry_path.read_text(encoding="utf-8"))
    return {
        "active": info,
        "registry": registry,
        "evaluations": _read_evaluation(),
    }


@router.post("/predict")
async def predict(req: PredictRequest):
    try:
        result = get_predictor().predict(req.model_dump())
    except Exception as exc:
        logger.exception("Prédiction MLOps échouée.")
        raise HTTPException(
            status_code=500,
            detail="Le service de prédiction MLOps a échoué.",
        ) from exc

    log_prediction(result)
    result["logged"] = True
    return result


@router.post("/retrain")
async def retrain():
    get_predictor()._pipes.clear()
    get_predictor()._metas.clear()

    try:
        import asyncio
        summary = await asyncio.to_thread(run_pipeline, False, False, None, None)
    except Exception as exc:
        logger.exception("Réentraînement du pipeline MLOps échoué.")
        raise HTTPException(
            status_code=500,
            detail="Le réentraînement du pipeline MLOps a échoué.",
        ) from exc

    get_predictor().reload()
    return {"status": "success", "summary": summary, "message":
            "Pipeline retrainé. Les modèles rechargés sont désormais actifs."}


@router.post("/log-actual")
async def log_actual_endpoint(req: LogActualRequest):
    log_actual(req.workflow_name, req.repository, req.duration_seconds, req.failed)
    info = _active_models_info()
    monitoring = get_status(info)
    return {
        "status": "success",
        "message": "Réel enregistré pour la dernière prédiction correspondante.",
        "monitoring": monitoring,
    }


@router.get("/monitoring")
async def monitoring():
    return get_status(_active_models_info())


@router.get("/dataset-locations")
async def dataset_locations():
    return {
        "raw": str((PROCESSED_DIR.parent / "raw").resolve()),
        "processed": str(PROCESSED_DIR.resolve()),
        "features": {
            "regression": str(REGRESSION_DATASET_CSV),
            "classification": str(CLASSIFICATION_DATASET_CSV),
        },
        "evaluation": str(EVALUATION_DIR.resolve()),
        "models": str(MODELS_DIR.resolve()),
    }