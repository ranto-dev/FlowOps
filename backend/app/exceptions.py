"""Erreurs métier transportant un statut HTTP et un détail à renvoyer.

Ces exceptions sont converties en réponse JSON ``{"detail": ...}`` par le
handler enregistré dans ``app.main.create_app()`` — même format que
``HTTPException``, que le frontend consomme via ``src/lib/api.ts``.
"""
from __future__ import annotations


class ServiceError(Exception):
    """Erreur applicative normalisée (statut HTTP + message utilisateur)."""

    def __init__(self, status_code: int, detail: str) -> None:
        super().__init__(detail)
        self.status_code = status_code
        self.detail = detail


class GitHubApiError(ServiceError):
    """Réponse d'erreur de l'API GitHub.

    Args:
        github_status: Statut HTTP retourné par GitHub.
        detail: Message déjà formaté pour l'utilisateur.
        http_status: Statut à exposer à l'appelant. Par défaut, le statut
            GitHub est repris tel quel ; les appels « écriture » le
            surchargent (ex. push de workflow → 400 sauf 404).
    """

    def __init__(
        self,
        github_status: int,
        detail: str,
        *,
        http_status: int | None = None,
    ) -> None:
        super().__init__(http_status if http_status is not None else github_status, detail)
        self.github_status = github_status


class StorageError(ServiceError):
    """Workflow compilé absent ou illisible dans ``generated_workflows/``."""
