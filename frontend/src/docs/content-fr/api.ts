import type { DocPage } from "../types";
import { code, h2, h3, note, p, table, warning } from "../content/blocks";

const BASE = "http://localhost:8000";

export const apiFr: DocPage[] = [
  {
    slug: "api-overview",
    title: "Vue d'ensemble de l'API",
    description: "URL de base, authentification, format des erreurs et liste des endpoints.",
    keywords: ["rest", "bearer", "errors", "endpoints", "erreurs", "authentification", "api"],
    blocks: [
      h2("URL de base"),
      code("text", BASE, "Développement"),
      h2("Authentification"),
      p("Envoyez le jeton d'accès GitHub en tant que jeton Bearer. Les endpoints marqués *public* n'en ont pas besoin."),
      code("bash", `curl ${BASE}/api/projects \\\n  -H "Authorization: Bearer $GITHUB_TOKEN"`),
      h2("Erreurs"),
      code("json", '{ "detail": "Project not found" }', "Corps d'erreur"),
      table(
        ["Statut", "Signification"],
        ["`401`", "Jeton GitHub manquant, invalide ou expiré"],
        ["`404`", "Ressource introuvable, ou qui ne vous appartient pas"],
        ["`400`", "GitHub a refusé une écriture (push ou dispatch), ou aucun dépôt n'est lié"],
        ["`500`", "Erreur serveur, GitHub injoignable ou OAuth non configuré"],
      ),
      h2("Endpoints"),
      table(
        ["Méthode", "Chemin", "Auth"],
        ["GET", "`/api/auth/status`", "public"],
        ["POST", "`/api/auth/device-code`", "public"],
        ["POST", "`/api/auth/check-login`", "public"],
        ["GET", "`/api/github/repositories`", "token"],
        ["POST", "`/api/projects`", "token"],
        ["GET", "`/api/projects`", "token"],
        ["DELETE", "`/api/projects/{id}`", "token"],
        ["POST", "`/api/generate-workflow`", "public"],
        ["POST", "`/api/projects/{id}/workflow`", "token"],
        ["POST", "`/api/projects/{id}/execute`", "token"],
        ["GET", "`/api/projects/{id}/runs`", "token"],
        ["GET", "`/api/projects/{id}/runs/{run_id}/jobs`", "token"],
        ["GET", "`/api/projects/{id}/runs/{run_id}/jobs/{job_id}/logs`", "token"],
        ["*", "`/api/mlops/*`", "public"],
      ),
    ],
  },
  {
    slug: "api-authentication",
    title: "API d'authentification",
    navTitle: "Authentification",
    description: "Les endpoints du Device Flow GitHub.",
    keywords: ["device-code", "check-login", "status", "repositories", "authentification", "dépôts"],
    blocks: [
      h2("GET /api/auth/status"),
      p("Indique si les identifiants OAuth GitHub sont configurés."),
      code("bash", `curl ${BASE}/api/auth/status`),
      code(
        "json",
        `{
  "configured": false,
  "missing_env_vars": ["GITHUB_CLIENT_ID", "GITHUB_CLIENT_SECRET"],
  "message": "GitHub OAuth App is not configured. ..."
}`,
      ),
      h2("POST /api/auth/device-code"),
      p(
        "Démarre le Device Flow et renvoie la réponse de GitHub (`device_code`, `user_code`, `verification_uri`, `expires_in`, `interval`). Échoue avec une erreur 500 si OAuth n'est pas configuré.",
      ),
      code("bash", `curl -X POST ${BASE}/api/auth/device-code`),
      h2("POST /api/auth/check-login"),
      p("Interrogez l'endpoint avec le `device_code` jusqu'à ce que l'utilisateur ait autorisé l'application."),
      code(
        "bash",
        `curl -X POST ${BASE}/api/auth/check-login \\
  -H "Content-Type: application/json" \\
  -d '{ "device_code": "<device_code>" }'`,
      ),
      code("json", '{ "status": "pending", "error": "authorization_pending" }', "En attente"),
      code(
        "json",
        `{
  "status": "success",
  "token": "gho_...",
  "github_id": 1234567,
  "username": "octocat",
  "avatar_url": "https://avatars.githubusercontent.com/u/1234567",
  "is_new_user": false
}`,
        "Autorisé",
      ),
      h2("GET /api/github/repositories"),
      p("Liste les dépôts accessibles avec votre jeton."),
      code("bash", `curl ${BASE}/api/github/repositories \\\n  -H "Authorization: Bearer $GITHUB_TOKEN"`),
      code("json", '[{ "id": 987654, "full_name": "acme/payments-api" }]'),
    ],
  },
  {
    slug: "api-projects",
    title: "API des projets",
    navTitle: "Projets",
    description: "Créer, lister et supprimer des projets.",
    keywords: ["projects", "crud", "projets"],
    blocks: [
      h2("POST /api/projects"),
      code(
        "bash",
        `curl -X POST ${BASE}/api/projects \\
  -H "Authorization: Bearer $GITHUB_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "payments-api",
    "description": "CI for the payments service",
    "repository": "acme/payments-api"
  }'`,
      ),
      code(
        "json",
        `{
  "id": "6650f1c2a1b2c3d4e5f60718",
  "name": "payments-api",
  "description": "CI for the payments service",
  "repository": "acme/payments-api",
  "has_workflow": false,
  "yaml_filename": null
}`,
        "Réponse",
      ),
      h2("GET /api/projects"),
      p("Renvoie uniquement vos projets, du plus récemment modifié au plus ancien."),
      code("bash", `curl ${BASE}/api/projects \\\n  -H "Authorization: Bearer $GITHUB_TOKEN"`),
      h2("DELETE /api/projects/{project_id}"),
      p("Supprime un projet. Renvoie 404 s'il n'existe pas ou ne vous appartient pas."),
      code("bash", `curl -X DELETE ${BASE}/api/projects/$PROJECT_ID \\\n  -H "Authorization: Bearer $GITHUB_TOKEN"`),
    ],
  },
  {
    slug: "api-workflows",
    title: "API des workflows",
    navTitle: "Workflows",
    description: "Prévisualiser, enregistrer et exécuter des workflows.",
    keywords: ["generate-workflow", "save", "execute", "yaml", "enregistrer", "exécuter"],
    blocks: [
      p("Le corps de requête des deux premiers endpoints est le [schéma de workflow](/docs/workflow-schema)."),
      h2("POST /api/generate-workflow"),
      p("Compile le schéma et renvoie le YAML. Rien n'est stocké et GitHub n'est pas contacté."),
      code(
        "bash",
        `curl -X POST ${BASE}/api/generate-workflow \\
  -H "Content-Type: application/json" \\
  -d '{
    "filename": "ci.yaml",
    "name": "CI",
    "on_events": ["push"],
    "branches": "main",
    "jobs": [{
      "id": "j1", "name": "build", "runs_on": "ubuntu-latest",
      "steps": [{ "id": "s1", "name": "Checkout", "type": "checkout" }]
    }]
  }'`,
      ),
      code("json", '{ "filename": "ci.yaml", "yaml": "name: CI\\non:\\n  push: ..." }', "Réponse"),
      h2("POST /api/projects/{project_id}/workflow"),
      p("Compile et stocke le workflow d'un projet qui vous appartient."),
      code(
        "json",
        `{
  "status": "success",
  "message": "Workflow saved locally in project directory",
  "yaml_filename": "ci.yaml"
}`,
      ),
      h2("POST /api/projects/{project_id}/execute"),
      p("Commite le YAML enregistré dans `.github/workflows/` sur `main` puis déclenche `flowops_trigger`. Pas de corps de requête."),
      code("bash", `curl -X POST ${BASE}/api/projects/$PROJECT_ID/execute \\\n  -H "Authorization: Bearer $GITHUB_TOKEN"`),
      warning("Nécessite un jeton avec les scopes `repo` et `workflow`.", "Scopes du jeton"),
    ],
  },
  {
    slug: "api-runs-logs",
    title: "API des exécutions et logs",
    navTitle: "Exécutions et logs",
    description: "Lire les exécutions, jobs et logs GitHub Actions d'un projet.",
    keywords: ["runs", "jobs", "logs", "exécutions"],
    blocks: [
      h2("GET /api/projects/{project_id}/runs"),
      code("bash", `curl ${BASE}/api/projects/$PROJECT_ID/runs \\\n  -H "Authorization: Bearer $GITHUB_TOKEN"`),
      code(
        "json",
        `{
  "project_id": "6650f1c2a1b2c3d4e5f60718",
  "repository": "acme/payments-api",
  "runs": [{
    "id": "9876543210",
    "name": "CI",
    "status": "completed",
    "conclusion": "success",
    "event": "repository_dispatch",
    "branch": "main",
    "commit_sha": "a1b2c3d",
    "created_at": "2026-11-04T09:12:00Z",
    "updated_at": "2026-11-04T09:14:10Z",
    "html_url": "https://github.com/acme/payments-api/actions/runs/9876543210"
  }]
}`,
      ),
      h2("GET /api/projects/{project_id}/runs/{run_id}/jobs"),
      p("Renvoie les jobs d'une exécution avec leurs étapes."),
      h2("GET /api/projects/{project_id}/runs/{run_id}/jobs/{job_id}/logs"),
      code("json", '{ "logs": "...", "available": true, "message": null }'),
      note("Une erreur 502 signifie que GitHub n'a pas pu fournir les logs. `available: false` signifie qu'ils n'existent pas encore."),
    ],
  },
  {
    slug: "api-mlops",
    title: "API MLOps",
    navTitle: "MLOps",
    description: "Endpoints de prédiction, de monitoring et de ré-entraînement sous `/api/mlops`.",
    keywords: ["predict", "status", "models", "retrain", "log-actual", "monitoring", "prédiction", "ré-entraînement", "modèles"],
    blocks: [
      table(
        ["Méthode", "Chemin", "Description"],
        ["GET", "`/api/mlops/status`", "Modèles actifs, évaluations, monitoring et taille des jeux de données"],
        ["GET", "`/api/mlops/models`", "Modèles actifs, registre et évaluations"],
        ["POST", "`/api/mlops/predict`", "Durée et risque d'échec d'un workflow"],
        ["POST", "`/api/mlops/log-actual`", "Associer le résultat réel à une prédiction"],
        ["GET", "`/api/mlops/monitoring`", "Suivi des valeurs prédites par rapport aux valeurs réelles"],
        ["POST", "`/api/mlops/retrain`", "Lancer le pipeline et recharger les modèles"],
        ["GET", "`/api/mlops/dataset-locations`", "Chemins des jeux de données et des modèles"],
      ),
      h2("POST /api/mlops/predict"),
      p(
        "Accepte une configuration de workflow. `name`, `repository`, `on_events`, `branches` et `jobs` sont lus ; les champs supplémentaires sont tolérés.",
      ),
      code(
        "bash",
        `curl -X POST ${BASE}/api/mlops/predict \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "CI",
    "repository": "acme/payments-api",
    "on_events": ["push"],
    "branches": "main",
    "jobs": [{ "name": "build", "runs_on": "ubuntu-latest",
               "steps": [{ "type": "checkout" }, { "type": "npm", "npm_command": "test" }] }]
  }'`,
      ),
      code(
        "json",
        `{
  "workflow_name": "CI",
  "repository": "acme/payments-api",
  "duration_seconds": 128.5,
  "failure_probability": 0.23,
  "failure_percentage": 23.0,
  "risk_level": "low",
  "logged": true
}`,
        "Réponse (extrait)",
      ),
      h3("Erreurs"),
      p("Une prédiction en échec renvoie une erreur 500 avec un message générique ; la cause figure dans les logs du serveur. Entraînez d'abord les modèles avec `python -m mlops.pipeline --sample`."),
      h2("POST /api/mlops/log-actual"),
      code(
        "json",
        `{
  "workflow_name": "CI",
  "repository": "acme/payments-api",
  "duration_seconds": 141.2,
  "failed": false
}`,
        "Corps de requête",
      ),
      h2("POST /api/mlops/retrain"),
      p("Exécute le pipeline complet, puis recharge les modèles. L'opération peut être longue et bloque jusqu'à la fin."),
    ],
  },
];
