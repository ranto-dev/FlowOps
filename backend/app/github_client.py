"""Façade HTTP vers l'API GitHub (profil, dépôts, contenus, Actions).

Un unique ``httpx.AsyncClient`` est partagé par toutes les requêtes
sortantes : keep-alive, timeouts centralisés (``settings.GITHUB_TIMEOUT``)
et un seul point d'entrée à auditer. Les erreurs métier sont levées en
``GitHubApiError`` (voir ``app.exceptions``) et converties en réponse
JSON ``{"detail": ...}`` par le handler enregistré dans ``create_app()``.

Toutes les fonctions sont asynchrones et renvoient/haussent les mêmes
formes de données que l'ancienne implémentation inline dans ``main.py``
(contrat API gelé — voir tests/test_routes.py).
"""
from __future__ import annotations

import base64

import httpx

from app.exceptions import GitHubApiError
from app.settings import GITHUB_TIMEOUT

GITHUB_API_BASE = "https://api.github.com"

# Certains appels (push de contenu, téléchargement de logs) étaient
# historiquement servis avec un timeout de 30 s, contre 20 s ailleurs.
LONG_REQUEST_TIMEOUT = 30.0

_client: httpx.AsyncClient | None = None


def get_client() -> httpx.AsyncClient:
    """Retourne le client HTTP partagé, créé paresseusement à la 1re requête."""
    global _client
    if _client is None or _client.is_closed:
        _client = httpx.AsyncClient(
            timeout=httpx.Timeout(GITHUB_TIMEOUT, connect=5.0),
            limits=httpx.Limits(max_connections=50, max_keepalive_connections=20),
            headers={
                "Accept": "application/vnd.github+json",
                "X-GitHub-Api-Version": "2022-11-28",
            },
        )
    return _client


async def aclose() -> None:
    """Ferme le client partagé (appelé au shutdown via le lifespan)."""
    global _client
    if _client is not None and not _client.is_closed:
        await _client.aclose()
    _client = None


def auth_headers(token: str) -> dict[str, str]:
    """En-tête d'authentification « token » exigé par l'API GitHub v3."""
    return {"Authorization": f"token {token}"}


def normalize_repo_slug(repo: str) -> str:
    """Réduit une URL GitHub (https://… ou git@…:owner/repo.git) au slug ``owner/name``.

    Dédupliqué : cette logique était copiée 3 fois dans ``main.py``.
    """
    if "github.com/" in repo:
        return repo.split("github.com/")[-1].strip("/")
    if "github.com:" in repo:
        return repo.split("github.com:")[-1].replace(".git", "").strip("/")
    return repo.strip()


def _response_message(response: httpx.Response) -> str:
    """Extrait le message d'erreur lisible d'une réponse GitHub (JSON ou texte)."""
    try:
        return response.json().get("message", response.text)
    except Exception:  # noqa: BLE001 — réponse non JSON : on garde le texte brut
        return response.text


async def get_user(token: str) -> dict:
    """Renvoie le profil GitHub associé au token.

    Raises:
        GitHubApiError: Si le token est expiré/invalide (→ 401 côté API).
    """
    response = await get_client().get(
        f"{GITHUB_API_BASE}/user",
        headers={**auth_headers(token), "Accept": "application/json"},
    )
    if response.status_code != 200:
        raise GitHubApiError(
            response.status_code,
            "GitHub Access Token expired or invalid. Please re-authenticate.",
            http_status=401,
        )
    return response.json()


async def list_repositories(token: str) -> list[dict]:
    """Liste les dépôts visibles par l'utilisateur (100 premiers, triés par activité).

    Raises:
        GitHubApiError: Si l'API GitHub répond autrement que 200 (→ 400).
    """
    response = await get_client().get(
        f"{GITHUB_API_BASE}/user/repos?per_page=100&sort=updated",
        headers={**auth_headers(token), "Accept": "application/json"},
    )
    if response.status_code != 200:
        raise GitHubApiError(
            response.status_code,
            "Failed to fetch repositories from GitHub",
            http_status=400,
        )
    return response.json()


async def push_workflow_file(token: str, repo: str, filename: str, content: str) -> None:
    """Commit le YAML compilé dans ``.github/workflows/<filename>`` (branche ``main``).

    Récupère d'abord le ``sha`` du fichier existant (obligatoire pour l'update),
    puis encode le contenu en base64 comme demandé par l'API « contents ».

    Raises:
        GitHubApiError: 401 (token), 404 (dépôt/accès), sinon 400 (push échoué).
    """
    client = get_client()
    headers = auth_headers(token)
    url = f"{GITHUB_API_BASE}/repos/{repo}/contents/.github/workflows/{filename}"

    sha = None
    check = await client.get(url, headers=headers)
    if check.status_code == 200:
        sha = check.json().get("sha")
    elif check.status_code == 404:
        # Fichier absent : création, pas de sha à fournir.
        pass
    elif check.status_code == 401:
        raise GitHubApiError(401, "GitHub Access Token expired or invalid")

    encoded = base64.b64encode(content.encode("utf-8")).decode("utf-8")
    payload: dict = {
        "message": f"ci(flowops): update/create workflow {filename} via FlowOps Studio",
        "content": encoded,
        # "main" : passer en "master" si le dépôt utilise l'ancienne nomenclature.
        "branch": "main",
    }
    if sha:
        payload["sha"] = sha

    push = await client.put(url, headers=headers, json=payload, timeout=LONG_REQUEST_TIMEOUT)
    if push.status_code in (200, 201):
        return

    if push.status_code == 404:
        raise GitHubApiError(
            404,
            f"GitHub returned 404 Not Found during file push to '{repo}'. "
            "Verify that the repository exists, that your account has write access, "
            "and that your GitHub token has BOTH 'repo' and 'workflow' scopes checked.",
        )
    raise GitHubApiError(
        push.status_code,
        f"Failed to push YAML file to GitHub: {_response_message(push)} "
        f"(Status: {push.status_code})",
        http_status=400,
    )


async def create_dispatch(token: str, repo: str, project_name: str) -> None:
    """Envoie le ``repository_dispatch`` ``flowops_trigger`` qui lance l'action GitHub.

    Args:
        token: Token GitHub avec le scope ``repo``.
        repo: Slug ``owner/name`` du dépôt cible.
        project_name: Nom du projet, transmis dans le payload client.

    Raises:
        GitHubApiError: Si le signal n'est pas accepté (→ 400). Le message
            rappelle que le YAML a déjà été poussé (c'est le seul usage).
    """
    response = await get_client().post(
        f"{GITHUB_API_BASE}/repos/{repo}/dispatches",
        headers=auth_headers(token),
        json={
            "event_type": "flowops_trigger",
            "client_payload": {
                "project_name": project_name,
                "triggered_by": "FlowOps Dashboard",
            },
        },
        timeout=LONG_REQUEST_TIMEOUT,
    )
    # HTTP 204 = succès sans contenu (comportement normal du Repository Dispatch).
    if response.status_code == 204:
        return
    raise GitHubApiError(
        response.status_code,
        f"YAML file pushed successfully, but Dispatch signal failed: "
        f"{_response_message(response)} (Status: {response.status_code})",
        http_status=400,
    )


async def list_workflow_runs(token: str, repo: str) -> list[dict]:
    """Renvoie les 10 dernières exécutions (workflow runs) du dépôt.

    Raises:
        GitHubApiError: Si l'API GitHub répond autrement que 200 (statut repris).
    """
    response = await get_client().get(
        f"{GITHUB_API_BASE}/repos/{repo}/actions/runs?per_page=10",
        headers=auth_headers(token),
    )
    if response.status_code != 200:
        raise GitHubApiError(
            response.status_code,
            f"Impossible de récupérer les exécutions depuis GitHub: {response.text}",
        )
    return response.json().get("workflow_runs", [])


async def list_run_jobs(token: str, repo: str, run_id: str) -> list[dict]:
    """Renvoie les jobs (et leurs steps) d'une exécution donnée.

    Raises:
        GitHubApiError: Si l'API GitHub répond autrement que 200 (statut repris).
    """
    response = await get_client().get(
        f"{GITHUB_API_BASE}/repos/{repo}/actions/runs/{run_id}/jobs",
        headers=auth_headers(token),
    )
    if response.status_code != 200:
        raise GitHubApiError(
            response.status_code,
            "Erreur de récupération des jobs GitHub",
        )
    return response.json().get("jobs", [])


async def get_job_logs(token: str, repo: str, job_id: str) -> tuple[int, str]:
    """Télécharge le texte brut des logs d'un job (GitHub renvoie un 302 signé S3).

    Returns:
        ``(statut_http, corps)`` — le routeur transforme lui-même les
        réponses 404/erreur en messages pédagogiques (contrat inchangé).

    Note:
        ``follow_redirects=True`` : le 302 de GitHub pointe vers un stockage
        objet dont l'URL expire ; sans redirection on ne récupère jamais le flux.
    """
    response = await get_client().get(
        f"{GITHUB_API_BASE}/repos/{repo}/actions/jobs/{job_id}/logs",
        headers=auth_headers(token),
        follow_redirects=True,
        timeout=LONG_REQUEST_TIMEOUT,
    )
    return response.status_code, response.text
