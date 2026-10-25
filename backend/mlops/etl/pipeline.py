"""ETL - Pipeline complet (Extraction -> Transformation -> Chargement).

Usage :
    python -m mlops.etl.pipeline
"""
from __future__ import annotations

from mlops.config import (
    CLASSIFICATION_DATASET_CSV,
    REGRESSION_DATASET_CSV,
)
from mlops.etl.extract import extract
from mlops.etl.load import load
from mlops.etl.transform import transform
from mlops.features.engineering import engineer_training_datasets


def run_etl(verbose: bool = True) -> dict:
    """Exécute l'ETL complet et le feature engineering des datasets."""
    if verbose:
        print("=== ETL : EXTRACTION ===")
    data = extract()
    if verbose:
        print("\n=== ETL : TRANSFORMATION ===")
    processed = transform(
        data["runs"], data["workflows"], data["jobs"], data["steps"]
    )
    if verbose:
        print(f"[transform] {len(processed)} exécutions propres")
    load(processed)

    if verbose:
        print("\n=== FEATURE ENGINEERING (datasets d'entraînement) ===")
    regression, classification = engineer_training_datasets(processed)
    regression.to_csv(REGRESSION_DATASET_CSV, index=False)
    classification.to_csv(CLASSIFICATION_DATASET_CSV, index=False)

    if verbose:
        print(f"[features] régression       -> {REGRESSION_DATASET_CSV} "
              f"({len(regression)} lignes)")
        print(f"[features] classification   -> {CLASSIFICATION_DATASET_CSV} "
              f"({len(classification)} lignes)")

    return {
        "processed": processed,
        "regression": regression,
        "classification": classification,
    }


if __name__ == "__main__":
    run_etl()