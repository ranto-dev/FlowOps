"""Pipeline MLOps global — exécute tout le cycle en une commande.

    python -m mlops.pipeline [--sample] [--skip-train] [--repo R] [--token T]

Étapes :
    1. Collecte (GitHub ou jeu de démonstration)
    2. ETL
    3. Feature Engineering
    4. Entraînement (durée + risque d'échec)
    5. Évaluation
    6. Tracking MLflow
    7. Validation
    8. Enregistrement (Model Registry + local)
"""
from __future__ import annotations

import argparse
import sys

from mlops.config import GITHUB_TOKEN, ensure_dirs


def run_pipeline(sample: bool = False, skip_train: bool = False,
                 repo: str | None = None, token: str | None = None,
                 limit: int = 200, verbose: bool = True) -> dict:
    ensure_dirs()
    step: dict = {}

    print("=" * 60)
    print("FLOWOPS — PIPELINE MLOps")
    print("=" * 60)

    # 1. Collecte
    print("\n[1/8] COLLECTE")
    if sample:
        from mlops.data.sample_data import generate_sample_data
        generate_sample_data()
        step["collect"] = "sample"
    elif (token or GITHUB_TOKEN) and repo:
        from mlops.collection.collector import collect
        collect(repo, token or GITHUB_TOKEN, limit_runs=limit, verbose=verbose)
        step["collect"] = "github"
    else:
        print("ℹ️  Collecte ignoree : utilisez --sample, ou --repo/--token.")
        step["collect"] = "skipped"

    # 2 + 3. ETL + Feature Engineering
    print("\n[2/8] ETL + FEATURE ENGINEERING")
    from mlops.etl.pipeline import run_etl
    run_etl(verbose=verbose)
    step["etl"] = "done"

    if skip_train:
        print("\nℹ️  --skip-train : arrêt avant l'entraînement.")
        return step

    # 4. Entraînement
    print("\n[4/8] ENTRAÎNEMENT")
    from mlops.training.train import train_all
    train_all(verbose=verbose)
    step["training"] = "done"

    # 5 + 6. Évaluation + tracking
    print("\n[5/8] ÉVALUATION + [6/8] TRACKING MLflow")
    from mlops.evaluation.evaluate import evaluate_all
    evaluate_all(verbose=verbose)
    step["evaluation"] = "done"

    # 7 + 8. Validation + enregistrement
    print("\n[7/8] VALIDATION + [8/8] MODEL REGISTRY")
    from mlops.validation.validator import validate_and_promote_all
    result = validate_and_promote_all(verbose=verbose)
    step["validation"] = result

    print("\n" + "=" * 60)
    print("Pipeline terminé. Résumé :")
    for k, v in step.items():
        print(f"  - {k}: {v}")
    print("=" * 60)
    return step


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Pipeline MLOps FlowOps")
    parser.add_argument("--sample", action="store_true",
                        help="Génère d'abord le jeu de données de démonstration")
    parser.add_argument("--skip-train", action="store_true",
                        help="S'arrête après l'ETL/features")
    parser.add_argument("--repo", default=None)
    parser.add_argument("--token", default=None)
    parser.add_argument("--limit", type=int, default=200)
    args = parser.parse_args(sys.argv[1:])
    run_pipeline(
        sample=args.sample, skip_train=args.skip_train,
        repo=args.repo, token=args.token, limit=args.limit,
    )