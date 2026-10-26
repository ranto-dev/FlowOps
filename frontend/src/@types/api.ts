/**
 * Types des réponses de l'API FlowOps — **miroir TypeScript de
 * `backend/schemas.py` et des routes de `backend/main.py`**.
 *
 * Toute évolution du contrat backend (nouveau champ, champ supprimé) doit se
 * répercuter ici, sinon `tsc -b` casse ou, pire, les champs sont lus en
 * `undefined` à l'exécution. Les tests backend (`backend/tests/test_routes.py`)
 * verrouillent la même forme côté serveur.
 */

/** `GET /api/auth/status` — état de configuration de l'OAuth GitHub. */
export interface AuthStatus {
  configured: boolean;
  missing_env_vars: string[];
  message: string | null;
}

/** `POST /api/auth/device-code` — code d'activation du GitHub Device Flow. */
export interface DeviceCodeInfo {
  device_code: string;
  user_code: string;
  verification_uri: string;
  expires_in: number;
  interval: number;
}

/** `POST /api/auth/check-login` — résultat du polling Device Flow. */
export interface CheckLoginResponse {
  status: "success" | "pending";
  token?: string;
  github_id?: string;
  username?: string;
  avatar_url?: string;
  is_new_user?: boolean;
  error?: string;
}

/** `GET /api/projects` — projet tel que renvoyé par `format_project()`. */
export interface Project {
  id: string;
  name: string;
  description: string;
  repository: string;
  has_workflow: boolean;
  yaml_filename?: string | null;
}

/** `GET /api/github/repositories` — dépôt GitHub du compte connecté. */
export interface GitHubRepo {
  id: number;
  full_name: string;
}

/** Étape d'un job telle que remontée par l'API GitHub Actions. */
export interface RunStep {
  name: string | null;
  status: string;
  conclusion: string | null;
  number: number;
  started_at: string | null;
  completed_at: string | null;
}

/** Job d'une exécution GitHub Actions. */
export interface RunJob {
  id: string;
  name: string | null;
  status: string;
  conclusion: string | null;
  started_at: string | null;
  completed_at: string | null;
  steps: RunStep[];
}

/** Exécution (workflow run) GitHub Actions. */
export interface WorkflowRun {
  id: string;
  name: string;
  status: string;
  conclusion: string | null;
  event: string | null;
  branch: string | null;
  commit_sha: string;
  created_at: string;
  updated_at: string;
  html_url: string | null;
}

/** `GET .../runs` — liste des exécutions d'un projet. */
export interface RunListResponse {
  project_id: string;
  repository: string;
  runs: WorkflowRun[];
}

/** `GET .../runs/{run_id}/jobs` — jobs d'une exécution. */
export interface JobListResponse {
  run_id: string;
  jobs: RunJob[];
}

/** `GET .../jobs/{job_id}/logs` — logs bruts d'un job. */
export interface LogsResponse {
  logs: string;
  available?: boolean;
  message?: string | null;
}

/** `POST /api/generate-workflow` — prévisualisation YAML compilée. */
export interface GenerateWorkflowResponse {
  filename: string;
  yaml: string;
}

/** `POST /api/projects/{id}/workflow` — sauvegarde du workflow. */
export interface SaveWorkflowResponse {
  status: string;
  message: string;
  yaml_filename: string;
}

/** `POST /api/projects/{id}/execute` — push du YAML + repository_dispatch. */
export interface ExecuteResponse {
  status: string;
  message: string;
}

/** Carte d'un modèle actif (registry MLOps). */
export interface MlopsModelCard {
  deployed: boolean;
  version?: number;
  algorithm?: string;
  training_date?: string;
  dataset_version?: string;
  threshold?: number;
  metrics?: Record<string, number>;
}

/** Dernière prédiction enregistrée dans le journal de monitoring. */
export interface MlopsLatestPrediction {
  workflow_name?: string;
  repository?: string;
  duration_predicted?: number | string;
  failure_probability?: number | string;
  duration_actual?: number | string;
  risk_level?: string;
  timestamp?: string;
}

/** `GET /api/mlops/status` — modèles actifs, évaluations et monitoring. */
export interface MlopsStatus {
  models?: { duration?: MlopsModelCard; failure?: MlopsModelCard };
  evaluations?: Record<string, unknown>;
  monitoring?: {
    prediction_count?: number;
    predictions_with_actual?: number;
    drift?: { pred_vs_actual_mae_seconds?: number | null };
    latest_predictions?: MlopsLatestPrediction[];
  };
  data?: { regression_rows?: number; classification_rows?: number };
  note?: string;
}

/** `POST /api/mlops/retrain` — résumé d'une relance du pipeline. */
export interface MlopsRetrainResponse {
  status: string;
  summary?: Record<string, unknown> & {
    validation?: { duration?: string; failure?: string };
  };
  message?: string;
}

/** `POST /api/mlops/predict` — prédiction durée + risque d'échec. */
export interface PredictionResult {
  duration_seconds: number | null;
  failure_probability: number | null;
  failure_percentage: number | null;
  predicted_failure: boolean | null;
  risk_level: string | null;
  risk_level_label: string | null;
  failure_threshold: number | null;
  history?: {
    previous_run_count?: number;
    previous_success_rate?: number;
    previous_failure_rate?: number;
    average_previous_duration?: number | null;
  };
  model?: {
    duration?: {
      deployed: boolean;
      version?: number;
      algorithm?: string;
      training_date?: string;
    };
    failure?: {
      deployed: boolean;
      version?: number;
      algorithm?: string;
      training_date?: string;
    };
  };
  duration_error?: string;
  failure_error?: string;
}
