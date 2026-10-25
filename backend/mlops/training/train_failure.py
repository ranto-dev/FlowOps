"""Entraînement — Modèle de CLASSIFICATION (risque d'échec).

Comparaison de plusieurs classifieurs (class_weight='balanced' pour tenir
compte du déséquilibre succès/échec) + baseline, sélection sur le F1-score de
validation (classes déséquilibrées => l'Accuracy seule est trompeuse),
évaluation finale sur le test, enregistrement MLflow et artefact candidat.

Usage :
    python -m mlops.training.train_failure
"""
from __future__ import annotations

import numpy as np
import mlflow
import pandas as pd
from sklearn.dummy import DummyClassifier
from sklearn.ensemble import GradientBoostingClassifier, RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    accuracy_score, confusion_matrix, f1_score, precision_score,
    recall_score, roc_auc_score,
)
from sklearn.model_selection import StratifiedKFold
from sklearn.base import clone

from mlops.config import (
    CLASSIFICATION_DATASET_CSV, MLFLOW_EXPERIMENT_NAMES, FEATURE_COLUMNS,
    RANDOM_STATE,
)
from mlops.tracking.tracking import ensure_experiment
from mlops.training.common import (
    make_pipeline, temporal_split, save_candidate, next_version,
    dataset_version, now_iso, best_threshold, optimal_threshold,
)

REGISTRY_KIND = "failure"
TARGET = "workflow_failed"

CANDIDATES = {
    "logistic": LogisticRegression(max_iter=2000, class_weight="balanced", random_state=42),
    "random_forest": RandomForestClassifier(
        n_estimators=300, class_weight="balanced", random_state=42,
        n_jobs=-1, min_samples_leaf=2,
    ),
    "gradient_boosting": GradientBoostingClassifier(
        n_estimators=200, max_depth=3, learning_rate=0.06, random_state=42
    ),
}


def _metrics(y_true, y_pred, y_proba=None) -> dict:
    m = {
        "accuracy": float(accuracy_score(y_true, y_pred)),
        "precision": float(precision_score(y_true, y_pred, zero_division=0)),
        "recall": float(recall_score(y_true, y_pred, zero_division=0)),
        "f1": float(f1_score(y_true, y_pred, zero_division=0)),
        "support_failure": int(np.sum(y_true)),
    }
    if y_proba is not None and len(set(y_true.tolist())) > 1:
        m["roc_auc"] = float(roc_auc_score(y_true, y_proba))
    else:
        m["roc_auc"] = float("nan")
    return m


def train_failure_model(verbose: bool = True) -> dict:
    if verbose:
        print("\n=== TRAINING — CLASSIFICATION (risque d'échec) ===")
    df = pd.read_csv(CLASSIFICATION_DATASET_CSV)
    if verbose:
        n_fail = int(df[TARGET].sum())
        print(f"[data]  {len(df)} exécutions, échecs={n_fail} "
              f"({100 * n_fail / len(df):.1f}%)")

    (X_train, y_train), (X_val, y_val), (X_test, y_test) = temporal_split(df, TARGET)
    if verbose:
        print(f"[split] train={len(X_train)}  val={len(X_val)}  test={len(X_test)} "
              f"(séparation temporelle)")

    exp_id = ensure_experiment(MLFLOW_EXPERIMENT_NAMES[REGISTRY_KIND])
    mlflow.set_experiment(experiment_id=exp_id)
    dataset_ver = dataset_version()

    baseline = DummyClassifier(strategy="most_frequent")
    baseline.fit(X_train, y_train)
    base_pred = baseline.predict(X_val)
    base_metrics = _metrics(y_val, base_pred)

    results: dict[str, dict] = {}
    thresholds: dict[str, float] = {}
    best_name, best_cv_auc, best_pipeline = None, -1.0, None

    # Jeu d'entraînement élargi (train+val) pour la sélection par
    # cross-validation. Sur de petits jeux, le F1 d'une seule tranche de
    # validation est très bruité : on sélectionne sur l'AUC CV moyenne
    # (stabilité du rang), puis on calibre le seuil sur des prédictions
    # out-of-fold (jamais le test) : chaque ligne de train+val est prédite par
    # un modèle entraîné sans la contenir => distribution comparable au vrai futur.
    X_tv = pd.concat([X_train, X_val])
    y_tv = pd.concat([y_train, y_val])
    y_tv = y_tv.reset_index(drop=True)
    skf = StratifiedKFold(n_splits=5, shuffle=True,
                          random_state=RANDOM_STATE)

    for name, model in CANDIDATES.items():
        with mlflow.start_run(run_name=f"failure-{name}") as run:
            pipeline = make_pipeline(model)
            pipeline.fit(X_train, y_train)
            proba = pipeline.predict_proba(X_val)[:, 1] if hasattr(pipeline, "predict_proba") else None
            thr = best_threshold(y_val, proba) if proba is not None else 0.5
            y_val_pred = (proba >= thr).astype(int) if proba is not None else pipeline.predict(X_val)
            m = _metrics(y_val, y_val_pred, proba)
            m["threshold"] = thr
            thresholds[name] = thr

            aucs: list[float] = []
            oof_p = np.full(len(X_tv), np.nan)
            for tr_idx, va_idx in skf.split(X_tv, y_tv):
                fold = make_pipeline(clone(model))
                fold.fit(X_tv.iloc[tr_idx], y_tv.iloc[tr_idx])
                f_proba = fold.predict_proba(X_tv.iloc[va_idx])[:, 1]
                oof_p[va_idx] = f_proba
                if len(set(y_tv.iloc[va_idx])) > 1:
                    aucs.append(float(roc_auc_score(y_tv.iloc[va_idx], f_proba)))
            m["cv_auc"] = float(np.mean(aucs)) if aucs else float("nan")
            # Seuil out-of-fold : F1 maximal vu hors-échantillon
            m["cv_threshold"] = float(optimal_threshold(y_tv, oof_p)) \
                if not np.isnan(oof_p).any() else thr

            mlflow.log_params({p: v for p, v in model.get_params().items()})
            mlflow.log_metrics({f"val_{k}": v for k, v in m.items()
                                if k not in ("support_failure", "threshold",
                                             "cv_auc", "cv_threshold")})
            mlflow.log_metric("cv_auc", m["cv_auc"])
            mlflow.log_param("algorithm", name)
            mlflow.log_param("baseline_val_f1", base_metrics["f1"])
            mlflow.log_param("threshold", thr)

            results[name] = m
            if verbose:
                print(f"[{name:18s}] val F1={m['f1']:.3f}  "
                      f"val AUC={m['roc_auc']:.3f}  CV-AUC={m['cv_auc']:.3f}  "
                      f"CV-seuil={m['cv_threshold']:.2f}")

            # Sélection : AUC cross-validée (moyenne sur train+val)
            if m["cv_auc"] > best_cv_auc + 1e-9:
                best_cv_auc, best_name, best_pipeline = m["cv_auc"], name, pipeline

    if verbose:
        print(f"[select] meilleur modèle : {best_name} "
              f"(CV-AUC avg={best_cv_auc:.3f})")

    # Ré-entraînement sur train+val ; seuil = le seuil out-of-fold du vainqueur
    best_pipeline.fit(X_tv, y_tv)
    best_thr = float(results[best_name]["cv_threshold"])
    if hasattr(best_pipeline, "predict_proba"):
        proba_test = best_pipeline.predict_proba(X_test)[:, 1]
        y_pred_test = (proba_test >= best_thr).astype(int)
    else:  # pragma: no cover — aucun candidat n'est sans predict_proba
        proba_test, y_pred_test = None, best_pipeline.predict(X_test)
    test_metrics = _metrics(y_test, y_pred_test, proba_test)
    conf_mat = confusion_matrix(y_test, y_pred_test).tolist()

    with mlflow.start_run(run_name=f"failure-selected-{best_name}") as run:
        mlflow.log_params(
            {"algorithm": best_name, "dataset_version": dataset_ver,
             "baseline_val_f1": base_metrics["f1"], "threshold": best_thr}
        )
        mlflow.log_metrics({f"test_{k}": v for k, v in test_metrics.items() if k != "support_failure"})
        mlflow.log_metric("baseline_val_f1", base_metrics["f1"])
        mlflow.log_metric("best_cv_auc", best_cv_auc)
        mlflow.sklearn.log_model(best_pipeline, artifact_path="model")
        mlflow.log_artifact(str(CLASSIFICATION_DATASET_CSV))
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
        "threshold": best_thr,
        "metrics": {
            "validation": {k: results[best_name][k] for k in
                           ("accuracy", "precision", "recall", "f1", "roc_auc")},
            "test": test_metrics,
            "confusion_matrix": conf_mat,
            "baseline": {"val": base_metrics},
        },
        "thresholds": thresholds,
    }
    save_candidate(REGISTRY_KIND, best_pipeline, metadata)

    if verbose:
        print(f"[test]  {best_name} -> F1={test_metrics['f1']:.3f}  "
              f"AUC={test_metrics['roc_auc']:.3f}  Accuracy={test_metrics['accuracy']:.3f}  "
              f"@ seuil {best_thr:.2f}")
    return metadata


if __name__ == "__main__":
    train_failure_model()