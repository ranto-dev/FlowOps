import os
import pandas as pd
import numpy as np

RAW_CSV = "raw_workflow_runs.csv"
OUTPUT_CSV = "processed_features.csv"


def process_csv_features():
    if not os.path.exists(RAW_CSV):
        raise FileNotFoundError(
            f"❌ Le fichier {RAW_CSV} n'existe pas. Lance d'abord github_collector.py."
        )

    print(f"📖 Lecture de {RAW_CSV}...")
    df = pd.read_csv(RAW_CSV)

    # Assurer le tri temporel pour éviter le Data Leakage
    df["created_at"] = pd.to_datetime(df["created_at"])
    df = df.sort_values(by="created_at", ascending=True).reset_index(drop=True)

    # 1. Cible (Target) Échec (1 = failure, 0 = success/autres)
    df["is_failed"] = (df["conclusion"] == "failure").astype(int)

    # 2. Features Temporelles
    df["hour_of_day"] = df["created_at"].dt.hour
    df["day_of_week"] = df["created_at"].dt.dayofweek

    # 3. Rolling Features (Calculs glissants sans fuite de données)
    # Taux d'échec sur les 10 derniers runs du repo
    df["repo_fail_rate_last_10"] = (
        df.groupby("repo_id")["is_failed"]
        .transform(lambda x: x.shift(1).rolling(window=10, min_periods=1).mean())
        .fillna(0.0)
    )

    # Durée moyenne des 5 derniers runs réussis pour le même workflow
    success_mask = df["conclusion"] == "success"
    df["duration_clean"] = np.where(success_mask, df["duration_seconds"], np.nan)

    df["workflow_avg_duration_last_5"] = df.groupby("workflow_filename")[
        "duration_clean"
    ].transform(lambda x: x.shift(1).rolling(window=5, min_periods=1).mean())

    # Fallback si premier run du workflow
    median_duration = df["duration_seconds"].median() if not df.empty else 60.0
    df["workflow_avg_duration_last_5"] = df["workflow_avg_duration_last_5"].fillna(
        median_duration
    )

    # 4. Nettoyage des colonnes inutiles pour l'entraînement
    columns_to_keep = [
        "run_id",
        "workflow_filename",
        "event_type",
        "files_changed_count",
        "lines_added",
        "lines_deleted",
        "has_dockerfile_changes",
        "hour_of_day",
        "day_of_week",
        "repo_fail_rate_last_10",
        "workflow_avg_duration_last_5",
        "duration_seconds",
        "is_failed",  # Cibles
    ]

    df_processed = df[columns_to_keep]

    # Export en CSV prêt pour MLflow
    df_processed.to_csv(OUTPUT_CSV, index=False)
    print(f"✅ CSV de features prêt sauvegardé sous : {OUTPUT_CSV}")

    return df_processed


if __name__ == "__main__":
    df_result = process_csv_features()
    print("\nAperçu du jeu de données transformé :")
    print(df_result.head())
