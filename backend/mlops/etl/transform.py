"""ETL - Étape 2 : TRANSFORMATION.

Nettoie et agrège les tables RAW en un dataset propre de une ligne par
exécution (``prediction/processed/workflow_dataset.csv``) :
    1. suppression des doublons ;
    2. valeurs manquantes ;
    3. types de données ;
    4. conversion des dates ;
    5. calcul des durées ;
    6. agrégation jobs/steps ;
    7. variables dérivées (workflow_failed, workflow_duration, ...) ;
    8. jointure avec les features de configuration des workflows.
"""
from __future__ import annotations

import pandas as pd

from mlops.config import INTERNAL_COLUMNS


def _parse_time(series: pd.Series) -> pd.Series:
    return pd.to_datetime(series, utc=True, errors="coerce")


def _aggregate_steps(steps: pd.DataFrame) -> pd.DataFrame:
    """Agrège les steps par run : compteurs réussis / échoués / ignorés."""
    if steps.empty:
        return pd.DataFrame(
            columns=[
                "run_id",
                "number_of_successful_steps",
                "number_of_failed_steps",
                "number_of_skipped_steps",
            ]
        )

    base = pd.DataFrame({"run_id": steps["run_id"].drop_duplicates()})
    for run_id in base["run_id"]:
        sub = steps[steps["run_id"] == run_id]
        base.loc[base["run_id"] == run_id, "number_of_successful_steps"] = (
            (sub["conclusion"] == "success").sum()
        )
        base.loc[base["run_id"] == run_id, "number_of_failed_steps"] = (
            (sub["conclusion"] == "failure").sum()
        )
        base.loc[base["run_id"] == run_id, "number_of_skipped_steps"] = (
            sub["conclusion"].isin(["skipped", "cancelled"]).sum()
        )
    for col in ("number_of_successful_steps", "number_of_failed_steps",
                "number_of_skipped_steps"):
        base[col] = pd.to_numeric(base[col], errors="coerce").fillna(0).astype(int)
    return base


def _aggregate_jobs(jobs: pd.DataFrame) -> pd.DataFrame:
    """Agrège les jobs par run : nombre de jobs réellement exécutés."""
    if jobs.empty or "run_id" not in jobs:
        return pd.DataFrame(columns=["run_id", "number_of_jobs_executed"])
    agg = (
        jobs.groupby("run_id")
        .size()
        .rename("number_of_jobs_executed")
        .reset_index()
    )
    return agg


def transform(runs: pd.DataFrame, workflows: pd.DataFrame,
              jobs: pd.DataFrame, steps: pd.DataFrame) -> pd.DataFrame:
    """Produit le dataset propre : une ligne par exécution de run."""
    df = runs.copy()

    # 1 + 2. Dé-duplication et valeurs manquantes
    df = df.drop_duplicates(subset=["run_id"], keep="last")
    df = df.dropna(subset=["started_at"])

    # 3 + 4. Types & dates
    df["started_at"] = _parse_time(df["started_at"])
    df["completed_at"] = _parse_time(df["completed_at"])
    df["duration_seconds"] = pd.to_numeric(
        df["duration_seconds"], errors="coerce"
    )

    # 5. Durée recalculée si absente (started_at -> completed_at)
    missing_dur = df["duration_seconds"].isna()
    df.loc[missing_dur, "duration_seconds"] = (
        df.loc[missing_dur, "completed_at"] - df.loc[missing_dur, "started_at"]
    ).dt.total_seconds()
    df["duration_seconds"] = (
        df["duration_seconds"].fillna(df["duration_seconds"].median())
    )

    # On ne garde que les exécutions terminées
    df = df[df["status"] == "completed"].reset_index(drop=True)

    # 6. Agrégation jobs / steps -> une ligne par run
    steps_agg = _aggregate_steps(steps)
    jobs_agg = _aggregate_jobs(jobs)
    df = df.merge(steps_agg, on="run_id", how="left")
    df = df.merge(jobs_agg, on="run_id", how="left")
    for col in ("number_of_successful_steps", "number_of_failed_steps",
                "number_of_skipped_steps", "number_of_jobs_executed"):
        df[col] = df[col].fillna(0).astype(int)

    # 7. Variables dérivées
    df["workflow_duration"] = df["duration_seconds"].round(2)
    df["workflow_failed"] = (df["conclusion"] == "failure").astype(int)

    # 6'. Features de configuration issues de workflow_definitions
    # (on ne fusionne que les colonnes de config pour ne pas écraser les
    # colonnes communes runner/workflow_name/repository du run).
    if not workflows.empty and "workflow_id" in workflows:
        def_cols = [
            "workflow_id",
            "number_of_jobs",
            "number_of_steps",
            "number_of_actions",
            "has_build",
            "has_test",
            "has_deployment",
            "language",
            "language_version",
            "runner",
        ]
        def_prep = (
            workflows[def_cols]
            .drop_duplicates(subset=["workflow_id"])
            .rename(columns={"number_of_jobs": "_def_jobs",
                             "number_of_steps": "_def_steps"})
        )
        df = df.merge(def_prep, on="workflow_id", how="left")

        # Repli : si la définition manque (parse YAML échoué), on retombe sur
        # les valeurs d'exécution agrégées (jamais de valeur manquante).
        df["number_of_jobs"] = df["_def_jobs"].fillna(df["number_of_jobs_executed"])
        df["number_of_steps"] = df["_def_steps"].fillna(
            df["number_of_successful_steps"]
            + df["number_of_failed_steps"]
            + df["number_of_skipped_steps"]
        )
        for col in ("number_of_actions", "has_build", "has_test",
                    "has_deployment"):
            df[col] = df[col].fillna(0).astype(int)
        for col in ("language", "language_version", "runner"):
            df[col] = df[col].fillna("").astype(str)
        df = df.drop(columns=["_def_jobs", "_def_steps"], errors="ignore")
    else:
        df["workflow_name"] = df.get("workflow_name", df.get("workflow_filename"))
        for col in ("number_of_jobs", "number_of_steps", "number_of_actions",
                    "has_build", "has_test", "has_deployment"):
            if col in df.columns:
                df[col] = df[col].fillna(0).astype(int)
        for col in ("language", "language_version", "runner"):
            if col in df.columns:
                df[col] = df[col].fillna("").astype(str)

    # 8. Colonnes finales
    keep = INTERNAL_COLUMNS + [
        "workflow_id",
        "duration_seconds",
        "workflow_duration",
        "workflow_failed",
    ] + [
        "number_of_jobs",
        "number_of_steps",
        "number_of_actions",
        "has_build",
        "has_test",
        "has_deployment",
        "language",
        "language_version",
        "runner",
    ] + [
        "number_of_successful_steps",
        "number_of_failed_steps",
        "number_of_skipped_steps",
        "number_of_jobs_executed",
    ]
    available = [c for c in keep if c in df.columns]
    out = df[available].copy()

    # Ordre temporel ascendant (indispensable pour l'historique sans fuite)
    out = out.sort_values("started_at").reset_index(drop=True)
    out["started_at"] = out["started_at"].dt.strftime("%Y-%m-%dT%H:%M:%SZ")

    return out