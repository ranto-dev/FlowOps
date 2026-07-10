export interface Step {
  id: string;
  name: string;
  type: "run" | "uses";
  content: string; // Contiendra le script complet multi-lignes ou la référence de l'action
  env?: string; // Chaîne de caractères KEY=VALUE à découper par ligne
}

export interface WorkflowConfig {
  filename: string;
  name: string;
  on_event: string;
  branches: string;
  runs_on: string;
  matrix_key: string; // Nom de la variable de matrice libre (ex: go-version, python-version)
  matrix_values: string; // Valeurs de la matrice (ex: 1.21, 1.22)
  steps: Step[];
}

export interface VirtualFile {
  id: string;
  filename: string;
  yaml: string | null;
  config: WorkflowConfig;
}