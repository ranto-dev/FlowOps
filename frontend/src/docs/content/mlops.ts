import type { DocPage } from "../types";
import { code, h2, note, ol, p, table, tip, warning } from "./blocks";

export const mlops: DocPage[] = [
  {
    slug: "ml-architecture",
    title: "ML Architecture",
    description: "Modules, datasets and models of the MLOps engine in `backend/mlops/`.",
    keywords: ["dataset", "models", "registry", "scikit-learn"],
    blocks: [
      h2("Modules"),
      table(
        ["Package", "Role"],
        ["`collection`", "Collect workflow runs from GitHub"],
        ["`etl`", "Extract, transform and load into processed datasets"],
        ["`features`", "Feature engineering, shared by training and inference"],
        ["`training`", "Train the duration and failure models"],
        ["`evaluation`", "Metrics and plots on the held-out test set"],
        ["`validation`", "Threshold checks and promotion"],
        ["`tracking`", "MLflow logging and model registry"],
        ["`inference`", "Predictor used by the API"],
        ["`monitoring`", "Prediction log and drift tracking"],
      ),
      h2("Datasets"),
      code(
        "text",
        `backend/mlops/data/
├── raw/          workflow_runs.csv, jobs.csv, steps.csv, workflow_definitions.csv
├── processed/    workflow_dataset.csv, prediction_dataset.csv
├── features/     regression_dataset.csv, classification_dataset.csv
├── evaluation/   *_evaluation.json and plots
└── monitoring/   predictions.csv`,
      ),
      h2("Models"),
      p(
        "Each model kind (`duration`, `failure`) has a `candidate/` and a `production/` folder under `backend/mlops/models/`, each with `pipeline.joblib` and `metadata.json`. `registry.json` records the active versions.",
      ),
      note(
        "Data and models are **committed** to the repository, so running the pipeline produces git diffs. The shipped models are trained on synthetic demonstration data.",
      ),
      warning(
        "Train/serve parity is enforced by `features/engineering.py`. Never change features in only one of the two paths.",
        "Feature parity",
      ),
    ],
  },
  {
    slug: "data-pipeline",
    title: "Data Pipeline",
    description: "The 8-step pipeline and the commands to run each stage.",
    keywords: ["cli", "etl", "collector", "train", "sample"],
    blocks: [
      h2("Steps"),
      ol(
        "Collection — GitHub runs or the demonstration dataset",
        "ETL",
        "Feature engineering",
        "Training (duration and failure)",
        "Evaluation",
        "MLflow tracking",
        "Validation against thresholds",
        "Model registry and promotion",
      ),
      h2("Run the pipeline"),
      code(
        "bash",
        `cd backend
venv/bin/python -m mlops.pipeline --sample       # demo data, all steps
venv/bin/python -m mlops.pipeline --skip-train   # stop after ETL and features`,
      ),
      table(
        ["Option", "Effect"],
        ["`--sample`", "Generate the demonstration dataset first"],
        ["`--skip-train`", "Stop after ETL and feature engineering"],
        ["`--repo`, `--token`", "Collect runs from a GitHub repository"],
        ["`--limit`", "Maximum number of runs to collect (default 200)"],
      ),
      h2("Individual stages"),
      code(
        "bash",
        `venv/bin/python -m mlops.etl.pipeline
venv/bin/python -m mlops.training.train_duration
venv/bin/python -m mlops.training.train_failure
venv/bin/python -m mlops.evaluation.evaluate
venv/bin/python -m mlops.validation.validator
venv/bin/python -m mlops.collection.collector --repo owner/repo --token ghp_xxx`,
      ),
      tip("Without `--sample` and without `--repo`/`--token`, the collection step is skipped and the existing raw data is reused."),
    ],
  },
  {
    slug: "forecasting",
    title: "Duration & Risk Forecasting",
    navTitle: "Duration & Risk",
    description: "How the engine predicts execution duration (seconds) and failure risk (%).",
    keywords: ["prediction", "regression", "classification", "features", "risk"],
    blocks: [
      h2("Two models"),
      table(
        ["Target", "Task", "Candidates"],
        ["Duration (seconds)", "Regression", "linear, ridge, random forest, gradient boosting"],
        ["Failure risk (%)", "Classification", "logistic, random forest, gradient boosting"],
      ),
      p(
        "The best candidate of each family is selected on the validation split. Data is split **by time**: the most recent 15 % is the test set, and 15 % of the remainder is used for validation.",
      ),
      h2("Features"),
      p("Both models use the same features, derived from the workflow definition and the repository history."),
      table(
        ["Group", "Features"],
        [
          "Structure",
          "`number_of_jobs`, `number_of_steps`, `number_of_actions`, `has_build`, `has_test`, `has_deployment`",
        ],
        [
          "Triggers",
          "`trigger_push`, `trigger_pull_request`, `trigger_schedule`, `trigger_repository_dispatch`",
        ],
        [
          "History",
          "`previous_run_count`, `previous_success_rate`, `previous_failure_rate`, `average_previous_duration`",
        ],
        ["Categorical", "`language`, `language_version`, `runner`, `branch`"],
      ),
      h2("Risk levels"),
      table(
        ["Failure probability", "Level"],
        ["0 % – 30 %", "`low`"],
        ["30 % – 70 %", "`medium`"],
        ["70 % – 100 %", "`high`"],
      ),
      h2("Predict"),
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
        "Response (excerpt)",
      ),
      p("The response also contains the computed features and the version of each model used."),
    ],
  },
  {
    slug: "mlflow-tracking",
    title: "MLflow Tracking",
    description: "Experiments, runs and the model registry.",
    keywords: ["mlflow", "registry", "sqlite", "experiments"],
    blocks: [
      h2("Tracking store"),
      p("MLflow uses a self-hosted SQLite backend at `backend/mlruns/mlflow.db` (git-ignored)."),
      code(
        "bash",
        `# override the store
export FLOWOPS_MLFLOW_TRACKING_URI=sqlite:////absolute/path/to/mlflow.db

# browse experiments
cd backend
venv/bin/mlflow ui --backend-store-uri sqlite:///mlruns/mlflow.db --port 5000`,
      ),
      warning(
        "The variable is deliberately `FLOWOPS_MLFLOW_TRACKING_URI`. The standard `MLFLOW_TRACKING_URI` is ignored so that FlowOps never inherits a machine-wide configuration.",
        "Variable name",
      ),
      h2("Experiments and registry"),
      table(
        ["Kind", "Experiment", "Registered model"],
        ["Duration", "`flowops-duration`", "`flowops-duration-model`"],
        ["Failure", "`flowops-failure`", "`flowops-failure-model`"],
        ["Evaluation", "`flowops-evaluation`", "—"],
      ),
      p("A validated version is promoted to the `Production` stage."),
    ],
  },
  {
    slug: "monitoring-retraining",
    title: "Monitoring & Retraining",
    description: "Log predictions, compare them to reality and retrain the models.",
    keywords: ["drift", "log-actual", "retrain", "thresholds", "validation"],
    blocks: [
      h2("Prediction log"),
      p(
        "Every call to `POST /api/mlops/predict` appends a row to `data/monitoring/predictions.csv` with the predicted duration, failure probability, risk level and model versions.",
      ),
      h2("Report the real outcome"),
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
      p("The actual values are attached to the latest matching prediction, which enables predicted-versus-actual tracking."),
      h2("Retrain"),
      p(
        "`POST /api/mlops/retrain` clears the in-memory models, runs the full pipeline in a worker thread, then reloads the new models.",
      ),
      h2("Validation thresholds"),
      p("A candidate is promoted only if it passes these checks. Each value can be overridden with an environment variable."),
      table(
        ["Check", "Default", "Variable"],
        ["Duration MAE ≤", "120 s", "`MLOPS_DURATION_MAX_MAE`"],
        ["Duration RMSE ≤", "240 s", "`MLOPS_DURATION_MAX_RMSE`"],
        ["Duration R² ≥", "0.40", "`MLOPS_DURATION_MIN_R2`"],
        ["Failure F1 ≥", "0.50", "`MLOPS_FAILURE_MIN_F1`"],
        ["Failure precision ≥", "0.45", "`MLOPS_FAILURE_MIN_PRECISION`"],
        ["Failure recall ≥", "0.40", "`MLOPS_FAILURE_MIN_RECALL`"],
        ["Failure ROC AUC ≥", "0.60", "`MLOPS_FAILURE_MIN_ROC_AUC`"],
      ),
      note("Retraining on the demonstration data only reproduces synthetic results. Collect real runs first for meaningful models."),
    ],
  },
];

