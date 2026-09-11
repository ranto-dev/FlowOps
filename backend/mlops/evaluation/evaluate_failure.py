"""Évaluation — CLASSIFICATION risque d'échec.

Métriques adaptées aux classes déséquilibrées + matrice de confusion
(graphique), comparaison avec le modèle Production, rapport JSON et MLflow.
"""
from __future__ import annotations

import json
from pathlib import Path

import joblib
import mlflow
import pandas as pd
from sklearn.metrics import (
    accuracy_score, confusion_matrix, f1_score, precision_score,
    recall_score, roc_auc_score,
)

from mlops.config import (
    CLASSIFICATION_DATASET_CSV, EVALUATION_DIR, MODEL_DIR,
    MLFLOW_EXPERIMENT_NAMES,
)
from mlops.tracking.tracking import ensure_experiment
from mlops.training.common import temporal_split

KIND = "failure"
TARGET = "workflow_failed"


def _load_production_metrics() -> dict | None:
    meta = Path(MODEL_DIR[KIND]) / "production" / "metadata.json"
    if meta.exists():
        try:
            return json.loads(meta.read_text()).get("metrics", {})
        except Exception:
            return None
    return None


def evaluate_failure(verbose: bool = True) -> dict:
    if verbose:
        print("=== EVALUATION — failure ===")

    df = pd.read_csv(CLASSIFICATION_DATASET_CSV)
    (_, _), (_, _), (X_test, y_test) = temporal_split(df, TARGET)

    cand_dir = Path(MODEL_DIR[KIND]) / "candidate"
    pipeline = joblib.load(cand_dir / "pipeline.joblib")
    meta = json.loads((cand_dir / "metadata.json").read_text(encoding="utf-8"))

    # Le seuil de décision a été calibré sur la validation par train_failure
    thr = float(meta.get("threshold", 0.5))
    proba = pipeline.predict_proba(X_test)[:, 1]
    y_pred = (proba >= thr).astype(int)
    conf_mat = confusion_matrix(y_test, y_pred).tolist()

    metrics = {
        "accuracy": float(accuracy_score(y_test, y_pred)),
        "precision": float(precision_score(y_test, y_pred, zero_division=0)),
        "recall": float(recall_score(y_test, y_pred, zero_division=0)),
        "f1": float(f1_score(y_test, y_pred, zero_division=0)),
        "roc_auc": float(roc_auc_score(y_test, proba)),
        "threshold": thr,
        "test_size": int(len(y_test)),
        "failures_in_test": int(y_test.sum()),
    }

    prev = _load_production_metrics()
    comparison = None
    if prev:
        p = prev.get("test", {})
        comparison = {
            "previous_f1": p.get("f1"),
            "previous_roc_auc": p.get("roc_auc"),
            "delta_f1": round(p.get("f1", metrics["f1"]) - metrics["f1"], 3),
        }

    report = {
        "kind": KIND,
        "version": meta.get("version"),
        "algorithm": meta.get("algorithm"),
        "training_date": meta.get("training_date"),
        "metrics": metrics,
        "confusion_matrix": conf_mat,
        "threshold": thr,
        "comparison_with_production": comparison,
        "mlflow_run_id": meta.get("mlflow_run_id"),
    }

    try:
        import matplotlib
        matplotlib.use("Agg")
        import matplotlib.pyplot as plt

        fig, ax = plt.subplots(figsize=(5, 4))
        im = ax.imshow(conf_mat, cmap="Blues")
        ax.set_xticks([0, 1]); ax.set_yticks([0, 1])
        ax.set_xticklabels(["succès", "échec"])
        ax.set_yticklabels(["succès", "échec"])
        for i in range(2):
            for j in range(2):
                ax.text(j, i, conf_mat[i][j], ha="center", va="center", color="black")
        ax.set_xlabel("prédit"); ax.set_ylabel("réel")
        ax.set_title(f"Confusion matrix (F1={metrics['f1']:.2f})")
        fig.colorbar(im)
        fig.tight_layout()
        plot_path = Path(EVALUATION_DIR) / "failure_confusion_matrix.png"
        if plot_path.exists():
            plot_path.unlink()
        fig.savefig(plot_path, dpi=120)
        plt.close(fig)
        report["plot"] = str(plot_path)
    except Exception as exc:
        if verbose:
            print(f"[evaluate] (graphique ignoré : {exc})")

    (EVALUATION_DIR / "failure_evaluation.json").write_text(
        json.dumps(report, indent=2, ensure_ascii=False), encoding="utf-8"
    )

    exp_id = ensure_experiment(MLFLOW_EXPERIMENT_NAMES["evaluation"])
    mlflow.set_experiment(experiment_id=exp_id)
    with mlflow.start_run(run_name=f"evaluate-failure-v{meta.get('version')}"):
        mlflow.log_metrics(
            {k: v for k, v in metrics.items()
             if isinstance(v, (int, float)) and "size" not in k}
        )
        mlflow.log_params({"model_version": meta.get("version"),
                           "algorithm": meta.get("algorithm")})
        if report.get("plot"):
            mlflow.log_artifact(report["plot"])

    if verbose:
        print(f"[result] Accuracy={metrics['accuracy']:.3f}  Precision="
              f"{metrics['precision']:.3f}  Recall={metrics['recall']:.3f}  "
              f"F1={metrics['f1']:.3f}  AUC={metrics['roc_auc']:.3f}")
    return report


if __name__ == "__main__":
    evaluate_failure()