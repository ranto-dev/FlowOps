"""Génération d'un jeu de données de DÉMONSTRATION.

Produit des tables RAW au même format exact que le collecteur GitHub
(``mlops.collection.collector``) afin que tout le pipeline (ETL -> features ->
entraînement -> inférence) puisse être testé de bout en bout SANS accès à
GitHub ni token.

Le jeu par défaut = 200 exécutions réalistes d'une CI type :
    * 8 workflows GitHub Actions (Node CI, Python ML, Docker Deploy, API
      TypeScript, Lint & Format, Go Service, Build Mobile, Terraform Deploy) ;
    * événements pondérés (push > pull_request > schedule > repository_dispatch) ;
    * branches pondérées (main dominant, develop, feature/*, release/*) ;
    * durées **cohérentes** steps -> jobs -> run (la durée de l'exécution est la
      somme réelle de ses étapes + overhead de planification) ;
    * échecs réalistes : un run qui échoue s'arrête à l'étape fautive (étapes
      suivantes « skipped »), et un workflow « cassé » échoue en boucle jusqu'à
      un push de correction sur main.

Usage :
    python -m mlops.data.sample_data [--seed 7] [--runs 200]
"""
from __future__ import annotations

import argparse
import random

import pandas as pd

from mlops.config import ensure_dirs, RAW_DIR
from mlops.config import (RAW_RUNS_CSV, RAW_WORKFLOWS_CSV, RAW_JOBS_CSV,
                          RAW_STEPS_CSV)


# ---------------------------------------------------------------------------
# Palettes de steps réalistes (par "<name>" -> [durée min, durée max] en s)
# ---------------------------------------------------------------------------
POOL = {
    "actions/checkout@v4": (8, 16),
    "actions/setup-node@v4": (10, 20),
    "actions/setup-python@v5": (8, 18),
    "actions/setup-go@v5": (10, 22),
    "npm ci": (18, 42),
    "npm run build": (25, 60),
    "npm test": (15, 40),
    "npm run lint": (10, 25),
    "npm run typecheck": (15, 30),
    "pnpm install --frozen-lockfile": (16, 38),
    "pip install -e '.[dev]'": (15, 35),
    "pytest -m unit": (20, 50),
    "pytest -m integration": (25, 60),
    "ruff check .": (5, 15),
    "mypy src": (10, 25),
    "go mod download": (20, 40),
    "go vet ./...": (10, 25),
    "go build -o bin/app ./cmd/...": (20, 50),
    "go test -race ./...": (25, 70),
    "docker build -t app:latest .": (45, 120),
    "docker push ghcr.io/ranto-dev/app:latest": (15, 40),
    "docker scan --severity high app:latest": (10, 25),
    "aws ecr get-login-password": (5, 12),
    "terraform init": (15, 30),
    "terraform plan -out=tfplan": (20, 45),
    "terraform apply -auto-approve": (30, 70),
    "actions/upload-artifact@v4": (5, 10),
    "flutter test": (30, 70),
    "flutter build apk --release": (60, 150),
    "codesign & notarize": (20, 60),
    "scripts/smoke-test.sh": (12, 30),
}


def _steps(*names: str) -> list[dict[str, str]]:
    return [{"name": n, "low": POOL[n][0], "high": POOL[n][1]} for n in names]


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
            "has_build": 1, "has_test": 1, "has_deployment": 0,
            "actions": "actions/checkout@v4, actions/setup-node@v4, actions/upload-artifact@v4",
            "job_names": ["build", "test"],
            "steps": _steps(
                "actions/checkout@v4", "actions/setup-node@v4", "npm ci",
                "npm run build", "npm run typecheck", "npm run lint",
                "npm test", "npm test", "npm run build",
                "actions/upload-artifact@v4",
            ),
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
            "has_build": 0, "has_test": 1, "has_deployment": 0,
            "actions": "actions/checkout@v4, actions/setup-python@v5",
            "job_names": ["tests"],
            "steps": _steps(
                "actions/checkout@v4", "actions/setup-python@v5",
                "pip install -e '.[dev]'",
                "ruff check .", "mypy src",
                "pytest -m unit", "pytest -m integration",
            ),
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
            "has_build": 0, "has_test": 0, "has_deployment": 1,
            "actions": "actions/checkout@v4, actions/docker/build-push-action@v6",
            "job_names": ["build-image", "deploy"],
            "steps": _steps(
                "actions/checkout@v4",
                "docker build -t app:latest .",
                "docker scan --severity high app:latest",
                "docker push ghcr.io/ranto-dev/app:latest",
                "aws ecr get-login-password",
                "scripts/smoke-test.sh",
            ),
        },
        {
            "workflow_id": 4,
            "workflow_filename": "ts-api.yaml",
            "repository": "ranto-dev/Fluxy",
            "workflow_name": "TypeScript API",
            "language": "node",
            "language_version": "20",
            "runner": "ubuntu-latest",
            "number_of_jobs": 3,
            "has_build": 1, "has_test": 1, "has_deployment": 0,
            "actions": "actions/checkout@v4, actions/setup-node@v4, actions/upload-artifact@v4",
            "job_names": ["install", "build", "test"],
            "steps": _steps(
                "actions/checkout@v4", "actions/setup-node@v4",
                "pnpm install --frozen-lockfile",
                "npm run build", "npm run typecheck",
                "npm run lint",
                "npm test", "npm test", "npm test",
                "npm run typecheck",
                "actions/upload-artifact@v4",
            ),
        },
        {
            "workflow_id": 5,
            "workflow_filename": "lint-format.yaml",
            "repository": "ranto-dev/Fluxy",
            "workflow_name": "Lint & Format",
            "language": "node",
            "language_version": "22",
            "runner": "ubuntu-latest",
            "number_of_jobs": 1,
            "has_build": 0, "has_test": 0, "has_deployment": 0,
            "actions": "actions/checkout@v4, actions/setup-node@v4",
            "job_names": ["lint"],
            "steps": _steps(
                "actions/checkout@v4", "actions/setup-node@v4",
                "npm ci", "npm run lint", "npm run typecheck",
            ),
        },
        {
            "workflow_id": 6,
            "workflow_filename": "go-service.yaml",
            "repository": "ranto-dev/Fluxy",
            "workflow_name": "Go Service",
            "language": "golang",
            "language_version": "1.24",
            "runner": "ubuntu-latest",
            "number_of_jobs": 2,
            "has_build": 1, "has_test": 1, "has_deployment": 0,
            "actions": "actions/checkout@v4, actions/setup-go@v5",
            "job_names": ["build", "test"],
            "steps": _steps(
                "actions/checkout@v4", "actions/setup-go@v5", "go mod download",
                "go vet ./...",
                "go build -o bin/app ./cmd/...",
                "go test -race ./...",
            ),
        },
        {
            "workflow_id": 7,
            "workflow_filename": "rn-mobile.yaml",
            "repository": "ranto-dev/Fluxy",
            "workflow_name": "Mobile Build",
            "language": "node",
            "language_version": "20",
            "runner": "macos-latest",
            "number_of_jobs": 2,
            "has_build": 1, "has_test": 1, "has_deployment": 0,
            "actions": "actions/checkout@v4, actions/setup-node@v4",
            "job_names": ["unit", "build-apk"],
            "steps": _steps(
                "actions/checkout@v4", "actions/setup-node@v4",
                "flutter test",
                "flutter test",
                "flutter build apk --release",
                "codesign & notarize",
            ),
        },
        {
            "workflow_id": 8,
            "workflow_filename": "terraform-deploy.yaml",
            "repository": "ranto-dev/Fluxy",
            "workflow_name": "Terraform Deploy",
            "language": "terraform",
            "language_version": "",
            "runner": "ubuntu-latest",
            "number_of_jobs": 1,
            "has_build": 0, "has_test": 0, "has_deployment": 1,
            "actions": "actions/checkout@v4, hashicorp/setup-terraform@v3",
            "job_names": ["apply-infra"],
            "steps": _steps(
                "actions/checkout@v4",
                "terraform init", "terraform plan -out=tfplan",
                "terraform apply -auto-approve",
                "scripts/smoke-test.sh",
            ),
        },
    ]


# ---------------------------------------------------------------------------
# Distributions réalistes
# ---------------------------------------------------------------------------
EVENT_POOL = [
    ("push", 55), ("pull_request", 30), ("schedule", 10),
    ("repository_dispatch", 5),
]
BRANCH_POOL = [
    ("main", 58), ("develop", 20), ("feature/mobile", 12), ("release/2.x", 10),
]

# Propension d'échec de base par workflow (id -> prob. pour un run nominal).
# Le modèle ne voit PAS d'identité de workflow (aucune fuite) : le signal doit
# donc venir de features observables (branche, événement, déploiement) et de
# l'historique par workflow (features "previous_*").
WORKFLOW_RISK: dict[int, float] = {
    1: 0.07,  # Node CI       (stable)
    2: 0.08,  # Python ML     (stable)
    3: 0.12,  # Docker Deploy (push registry / scan)
    4: 0.07,  # TypeScript API (stable)
    5: 0.15,  # Lint & Format (tooling sensible aux versions)
    6: 0.09,  # Go Service
    7: 0.18,  # Mobile Build  (build natif)
    8: 0.10,  # Terraform Deploy (plan/apply conditionnel)
}


def _weighted(pool: list[tuple[str, int]], rng: random.Random) -> str:
    total = sum(w for _, w in pool)
    r = rng.uniform(0, total)
    acc = 0.0
    for value, w in pool:
        acc += w
        if r <= acc:
            return value
    return pool[-1][0]


def generate_sample_data(runs: int = 200, seed: int = 7) -> None:
    """Écrit les 4 fichiers RAW de démonstration dans data/raw/."""
    ensure_dirs()
    rng = random.Random(seed)
    wfs = _workflow_definitions()
    for wf in wfs:
        wf["number_of_steps"] = sum(1 for _ in wf["steps"])
        wf["number_of_actions"] = sum(
            1 for s in wf["steps"] if s["name"].startswith("actions/")
        )

    runs_rows: list[dict] = []
    jobs_rows: list[dict] = []
    steps_rows: list[dict] = []

    start = pd.Timestamp("2025-05-01T08:00:00Z")
    job_counter = 1
    step_counter = 1
    run_id = 1001

    # Historique glissant par workflow pour générer des échecs corrélés
    wf_fail_rates = {w["workflow_id"]: [] for w in wfs}
    # État "CI cassé" : un workflow qui échoue reste cassé jusqu'à réparation.
    wf_broken = {w["workflow_id"]: False for w in wfs}

    ts = start
    for _ in range(runs):
        wf = rng.choice(wfs)
        wf_id = wf["workflow_id"]

        # Espacement temporel réaliste (3 à ~30 h selon la cadence)
        ts += pd.Timedelta(minutes=180 + rng.randint(0, 1700))

        event = _weighted(EVENT_POOL, rng)
        branch = _weighted(BRANCH_POOL, rng)
        steps_spec = wf["steps"]
        n_jobs = wf["number_of_jobs"]
        n_steps = len(steps_spec)

        # --- Décision d'échec (signal utilisable AVANT exécution) ---
        history = wf_fail_rates[wf_id]
        hist_fail = sum(history) / len(history) if history else 0.08
        is_fix = event == "push" and branch == "main"

        # Propension de base propre au workflow (signal stable, généralisable
        # aux nouveaux runs : certains workflows sont plus sujets aux échecs).
        p_fail = WORKFLOW_RISK[wf_id]

        # Effets observables (features présentes à l'inférence aussi) :
        #  - des branches non main exercent du code non fusionné -> +d'échecs ;
        #  - un plan/apply de déploiement multiplie les points de défaillance.
        if branch != "main":
            p_fail += 0.18
        if wf["has_deployment"]:
            p_fail += 0.04
        if event == "schedule":
            p_fail += 0.08
        if event == "repository_dispatch":
            p_fail += 0.10
        if wf_broken[wf_id]:
            p_fail += 0.20 if not is_fix else -0.05
        else:
            p_fail += 0.10 * hist_fail
        failed = rng.random() < min(0.9, p_fail)

        # --- Point d'échec dans la suite d'étapes (après checkout) ---
        failure_idx = None
        if failed:
            failure_idx = rng.randint(max(1, len(steps_spec) // 3), n_steps - 1)

        # --- Répartition des steps entre les jobs (séquentiel, réaliste) ---
        per_job = _split_steps(n_steps, n_jobs, rng)

        champion = "failure" if failed else "success"
        if failed:
            wf_broken[wf_id] = True
        elif is_fix or wf_broken[wf_id]:
            wf_broken[wf_id] = False
        wf_fail_rates[wf_id].append(1 if failed else 0)
        wf_fail_rates[wf_id] = wf_fail_rates[wf_id][-50:]

        started = ts
        commit_sha = f"{rng.randint(0, 0xFFFFFF):07x}{rng.randint(0, 0xFFFFFF):07x}"

        global_step = 0
        prev_job_end = started
        for j_idx, job_step_count in enumerate(per_job):
            job_name = (wf.get("job_names") or [f"job-{j_idx + 1}"] *
                        max(1, n_jobs))[j_idx]
            gap = rng.uniform(2, 10) if j_idx > 0 else 0
            job_start = prev_job_end + pd.Timedelta(seconds=gap)
            job_time = job_start
            job_steps_total = 0.0
            for _s in range(job_step_count):
                spec = steps_spec[global_step]

                if failure_idx is not None:
                    if global_step < failure_idx:
                        step_conclusion = "success"
                    elif global_step == failure_idx:
                        step_conclusion = "failure"
                    else:
                        step_conclusion = "skipped"
                else:
                    step_conclusion = "skipped" if rng.random() < 0.05 else "success"

                # Une étape « skipped » n'est pas exécutée (durée ~nulle).
                if step_conclusion == "skipped":
                    step_dur = round(rng.uniform(0.3, 1.2), 1)
                else:
                    step_dur = round(rng.uniform(spec["low"], spec["high"]), 1)
                job_steps_total += step_dur
                s_start = job_time
                s_end = s_start + pd.Timedelta(seconds=step_dur)
                job_time = s_end

                steps_rows.append(
                    {
                        "run_id": run_id,
                        "job_id": job_counter,
                        "step_id": step_counter,
                        "number": global_step + 1,
                        "name": spec["name"],
                        "status": "completed",
                        "conclusion": step_conclusion,
                        "started_at": s_start.strftime("%Y-%m-%dT%H:%M:%SZ"),
                        "completed_at": s_end.strftime("%Y-%m-%dT%H:%M:%SZ"),
                        "duration_seconds": step_dur,
                    }
                )
                step_counter += 1
                global_step += 1

            jobs_rows.append(
                {
                    "run_id": run_id,
                    "job_id": job_counter,
                    "name": job_name,
                    "status": "completed",
                    "conclusion": champion,
                    "runner": wf["runner"],
                    "started_at": job_start.strftime("%Y-%m-%dT%H:%M:%SZ"),
                    "completed_at": job_time.strftime("%Y-%m-%dT%H:%M:%SZ"),
                    "duration_seconds": round(job_steps_total, 1),
                }
            )
            prev_job_end = job_time
            job_counter += 1

        # --- Durée du run = somme RÉELLE des steps + gaps entre jobs (cohérent
        # avec les tables jobs/steps) + petit overhead de planification ---
        overhead = rng.uniform(0, 6)
        duration = round(float((job_time + pd.Timedelta(seconds=overhead) - started).total_seconds()), 1)
        completed = started + pd.Timedelta(seconds=duration)

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

        run_id += 1

    defs_df = pd.DataFrame(wfs).drop(columns=["steps", "job_names"])
    defs_df.to_csv(RAW_WORKFLOWS_CSV, index=False)
    pd.DataFrame(runs_rows).to_csv(RAW_RUNS_CSV, index=False)
    pd.DataFrame(jobs_rows).to_csv(RAW_JOBS_CSV, index=False)
    pd.DataFrame(steps_rows).to_csv(RAW_STEPS_CSV, index=False)

    print(f"[sample_data] {len(runs_rows)} runs générés -> {RAW_RUNS_CSV}")
    print(f"[sample_data] {len(jobs_rows)} jobs     -> {RAW_JOBS_CSV}")
    print(f"[sample_data] {len(steps_rows)} steps    -> {RAW_STEPS_CSV}")
    print(f"[sample_data] {len(wfs)} définitions -> {RAW_WORKFLOWS_CSV}")


def _split_steps(total: int, n_jobs: int, rng: random.Random) -> list[int]:
    if n_jobs <= 1:
        return [total]
    parts = [max(1, total // n_jobs) for _ in range(n_jobs)]
    parts[-1] += total - sum(parts)
    return parts


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Génère les données RAW de démo")
    parser.add_argument("--runs", type=int, default=200)
    parser.add_argument("--seed", type=int, default=7)
    args = parser.parse_args()
    generate_sample_data(runs=args.runs, seed=args.seed)