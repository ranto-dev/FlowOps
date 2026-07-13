export interface LowCodeStep {
  id: string;
  name: string;
  type:
    | "checkout"
    | "setup-node"
    | "npm"
    | "docker"
    | "custom-run"
    | "upload-artifact";
  node_version?: string;
  npm_command?: string;
  docker_image?: string;
  docker_registry?: string;
  custom_script?: string;
  artifact_path?: string;
  step_if?: string;
}

export interface LowCodeJob {
  id: string;
  name: string;
  runs_on: string;
  needs: string[];
  matrix_key?: string;
  matrix_values?: string;
  job_if?: string;
  steps: LowCodeStep[];
}

export interface FlowOpsWorkflowConfig {
  filename: string;
  name: string;
  on_events: string[];
  branches: string;
  global_env: string;
  jobs: LowCodeJob[];
}

export interface VirtualFile {
  id: string;
  filename: string;
  yaml: string | null;
  config: FlowOpsWorkflowConfig;
}
