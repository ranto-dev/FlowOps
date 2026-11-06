import type { DocPage } from "../types";
import { code, h2, ol, p, table, tip, ul, warning } from "../content/blocks";

export const advancedFr: DocPage[] = [
  {
    slug: "dev-troubleshooting",
    title: "Dépannage développeur",
    navTitle: "Dépannage",
    description: "Résolvez les problèmes de MongoDB, de token GitHub, d'OAuth, d'exécution et de ports.",
    keywords: ["error", "401", "500", "mongo", "port", "cors", "erreur", "dépannage"],
    blocks: [
      h2("MongoDB est injoignable"),
      p("Symptômes : les endpoints de projets échouent alors que `/api/auth/status` répond toujours (l'API démarre sans MongoDB)."),
      code(
        "bash",
        `docker ps --filter name=flowops-mongo
docker logs --tail 50 flowops-mongo
docker start flowops-mongo`,
      ),
      p("Vérifiez aussi que `MONGO_URI` contient les identifiants définis dans `backend/mongo-docker.sh`."),
      h2("OAuth n'est pas configuré"),
      p(
        "`POST /api/auth/device-code` renvoie 500 quand `GITHUB_CLIENT_ID` ou `GITHUB_CLIENT_SECRET` est vide. `GET /api/auth/status` liste les variables manquantes. Redémarrez l'API après avoir modifié `.env`.",
      ),
      h2("401 — token expiré ou révoqué"),
      p("L'application web vous déconnecte automatiquement sur un 401. Reconnectez-vous. Les résolutions d'identité sont mises en cache 10 minutes."),
      h2("L'exécution échoue"),
      table(
        ["Symptôme", "Cause"],
        ["400 — aucun dépôt lié", "Le projet n'a pas de `repository`"],
        ["404 de GitHub", "Dépôt introuvable ou accès refusé"],
        ["400 sur push ou dispatch", "Le token n'a pas les scopes `repo` et `workflow`, ou la branche n'est pas `main`"],
        ["Erreur de stockage", "Aucun workflow n'a encore été sauvegardé pour le projet"],
      ),
      h2("Les logs sont vides"),
      p("`available: false` signifie que GitHub n'a pas encore de log. Réessayez une fois le job démarré."),
      h2("Conflits de ports"),
      table(
        ["Port", "Service"],
        ["5173", "Serveur de dev Vite (l'origine CORS autorisée)"],
        ["8000", "FastAPI"],
        ["27017", "MongoDB"],
        ["5000", "Interface MLflow"],
      ),
      code("bash", "ss -ltnp | grep -E ':(5173|8000|27017)'"),
      warning(
        "Si vous servez le frontend depuis une autre origine, ajoutez-la à `CORS_ORIGINS` ; sinon le navigateur bloque tous les appels API.",
        "CORS",
      ),
      h2("Les prédictions échouent"),
      p("Assurez-vous que les modèles existent, puis réessayez :"),
      code("bash", "cd backend\nvenv/bin/python -m mlops.pipeline --sample"),
    ],
  },
  {
    slug: "development",
    title: "Développement",
    description: "Commandes, vérifications et conventions pour contribuer à FlowOps.",
    keywords: ["tests", "ruff", "pytest", "eslint", "contributing", "contribuer", "conventions"],
    blocks: [
      h2("Vérifications backend"),
      code(
        "bash",
        `cd backend
venv/bin/ruff check .
venv/bin/python -m pytest
venv/bin/python -m pytest tests/test_routes.py::test_name   # single test`,
      ),
      h2("Vérifications frontend"),
      code("bash", "cd frontend\npnpm lint\npnpm exec tsc -b\npnpm build"),
      h2("Conventions"),
      ul(
        "Les nouvelles routes vont dans `backend/app/routers/*.py` et sont montées dans `create_app()` — jamais dans `backend/main.py`.",
        "Les variables d'environnement ne sont lues que dans `app/settings.py`.",
        "Conservez l'isolation par utilisateur : renvoyez 404 aussi bien pour un projet inexistant que pour un projet qui n'est pas à vous.",
        "Les imports frontend sont relatifs (pas d'alias de chemin) et les appels API passent par `lib/api.ts`.",
        "Les commentaires et les messages de commit sont écrits en français.",
      ),
      h2("Ajouter un type d'étape"),
      p("Le type d'étape est un ensemble fermé. Mettez à jour chaque endroit qui s'appuie dessus :"),
      ol(
        "`backend/compiler.py` — émission du YAML",
        "`backend/mlops/features/engineering.py` — features ML (gardez la parité train/serve)",
        "`frontend/src/@types/workflow.ts` — déclaration du type",
        "`frontend/src/components/WorkflowForm.tsx` — champs du formulaire",
      ),
      h2("Modifier cette documentation"),
      p(
        "Les pages sont des données. Le contenu vit dans `src/docs/content/*.ts`, la sidebar dans `src/docs/navigation.ts`. Ajouter une page se fait en deux étapes :",
      ),
      ol(
        "Ajoutez un `DocPage` à un fichier de contenu (voir `blocks.ts` pour les helpers de blocs).",
        "Référencez son `slug` dans `navigation.ts`.",
      ),
      tip("Les titres reçoivent automatiquement des ancres et sont indexés par la recherche ; aucun branchement supplémentaire n'est nécessaire."),
    ],
  },
];
