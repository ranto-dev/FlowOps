import type { DocPage } from "../types";
import { code, h2, note, ol, p, table, tip, ul, warning } from "../content/blocks";

export const gettingStartedFr: DocPage[] = [
  {
    slug: "developer-overview",
    title: "Vue d'ensemble pour les développeurs",
    navTitle: "Vue d'ensemble",
    description:
      "FlowOps est un constructeur low-code de workflows GitHub Actions, avec un module MLOps intégré qui prédit la durée des exécutions et le risque d'échec.",
    keywords: ["overview", "what is flowops", "vue d'ensemble", "présentation", "qu'est-ce que flowops"],
    blocks: [
      h2("Qu'est-ce que FlowOps ?"),
      p(
        "Écrire du YAML GitHub Actions à la main est lent et source d'erreurs. Avec FlowOps, vous remplissez un formulaire — déclencheurs, jobs, étapes — et le backend le compile en fichier de workflow valide, le commite dans votre dépôt et le déclenche.",
      ),
      h2("Principales fonctionnalités"),
      ul(
        "**Constructeur low-code** — composez jobs et étapes visuellement et prévisualisez le YAML généré.",
        "**Projets** — chaque projet relie un dépôt GitHub à sa configuration de workflow.",
        "**Exécution en un clic** — FlowOps commite le YAML dans `.github/workflows/` et envoie un événement `repository_dispatch`.",
        "**Exécutions et logs** — parcourez les exécutions, jobs et logs de job GitHub Actions depuis l'espace de travail.",
        "**Prédictions** — un moteur ML local estime la durée (en secondes) et le risque d'échec (en %).",
      ),
      h2("Comment ça marche"),
      ol(
        "Connectez-vous avec GitHub (OAuth Device Flow).",
        "Créez un projet lié à un dépôt.",
        "Construisez le workflow dans le formulaire ; l'aperçu YAML se met à jour via le compilateur.",
        "Enregistrez, puis exécutez : le YAML est poussé et le workflow est déclenché.",
        "Consultez les exécutions et les logs, et examinez la durée et le risque prédits.",
      ),
      h2("Composants"),
      table(
        ["Composant", "Technologie", "Rôle"],
        ["Frontend", "React 19, Vite, Tailwind 4", "Interface de l'espace de travail, formulaire de workflow, documentation"],
        ["Backend", "FastAPI (Python)", "API REST, compilateur, intégration GitHub"],
        ["Base de données", "MongoDB", "Utilisateurs et projets"],
        ["MLOps", "scikit-learn, MLflow", "Entraînement, suivi et inférence"],
        ["GitHub", "OAuth, API REST, Actions", "Identité, accès aux dépôts, exécution"],
      ),
      tip(
        "Vous voulez simplement utiliser FlowOps ? Lisez les [guides utilisateur](/docs/what-is-flowops). Pour le lancer sur votre machine, suivez [Installation locale](/docs/local-setup).",
      ),
    ],
  },
  {
    slug: "local-setup",
    title: "Installation locale",
    description: "Lancez FlowOps en local et accédez à l'espace de travail en quelques minutes.",
    keywords: ["setup", "run", "start", "installation", "lancer", "démarrer"],
    blocks: [
      h2("Prérequis"),
      ul(
        "Python 3.12 ou plus récent",
        "Node.js et [pnpm](https://pnpm.io)",
        "Docker, pour exécuter MongoDB",
        "Une application OAuth GitHub (voir [Configuration](/docs/configuration))",
      ),
      h2("1. Démarrer MongoDB"),
      code("bash", "cd backend\n./mongo-docker.sh", "Terminal 1"),
      h2("2. Démarrer l'API"),
      code(
        "bash",
        `cd backend
cp .env.example .env     # then fill in GITHUB_CLIENT_ID / GITHUB_CLIENT_SECRET
venv/bin/python -m uvicorn main:app --reload --port 8000`,
        "Terminal 2",
      ),
      h2("3. Démarrer le frontend"),
      code("bash", "cd frontend\npnpm install\npnpm dev", "Terminal 3"),
      p("Ouvrez `http://localhost:5173` et connectez-vous avec GitHub."),
      h2("Vérifier l'installation"),
      code("bash", "curl http://localhost:8000/api/auth/status", "Vérifier la configuration OAuth"),
      code(
        "json",
        `{
  "configured": true,
  "missing_env_vars": [],
  "message": null
}`,
        "Réponse attendue",
      ),
      note(
        "Si `configured` vaut `false`, la réponse liste les variables manquantes. Voir [Dépannage développeur](/docs/dev-troubleshooting).",
      ),
    ],
  },
  {
    slug: "installation",
    title: "Installation",
    description: "Installez MongoDB, le backend FastAPI et le frontend React.",
    keywords: ["docker", "venv", "pip", "pnpm", "installer", "installation"],
    blocks: [
      h2("MongoDB"),
      p(
        "`backend/mongo-docker.sh` démarre un conteneur nommé `flowops-mongo`. La chaîne de connexion doit ensuite inclure les identifiants du conteneur définis dans ce script.",
      ),
      code("bash", "cd backend\n./mongo-docker.sh\ndocker ps --filter name=flowops-mongo"),
      note(
        "L'API démarre même si MongoDB est injoignable : la création des index est faite au mieux, avec un plafond de 3 s. Les endpoints de projets échouent tant que la base n'est pas disponible.",
      ),
      h2("Backend"),
      code(
        "bash",
        `cd backend
python -m venv venv
venv/bin/pip install -r requirements.txt
venv/bin/pip install -r requirements-dev.txt   # ruff + pytest
venv/bin/python -m uvicorn main:app --reload --port 8000`,
      ),
      h2("Frontend"),
      code("bash", "cd frontend\npnpm install\npnpm dev      # http://localhost:5173"),
      warning(
        "Utilisez **pnpm**. `pnpm-lock.yaml` est le fichier de verrouillage ; lancer `npm install` crée un `package-lock.json` concurrent.",
        "pnpm uniquement",
      ),
      h2("Facultatif : initialiser les modèles ML"),
      p(
        "Les modèles entraînés sont commités dans le dépôt. Pour les régénérer à partir du jeu de données de démonstration, voir [Pipeline de données](/docs/data-pipeline).",
      ),
    ],
  },
  {
    slug: "configuration",
    title: "Configuration",
    description: "Configurez l'environnement du backend et l'application OAuth GitHub.",
    keywords: ["env", ".env", "oauth", "cors", "mongo_uri", "configuration", "variables d'environnement"],
    blocks: [
      h2("Le fichier .env"),
      p(
        "Copiez `backend/.env.example` vers `backend/.env`. Toutes les variables sont lues en un seul endroit, `app/settings.py`, après le chargement de `backend/.env`.",
      ),
      code(
        "bash",
        `# GitHub OAuth App (required to sign in)
GITHUB_CLIENT_ID=your_client_id
GITHUB_CLIENT_SECRET=your_client_secret

# MongoDB — with the Docker container, include its credentials
MONGO_URI=mongodb://<user>:<password>@localhost:27017/
MONGO_DB_NAME=flowops_db`,
        "backend/.env",
      ),
      p("La liste complète est dans [Variables d'environnement](/docs/environment-variables)."),
      h2("Créer l'application OAuth GitHub"),
      ol(
        "Ouvrez `https://github.com/settings/developers` et choisissez **New OAuth App**.",
        "Définissez l'URL de la page d'accueil sur `http://localhost:5173`.",
        "Définissez l'URL de callback sur `http://localhost:5173/auth` (exigée par GitHub ; le Device Flow ne l'utilise pas).",
        "Copiez le **Client ID** et le **Client Secret** dans `backend/.env`.",
      ),
      h2("Scopes accordés"),
      p(
        "Le Device Flow demande les scopes `user`, `repo` et `workflow`. `repo` et `workflow` sont nécessaires pour commiter les fichiers de workflow et envoyer les événements.",
      ),
      h2("CORS"),
      p(
        "Par défaut, l'API accepte les requêtes du navigateur depuis `http://localhost:5173` et `http://127.0.0.1:5173`. Modifiez-le avec `CORS_ORIGINS` (séparé par des virgules).",
      ),
    ],
  },
];
