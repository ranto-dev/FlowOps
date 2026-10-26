"""Contrats pour les états d'indisponibilité des logs GitHub."""
from __future__ import annotations

from fastapi.testclient import TestClient

from app.dependencies import CurrentUser, OwnedProject, get_owned_project
from app.routers import logs
from main import app


def _install_project_override():
    async def resolve_project() -> OwnedProject:
        return OwnedProject(
            project_id="64b000000000000000000000",
            project={"repository": "owner/repo"},
            user=CurrentUser(
                token="test-token",
                github_id="user-1",
                username="test-user",
                avatar_url="",
            ),
        )

    app.dependency_overrides[get_owned_project] = resolve_project


def test_job_logs_not_ready_is_an_explicit_unavailable_state(monkeypatch):
    async def unavailable_logs(_token: str, _repo: str, _job_id: str):
        return 404, ""

    _install_project_override()
    monkeypatch.setattr(logs, "fetch_job_logs", unavailable_logs)
    try:
        response = TestClient(app).get(
            "/api/projects/64b000000000000000000000/runs/123/jobs/456/logs"
        )
    finally:
        app.dependency_overrides.pop(get_owned_project, None)

    assert response.status_code == 200
    assert response.json() == {
        "logs": "",
        "available": False,
        "message": (
            "Les logs ne sont pas encore disponibles sur GitHub. "
            "Réessayez après le démarrage du job."
        ),
    }


def test_upstream_log_failure_is_not_returned_as_successful_logs(monkeypatch):
    async def failed_logs(_token: str, _repo: str, _job_id: str):
        return 403, ""

    _install_project_override()
    monkeypatch.setattr(logs, "fetch_job_logs", failed_logs)
    try:
        response = TestClient(app).get(
            "/api/projects/64b000000000000000000000/runs/123/jobs/456/logs"
        )
    finally:
        app.dependency_overrides.pop(get_owned_project, None)

    assert response.status_code == 502
    assert response.json()["detail"] == (
        "GitHub n'a pas pu fournir les logs (statut HTTP 403)."
    )
