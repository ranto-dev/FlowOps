"""ETL - Étape 3 : CHARGEMENT.

Persiste le dataset propre dans ``data/processed/`` :
    * ``workflow_dataset.csv``     : une ligne par exécution (analytique) ;
    * ``prediction_dataset.csv``   : version allégée utilisée pour calculer les
      features historiques au moment de la prédiction.
"""
from __future__ import annotations

import pandas as pd

from mlops.config import (
    PROCESSED_DATASET_CSV, PREDICTION_DATASET_CSV,
)

CARRIED_PREDICTION_COLUMNS = [
    "run_id",
    "repository",
    "workflow_name",
    "workflow_filename",
    "trigger_event",
    "branch",
    "conclusion",
    "started_at",
    "duration_seconds",
    "workflow_failed",
]


def load(processed: pd.DataFrame) -> None:
    processed.to_csv(PROCESSED_DATASET_CSV, index=False)
    print(f"[load]  dataset analytique      -> {PROCESSED_DATASET_CSV}")

    cols = [c for c in CARRIED_PREDICTION_COLUMNS if c in processed.columns]
    prediction = processed[cols].copy()
    prediction.to_csv(PREDICTION_DATASET_CSV, index=False)
    print(f"[load]  dataset historique      -> {PREDICTION_DATASET_CSV}")