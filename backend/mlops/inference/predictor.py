"""Service d'INFÉRENCE — prédictions de durée et de risque d'échec.

Indépendant du frontend React : il reçoit une configuration de workflow
normalisée, la transforme en features (mêmes fonctions que l'entraînement),
charge les modèles validés (``models/<kind>/production/``) et retourne une
structure normalisée :

    {
      "duration_seconds": 128.5,
      "failure_probability": 0.23,
      "failure_percentage": 23.0,
      "risk_level": "low",
      ...
    }
"""
from __future__ import annotations

import json
from pathlib import Path

import joblib
import pandas as pd

from mlops.config import (
    MODEL_DIR,
    PREDICTION_DATASET_CSV,
    RISK_LEVEL_LABELS,
    risk_level,
)
from mlops.features.engineering import (
    build_prediction_row,
    features_from_normalized,
    history_features_for,
    normalize_from_lowcode,
)


class ModelNotDeployedError(RuntimeError):
    """Aucun modèle validé disponible pour ce type de prédiction."""


def _load_production(kind: str):
    prod = Path(MODEL_DIR[kind]) / "production"
    pipe_path = prod / "pipeline.joblib"
    meta_path = prod / "metadata.json"
    if not pipe_path.exists():
        raise ModelNotDeployedError(
            f"Aucun modèle {kind} validé déployé. "
            "Lancez : python -m mlops.pipeline"
        )
    meta = {}
    if meta_path.exists():
        meta = json.loads(meta_path.read_text(encoding="utf-8"))
    return joblib.load(pipe_path), meta


def _load_history() -> pd.DataFrame:
    if not PREDICTION_DATASET_CSV.exists():
        return pd.DataFrame()
    return pd.read_csv(PREDICTION_DATASET_CSV)


class Predictor:
    """Charge les modèles au premier appel et les garde en cache."""

    def __init__(self) -> None:
        self._pipes: dict[str, object] = {}
        self._metas: dict[str, dict] = {}

    def _get(self, kind: str):
        if kind not in self._pipes:
            try:
                self._pipes[kind], self._metas[kind] = _load_production(kind)
            except ModelNotDeployedError:
                self._pipes[kind], self._metas[kind] = None, {}
        return self._pipes[kind], self._metas[kind]

    def reload(self) -> None:
        """Recharge les modèles (après un nouvel entraînement)."""
        self._pipes.clear()
        self._metas.clear()

    def predict(self, config: dict) -> dict:
        """Prédit durée + risque depuis une config low-code (FlowOpsWorkflowSchema)."""
        history_df = _load_history()
        normalized = normalize_from_lowcode(config)

        workflow_name = config.get("name") or config.get("workflow_name") or "workflow"
        repository = config.get("repository") or (
            history_df["repository"].iloc[0] if not history_df.empty else None
        )
        history = history_df if not history_df.empty else pd.DataFrame(
            columns=["workflow_name", "repository", "conclusion", "duration_seconds"]
        )
        hist_feats = history_features_for(history, workflow_name, repository)

        duration_pipe, duration_meta = self._get("duration")
        failure_pipe, failure_meta = self._get("failure")

        row = build_prediction_row(normalized, hist_feats)

        out: dict[str, object] = {
            "workflow_name": workflow_name,
            "repository": repository if repository else "",
            "features": features_from_normalized(normalized),
            "history": hist_feats,
            "model": {
                "duration": self._model_info("duration", duration_meta),
                "failure": self._model_info("failure", failure_meta),
            },
        }

        if duration_pipe is not None:
            duration_seconds = float(duration_pipe.predict(row)[0])
            out["duration_seconds"] = round(max(duration_seconds, 0.0), 1)
        else:
            out["duration_seconds"] = None
            out["duration_error"] = "duration model not deployed"

        if failure_pipe is not None:
            failure_probability = float(failure_pipe.predict_proba(row)[0][1])
            thr = float(failure_meta.get("threshold", 0.5))
            out["failure_probability"] = round(failure_probability, 4)
            out["failure_percentage"] = round(failure_probability * 100.0, 1)
            out["predicted_failure"] = bool(failure_probability >= thr)
            out["failure_threshold"] = thr
            out["risk_level"] = risk_level(failure_probability)
            out["risk_level_label"] = RISK_LEVEL_LABELS[out["risk_level"]]
        else:
            out["failure_probability"] = None
            out["failure_percentage"] = None
            out["predicted_failure"] = None
            out["risk_level"] = None
            out["failure_error"] = "failure model not deployed"

        return out

    @staticmethod
    def _model_info(kind: str, meta: dict) -> dict:
        if not meta:
            return {"kind": kind, "deployed": False}
        return {
            "kind": kind,
            "deployed": True,
            "version": meta.get("version"),
            "algorithm": meta.get("algorithm"),
            "training_date": meta.get("training_date"),
            "dataset_version": meta.get("dataset_version"),
            "metrics": (meta.get("metrics") or {}).get("test", {}),
            "features": meta.get("features"),
        }


_predictor = Predictor()


def get_predictor() -> Predictor:
    return _predictor


def predict_from_config(config: dict) -> dict:
    return get_predictor().predict(config)