# github_collector.py
import os
import pandas as pd
from datetime import datetime
from github import Github, GithubException

GITHUB_TOKEN = os.getenv("GITHUB_TOKEN")
REPO_NAME = "ranto-dev/Fluxy"  # Exemple: "octocat/Hello-World"
CSV_FILE = "raw_workflow_runs.csv"

def collect_github_runs_to_csv(limit_runs=500):
    print(f"🔄 Connexion à GitHub pour le repo : {REPO_NAME}...")
    g = Github(GITHUB_TOKEN)
    repo = g.get_repo(REPO_NAME)

    # Charger les IDs déjà existants pour éviter les doublons
    existing_ids = set()
    if os.path.exists(CSV_FILE):
        df_existing = pd.read_csv(CSV_FILE)
        if "run_id" in df_existing.columns:
            existing_ids = set(df_existing["run_id"].unique())

    runs_data = []
    runs = repo.get_workflow_runs()
    collected_count = 0

    for run in runs:
        if collected_count >= limit_runs:
            break

        # On saute si non terminé ou déjà collecté
        if run.status != "completed" or run.id in existing_ids:
            continue

        created_at = run.created_at
        updated_at = run.updated_at
        duration_seconds = (
            (updated_at - created_at).total_seconds() if updated_at else 0
        )

        # Récupération des changements de code dans le commit
        files_changed = 0
        lines_added = 0
        lines_deleted = 0
        has_dockerfile = 0

        try:
            commit = repo.get_commit(run.head_sha)
            files_changed = len(commit.files)
            lines_added = commit.stats.additions
            lines_deleted = commit.stats.deletions

            for f in commit.files:
                filename_lower = f.filename.lower()
                if (
                    "dockerfile" in filename_lower
                    or ".github/workflows" in filename_lower
                ):
                    has_dockerfile = 1
                    break
        except GithubException as e:
            print(f"⚠️ Erreur récupération commit {run.head_sha}: {e}")

        # Structure d'une ligne
        runs_data.append(
            {
                "run_id": run.id,
                "repo_id": str(repo.id),
                "workflow_filename": os.path.basename(run.path),
                "event_type": run.event,
                "branch": run.head_branch,
                "status": run.status,
                "conclusion": run.conclusion,  # 'success', 'failure', 'cancelled'
                "created_at": created_at.isoformat(),
                "duration_seconds": duration_seconds,
                "files_changed_count": files_changed,
                "lines_added": lines_added,
                "lines_deleted": lines_deleted,
                "has_dockerfile_changes": has_dockerfile,
                "author": (
                    run.head_commit.author.login
                    if run.head_commit and run.head_commit.author
                    else "unknown"
                ),
            }
        )

        collected_count += 1
        print(
            f"✅ [{collected_count}/{limit_runs}] Run #{run.id} ({run.path}) collecté - Statut: {run.conclusion}"
        )

    if runs_data:
        df_new = pd.DataFrame(runs_data)

        # Si le fichier existe, on concatène
        if os.path.exists(CSV_FILE):
            df_final = pd.concat([df_existing, df_new], ignore_index=True)
        else:
            df_final = df_new

        # Sauvegarde au format CSV
        df_final.to_csv(CSV_FILE, index=False)
        print(
            f"🎉 Terminé ! {len(runs_data)} nouvelles lignes ajoutées dans {CSV_FILE}."
        )
    else:
        print("ℹ️ Aucun nouveau workflow à enregistrer.")


if __name__ == "__main__":
    collect_github_runs_to_csv(limit_runs=500)
