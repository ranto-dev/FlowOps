import type { DocPage } from "../types";
import { code, h2, note, ol, p, table, ul, warning } from "../content/blocks";

export const conceptsFr: DocPage[] = [
  {
    slug: "architecture",
    title: "Architecture",
    description: "Comment le frontend, l'API, la base de données, GitHub et le moteur ML s'articulent.",
    keywords: ["fastapi", "mongodb", "layers", "couches", "architecture"],
    blocks: [
      h2("Vue d'ensemble"),
      code(
        "text",
        `React (5173)  ──HTTP + Bearer token──▶  FastAPI (8000)
                                              │
                    ┌─────────────────────────┼──────────────────────┐
                    ▼                         ▼                      ▼
                 MongoDB               GitHub REST API         MLOps engine
            users · projects        contents · dispatches     scikit-learn · MLflow`,
        "Chemin d'une requête",
      ),
      h2("Backend"),
      p(
        "`backend/main.py` est un simple shim qui réexporte l'application construite par `app.main.create_app()`. Cette fabrique monte le CORS, le lifespan (index Mongo, fermeture du client HTTP), le gestionnaire d'erreurs et les routeurs.",
      ),
      table(
        ["Module", "Responsabilité"],
        ["`app/routers/*`", "Logique des routes : auth, projects, workflows, logs"],
        ["`mlops/api.py`", "Routes MLOps, montées sur `/api/mlops`"],
        ["`app/dependencies.py`", "`CurrentUserDep` et `OwnedProjectDep`"],
        ["`app/github_client.py`", "Client HTTP partagé et appels GitHub"],
        ["`app/github_auth.py`", "Device Flow et cache d'identité"],
        ["`app/storage.py`", "Accès à `generated_workflows/`"],
        ["`compiler.py`", "Schéma FlowOps vers YAML GitHub Actions"],
      ),
      h2("Erreurs"),
      p(
        "Les échecs GitHub et de stockage sont levés en `ServiceError`, puis sérialisés par un gestionnaire global en `{ \"detail\": ... }`, le même format que le `HTTPException` de FastAPI.",
      ),
      h2("Frontend"),
      p(
        "Tous les appels API passent par `src/lib/api.ts` (`apiFetch`, `ApiError`). Une réponse 401 efface la session et déconnecte l'utilisateur. Les routes et leurs gardes sont déclarées dans `src/App.tsx`.",
      ),
    ],
  },
  {
    slug: "projects-repositories",
    title: "Projets et dépôts",
    description: "Comment les projets sont stockés dans MongoDB et liés aux dépôts GitHub.",
    keywords: ["mongodb", "isolation", "repository", "dépôt", "projet"],
    blocks: [
      h2("L'enregistrement d'un projet"),
      p("Un projet relie un nom et une description à un dépôt GitHub, et indique si un workflow a été sauvegardé."),
      table(
        ["Champ", "Description"],
        ["`name`, `description`", "Texte libre saisi à la création"],
        ["`repository`", "Dépôt cible, `owner/name`"],
        ["`github_id`, `created_by`", "Propriétaire du projet"],
        ["`has_workflow`", "`true` dès qu'un workflow a été sauvegardé"],
        ["`yaml_filename`", "Nom du fichier du workflow sauvegardé"],
        ["`created_at`, `updated_at`", "Horodatages UTC ; les listes sont triées par `updated_at`"],
      ),
      h2("Isolation par utilisateur"),
      p(
        "Chaque endpoint de projet résout le projet via `OwnedProjectDep`. Un projet inexistant et un projet appartenant à quelqu'un d'autre renvoient tous deux **404** : impossible de sonder les identifiants.",
      ),
      h2("Format du dépôt"),
      p(
        "Le dépôt est stocké tel que saisi. À l'utilisation, une URL GitHub complète est normalisée en slug `owner/name`.",
      ),
      h2("Lister vos dépôts"),
      p("`GET /api/github/repositories` renvoie les dépôts accessibles avec votre token (`id` et `full_name`)."),
    ],
  },
  {
    slug: "authentication",
    title: "Authentification",
    description: "GitHub OAuth Device Flow, tokens Bearer et résolution d'identité.",
    keywords: ["oauth", "device flow", "token", "login", "connexion", "authentification"],
    blocks: [
      h2("Device Flow"),
      ol(
        "Le frontend appelle `POST /api/auth/device-code` et affiche le code utilisateur renvoyé.",
        "L'utilisateur autorise l'application sur GitHub.",
        "Le frontend interroge `POST /api/auth/check-login` avec le `device_code` jusqu'au succès.",
        "La réponse contient le token d'accès GitHub, que le frontend conserve dans `localStorage` (`flowops_token`) pendant 30 jours d'inactivité (expiration glissante, voir `lib/session.ts`) : la connexion GitHub et sa double authentification ne sont donc pas répétées à chaque visite.",
      ),
      h2("Requêtes authentifiées"),
      code("bash", 'curl http://localhost:8000/api/projects \\\n  -H "Authorization: Bearer $GITHUB_TOKEN"'),
      p(
        "Le backend résout le token auprès de GitHub et met l'identité en cache pendant 10 minutes. Un token révoqué peut donc continuer à fonctionner brièvement.",
      ),
      h2("Utilisateurs"),
      p(
        "À chaque connexion réussie, l'utilisateur est créé ou mis à jour (upsert) dans la collection `users` (`github_id` unique). `is_new_user` dans la réponse de connexion vaut `true` uniquement quand le document vient d'être créé.",
      ),
      h2("Gardes de routes"),
      p(
        "Côté frontend, `ProtectedRoute` redirige vers `/auth` quand aucun token n'est stocké, et `PublicOnlyRoute` redirige les utilisateurs connectés vers `/workspace`.",
      ),
    ],
  },
  {
    slug: "pipeline-builder",
    title: "Éditeur de pipelines low-code",
    navTitle: "Éditeur de pipelines",
    description: "Composez des workflows avec un formulaire et compilez-les en YAML GitHub Actions.",
    keywords: ["workflow", "form", "jobs", "steps", "formulaire", "étapes", "pipeline"],
    blocks: [
      h2("Concept"),
      p(
        "L'éditeur manipule un **schéma FlowOps** : déclencheurs, branches, variables d'environnement et une liste de jobs, chacun avec des étapes ordonnées. Le compilateur backend transforme ce schéma en YAML GitHub Actions standard, que vous pouvez relire avant de sauvegarder.",
      ),
      h2("Les briques"),
      ul(
        "**Workflow** — nom, nom de fichier, événements déclencheurs, branches et variables d'environnement globales.",
        "**Jobs** — runner, dépendances (`needs`), matrice et condition optionnelles.",
        "**Étapes** — l'un des six [types d'étapes](/docs/step-types), avec une condition `if` optionnelle.",
      ),
      h2("Aperçu et sauvegarde"),
      p(
        "`POST /api/generate-workflow` renvoie le YAML sans toucher à GitHub. `POST /api/projects/{id}/workflow` compile de la même façon et stocke le résultat pour le projet.",
      ),
      note(
        "L'aperçu et la sauvegarde utilisent le même compilateur : l'aperçu correspond exactement à ce qui sera commité.",
      ),
      h2("Pour aller plus loin"),
      ul(
        "[Types d'étapes](/docs/step-types)",
        "[Compilation YAML](/docs/yaml-compilation)",
        "[Référence du schéma de workflow](/docs/workflow-schema)",
      ),
    ],
  },
  {
    slug: "step-types",
    title: "Types d'étapes",
    description: "Les six types d'étapes gérés par l'éditeur et le YAML que chacun produit.",
    keywords: ["checkout", "setup-node", "npm", "docker", "custom-run", "upload-artifact", "étape", "type"],
    blocks: [
      p("Le `type` d'étape est un ensemble fermé. Chaque type lit ses propres champs dans l'étape."),
      table(
        ["Type", "Champs utilisés", "Étape générée"],
        ["`checkout`", "—", "`uses: actions/checkout@v4`"],
        ["`setup-node`", "`node_version`", "`uses: actions/setup-node@v4` avec `cache: npm`"],
        ["`npm`", "`npm_command`", "`run: npm <command>`"],
        ["`upload-artifact`", "`artifact_path`", "`uses: actions/upload-artifact@v4`"],
        ["`docker`", "`docker_image`, `docker_registry`", "`run:` script de build, tag et push"],
        ["`custom-run`", "`custom_script`", "`run:` votre script"],
      ),
      h2("setup-node"),
      p(
        "`node_version` est utilisé s'il est numérique, sinon `20`. Si le job définit une clé de matrice contenant `node`, la version provient de la matrice.",
      ),
      h2("upload-artifact"),
      p("L'artefact se nomme `production-artifacts`. `artifact_path` vaut `dist/` par défaut."),
      h2("docker"),
      p(
        "L'image est poussée vers `ghcr.io/<owner>/<image>:latest`, ou vers Docker Hub quand `docker_registry` vaut `dockerhub`.",
      ),
      code(
        "bash",
        `docker build -t my-app .
docker tag my-app ghcr.io/\${{ github.repository_owner }}/my-app:latest
docker push ghcr.io/\${{ github.repository_owner }}/my-app:latest`,
        "Script généré (GHCR)",
      ),
      h2("custom-run"),
      p("Les scripts multilignes sont émis sous forme de bloc scalaire YAML. Un script vide se rabat sur un simple `echo`."),
      warning(
        "Ajouter un nouveau type d'étape impose des changements dans le compilateur, le feature engineering ML ainsi que les types et le formulaire du frontend. Voir [Développement](/docs/development).",
        "Ensemble fermé",
      ),
    ],
  },
  {
    slug: "yaml-compilation",
    title: "Compilation YAML",
    description: "Les règles appliquées par `compiler.py` pour transformer le schéma en fichier de workflow.",
    keywords: ["compiler", "repository_dispatch", "matrix", "env", "compilateur", "matrice"],
    blocks: [
      h2("Déclencheurs"),
      ul(
        "Chaque entrée de `on_events` devient un déclencheur.",
        "Pour `push` et `pull_request`, la valeur `branches` (séparée par des virgules) devient un filtre de branches.",
        "Un déclencheur `repository_dispatch` de type `flowops_trigger` est **toujours ajouté**.",
      ),
      note(
        "Le déclencheur `repository_dispatch` forcé est ce sur quoi s'appuie le bouton **Execute** : même les workflows limités à `push` peuvent donc être lancés à la demande.",
        "Pourquoi un déclencheur en plus ?",
      ),
      h2("Environnement"),
      p("`global_env` est analysé ligne par ligne au format `KEY=value` et émis comme bloc `env` au niveau du workflow."),
      h2("Jobs"),
      ul(
        "La clé du job est son `name`, en minuscules, avec les espaces remplacés par des tirets.",
        "`needs` et `job_if` correspondent à `needs` et `if`.",
        "`matrix_key` et `matrix_values` (séparées par des virgules) produisent `strategy.matrix`.",
        "Chaque étape reçoit son `name`, un `if` optionnel issu de `step_if`, puis les champs de son [type](/docs/step-types).",
      ),
      h2("Exemple"),
      code(
        "yaml",
        `name: Release
on:
  push:
    branches:
      - main
  repository_dispatch:
    types:
      - flowops_trigger
jobs:
  test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        node:
          - '18'
          - '20'
    steps:
      - name: Checkout
        uses: actions/checkout@v4`,
      ),
    ],
  },
];
