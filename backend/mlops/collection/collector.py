"""Collecte des données d'exécution GitHub Actions.

Récupère, pour un dépôt donné, les exécutions (runs) terminées avec leurs
jobs et leurs steps, plus les caractéristiques de configuration de chaque
workflow (parse du fichier YAML) — et écrit les 4 tables RAW :

    data/raw/workflow_runs.csv         (informations générales + exécution)
    data/raw/workflow_definitions.csv  (informations relatives au workflow)
    data/raw/jobs.csv                  (durée/statut de chaque job)
    data/raw/steps.csv                 (durée/statut de chaque step)

Usage :
    python -m mlops.collection.collect --repo owner/name --token TOKEN [--limit 200]
"""
from __future__ import annotations

import argparse
import json
from datetime import timedelta as _td

import pandas as pd
import yaml
from github import Github, GithubException

from mlops.config import (
    ensure_dirs, RAW_DIR, RAW_RUNS_CSV, RAW_WORKFLOWS_CSV,
    RAW_JOBS_CSV, RAW_STEPS_CSV, GITHUB_TOKEN, DEFAULT_REPO,
)
from mlops.features.engineering import (
    normalize_from_yaml_dict, features_from_normalized,
)


def _iso(value) -> str | None:
    return value.isoformat() if value else None


def _collect_workflow_definitions(repo, run, wf_cache: dict) -> dict | None:
    """Parse le YAML du workflow pour en extraire les features de config."""
    wf_id = run.workflow_id
    if wf_id in wf_cache:
        return wf_cache[wf_id]

    definition = None
    try:
        content = repo.get_contents(run.path, ref=run.head_sha)
        doc = yaml.safe_load(content.decoded_content.decode("utf-8"))
        normalized = normalize_from_yaml_dict(doc or {})
        feats = features_from_normalized(normalized)
        definition = {
            "workflow_id": wf_id,
            "workflow_filename": str(run.path).rsplit("/", 1)[-1],
            "repository": str(repo.full_name),
            "workflow_name": (doc or {}).get("name")
            or str(run.path).rsplit("/", 1)[-1],
            "language": feats["language"],
            "language_version": feats["language_version"],
            "runner": feats["runner"],
            "number_of_jobs": feats["number_of_jobs"],
            "number_of_steps": feats["number_of_steps"],
            "number_of_actions": feats["number_of_actions"],
            "has_build": feats["has_build"],
            "has_test": feats["has_test"],
            "has_deployment": feats["has_deployment"],
            "actions": json.dumps(
                [s.get("uses") for j in normalized["jobs"]
                 for s in j["steps"] if s.get("uses")]
            ),
        }
    except (GithubException, KeyError, yaml.YAMLError) as exc:
        print(f"⚠️ [collect] workflow YAML non parsé (workflow_id={wf_id}) : {exc}")

    wf_cache[wf_id] = definition
    return definition


def collect(repo_name: str, token: str, limit_runs: int = 200,
            verbose: bool = True) -> dict:
    """Collecte les exécutions terminées et écrit les tables RAW."""
    ensure_dirs()
    if not token:
        raise ValueError(
            "Token GitHub requis : fournissez --token ou GITHUB_TOKEN."
        )

    g = Github(token)
    repo = g.get_repo(repo_name)

    existing_ids: set[int] = set()
    if RAW_RUNS_CSV.exists():
        try:
            existing_ids = set(pd.read_csv(RAW_RUNS_CSV)["run_id"].astype(int))
        except Exception:
            existing_ids = set()

    runs_rows: list[dict] = []
    jobs_rows: list[dict] = []
    steps_rows: list[dict] = []
    wf_rows: list[dict] = []
    wf_cache: dict = {}

    if verbose:
        print(f"[collect] repo={repo_name} (runs existants : {len(existing_ids)})")

    done = 0
    for run in repo.get_workflow_runs():
        if done >= limit_runs:
            break
        if run.status != "completed" or run.id in existing_ids:
            continue

        created = run.created_at
        updated = run.updated_at or created
        duration = (updated - created).total_seconds()

        runs_rows.append(
            {
                "run_id": run.id,
                "repository": str(repo.full_name),
                "workflow_id": run.workflow_id,
                "workflow_name": run.name or run.path,
                "workflow_filename": str(run.path).rsplit("/", 1)[-1],
                "trigger_event": run.event,
                "branch": run.head_branch,
                "commit_sha": run.head_sha,
                "status": run.status,
                "conclusion": run.conclusion,
                "started_at": _iso(created),
                "completed_at": _iso(updated),
                "duration_seconds": round(duration, 2),
            }
        )

        definition = _collect_workflow_definitions(repo, run, wf_cache)
        if definition and all(
            str(d.get("workflow_id")) != str(definition["workflow_id"])
            for d in wf_rows
        ):
            wf_rows.append(definition)

        for job in run.get_jobs():
            j_start = job.started_at or created
            j_end = job.completed_at or updated
            j_dur = (j_end - j_start).total_seconds()
            jobs_rows.append(
                {
                    "run_id": run.id,
                    "job_id": job.id,
                    "name": job.name,
                    "status": job.status,
                    "conclusion": job.conclusion,
                    "runner": getattr(job, "runs_on", None),
                    "started_at": _iso(j_start),
                    "completed_at": _iso(j_end),
                    "duration_seconds": round(j_dur, 2),
                }
            )
            for step in job.steps:
                s_start = getattr(step, "started_at", None) or j_start
                s_end = getattr(step, "completed_at", None) or j_end
                s_dur = (s_end - s_start).total_seconds()
                steps_rows.append(
                    {
                        "run_id": run.id,
                        "job_id": job.id,
                        "step_id": step.number,
                        "number": step.number,
                        "name": step.name,
                        "status": step.status,
                        "conclusion": step.conclusion,
                        "started_at": _iso(s_start),
                        "completed_at": _iso(s_end),
                        "duration_seconds": round(s_dur, 2),
                    }
                )

        done += 1
        if verbose:
            print(f"✅ [{done}/{limit_runs}] run #{run.id} "
                  f"({run.conclusion}) {run.path}")

    return _write_raw(runs_rows, jobs_rows, steps_rows, wf_rows, verbose)


def _write_raw(runs_rows, jobs_rows, steps_rows, wf_rows, verbose: bool = True) -> dict:
    def _merge_append(path, rows):
        new_df = pd.DataFrame(rows)
        if new_df.empty:
            return 0
        if path.exists():
            old = pd.read_csv(path)
            combined = pd.concat([old, new_df], ignore_index=True)
            combined = combined.drop_duplicates(
                subset=combined.columns[0], keep="last"
            )
            combined.to_csv(path, index=False)
        else:
            new_df.to_csv(path, index=False)
        return len(new_df)

    n_runs = _merge_append(RAW_RUNS_CSV, runs_rows)

    # Définitions : mise à jour "upsert" sur workflow_id
    new_defs = pd.DataFrame(wf_rows)
    if not new_defs.empty:
        if RAW_WORKFLOWS_CSV.exists():
            old_defs = pd.read_csv(RAW_WORKFLOWS_CSV)
            old_defs = old_defs[
                ~old_defs["workflow_id"].astype(str).isin(
                    new_defs["workflow_id"].astype(str)
                )
            ]
            merged = pd.concat([old_defs, new_defs], ignore_index=True)
        else:
            merged = new_defs
        merged.to_csv(RAW_WORKFLOWS_CSV, index=False)

    n_jobs = _merge_append(RAW_JOBS_CSV, jobs_rows)
    n_steps = _merge_append(RAW_STEPS_CSV, steps_rows)

    if verbose:
        print(f"[collect] +{n_runs} runs, +{n_jobs} jobs, +{n_steps} steps "
              f"(définitions : {len(wf_rows)})")
    return {"runs": n_runs, "jobs": n_jobs, "steps": n_steps,
            "definitions": len(wf_rows)}


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Collecte des runs GitHub Actions")
    parser.add_argument("--repo", default=DEFAULT_REPO)
    parser.add_argument("--token", default=GITHUB_TOKEN)
    parser.add_argument("--limit", type=int, default=200)
    args = parser.parse_args()
    collect(args.repo, args.token, args.limit)