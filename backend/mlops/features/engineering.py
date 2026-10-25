"""Feature Engineering — FlowOps.

Deux usages distincts partagent les MÊMES fonctions de calcul de features afin
de garantir la parité entre entraînement et inférence (train/serve) :

1. ``features_from_normalized(...)``  : features de configuration calculées à
   partir d'un workflow décrit de façon normalisée (jobs -> steps). Utilisée à
   l'entraînement (via le parse du YAML) ET au moment de la prédiction (via la
   configuration low-code) ;
2. ``attach_history_features(...)``   : features historiques calculées SANS
   fuite de données (shift(1) : seules les exécutions PASSÉES d'un workflow
   sont utilisées).
"""
from __future__ import annotations

from typing import Iterable

import pandas as pd

from mlops.config import FEATURE_COLUMNS, NUMERICAL_FEATURES, CATEGORICAL_FEATURES


# ---------------------------------------------------------------------------
# 1. Normalisation des sources de configuration
# ---------------------------------------------------------------------------
# Une configuration normalisée ressemble à :
# {
#   "on_events": ["push", "pull_request"],
#   "branches": "main, develop",
#   "jobs": [
#       {"runs_on": "ubuntu-latest", "steps": [
#           {"uses": "actions/checkout@v4"} | {"run": "npm install"},
#       ]}
#   ]
# }


def normalize_from_lowcode(config: dict) -> dict:
    """Normalise la configuration low-code de FlowOps (FlowOpsWorkflowSchema)."""
    jobs = []
    for j in config.get("jobs", []):
        steps = []
        for s in j.get("steps", []):
            entry: dict[str, object] = {}
            if s.get("type") == "checkout":
                entry["uses"] = "actions/checkout@v4"
            elif s.get("type") == "setup-node":
                entry["uses"] = "actions/setup-node@v4"
                entry["with"] = {"node-version": s.get("node_version") or ""}
            elif s.get("type") == "npm":
                entry["run"] = f"npm {s.get('npm_command') or ''}"
            elif s.get("type") == "upload-artifact":
                entry["uses"] = "actions/upload-artifact@v4"
                entry["with"] = {"path": s.get("artifact_path") or ""}
            elif s.get("type") == "docker":
                entry["run"] = "docker build\n docker push"
            elif s.get("type") == "custom-run":
                entry["run"] = s.get("custom_script") or ""
            steps.append(entry)
        jobs.append({"runs_on": j.get("runs_on", "ubuntu-latest"), "steps": steps})

    return {
        "on_events": list(config.get("on_events", [])) or ["push"],
        "branches": config.get("branches", "main"),
        "jobs": jobs,
    }


def normalize_from_yaml_dict(yaml_doc: dict) -> dict:
    """Normalise un document YAML GitHub Actions (parse par le collecteur)."""
    on_spec = yaml_doc.get("on") or yaml_doc.get("on") or {}
    on_events = list(on_spec.keys()) if isinstance(on_spec, dict) else ["push"]

    branches = "main"
    for ev in ("push", "pull_request"):
        spec = on_spec.get(ev) if isinstance(on_spec, dict) else None
        if isinstance(spec, dict) and spec.get("branches"):
            branches = ", ".join(spec["branches"])
            break

    jobs = []
    for job_spec in (yaml_doc.get("jobs") or {}).values():
        steps = []
        for step in job_spec.get("steps") or []:
            entry: dict[str, object] = {}
            if step.get("uses"):
                entry["uses"] = step["uses"]
                if step.get("with"):
                    entry["with"] = step["with"]
            else:
                entry["run"] = step.get("run", "")
            steps.append(entry)
        jobs.append({"runs_on": job_spec.get("runs-on", "ubuntu-latest"), "steps": steps})

    return {"on_events": on_events, "branches": branches, "jobs": jobs}


# ---------------------------------------------------------------------------
# 2. Calcul des features de configuration
# ---------------------------------------------------------------------------
def _text_of_steps(jobs: Iterable[dict]) -> list[str]:
    texts: list[str] = []
    for job in jobs:
        for step in job.get("steps") or []:
            if step.get("run"):
                texts.append(str(step["run"]).lower())
    return texts


def infer_language(jobs: Iterable[dict]) -> tuple[str, str]:
    """Infère (language, language_version) à partir des steps configurés."""
    language = "generic"
    version = ""
    for job in jobs:
        for step in job.get("steps") or []:
            uses = str(step.get("uses") or "")
            with_ = step.get("with") or {}
            if "setup-node" in uses:
                language = "node"
                version = str(with_.get("node-version") or version or "")
            elif "setup-python" in uses:
                language = "python"
                version = str(with_.get("python-version") or version or "")
            elif "docker" in uses or "docker" in str(step.get("run") or "").lower():
                if language == "generic":
                    language = "docker"
    return language, version


def features_from_normalized(normalized: dict) -> dict:
    """Calcule les features de configuration d'un workflow normalisé."""
    jobs = normalized.get("jobs") or []

    number_of_jobs = len(jobs)
    number_of_steps = sum(len(j.get("steps") or []) for j in jobs)
    number_of_actions = sum(
        1 for j in jobs for s in (j.get("steps") or []) if s.get("uses")
    )

    run_texts = _text_of_steps(jobs)
    all_text = " | ".join(run_texts)

    has_build = int(
        "build" in all_text
        or any("upload-artifact" in str(s.get("uses") or "") for j in jobs for s in (j.get("steps") or []))
    )
    has_test = int(
        "test" in all_text
        or "pytest" in all_text
        or "vitest" in all_text
    )
    has_deployment = int(
        "deploy" in all_text
        or "docker push" in all_text
    )

    language, language_version = infer_language(jobs)

    runners = [j.get("runs_on", "ubuntu-latest") for j in jobs] or ["ubuntu-latest"]
    runner = max(set(runners), key=runners.count)

    events = set(normalized.get("on_events") or [])
    branches = normalized.get("branches", "main")
    first_branch = next(
        (b.strip() for b in str(branches).split(",") if b.strip()), "main"
    )

    return {
        "number_of_jobs": number_of_jobs,
        "number_of_steps": number_of_steps,
        "number_of_actions": number_of_actions,
        "has_build": has_build,
        "has_test": has_test,
        "has_deployment": has_deployment,
        "language": language,
        "language_version": language_version,
        "runner": runner,
        "branch": first_branch,
        "trigger_push": int("push" in events),
        "trigger_pull_request": int("pull_request" in events),
        "trigger_schedule": int("schedule" in events),
        "trigger_repository_dispatch": int("repository_dispatch" in events),
    }


# ---------------------------------------------------------------------------
# 3. Features historiques (sans fuite de données)
# ---------------------------------------------------------------------------
def attach_history_features(
    df: pd.DataFrame,
    group_cols: tuple[str, ...] = ("repository", "workflow_name"),
) -> pd.DataFrame:
    """Ajoute les features historiques à chaque ligne d'exécution.

    Pour chaque workflow, seules les exécutions ANTÉRIEURES (ordonnées par
    ``started_at``) sont utilisées (décalage ``shift(1)``) => aucune fuite de
    données vers le futur.
    """
    out = df.copy()
    if out.empty:
        for col in ("previous_run_count", "previous_success_rate",
                    "previous_failure_rate", "average_previous_duration"):
            out[col] = 0.0
        return out

    out = out.sort_values(["started_at"]).reset_index(drop=True)
    grouped = out.groupby(list(group_cols), sort=False)

    out["_success"] = (out["conclusion"] == "success").astype(float)
    out["_failure"] = (out["conclusion"] == "failure").astype(float)

    out["previous_run_count"] = grouped.cumcount().astype(int)
    out["previous_success_rate"] = (
        grouped["_success"].transform(lambda s: s.expanding().mean().shift(1))
    )
    out["previous_failure_rate"] = (
        grouped["_failure"].transform(lambda s: s.expanding().mean().shift(1))
    )
    out["average_previous_duration"] = (
        grouped["duration_seconds"].transform(
            lambda s: s.expanding().mean().shift(1)
        )
    )

    median_duration = out["duration_seconds"].median(skipna=True) or 0.0
    out["previous_success_rate"] = out["previous_success_rate"].fillna(0.0)
    out["previous_failure_rate"] = out["previous_failure_rate"].fillna(0.0)
    out["average_previous_duration"] = out["average_previous_duration"].fillna(
        median_duration
    )

    out = out.drop(columns=["_success", "_failure"])
    return out


def history_features_for(
    df: pd.DataFrame,
    workflow_name: str,
    repository: str | None = None,
) -> dict[str, float]:
    """Features historiques d'un workflow à l'instant de la prédiction.

    Utilise TOUTES les exécutions déjà enregistrées pour ce workflow (la
    prédiction concerne une exécution qui n'est pas encore dans l'historique,
    donc pas de décalage nécessaire).
    """
    mask = df["workflow_name"] == workflow_name
    if repository:
        mask &= df["repository"] == repository
    hist = df[mask]

    if hist.empty:
        return {
            "previous_run_count": 0,
            "previous_success_rate": 0.0,
            "previous_failure_rate": 0.0,
            "average_previous_duration": 0.0,
        }

    return {
        "previous_run_count": int(len(hist)),
        "previous_success_rate": float((hist["conclusion"] == "success").mean()),
        "previous_failure_rate": float((hist["conclusion"] == "failure").mean()),
        "average_previous_duration": float(hist["duration_seconds"].mean()),
    }


# ---------------------------------------------------------------------------
# 4. Assembly des datasets d'entraînement
# ---------------------------------------------------------------------------
def _order_feature_row(base: dict, history: dict) -> dict:
    feats: dict[str, object] = {}
    for col in NUMERICAL_FEATURES:
        if col in base:
            feats[col] = base[col]
        elif col in history:
            feats[col] = history[col]
    for col in CATEGORICAL_FEATURES:
        feats[col] = base.get(col, "")
    return feats


def engineer_training_datasets(processed: pd.DataFrame) -> tuple[pd.DataFrame, pd.DataFrame]:
    """Construit les datasets de features (régression + classification).

    :param processed: dataset issu de l'ETL (une ligne par exécution).
    :returns: (regression_dataset, classification_dataset)
    """
    df = processed.copy()
    df = attach_history_features(df)

    rows_base: list[dict] = []
    _trigger_map = {
        "push": "trigger_push",
        "pull_request": "trigger_pull_request",
        "schedule": "trigger_schedule",
        "repository_dispatch": "trigger_repository_dispatch",
    }

    for _, row in df.iterrows():
        base: dict = {}
        for col in NUMERICAL_FEATURES:
            if col in df.columns:
                base[col] = row[col]

        if "trigger_event" in df.columns:
            ev = str(row.get("trigger_event", ""))
            for key, feat in _trigger_map.items():
                base[feat] = int(ev == key)
        for col in CATEGORICAL_FEATURES:
            base[col] = row.get(col, "") if col in df.columns else ""

        hist = {
            "previous_run_count": row["previous_run_count"],
            "previous_success_rate": row["previous_success_rate"],
            "previous_failure_rate": row["previous_failure_rate"],
            "average_previous_duration": row["average_previous_duration"],
        }
        feats = _order_feature_row(base, hist)
        feats.update(
            {
                "run_id": row.get("run_id"),
                "repository": row.get("repository"),
                "workflow_name": row.get("workflow_name"),
                "started_at": row.get("started_at"),
                "duration_seconds": float(row.get("duration_seconds", 0.0)),
                "workflow_failed": int(row.get("workflow_failed", 0)),
            }
        )
        rows_base.append(feats)

    feat_df = pd.DataFrame(rows_base)

    regression = feat_df[FEATURE_COLUMNS + ["duration_seconds", "started_at"]].copy()
    classification = feat_df[
        FEATURE_COLUMNS + ["workflow_failed", "started_at"]
    ].copy()

    regression = regression.dropna(subset=["duration_seconds"])
    classification = (
        classification.dropna(subset=["workflow_failed"])
        .sort_values("started_at")
        .reset_index(drop=True)
    )
    return regression, classification


def build_prediction_row(normalized: dict, history: dict) -> pd.DataFrame:
    """Assemble la ligne (DataFrame à 1 ligne) envoyée aux modèles à l'inférence.

    La ligne contient exactement les colonnes ``FEATURE_COLUMNS`` dans le même
    ordre qu'à l'entraînement.
    """
    base = features_from_normalized(normalized)
    row = _order_feature_row(base, history)
    return pd.DataFrame([row])[FEATURE_COLUMNS]