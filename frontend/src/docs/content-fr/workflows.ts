import type { DocPage } from "../types";
import { code, h2, note, ol, p, table, ul, warning } from "../content/blocks";

export const workflowsFr: DocPage[] = [
  {
    slug: "running-workflows",
    title: "Exécuter des workflows",
    description: "Ce qui se passe quand vous enregistrez et exécutez un workflow.",
    keywords: ["execute", "dispatch", "commit", "push", "save", "exécuter", "enregistrer", "lancer"],
    blocks: [
      h2("Enregistrer"),
      p(
        "`POST /api/projects/{project_id}/workflow` compile le schéma, écrit `config.json` et le YAML dans `backend/generated_workflows/<project_id>/`, puis marque le projet avec `has_workflow` et `yaml_filename`.",
      ),
      h2("Exécuter"),
      p("`POST /api/projects/{project_id}/execute` enchaîne ces étapes dans l'ordre :"),
      ol(
        "Lit le projet et son dépôt lié (400 si aucun dépôt n'est lié).",
        "Charge la configuration enregistrée et le YAML compilé.",
        "Commite le fichier dans `.github/workflows/<filename>` sur la branche **`main`**, en le créant ou en le mettant à jour.",
        "Envoie un événement `repository_dispatch` de type `flowops_trigger`, avec `project_name` et `triggered_by` dans le client payload.",
      ),
      code(
        "yaml",
        `on:
  repository_dispatch:
    types:
      - flowops_trigger`,
        "Déclencheur toujours présent dans les workflows compilés",
      ),
      h2("Prérequis"),
      table(
        ["Prérequis", "Pourquoi"],
        ["Scopes `repo` et `workflow`", "Commiter les fichiers de workflow et envoyer les événements"],
        ["Accès en écriture au dépôt", "Le commit est fait avec votre jeton"],
        ["Une branche `main`", "Le commit cible `main` (valeur codée en dur)"],
        ["Un workflow enregistré", "Execute le lit depuis `generated_workflows/`"],
      ),
      warning(
        "Les dépôts dont la branche par défaut est `master` ne sont pas pris en charge par l'étape de commit dans son état actuel.",
        "Branche par défaut",
      ),
      note("Execute n'attend pas la fin de l'exécution. Suivez-la dans [Exécutions et logs](/docs/runs-and-logs)."),
    ],
  },
  {
    slug: "runs-and-logs",
    title: "Exécutions et logs",
    description: "Parcourez les exécutions GitHub Actions, les jobs et leurs logs pour un projet.",
    keywords: ["history", "status", "conclusion", "jobs", "historique", "statut", "exécutions", "logs"],
    blocks: [
      h2("Exécutions"),
      p(
        "`GET /api/projects/{id}/runs` renvoie les exécutions de workflow du dépôt lié. Chaque exécution expose :",
      ),
      ul(
        "`id`, `name`, `event`, `branch` et le `commit_sha` abrégé",
        "`status` — `queued`, `in_progress` ou `completed`",
        "`conclusion` — `success`, `failure`, `cancelled`, ou `null` tant qu'elle tourne",
        "`created_at`, `updated_at` et `html_url` (l'exécution sur GitHub)",
      ),
      h2("Jobs"),
      p("`GET /api/projects/{id}/runs/{run_id}/jobs` renvoie les jobs d'une exécution et leurs étapes."),
      h2("Logs"),
      p("`GET /api/projects/{id}/runs/{run_id}/jobs/{job_id}/logs` renvoie le log brut du job."),
      code(
        "json",
        `{
  "logs": "",
  "available": false,
  "message": "Les logs ne sont pas encore disponibles sur GitHub. Réessayez après le démarrage du job."
}`,
        "Logs pas encore disponibles",
      ),
      note(
        "GitHub ne fournit les logs qu'une fois le job démarré. Un log pas encore disponible est une réponse normale (`available: false`), pas une erreur.",
      ),
    ],
  },
];
