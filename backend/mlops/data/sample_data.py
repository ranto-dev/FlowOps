"""Génération d'un jeu de données de DÉMONSTRATION.

Produit des tables RAW au même format exact que le collecteur GitHub
(``mlops.collection.collector``) afin que tout le pipeline (ETL -> features ->
entraînement -> inférence) puisse être testé de bout en bout SANS accès à
GitHub ni token.

Usage :
    python -m mlops.data.sample_data [--seed 42] [--runs 800]
"""
from __future__ import annotations

import argparse
import json
import random

import pandas as pd

from mlops.config import ensure_dirs, RAW_DIR
from mlops.config import (RAW_RUNS_CSV, RAW_WORKFLOWS_CSV, RAW_JOBS_CSV,
                          RAW_STEPS_CSV)


# ---------------------------------------------------------------------------
# Workflows simulés (features de configuration, identiques à celles calculées
# par l'analyse des fichiers YAML côté collecteur)
# ---------------------------------------------------------------------------
def _workflow_definitions() -> list[dict]:
    return [
        {
            "workflow_id": 1,
            "workflow_filename": "node-ci.yaml",
            "repository": "ranto-dev/Fluxy",
            "workflow_name": "Node CI",
            "language": "node",
            "language_version": "22",
            "runner": "ubuntu-latest",
            "number_of_jobs": 2,
            "number_of_steps": 10,
            "number_of_actions": 4,
            "has_build": 1,
            "has_test": 1,
            "has_deployment": 0,
            "actions": json.dumps(["actions/checkout@v4", "actions/setup-node@v4"]),
        },
        {
            "workflow_id": 2,
            "workflow_filename": "python-ml.yaml",
            "repository": "ranto-dev/Fluxy",
            "workflow_name": "Python ML",
            "language": "python",
            "language_version": "3.12",
            "runner": "ubuntu-latest",
            "number_of_jobs": 1,
            "number_of_steps": 8,
            "number_of_actions": 3,
            "has_build": 0,
            "has_test": 1,
            "has_deployment": 0,
            "actions": json.dumps(["actions/checkout@v4", "actions/setup-python@v5"]),
        },
        {
            "workflow_id": 3,
            "workflow_filename": "docker-deploy.yaml",
            "repository": "ranto-dev/Fluxy",
            "workflow_name": "Docker Deploy",
            "language": "docker",
            "language_version": "",
            "runner": "ubuntu-latest",
            "number_of_jobs": 2,
            "number_of_steps": 9,
            "number_of_actions": 3,
            "has_build": 0,
            "has_test": 0,
            "has_deployment": 1,
            "actions": json.dumps(["actions/checkout@v4", "actions/docker/build-push-action@v6"]),
        },
        {
            "workflow_id": 4,
            "workflow_filename": "ts-api.yaml",
            "repository": "ranto-dev/Fluxy",
            "workflow_name": "TypeScript API",
            "language": "node",
            "language_version": "20",
            "runner": "us-west-2",
            "number_of_jobs": 3,
            "number_of_steps": 16,
            "number_of_actions": 6,
            "has_build": 1,
            "has_test": 1,
            "has_deployment": 0,
            "actions": json.dumps(["actions/checkout@v4", "actions/setup-node@v4", "actions/upload-artifact@v4"]),
        },
    ]


# ---------------------------------------------------------------------------
# Calculateur de durée réaliste (signaux corrélés pour que les modèles
# apprennent quelque chose de significatif).
# ---------------------------------------------------------------------------
def _base_duration(wf: dict) -> float:
    return (
        32.0
        + wf["number_of_jobs"] * 22.0
        + wf["number_of_steps"] * 7.5
        + wf["number_of_actions"] * 4.0
        + 18.0 * wf["has_deployment"]
        + 10.0 * wf["has_build"]
        + 8.0 * wf["has_test"]
    )


EVENTS = ["push", "pull_request", "schedule", "repository_dispatch"]
BRANCHES = ["main", "main", "main", "develop", "feature/mobile"]
STEP_NAMES = [
    "actions/checkout@v4",
    "actions/setup-node@v4",
    "npm install",
    "npm run build",
    "npm test",
    "npm run lint",
    "docker build",
    "docker push",
    "echo custom command",
    "tar archive",
    "pytest",
    "pip install",
]


def generate_sample_data(runs: int = 800, seed: int = 42) -> None:
    """Écrit les 4 fichiers RAW de démonstration dans data/raw/."""
    ensure_dirs()
    rng = random.Random(seed)
    wfs = _workflow_definitions()
    wf_by_id = {w["workflow_id"]: w for w in wfs}

    runs_rows: list[dict] = []
    jobs_rows: list[dict] = []
    steps_rows: list[dict] = []

    start = pd.Timestamp("2025-05-01T08:00:00Z")
    job_counter = 1
    step_counter = 1
    run_id = 1001

    # Historique glissant par workflow pour générer des échecs corrélés
    wf_fail_rates = {w["workflow_id"]: [] for w in wfs}
    # État "CI cassé" : réaliste pour GitHub Actions, un workflow qui échoue
    # reste généralement cassé jusqu'à ce qu'un push sur main le répare.
    wf_broken = {w["workflow_id"]: False for w in wfs}

    ts = start
    for i in range(runs):
        wf = rng.choice(wfs)
        wf_id = wf["workflow_id"]

        # Espacement temporel réaliste (6 à 30 h selon activité)
        ts += pd.Timedelta(minutes=180 + rng.randint(0, 1600))

        event = rng.choice(EVENTS)
        branch = rng.choice(BRANCHES)

        n_jobs = wf["number_of_jobs"]
        n_steps = wf["number_of_steps"]

        base = _base_duration(wf)
        spike = 90 if rng.random() < 0.08 else 0
        duration = max(30.0, round(base + rng.gauss(0, 0.12 * base) + spike, 1))

        # Probabilité d'échec : signal LIÉ AUX FEATURES qui seront réellement
        # utilisables par le modèle au moment de la prédiction (avant
        # exécution) : historique d'échec du même workflow, présence d'un
        # déploiement, événement planifié, branche hors main. Favorise une
        # autocorrélation forte (workflow cassé → échec probable), car c'est
        # exactement le comportement réel des pipelines instables.
        history = wf_fail_rates[wf_id]
        hist_fail = sum(history) / len(history) if history else 0.12
        is_fix = event == "push" and branch == "main"

        if wf_broken[wf_id]:
            p_fail = 0.55 + 0.30 * hist_fail if not is_fix else 0.35
        else:
            p_fail = 0.02 + 0.35 * hist_fail
        if wf["has_deployment"]:
            p_fail += 0.06
        if event == "schedule":
            p_fail += 0.04
        if branch != "main":
            p_fail += 0.04
        p_fail = min(0.9, p_fail)
        failed = rng.random() < p_fail

        champion = "failure" if failed else "success"
        if failed:
            wf_broken[wf_id] = True
        elif is_fix or wf_broken[wf_id]:
            wf_broken[wf_id] = False
        wf_fail_rates[wf_id].append(1 if failed else 0)
        wf_fail_rates[wf_id] = wf_fail_rates[wf_id][-50:]

        started = ts
        completed = started + pd.Timedelta(seconds=duration)

        commit_sha = f"{rng.randint(0, 0xFFFFFF):07x}{rng.randint(0, 0xFFFFFF):07x}"

        runs_rows.append(
            {
                "run_id": run_id,
                "repository": wf["repository"],
                "workflow_id": wf_id,
                "workflow_name": wf["workflow_name"],
                "workflow_filename": wf["workflow_filename"],
                "trigger_event": event,
                "branch": branch,
                "commit_sha": commit_sha,
                "status": "completed",
                "conclusion": champion,
                "started_at": started.strftime("%Y-%m-%dT%H:%M:%SZ"),
                "completed_at": completed.strftime("%Y-%m-%dT%H:%M:%SZ"),
                "duration_seconds": duration,
            }
        )

        # Répartition des steps entre les jobs (structuré mais simple).
        per_job = _split_steps(n_steps, n_jobs, rng)
        job_time = started
        for j_idx, job_steps in enumerate(per_job):
            job_name = f"job-{j_idx + 1}"
            job_duration = sum(2.0 + rng.uniform(0, 8) for _ in range(job_steps))
            job_duration = round(job_duration, 1)
            job_start = job_time
            job_end = job_start + pd.Timedelta(seconds=job_duration)
            job_time = job_end

            jobs_rows.append(
                {
                    "run_id": run_id,
                    "job_id": job_counter,
                    "name": job_name,
                    "status": "completed",
                    "conclusion": champion,
                    "runner": wf["runner"],
                    "started_at": job_start.strftime("%Y-%m-%dT%H:%M:%SZ"),
                    "completed_at": job_end.strftime("%Y-%m-%dT%H:%M:%SZ"),
                    "duration_seconds": job_duration,
                }
            )

            step_time = job_start
            for s_idx in range(job_steps):
                step_dur = round(2.0 + rng.uniform(0, 8), 1)
                s_start = step_time
                s_end = s_start + pd.Timedelta(seconds=step_dur)
                step_time = s_end
                steps_rows.append(
                    {
                        "run_id": run_id,
                        "job_id": job_counter,
                        "step_id": step_counter,
                        "number": s_idx + 1,
                        "name": rng.choice(STEP_NAMES),
                        "status": "completed",
                        "conclusion": champion,
                        "started_at": s_start.strftime("%Y-%m-%dT%H:%M:%SZ"),
                        "completed_at": s_end.strftime("%Y-%m-%dT%H:%M:%SZ"),
                        "duration_seconds": step_dur,
                    }
                )
                step_counter += 1

            job_counter += 1

        run_id += 1

    pd.DataFrame(_workflow_definitions()).to_csv(RAW_WORKFLOWS_CSV, index=False)
    pd.DataFrame(runs_rows).to_csv(RAW_RUNS_CSV, index=False)
    pd.DataFrame(jobs_rows).to_csv(RAW_JOBS_CSV, index=False)
    pd.DataFrame(steps_rows).to_csv(RAW_STEPS_CSV, index=False)

    print(f"[sample_data] {len(runs_rows)} runs générés -> {RAW_RUNS_CSV}")
    print(f"[sample_data] {len(jobs_rows)} jobs     -> {RAW_JOBS_CSV}")
    print(f"[sample_data] {len(steps_rows)} steps    -> {RAW_STEPS_CSV}")
    print(f"[sample_data] {len(_workflow_definitions())} définitions -> {RAW_WORKFLOWS_CSV}")


def _split_steps(total: int, n_jobs: int, rng: random.Random) -> list[int]:
    if n_jobs <= 1:
        return [total]
    parts = [max(1, total // n_jobs) for _ in range(n_jobs)]
    parts[-1] += total - sum(parts)
    return parts


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Génère les données RAW de démo")
    parser.add_argument("--runs", type=int, default=800)
    parser.add_argument("--seed", type=int, default=42)
    args = parser.parse_args()
    generate_sample_data(runs=args.runs, seed=args.seed)