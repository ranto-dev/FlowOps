"""Suivi (monitoring) des prédictions effectuées par FlowOps.

Première version du prototype : enregistre chaque prédiction dans
``data/monitoring/predictions.csv`` et permet d'obtenir l'état courant des
modèles (version active, date du dernier entraînement, nombre de prédictions,
erreurs prédit/réel quand la durée réelle devient disponible).
"""
from __future__ import annotations

import csv
import json
from datetime import datetime, timezone

import pandas as pd

from mlops.config import MONITORING_DIR, PREDICTIONS_LOG_CSV

_FIELDS = [
    "timestamp", "workflow_name", "repository",
    "duration_predicted", "failure_probability", "risk_level",
    "duration_actual", "failure_actual",
    "model_versions",
]


def ensure_file() -> None:
    MONITORING_DIR.mkdir(parents=True, exist_ok=True)
    if not PREDICTIONS_LOG_CSV.exists():
        with open(PREDICTIONS_LOG_CSV, "w", newline="", encoding="utf-8") as f:
            csv.writer(f).writerow(_FIELDS)


def log_prediction(prediction: dict) -> None:
    """Enregistre une prédiction dans le journal CSV."""
    ensure_file()
    model_versions = prediction.get("model", {})
    row = {
        "timestamp": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "workflow_name": prediction.get("workflow_name", ""),
        "repository": prediction.get("repository", ""),
        "duration_predicted": prediction.get("duration_seconds"),
        "failure_probability": prediction.get("failure_probability"),
        "risk_level": prediction.get("risk_level"),
        "duration_actual": "",
        "failure_actual": "",
        "model_versions": json.dumps(
            {k: (v or {}).get("version") for k, v in model_versions.items()}
        ),
    }
    with open(PREDICTIONS_LOG_CSV, "a", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=_FIELDS)
        writer.writerow(row)


def log_actual(workflow_name: str, repository: str,
               duration_seconds: float | None, failed: bool | None) -> None:
    """Backfill la dernière prédiction sans réel pour un workflow donné."""
    ensure_file()
    df = pd.read_csv(PREDICTIONS_LOG_CSV)
    if df.empty:
        return
    mask = (
        (df["workflow_name"] == workflow_name)
        & (df["duration_actual"].isna() | df["duration_actual"].eq(""))
    )
    if repository:
        mask &= df["repository"].fillna("").eq(repository)
    if not mask.any():
        return
    idx = df.index[mask].max()
    if duration_seconds is not None:
        df.at[idx, "duration_actual"] = float(duration_seconds)
    if failed is not None:
        df.at[idx, "failure_actual"] = int(failed)
    df.to_csv(PREDICTIONS_LOG_CSV, index=False)


def get_status(active_models: dict) -> dict:
    """Compose l'état de monitoring renvoyé par l'API."""
    ensure_file()
    df = pd.read_csv(PREDICTIONS_LOG_CSV)

    n_with_actual = 0
    pred_actual_mae = None
    if not df.empty and "duration_actual" in df.columns:
        mask = ~df["duration_actual"].isna() & ~df["duration_actual"].astype(str).eq("")
        actuals = pd.to_numeric(df.loc[mask, "duration_actual"], errors="coerce")
        preds = pd.to_numeric(df.loc[mask, "duration_predicted"], errors="coerce")
        valid = preds.notna() & actuals.notna()
        n_with_actual = int(valid.sum())
        if n_with_actual:
            pred_actual_mae = float((preds[valid] - actuals[valid]).abs().mean())

    latest = df.tail(10).fillna("").to_dict(orient="records") if not df.empty else []

    return {
        "active_models": active_models,
        "prediction_count": 0 if df.empty else int(len(df)),
        "predictions_with_actual": n_with_actual,
        "drift": {
            "pred_vs_actual_mae_seconds": pred_actual_mae,
            "note": "En production : les erreurs prédit/réel se renseignent dès "
                    "que la durée réelle d'exécution devient disponible.",
        },
        "latest_predictions": latest,
    }