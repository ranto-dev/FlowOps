"""Validation des modèles avant mise en Production.

Vérifie, pour chaque modèle candidat :
    * les métriques minimales (seuils de VALIDATION_THRESHOLDS) ;
    * la présence et la chargeabilité de l'artefact ;
    * la compatibilité des features attendues.

En cas de succès : promotion vers ``models/<kind>/production/``, mise à jour
du ``registry.json`` et bascule de la version MLflow vers le stage Production.
"""
from __future__ import annotations

import json
import shutil
from datetime import datetime, timezone
from pathlib import Path

import joblib

from mlops.config import (
    VALIDATION_THRESHOLDS, FEATURE_COLUMNS, MODEL_DIR, MODELS_DIR,
    MLFLOW_REGISTRY_MODEL_NAMES,
)
from mlops.tracking.tracking import (
    transition_to_production, log_model_version,
)


def _validate_duration(metrics: dict) -> tuple[bool, dict]:
    th = VALIDATION_THRESHOLDS["duration"]
    checks = {
        "mae_min": metrics.get("mae", float("inf")) <= th["max_mae"],
        "rmse_min": metrics.get("rmse", float("inf")) <= th["max_rmse"],
        "r2_min": metrics.get("r2", -1) >= th["min_r2"],
    }
    return all(checks.values()), checks


def _validate_failure(metrics: dict) -> tuple[bool, dict]:
    th = VALIDATION_THRESHOLDS["failure"]
    checks = {
        "f1_min": metrics.get("f1", 0.0) >= th["min_f1"],
        "precision_min": metrics.get("precision", 0.0) >= th["min_precision"],
        "recall_min": metrics.get("recall", 0.0) >= th["min_recall"],
        "roc_auc_min": metrics.get("roc_auc", 0.0) >= th["min_roc_auc"],
    }
    return all(checks.values()), checks


_VALIDATORS = {"duration": _validate_duration, "failure": _validate_failure}


def _update_registry(kind: str, version: int, model_name: str) -> None:
    registry_path = MODELS_DIR / "registry.json"
    registry: dict = {}
    if registry_path.exists():
        try:
            registry = json.loads(registry_path.read_text(encoding="utf-8"))
        except Exception:
            registry = {}
    registry[kind] = {
        "registered_name": model_name,
        "active_local_version": version,
        "status": "production",
        "deployed_at": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
    }
    registry_path.write_text(
        json.dumps(registry, indent=2, ensure_ascii=False), encoding="utf-8"
    )
    print(f"[registry] {MODELS_DIR / 'registry.json'} mis à jour")


def validate_and_promote(kind: str, verbose: bool = True) -> bool:
    """Valide le candidat et, si validé, le promeut en Production."""
    if verbose:
        print(f"\n=== VALIDATION — {kind} ===")

    cand_dir = Path(MODEL_DIR[kind]) / "candidate"
    meta_path = cand_dir / "metadata.json"
    pipe_path = cand_dir / "pipeline.joblib"

    if not meta_path.exists() or not pipe_path.exists():
        if verbose:
            print("[validation] Aucun candidat à valider (entraînez d'abord).")
        return False

    meta = json.loads(meta_path.read_text(encoding="utf-8"))
    pipeline = None
    loadable = True
    try:
        pipeline = joblib.load(pipe_path)
        loadable = pipeline is not None
    except Exception as exc:
        loadable = False
        if verbose:
            print(f"[validation] Artefact illisible : {exc}")

    features_ok = meta.get("features") == list(FEATURE_COLUMNS)
    metrics = meta["metrics"].get("test", {})

    valid, checks = _VALIDATORS[kind](metrics)

    if verbose:
        for check, ok in checks.items():
            print(f"[validation] {'✔' if ok else '✘'} {check}")
        print(f"[validation] artefact chargeable : {loadable}")
        print(f"[validation] features conformes ({len(FEATURE_COLUMNS)}) : {features_ok}")

    if not (valid and loadable and features_ok):
        if verbose:
            print("[validation] ❌ CANDIDAT REJETÉ — pas de promotion.")
        return False

    # --- Promotion locale ---
    prod_dir = Path(MODEL_DIR[kind]) / "production"
    if prod_dir.exists():
        shutil.rmtree(prod_dir)
    prod_dir.mkdir(parents=True, exist_ok=True)
    joblib.dump(pipeline, prod_dir / "pipeline.joblib")

    meta["validated_at"] = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    meta["validation"] = checks
    meta["thresholds"] = VALIDATION_THRESHOLDS[kind]
    meta["features"] = list(FEATURE_COLUMNS)
    (prod_dir / "metadata.json").write_text(
        json.dumps(meta, indent=2, ensure_ascii=False), encoding="utf-8"
    )

    # --- Model Registry MLflow ---
    model_name = MLFLOW_REGISTRY_MODEL_NAMES[kind]
    version = None
    run_id = meta.get("mlflow_run_id")
    if run_id:
        try:
            version = log_model_version(kind, pipeline, run_id=run_id)
            if version is not None:
                try:
                    transition_to_production(kind, version)
                except Exception as exc:
                    if verbose:
                        print(f"[registry] Bascule MLflow impossible : {exc}")
        except Exception as exc:
            if verbose:
                print(f"[registry] Enregistrement MLflow impossible : {exc}")

    if version is None:
        version = meta["version"]
    _update_registry(kind, meta["version"], model_name)

    if verbose:
        print(f"[validation] ✔ Modèle {kind} v{meta['version']} déployé en "
              f"Production (local + MLflow v{version}).")
    return True


def validate_and_promote_all(verbose: bool = True) -> dict:
    return {
        "duration": validate_and_promote("duration", verbose=verbose),
        "failure": validate_and_promote("failure", verbose=verbose),
    }


if __name__ == "__main__":
    validate_and_promote_all()