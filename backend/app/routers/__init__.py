"""Routeurs métier de l'API FlowOps (montés par ``app.main.create_app()``).

Chaque module expose un ``APIRouter`` couvrant un domaine :
    * ``auth``      — Device Flow GitHub + dépôts de l'utilisateur ;
    * ``projects``  — CRUD des projets Mongo (isolation par utilisateur) ;
    * ``workflows`` — compilation, stockage local et exécution ;
    * ``logs``      — exécutions/jobs/logs GitHub Actions.
"""
