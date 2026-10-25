"""Configuration centrale de l'API FlowOps (côté serveur).

Toutes les valeurs d'environnement sont lues **ici, une seule fois**, après
chargement explicite de ``backend/.env``. Aucun autre module ne doit appeler
``os.getenv`` directement : c'est ce qui garantit que l'ordre d'import est
sans effet sur la configuration.

Variables lues (cf. ``backend/.env.example``) :
    MONGO_URI, MONGO_DB_NAME, GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET,
    CORS_ORIGINS, GITHUB_TIMEOUT.
"""
from __future__ import annotations

import os
from pathlib import Path

from dotenv import load_dotenv

# Racine du backend (répertoire contenant main.py, mlops/, venv/ …).
BACKEND_DIR = Path(__file__).resolve().parent.parent

# Chargement explicite et idempotent du .env, AVANT toute lecture d'env.
# Fait au import du module : `app.settings` doit donc toujours être importé
# avant tout code lisant la configuration (c'est le cas de `app.main`).
load_dotenv(BACKEND_DIR / ".env")

# --- MongoDB ---------------------------------------------------------------
MONGO_URI: str = os.getenv("MONGO_URI", "mongodb://localhost:27017/")
MONGO_DB_NAME: str = os.getenv("MONGO_DB_NAME", "flowops_db")

# --- GitHub OAuth (Device Flow) --------------------------------------------
GITHUB_CLIENT_ID: str = os.getenv("GITHUB_CLIENT_ID", "").strip()
GITHUB_CLIENT_SECRET: str = os.getenv("GITHUB_CLIENT_SECRET", "").strip()

# L'application ne peut authentifier personne tant que les deux variables
# ci-dessus ne sont pas renseignées ; /api/auth/status expose cet état.
GITHUB_CONFIG_READY: bool = bool(GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET)
GITHUB_CONFIG_MISSING_MSG: str = (
    "GitHub OAuth App is not configured. "
    "Set GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET in backend/.env "
    "(see backend/.env.example)."
)

# --- CORS ------------------------------------------------------------------
# Le frontend Vite tourne uniquement sur ces origines en développement.
CORS_ORIGINS: list[str] = [
    origin.strip()
    for origin in os.getenv(
        "CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173"
    ).split(",")
    if origin.strip()
]

# --- HTTP GitHub -----------------------------------------------------------
# Timeout (secondes) appliqué à tous les appels sortants vers l'API GitHub.
GITHUB_TIMEOUT: float = float(os.getenv("GITHUB_TIMEOUT", "20"))

# --- Stockage local des workflows compilés ---------------------------------
# Dossier gitignoré : config.json + YAML compilé par projet Mongo.
# Créé au import (comportement historique de main.py).
WORKFLOWS_DIR: Path = BACKEND_DIR / "generated_workflows"
WORKFLOWS_DIR.mkdir(parents=True, exist_ok=True)
