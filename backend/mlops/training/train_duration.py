"""Entraînement — Modèle de RÉGRESSION (prédiction de la durée d'exécution).

Comparaison de plusieurs algorithmes + baseline median, sélection du meilleur
sur la base de la MAE de validation, évaluation finale sur le test, enregistrement
MLflow et export de l'artefact candidat.

Usage :
    python -m mlops.training.train_duration
"""
from __future__ import annotations

import mlflow
import pandas as pd
from sklearn.dummy import DummyRegressor
from sklearn.ensemble import GradientBoostingRegressor, RandomForestRegressor
from sklearn.linear_model import LinearRegression, Ridge
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score

from mlops.config import (
    REGRESSION_DATASET_CSV, MLFLOW_EXPERIMENT_NAMES, FEATURE_COLUMNS,
)
from mlops.tracking.tracking import ensure_experiment
from mlops.training.common import (
    make_pipeline, temporal_split, save_candidate, next_version,
    dataset_version, now_iso,
)

REGISTRY_KIND = "duration"
TARGET = "duration_seconds"

CANDIDATES = {
    "linear": LinearRegression(),
    "ridge": Ridge(alpha=1.0),
    "random_forest": RandomForestRegressor(
        n_estimators=300, random_state=42, n_jobs=-1, min_samples_leaf=2
    ),
    "gradient_boosting": GradientBoostingRegressor(
        n_estimators=200, max_depth=4, learning_rate=0.06, random_state=42
    ),
}


def _metrics(y_true, y_pred) -> dict:
    rmse = float(mean_squared_error(y_true, y_pred) ** 0.5)
    mae = float(mean_absolute_error(y_true, y_pred))
    r2 = float(r2_score(y_true, y_pred))
    rel = float((abs(y_true - y_pred) / y_true).mean()) if len(y_true) else 0.0
    return {"mae": mae, "rmse": rmse, "r2": r2, "relative_error": rel}


def train_duration_model(verbose: bool = True) -> dict:
    if verbose:
        print("=== TRAINING — RÉGRESSION (durée) ===")
    df = pd.read_csv(REGRESSION_DATASET_CSV)
    if verbose:
        print(f"[data]  {len(df)} exécutions chargées depuis {REGRESSION_DATASET_CSV.name}")

    (X_train, y_train), (X_val, y_val), (X_test, y_test) = temporal_split(df, TARGET)
    if verbose:
        print(f"[split] train={len(X_train)}  val={len(X_val)}  test={len(X_test)} "
              f"(séparation temporelle)")

    exp_id = ensure_experiment(MLFLOW_EXPERIMENT_NAMES[REGISTRY_KIND])
    mlflow.set_experiment(experiment_id=exp_id)
    dataset_ver = dataset_version()

    # --- Baseline (référence simple) ---
    baseline = DummyRegressor(strategy="median")
    baseline.fit(X_train, y_train)
    base_metrics = _metrics(y_val, baseline.predict(X_val))

    results: dict[str, dict] = {}
    best_name, best_metric, best_pipeline = None, 1e18, None

    for name, model in CANDIDATES.items():
        with mlflow.start_run(run_name=f"duration-{name}") as run:
            pipeline = make_pipeline(model)
            pipeline.fit(X_train, y_train)
            val_pred = pipeline.predict(X_val)
            m = _metrics(y_val, val_pred)

            mlflow.log_params({p: v for p, v in model.get_params().items()})
            mlflow.log_metrics(
                {f"val_{k}": v for k, v in m.items()}
            )
            mlflow.log_param("algorithm", name)
            mlflow.log_param("baseline_val_mae", base_metrics["mae"])

            results[name] = m
            if verbose:
                print(f"[{name:18s}] val MAE={m['mae']:.1f}s  "
                      f"RMSE={m['rmse']:.1f}s  R2={m['r2']:.3f}")

            if m["mae"] < best_metric:
                best_metric, best_name, best_pipeline = m["mae"], name, pipeline

    if verbose:
        print(f"[select] meilleur modèle : {best_name} "
              f"(MAE val={best_metric:.1f}s, baseline={base_metrics['mae']:.1f}s)")

    # --- Ré-entraînement sur train+val et évaluation sur test ---
    X_tv = pd.concat([X_train, X_val])
    y_tv = pd.concat([y_train, y_val])
    best_pipeline.fit(X_tv, y_tv)
    test_metrics = _metrics(y_test, best_pipeline.predict(X_test))

    with mlflow.start_run(run_name=f"duration-selected-{best_name}") as run:
        mlflow.log_params(
            {"algorithm": best_name, "dataset_version": dataset_ver,
             "x_features": len(results), "baseline_val_mae": base_metrics["mae"]}
        )
        mlflow.log_metrics(
            {"test_" + k: v for k, v in test_metrics.items()}
        )
        mlflow.log_metrics(
            {"baseline_val_mae": base_metrics["mae"],
             "best_val_mae": best_metric}
        )
        model_info = mlflow.sklearn.log_model(
            best_pipeline, artifact_path="model"
        )
        mlflow.log_artifact(str(REGRESSION_DATASET_CSV))
        run_id = run.info.run_id

    metadata = {
        "kind": REGISTRY_KIND,
        "version": next_version(REGISTRY_KIND),
        "dataset_version": dataset_ver,
        "training_date": now_iso(),
        "mlflow_run_id": run_id,
        "algorithm": best_name,
        "features": list(FEATURE_COLUMNS),
        "params": {p: str(v) for p, v in best_pipeline.named_steps["model"].get_params().items()},
        "metrics": {"validation": {k: results[best_name][k] for k in ("mae", "rmse", "r2")},
                    "test": test_metrics,
                    "baseline": {"val": base_metrics}},
        "thresholds": None,
    }

    save_candidate(REGISTRY_KIND, best_pipeline, metadata)

    if verbose:
        print(f"[test]  {best_name} -> MAE={test_metrics['mae']:.1f}s  "
              f"RMSE={test_metrics['rmse']:.1f}s  R2={test_metrics['r2']:.3f}")
        print(f"[mlflow] run {run_id}")
    return metadata


if __name__ == "__main__":
    train_duration_model()