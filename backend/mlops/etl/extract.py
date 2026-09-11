"""ETL - Étape 1 : EXTRACTION.

Charge les fichiers RAW (runs, définitions de workflows, jobs, steps) produits
par la collecte dans des DataFrames pandas.
"""
from __future__ import annotations

import pandas as pd

from mlops.config import (
    RAW_RUNS_CSV, RAW_WORKFLOWS_CSV, RAW_JOBS_CSV, RAW_STEPS_CSV,
)
from mlops.config import ensure_dirs


def extract() -> dict[str, pd.DataFrame]:
    """Charge les 4 tables RAW et retourne un dictionnaire {nom: DataFrame}."""
    ensure_dirs()

    def _read(path, name):
        if not path.exists():
            raise FileNotFoundError(
                f"[extract] Fichier RAW introuvable : {path}. "
                f"Lancez d'abord la collecte (python -m mlops.collection.collect) "
                f"ou la génération du jeu de démo (python -m mlops.data.sample_data)."
            )
        df = pd.read_csv(path)
        print(f"[extract]  {name:20s} : {len(df):>6} lignes <- {path.name}")
        return df

    return {
        "runs": _read(RAW_RUNS_CSV, "workflow_runs"),
        "workflows": _read(RAW_WORKFLOWS_CSV, "workflow_definitions"),
        "jobs": _read(RAW_JOBS_CSV, "jobs"),
        "steps": _read(RAW_STEPS_CSV, "steps"),
    }


if __name__ == "__main__":
    data = extract()
    print("\nSchéma chargé :", ", ".join(data.keys()))