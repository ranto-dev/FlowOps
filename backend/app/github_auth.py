"""Authentification GitHub (Device Flow) et résolution d'identité.

L'identité n'est jamais déclarée par le client : elle est résolue directement
auprès de l'API GitHub (impossible à falsifier) puis mise en cache en mémoire
quelques minutes pour ne pas re-appeler ``GET /user`` à chaque requête.

Contrat conservé (inchangé depuis l'implémentation inline dans ``main.py``) :
    * ``request_device_code()``  → payload brut du Device Flow GitHub ;
    * ``exchange_device_code()`` → ``{"status": "pending", "error": ...}``
      pendant l'attente, ou le couple token + profil une fois validé ;
    * ``resolve_user()``         → ``(github_id, username, avatar_url)``.
"""
from __future__ import annotations

from time import time

from app.exceptions import GitHubApiError
from app.github_client import get_client, get_user
from app.settings import GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET

# Cache token -> (github_id, username, avatar_url, expires_at).
_GITHUB_USER_CACHE: dict[str, tuple[str, str, str, float]] = {}
_GITHUB_USER_CACHE_TTL = 600  # secondes


async def resolve_user(token: str) -> tuple[str, str, str]:
    """Retourne ``(github_id, username, avatar_url)`` pour le token donné.

    Raises:
        GitHubApiError: Token expiré/invalide ou profil illisible (→ 401).
    """
    cached = _GITHUB_USER_CACHE.get(token)
    if cached and cached[3] > time():
        github_id, username, avatar_url, _ = cached
        return github_id, username, avatar_url

    user_data = await get_user(token)
    github_id = str(user_data.get("id"))
    username = user_data.get("login", "")
    avatar_url = user_data.get("avatar_url", "")

    if not github_id or github_id == "None":
        raise GitHubApiError(
            401,
            "Unable to resolve GitHub user profile. Please re-authenticate.",
        )

    _GITHUB_USER_CACHE[token] = (
        github_id,
        username,
        avatar_url,
        time() + _GITHUB_USER_CACHE_TTL,
    )
    return github_id, username, avatar_url


async def request_device_code() -> dict:
    """Demande un code d'activation d'appareil à l'API GitHub (Device Flow).

    Raises:
        GitHubApiError: GitHub injoignable ou en erreur (→ 500 côté API).
    """
    response = await get_client().post(
        "https://github.com/login/device/code",
        headers={"Accept": "application/json"},
        data={"client_id": GITHUB_CLIENT_ID, "scope": "user repo workflow"},
    )
    if response.status_code != 200:
        raise GitHubApiError(
            response.status_code,
            "Cannot connect to GitHub Device Flow API",
            http_status=500,
        )
    return response.json()


async def exchange_device_code(device_code: str) -> dict:
    """Échange le code device contre un token d'accès, ou décrit l'état d'attente.

    Dès que GitHub répond avec un ``access_token``, l'utilisateur est considéré
    connecté : son profil est alors récupéré pour fabriquer l'identité serveur.

    Returns:
        ``{"status": "pending", "error": <code>}`` en attente de validation,
        sinon ``{"status": "success", "access_token", "github_id",
        "username", "avatar_url"}``.
    """
    client = get_client()
    response = await client.post(
        "https://github.com/login/oauth/access_token",
        headers={"Accept": "application/json"},
        data={
            "client_id": GITHUB_CLIENT_ID,
            "client_secret": GITHUB_CLIENT_SECRET,
            "device_code": device_code,
            "grant_type": "urn:ietf:params:oauth:grant-type:device_code",
        },
    )
    data = response.json()

    # Cas d'attente (user_access_token refusé, appareil non validé, etc.)
    if "error" in data:
        return {"status": "pending", "error": data["error"]}
    if "access_token" not in data:
        return {"status": "pending", "error": "waiting_user_validation"}

    access_token = data["access_token"]
    try:
        user_data = await get_user(access_token)
    except GitHubApiError:
        return {"status": "pending", "error": "failed_to_fetch_user_profile"}

    github_id = str(user_data.get("id"))
    if not github_id or github_id == "None":
        return {"status": "pending", "error": "failed_to_fetch_user_profile"}

    return {
        "status": "success",
        "access_token": access_token,
        "github_id": github_id,
        "username": user_data.get("login"),
        "avatar_url": user_data.get("avatar_url"),
    }

