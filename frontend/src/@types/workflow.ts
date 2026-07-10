export interface WorkflowStep {
  id: string;
  name: string;
  uses?: string;
  run?: string;
  env?: string; // Format: KEY=VALUE, un par ligne
}

export interface WorkflowConfig {
  id: string;
  fileName: string;
  name: string;
  on: string;
  osList: string[]; // ex: ['ubuntu-latest', 'windows-latest']
  nodeVersions: string[]; // ex: ['18', '20']
  env: string; // Global env
  steps: WorkflowStep[];
}
