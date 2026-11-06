import type { DocPage } from "../types";
import { code, h2, note, ol, p, table, tip, warning } from "../content/blocks";

export const mlopsFr: DocPage[] = [
  {
    slug: "ml-architecture",
    title: "Architecture ML",
    description: "Modules, jeux de données et modèles du moteur MLOps dans `backend/mlops/`.",
    keywords: ["dataset", "models", "registry", "scikit-learn", "jeu de données", "modèles", "registre"],
    blocks: [
      h2("Modules"),
      table(
        ["Package", "Rôle"],
        ["`collection`", "Collecter les exécutions de workflows depuis GitHub"],
        ["`etl`", "Extraire, transformer et charger vers les jeux de données traités"],
        ["`features`", "Ingénierie des features, partagée entre entraînement et inférence"],
        ["`training`", "Entraîner les modèles de durée et d'échec"],
        ["`evaluation`", "Métriques et graphiques sur le jeu de test"],
        ["`validation`", "Vérification des seuils et promotion"],
        ["`tracking`", "Journalisation MLflow et registre des modèles"],
        ["`inference`", "Prédicteur utilisé par l'API"],
        ["`monitoring`", "Journal des prédictions et suivi de la dérive"],
      ),
      h2("Jeux de données"),
      code(
        "text",
        `backend/mlops/data/
├── raw/          workflow_runs.csv, jobs.csv, steps.csv, workflow_definitions.csv
├── processed/    workflow_dataset.csv, prediction_dataset.csv
├── features/     regression_dataset.csv, classification_dataset.csv
├── evaluation/   *_evaluation.json and plots
└── monitoring/   predictions.csv`,
      ),
      h2("Modèles"),
      p(
        "Chaque type de modèle (`duration`, `failure`) a un dossier `candidate/` et un dossier `production/` sous `backend/mlops/models/`, chacun avec `pipeline.joblib` et `metadata.json`. `registry.json` enregistre les versions actives.",
      ),
      note(
        "Les données et les modèles sont **versionnés** dans le dépôt : lancer le pipeline produit donc des diffs git. Les modèles livrés sont entraînés sur des données de démonstration synthétiques.",
      ),
      warning(
        "La parité entraînement/inférence est assurée par `features/engineering.py`. Ne modifiez jamais les features dans un seul des deux chemins.",
        "Parité des features",
      ),
    ],
  },
  {
    slug: "data-pipeline",
    title: "Pipeline de données",
    description: "Le pipeline en 8 étapes et les commandes pour lancer chaque étape.",
    keywords: ["cli", "etl", "collector", "train", "sample", "collecte", "entraînement", "échantillon"],
    blocks: [
      h2("Étapes"),
      ol(
        "Collecte — exécutions GitHub ou jeu de données de démonstration",
        "ETL",
        "Ingénierie des features",
        "Entraînement (durée et échec)",
        "Évaluation",
        "Suivi MLflow",
        "Validation par rapport aux seuils",
        "Registre des modèles et promotion",
      ),
      h2("Lancer le pipeline"),
      code(
        "bash",
        `cd backend
venv/bin/python -m mlops.pipeline --sample       # demo data, all steps
venv/bin/python -m mlops.pipeline --skip-train   # stop after ETL and features`,
      ),
      table(
        ["Option", "Effet"],
        ["`--sample`", "Générer d'abord le jeu de données de démonstration"],
        ["`--skip-train`", "S'arrêter après l'ETL et l'ingénierie des features"],
        ["`--repo`, `--token`", "Collecter les exécutions d'un dépôt GitHub"],
        ["`--limit`", "Nombre maximal d'exécutions à collecter (200 par défaut)"],
      ),
      h2("Étapes individuelles"),
      code(
        "bash",
        `venv/bin/python -m mlops.etl.pipeline
venv/bin/python -m mlops.training.train_duration
venv/bin/python -m mlops.training.train_failure
venv/bin/python -m mlops.evaluation.evaluate
venv/bin/python -m mlops.validation.validator
venv/bin/python -m mlops.collection.collector --repo owner/repo --token ghp_xxx`,
      ),
      tip("Sans `--sample` et sans `--repo`/`--token`, l'étape de collecte est ignorée et les données brutes existantes sont réutilisées."),
    ],
  },
  {
    slug: "forecasting",
    title: "Prévision de durée et de risque",
    navTitle: "Durée et risque",
    description: "Comment le moteur prédit la durée d'exécution (en secondes) et le risque d'échec (en %).",
    keywords: ["prediction", "regression", "classification", "features", "risk", "prédiction", "régression", "risque", "durée"],
    blocks: [
      h2("Deux modèles"),
      table(
        ["Cible", "Tâche", "Candidats"],
        ["Durée (secondes)", "Régression", "linéaire, ridge, random forest, gradient boosting"],
        ["Risque d'échec (%)", "Classification", "logistique, random forest, gradient boosting"],
      ),
      p(
        "Le meilleur candidat de chaque famille est choisi sur le jeu de validation. Les données sont découpées **par ordre chronologique** : les 15 % les plus récents forment le jeu de test, et 15 % du reste servent à la validation.",
      ),
      h2("Features"),
      p("Les deux modèles utilisent les mêmes features, dérivées de la définition du workflow et de l'historique du dépôt."),
      table(
        ["Groupe", "Features"],
        [
          "Structure",
          "`number_of_jobs`, `number_of_steps`, `number_of_actions`, `has_build`, `has_test`, `has_deployment`",
        ],
        [
          "Déclencheurs",
          "`trigger_push`, `trigger_pull_request`, `trigger_schedule`, `trigger_repository_dispatch`",
        ],
        [
          "Historique",
          "`previous_run_count`, `previous_success_rate`, `previous_failure_rate`, `average_previous_duration`",
        ],
        ["Catégorielles", "`language`, `language_version`, `runner`, `branch`"],
      ),
      h2("Niveaux de risque"),
      table(
        ["Probabilité d'échec", "Niveau"],
        ["0 % – 30 %", "`low`"],
        ["30 % – 70 %", "`medium`"],
        ["70 % – 100 %", "`high`"],
      ),
      h2("Prédire"),
      code(
        "bash",
        `curl -X POST http://localhost:8000/api/mlops/predict \\
  -H "Content-Type: application/json" \\
  -d @workflow.json`,
      ),
      code(
        "json",
        `{
  "workflow_name": "CI",
  "duration_seconds": 128.5,
  "failure_probability": 0.23,
  "failure_percentage": 23.0,
  "risk_level": "low"
}`,
        "Réponse (extrait)",
      ),
      p("La réponse contient aussi les features calculées et la version de chaque modèle utilisé."),
    ],
  },
  {
    slug: "mlflow-tracking",
    title: "Suivi MLflow",
    description: "Expériences, exécutions et registre des modèles.",
    keywords: ["mlflow", "registry", "sqlite", "experiments", "registre", "expériences", "suivi"],
    blocks: [
      h2("Stockage du suivi"),
      p("MLflow utilise un backend SQLite auto-hébergé à `backend/mlruns/mlflow.db` (ignoré par git)."),
      code(
        "bash",
        `# override the store
export FLOWOPS_MLFLOW_TRACKING_URI=sqlite:////absolute/path/to/mlflow.db

# browse experiments
cd backend
venv/bin/mlflow ui --backend-store-uri sqlite:///mlruns/mlflow.db --port 5000`,
      ),
      warning(
        "La variable est volontairement `FLOWOPS_MLFLOW_TRACKING_URI`. La variable standard `MLFLOW_TRACKING_URI` est ignorée afin que FlowOps n'hérite jamais d'une configuration globale de la machine.",
        "Nom de la variable",
      ),
      h2("Expériences et registre"),
      table(
        ["Type", "Expérience", "Modèle enregistré"],
        ["Durée", "`flowops-duration`", "`flowops-duration-model`"],
        ["Échec", "`flowops-failure`", "`flowops-failure-model`"],
        ["Évaluation", "`flowops-evaluation`", "—"],
      ),
      p("Une version validée est promue à l'étape `Production`."),
    ],
  },
  {
    slug: "monitoring-retraining",
    title: "Monitoring et réentraînement",
    description: "Journaliser les prédictions, les comparer à la réalité et réentraîner les modèles.",
    keywords: ["drift", "log-actual", "retrain", "thresholds", "validation", "dérive", "réentraînement", "seuils"],
    blocks: [
      h2("Journal des prédictions"),
      p(
        "Chaque appel à `POST /api/mlops/predict` ajoute une ligne à `data/monitoring/predictions.csv` avec la durée prédite, la probabilité d'échec, le niveau de risque et les versions des modèles.",
      ),
      h2("Signaler le résultat réel"),
      code(
        "bash",
        `curl -X POST http://localhost:8000/api/mlops/log-actual \\
  -H "Content-Type: application/json" \\
  -d '{
    "workflow_name": "CI",
    "repository": "acme/payments-api",
    "duration_seconds": 141.2,
    "failed": false
  }'`,
      ),
      p("Les valeurs réelles sont rattachées à la dernière prédiction correspondante, ce qui permet le suivi prédit contre réel."),
      h2("Réentraîner"),
      p(
        "`POST /api/mlops/retrain` vide les modèles en mémoire, exécute le pipeline complet dans un thread de travail, puis recharge les nouveaux modèles.",
      ),
      h2("Seuils de validation"),
      p("Un candidat n'est promu que s'il passe ces vérifications. Chaque valeur peut être surchargée par une variable d'environnement."),
      table(
        ["Vérification", "Par défaut", "Variable"],
        ["MAE de durée ≤", "120 s", "`MLOPS_DURATION_MAX_MAE`"],
        ["RMSE de durée ≤", "240 s", "`MLOPS_DURATION_MAX_RMSE`"],
        ["R² de durée ≥", "0.40", "`MLOPS_DURATION_MIN_R2`"],
        ["F1 d'échec ≥", "0.50", "`MLOPS_FAILURE_MIN_F1`"],
        ["Précision d'échec ≥", "0.45", "`MLOPS_FAILURE_MIN_PRECISION`"],
        ["Rappel d'échec ≥", "0.40", "`MLOPS_FAILURE_MIN_RECALL`"],
        ["ROC AUC d'échec ≥", "0.60", "`MLOPS_FAILURE_MIN_ROC_AUC`"],
      ),
      note("Réentraîner sur les données de démonstration ne reproduit que des résultats synthétiques. Collectez d'abord de vraies exécutions pour obtenir des modèles pertinents."),
    ],
  },
];
