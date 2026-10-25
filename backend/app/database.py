"""Accès à MongoDB : client Motor unique partagé par toute l'application.

Motor gère lui-même son pool de connexions : créer un client par requête
saturerait les sockets MongoDB et casserait la mise en cache des connexions.
"""
from __future__ import annotations

import asyncio
import logging

from motor.motor_asyncio import AsyncIOMotorClient

from app.settings import MONGO_DB_NAME, MONGO_URI

logger = logging.getLogger(__name__)

# Délai maximum consenti pour la création des index au démarrage : sans
# garde-fou, Motor attend le timeout de sélection de serveur (30 s par
# défaut) si MongoDB est absent, et bloque l'amorçage de l'application.
INDEX_STARTUP_TIMEOUT = 3.0

# Client unique — réutilisé pour toutes les requêtes (import unique).
client = AsyncIOMotorClient(MONGO_URI)
db = client[MONGO_DB_NAME]

projects_collection = db["projects"]
users_collection = db["users"]


async def ensure_indexes() -> None:
    """Crée les index nécessaires au démarrage (appelé par le lifespan).

    Index composite : la liste des projets filtre sur ``github_id`` puis trie
    sur ``updated_at`` — sans index, chaque appel fait un scan complet.

    Best-effort : si MongoDB est absent au démarrage, on logge et on laisse
    l'application monter (comportement historique de l'app).
    """
    try:
        await asyncio.wait_for(_create_indexes(), timeout=INDEX_STARTUP_TIMEOUT)
    except TimeoutError:
        # MongoDB absent/tejant : on n'interrompt pas l'amorçage.
        logger.warning(
            "MongoDB injoignable (%.0fs) : index non créés au démarrage.",
            INDEX_STARTUP_TIMEOUT,
        )
    except Exception:  # noqa: BLE001 — indisponibilité MongoDB non bloquante
        logger.warning(
            "Création des index impossible : MongoDB indisponible.",
            exc_info=True,
        )


async def _create_indexes() -> None:
    """Crée les index (isolé pour être exécutable sous ``asyncio.wait_for``)."""
    await projects_collection.create_index([("github_id", 1), ("updated_at", -1)])
    await users_collection.create_index("github_id", unique=True)
