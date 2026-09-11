"""Évaluation des deux modèles.

Usage :
    python -m mlops.evaluation.evaluate
"""
from __future__ import annotations

from mlops.evaluation.evaluate_duration import evaluate_duration
from mlops.evaluation.evaluate_failure import evaluate_failure


def evaluate_all(verbose: bool = True) -> dict:
    duration = evaluate_duration(verbose=verbose)
    failure = evaluate_failure(verbose=verbose)
    return {"duration": duration, "failure": failure}


if __name__ == "__main__":
    evaluate_all()