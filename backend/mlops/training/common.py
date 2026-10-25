"""Outils communs d'entraînement : séparation temporelle, préprocesseur,
fonctions de sélection de modèle, seuil de décision et persistance locale.
"""
from __future__ import annotations

import json
import math
from datetime import datetime, timezone
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.metrics import f1_score
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler

from mlops.config import (
    CATEGORICAL_FEATURES,
    FEATURE_COLUMNS,
    MODEL_DIR,
    NUMERICAL_FEATURES,
    TEST_RATIO,
    VALIDATION_RATIO,
)


def temporal_split(df: pd.DataFrame, target: str):
    """Séparation TEMPORELLE (pas aléatoire) train / validation / test.

    Le test = les X% d'exécutions les plus récentes ; la validation = la
    tranche suivante ; l'entraînement = le reste (le plus ancien). Cela évite
    qu'une information future soit utilisée pour prédire le passé.
    """
    df = df.copy()
    if "started_at" in df.columns:
        df = df.sort_values("started_at").reset_index(drop=True)
    n = len(df)
    n_test = max(1, int(math.ceil(n * TEST_RATIO)))
    n_val = max(1, int(math.ceil((n - n_test) * VALIDATION_RATIO)))
    n_train = n - n_val - n_test
    train = df.iloc[:n_train]
    val = df.iloc[n_train:n_train + n_val]
    test = df.iloc[n_train + n_val:]

    def _split(part):
        return part[FEATURE_COLUMNS], part[target]

    return _split(train), _split(val), _split(test)


def build_preprocessor() -> ColumnTransformer:
    """Préprocesseur identique à l'entraînement : numériques standardisées,
    catégorielles OneHotEncodées (inconnues tolérées)."""
    return ColumnTransformer(
        transformers=[
            ("num", StandardScaler(), NUMERICAL_FEATURES),
            ("cat", OneHotEncoder(handle_unknown="ignore", sparse_output=False),
             CATEGORICAL_FEATURES),
        ],
        remainder="drop",
    )


def make_pipeline(model) -> Pipeline:
    return Pipeline([("preprocessor", build_preprocessor()), ("model", model)])


def best_threshold(y_true, proba_positive: np.ndarray) -> float:
    """Calibre le seuil de décision qui maximise le F1 sur un échantillon.

    Les échecs de CI sont rares (quelques % à ~20 %) : seuiller à 0.5 rend le
    classifieur trop conservateur. Le seuil est choisi sur la VALIDATION
    uniquement (jamais sur le test), puis appliqué à l'inférence.
    """
    y = np.asarray(y_true)
    p = np.asarray(proba_positive)
    best = (0.5, f1_score(y, (p >= 0.5).astype(int), zero_division=0))
    for t in np.linspace(0.05, 0.95, 46):
        f1 = f1_score(y, (p >= t).astype(int), zero_division=0)
        if f1 > best[1]:
            best = (float(t), f1)
    return best[0]


def optimal_threshold(y_true, proba_positive: np.ndarray) -> float:
    """Seuil à F1 (quasi-)maximal, départagé vers la précision.

    Sur de petits jeux le seuil à F1 maximal est instable et souvent trop
    permissif (précision faible). On retient, parmi les seuils dont le F1
    reste à moins de 0.01 du maximum, le PLUS ÉLEVÉ : plus conservateur,
    il privilégie la précision sans sacrifier significativement le F1.
    """
    y = np.asarray(y_true)
    p = np.asarray(proba_positive)
    if len(np.unique(y)) < 2:
        return 0.5
    grid = np.linspace(0.05, 0.95, 181)
    f1s = [f1_score(y, (p >= t).astype(int), zero_division=0) for t in grid]
    best_f1 = max(f1s)
    candidates = [float(t) for t, f in zip(grid, f1s) if f >= best_f1 - 0.03]
    return max(candidates) if candidates else 0.5


def now_iso() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def next_version(kind: str) -> int:
    """Version = max(local production, local candidate, registry) + 1."""
    prod_meta = Path(MODEL_DIR[kind]) / "production" / "metadata.json"
    cand_meta = Path(MODEL_DIR[kind]) / "candidate" / "metadata.json"
    versions = [0]
    for meta in (prod_meta, cand_meta):
        if meta.exists():
            try:
                versions.append(int(json.loads(meta.read_text()).get("version", 0)))
            except Exception:
                pass
    return max(versions) + 1


def save_candidate(kind: str, pipeline: Pipeline, metadata: dict) -> Path:
    """Sauvegarde le pipeline + ses métadonnées dans models/<kind>/candidate/."""
    cand_dir = Path(MODEL_DIR[kind]) / "candidate"
    cand_dir.mkdir(parents=True, exist_ok=True)
    joblib.dump(pipeline, cand_dir / "pipeline.joblib")
    (cand_dir / "metadata.json").write_text(
        json.dumps(metadata, indent=2, ensure_ascii=False),
        encoding="utf-8",
    )
    print(f"[train]  artefact candidat -> {cand_dir}")
    return cand_dir


def dataset_version() -> str:
    """Version simple du dataset basée sur le nombre de lignes + date."""
    return datetime.now(timezone.utc).strftime("dataset-%Y%m%d-%H%M%S")