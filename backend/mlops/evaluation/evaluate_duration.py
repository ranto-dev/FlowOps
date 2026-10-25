"""Évaluation — RÉGRESSION durée.

Charge le modèle candidat, ré-évalue sur le test (séparation temporelle),
compare avec les métriques du modèle en Production, sauvegarde le rapport
JSON et les graphiques, et journalise dans MLflow (expérience evaluation).
"""
from __future__ import annotations

import json
from pathlib import Path

import joblib
import mlflow
import pandas as pd
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score

from mlops.config import (
    EVALUATION_DIR,
    MLFLOW_EXPERIMENT_NAMES,
    MODEL_DIR,
    REGRESSION_DATASET_CSV,
)
from mlops.tracking.tracking import ensure_experiment
from mlops.training.common import temporal_split

KIND = "duration"
TARGET = "duration_seconds"


def _load_production_metrics() -> dict | None:
    meta = Path(MODEL_DIR[KIND]) / "production" / "metadata.json"
    if meta.exists():
        try:
            return json.loads(meta.read_text()).get("metrics", {})
        except Exception:
            return None
    return None


def evaluate_duration(verbose: bool = True) -> dict:
    if verbose:
        print("=== EVALUATION — duration ===")

    df = pd.read_csv(REGRESSION_DATASET_CSV)
    (_, _), (_, _), (X_test, y_test) = temporal_split(df, TARGET)

    cand_dir = Path(MODEL_DIR[KIND]) / "candidate"
    pipeline = joblib.load(cand_dir / "pipeline.joblib")
    meta = json.loads((cand_dir / "metadata.json").read_text(encoding="utf-8"))

    y_pred = pipeline.predict(X_test)
    mae = float(mean_absolute_error(y_test, y_pred))
    rmse = float(mean_squared_error(y_test, y_pred) ** 0.5)
    r2 = float(r2_score(y_test, y_pred))
    relative_error = float((abs(y_test - y_pred) / y_test).mean())

    prev = _load_production_metrics()
    comparison = None
    if prev:
        comparison = {
            "previous_mae": prev.get("test", {}).get("mae"),
            "previous_rmse": prev.get("test", {}).get("rmse"),
            "delta_mae": round(prev.get("test", {}).get("mae", mae) - mae, 2),
        }

    report = {
        "kind": KIND,
        "version": meta.get("version"),
        "algorithm": meta.get("algorithm"),
        "training_date": meta.get("training_date"),
        "metrics": {
            "mae": mae, "rmse": rmse, "r2": r2,
            "relative_error": relative_error,
            "test_size": int(len(y_test)),
        },
        "comparison_with_production": comparison,
        "mlflow_run_id": meta.get("mlflow_run_id"),
    }

    # Graphiques optionnels (matplotlib fourni par MLflow)
    try:
        import matplotlib
        matplotlib.use("Agg")
        import matplotlib.pyplot as plt

        fig, axes = plt.subplots(1, 2, figsize=(12, 4))
        axes[0].scatter(y_test, y_pred, alpha=0.5, s=12)
        lim = [0, max(y_test.max(), y_pred.max()) * 1.05]
        axes[0].plot(lim, lim, "r--")
        axes[0].set_xlabel("durée réelle (s)")
        axes[0].set_ylabel("durée prédite (s)")
        axes[0].set_title("Prédictions vs réel")

        res = y_test - y_pred
        axes[1].hist(res, bins=30)
        axes[1].set_xlabel("erreur (s)")
        axes[1].set_title(f"Résidus (MAE={mae:.1f}s)")
        fig.tight_layout()
        plot_path = Path(EVALUATION_DIR) / "duration_scatter_residuals.png"

        # Supprimer l'ancien graphique si le nom de fichier existe déjà
        if plot_path.exists():
            plot_path.unlink()
        fig.savefig(plot_path, dpi=120)
        plt.close(fig)
        report["plot"] = str(plot_path)
    except Exception as exc:
        if verbose:
            print(f"[evaluate] (graphique ignoré : {exc})")

    (EVALUATION_DIR / "duration_evaluation.json").write_text(
        json.dumps(report, indent=2, ensure_ascii=False), encoding="utf-8"
    )

    exp_id = ensure_experiment(MLFLOW_EXPERIMENT_NAMES["evaluation"])
    mlflow.set_experiment(experiment_id=exp_id)
    with mlflow.start_run(run_name=f"evaluate-duration-v{meta.get('version')}"):
        mlflow.log_metrics({"mae": mae, "rmse": rmse, "r2": r2,
                            "relative_error": relative_error})
        mlflow.log_params({"model_version": meta.get("version"),
                           "algorithm": meta.get("algorithm")})
        if report.get("plot"):
            mlflow.log_artifact(report["plot"])

    if verbose:
        print(f"[result] MAE={mae:.1f}s  RMSE={rmse:.1f}s  R²={r2:.3f}  "
              f"erreur rel.={relative_error * 100:.1f}%")
    return report


if __name__ == "__main__":
    evaluate_duration()