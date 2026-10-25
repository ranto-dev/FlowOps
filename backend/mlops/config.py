"""Configuration centralisée du module MLOps FlowOps.

Tous les chemins, noms d'expériences, niveaux de risque, seuils de validation
et listes de features sont définis ici (et ici uniquement) afin de garantir la
reproductibilité du cycle MLOps.
"""
from __future__ import annotations

import os
from pathlib import Path

from dotenv import load_dotenv

# ---------------------------------------------------------------------------
# Chemins
# ---------------------------------------------------------------------------
BASE_DIR = Path(__file__).resolve().parent          # backend/mlops/
BACKEND_DIR = BASE_DIR.parent                        # backend/

# Charge backend/.env pour les CLI (`python -m mlops.pipeline`, etc.) :
# le serveur le fait déjà via app.settings. Idempotent et sans écrasement
# des variables déjà présentes dans l'environnement.
load_dotenv(BACKEND_DIR / ".env")

DATA_DIR = BASE_DIR / "data"
RAW_DIR = DATA_DIR / "raw"
PROCESSED_DIR = DATA_DIR / "processed"
FEATURES_DIR = DATA_DIR / "features"
EVALUATION_DIR = DATA_DIR / "evaluation"
MONITORING_DIR = DATA_DIR / "monitoring"
MODELS_DIR = BASE_DIR / "models"

# Fichiers RAW (collecte GitHub Actions ou jeu de démonstration)
RAW_RUNS_CSV = RAW_DIR / "workflow_runs.csv"
RAW_WORKFLOWS_CSV = RAW_DIR / "workflow_definitions.csv"
RAW_JOBS_CSV = RAW_DIR / "jobs.csv"
RAW_STEPS_CSV = RAW_DIR / "steps.csv"

# Fichiers PROCESSED (sortie de l'ETL)
PROCESSED_DATASET_CSV = PROCESSED_DIR / "workflow_dataset.csv"
PREDICTION_DATASET_CSV = PROCESSED_DIR / "prediction_dataset.csv"

# Datasets de features (sortie du feature engineering)
REGRESSION_DATASET_CSV = FEATURES_DIR / "regression_dataset.csv"
CLASSIFICATION_DATASET_CSV = FEATURES_DIR / "classification_dataset.csv"

# Répertoires modèles
MODEL_DIR = {"duration": MODELS_DIR / "duration", "failure": MODELS_DIR / "failure"}

# Journal de monitoring des prédictions
PREDICTIONS_LOG_CSV = MONITORING_DIR / "predictions.csv"

# ---------------------------------------------------------------------------
# MLflow
# ---------------------------------------------------------------------------
# Backend SQLite auto-hébergé (le stockage fichier '.mlruns' est déprécié en
# MLflow 3.x). Nous utilisons notre propre variable (FLOWOPS_MLFLOW_TRACKING_URI)
# et NON MLFLOW_TRACKING_URI afin de ne pas hériter d'une configuration
# machine externe. Surchargeable via l'environnement.
DEFAULT_MLFLOW_TRACKING_URI = (
    f"sqlite:///{BACKEND_DIR / 'mlruns' / 'mlflow.db'}"
)
MLFLOW_TRACKING_URI = os.getenv(
    "FLOWOPS_MLFLOW_TRACKING_URI", DEFAULT_MLFLOW_TRACKING_URI
)
MLFLOW_REGISTRY_MODEL_NAMES = {
    "duration": "flowops-duration-model",
    "failure": "flowops-failure-model",
}
MLFLOW_EXPERIMENT_NAMES = {
    "duration": "flowops-duration",
    "failure": "flowops-failure",
    "evaluation": "flowops-evaluation",
}
MLFLOW_STAGE_PRODUCTION = "Production"

# ---------------------------------------------------------------------------
# Niveaux de risque (configurables, mis en œuvre par risk_level())
# ---------------------------------------------------------------------------
# bornes de probabilité d'échec -> libellé
RISK_LEVELS = [
    (0.0, 0.30, "low"),
    (0.30, 0.70, "medium"),
    (0.70, 1.001, "high"),
]
RISK_LEVEL_LABELS = {"low": "Risque faible", "medium": "Risque moyen", "high": "Risque élevé"}


def risk_level(failure_probability: float) -> str:
    """Associe une probabilité d'échec à un niveau de risque.

    Seuils par défaut (documentés dans docs/MLOPS.md) :
        0.00 - 0.30 -> low   (risque faible)
        0.30 - 0.70 -> medium (risque moyen)
        0.70 - 1.00 -> high   (risque élevé)
    """
    for low, high, label in RISK_LEVELS:
        if low <= failure_probability < high:
            return label
    return "high"


# ---------------------------------------------------------------------------
# Seuils de validation des modèles (ajustés selon les expériences)
# ---------------------------------------------------------------------------
VALIDATION_THRESHOLDS = {
    # Régression — durée (en secondes)
    "duration": {
        "max_mae": float(os.getenv("MLOPS_DURATION_MAX_MAE", "120")),
        "max_rmse": float(os.getenv("MLOPS_DURATION_MAX_RMSE", "240")),
        "min_r2": float(os.getenv("MLOPS_DURATION_MIN_R2", "0.40")),
    },
    # Classification — risque d'échec (classes déséquilibrées => on exige plus
    # que la seule Accuracy)
    "failure": {
        "min_f1": float(os.getenv("MLOPS_FAILURE_MIN_F1", "0.50")),
        "min_precision": float(os.getenv("MLOPS_FAILURE_MIN_PRECISION", "0.45")),
        "min_recall": float(os.getenv("MLOPS_FAILURE_MIN_RECALL", "0.40")),
        "min_roc_auc": float(os.getenv("MLOPS_FAILURE_MIN_ROC_AUC", "0.60")),
    },
}

# ---------------------------------------------------------------------------
# Features utilisées par les modèles
# ---------------------------------------------------------------------------
# ATTENTION : ces listes doivent rester identiques entre l'entraînement et
# l'inférence (parité train/serve). Toute évolution nécessite un nouveau
# dataset version + un nouvel entraînement.
NUMERICAL_FEATURES = [
    "number_of_jobs",
    "number_of_steps",
    "number_of_actions",
    "has_build",
    "has_test",
    "has_deployment",
    "trigger_push",
    "trigger_pull_request",
    "trigger_schedule",
    "trigger_repository_dispatch",
    "previous_run_count",
    "previous_success_rate",
    "previous_failure_rate",
    "average_previous_duration",
]

CATEGORICAL_FEATURES = [
    "language",
    "language_version",
    "runner",
    "branch",
]

FEATURE_COLUMNS = NUMERICAL_FEATURES + CATEGORICAL_FEATURES

# Variables présentes uniquement dans le dataset analysé (pas utilisées par les
# modèles car inconnues avant exécution) — documentées dans docs/MLOPS.md.
ANALYTICS_COLUMNS = [
    "workflow_duration",
    "number_of_successful_steps",
    "number_of_failed_steps",
    "number_of_skipped_steps",
    "number_of_jobs_executed",
]

# Colonnes internes de gestion du temps (utilisées pour la séparation
# temporelle train/validation/test et le calcul d'historique sans fuite).
INTERNAL_COLUMNS = [
    "run_id",
    "repository",
    "workflow_name",
    "workflow_filename",
    "trigger_event",
    "branch",
    "conclusion",
    "started_at",
]

# ---------------------------------------------------------------------------
# Apprentissage
# ---------------------------------------------------------------------------
RANDOM_STATE = 42
TEST_RATIO = 0.15          # séparation temporelle des 15% plus récents
VALIDATION_RATIO = 0.15    # des 85% restants -> validation

# Sélection du meilleur modèle
DURATION_MODELS = ["linear", "ridge", "random_forest", "gradient_boosting"]
FAILURE_MODELS = ["logistic", "random_forest", "gradient_boosting"]

# ---------------------------------------------------------------------------
# Collecte GitHub
# ---------------------------------------------------------------------------
GITHUB_TOKEN = os.getenv("GITHUB_TOKEN", "")
DEFAULT_REPO = os.getenv("GITHUB_REPO", "ranto-dev/Fluxy")


def ensure_dirs() -> None:
    """Crée les répertoires du pipeline s'ils n'existent pas encore."""
    for d in (
        RAW_DIR,
        PROCESSED_DIR,
        FEATURES_DIR,
        EVALUATION_DIR,
        MONITORING_DIR,
        MODELS_DIR,
        MODEL_DIR["duration"],
        MODEL_DIR["failure"],
    ):
        d.mkdir(parents=True, exist_ok=True)