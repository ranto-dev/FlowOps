"""Entraînement des deux modèles (durée + risque d'échec).

Usage :
    python -m mlops.training.train
"""
from __future__ import annotations

from mlops.training.train_duration import train_duration_model
from mlops.training.train_failure import train_failure_model


def train_all(verbose: bool = True) -> dict:
    duration_meta = train_duration_model(verbose=verbose)
    failure_meta = train_failure_model(verbose=verbose)
    return {"duration": duration_meta, "failure": failure_meta}


if __name__ == "__main__":
    train_all()