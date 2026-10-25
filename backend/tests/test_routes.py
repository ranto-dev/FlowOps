"""Tests de non-régression du contrat HTTP de l'API FlowOps.

Verrouille les formes de réponse consommées par le frontend
(``frontend/src/@types/api.ts``) et les garde-fous d'authentification.
Aucun appel réseau : seuls sont testés ce qui s'exécute localement.
"""
from __future__ import annotations

from fastapi.testclient import TestClient

from main import app

client = TestClient(app)

VALID_PROJECT_BODY = {
    "name": "Demo",
    "description": "Projet de test",
    "repository": "owner/repo",
}

VALID_CONFIG = {
    "filename": "ci.yaml",
    "name": "CI",
    "on_events": ["push"],
    "branches": "main",
    "jobs": [
        {
            "id": "j-1",
            "name": "build",
            "runs_on": "ubuntu-latest",
            "needs": [],
            "steps": [{"id": "s-1", "name": "Checkout", "type": "checkout"}],
        }
    ],
}


def test_auth_status_shape():
    """``/api/auth/status`` : forme exacte lue par ``SetupPage``/``AuthPage``."""
    res = client.get("/api/auth/status")

    assert res.status_code == 200
    data = res.json()
    assert set(data) == {"configured", "missing_env_vars", "message"}
    assert isinstance(data["configured"], bool)
    assert isinstance(data["missing_env_vars"], list)


def test_project_endpoints_require_bearer_token():
    """Toute ressource projet est refusée (401) sans ``Authorization: Bearer``."""
    assert client.get("/api/projects").status_code == 401
    assert (
        client.post("/api/projects", json=VALID_PROJECT_BODY).status_code == 401
    )
    assert (
        client.post(
            "/api/projects/64b000000000000000000000/workflow", json=VALID_CONFIG
        ).status_code
        == 401
    )
    assert (
        client.post("/api/projects/64b000000000000000000000/execute").status_code
        == 401
    )


def test_runs_endpoints_require_bearer_token():
    assert (
        client.get("/api/projects/64b000000000000000000000/runs").status_code == 401
    )
    assert (
        client.get(
            "/api/projects/64b000000000000000000000/runs/123/jobs"
        ).status_code
        == 401
    )


def test_generate_workflow_returns_yaml_with_dispatch():
    """``/api/generate-workflow`` : renvoie le YAML compilé (prévisualisation)."""
    res = client.post("/api/generate-workflow", json=VALID_CONFIG)

    assert res.status_code == 200
    data = res.json()
    assert data["filename"] == "ci.yaml"
    assert "repository_dispatch" in data["yaml"]
    assert "flowops_trigger" in data["yaml"]


def test_mlops_status_shape():
    """``/api/mlops/status`` : sections lues par ``MlopsCenter``."""
    res = client.get("/api/mlops/status")

    assert res.status_code == 200
    data = res.json()
    assert {"models", "evaluations", "monitoring", "data"} <= set(data)


def test_unknown_route_returns_404():
    assert client.get("/api/definitely-not-a-route").status_code == 404
