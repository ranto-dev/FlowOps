# FlowOps — Système MLOps

Ce document décrit l'architecture, le fonctionnement et l'utilisation du
module MLOps de FlowOps : collecte des exécutions GitHub Actions, ETL,
feature engineering, entraînement de modèles (régression + classification),
tracking **MLflow**, validation, Model Registry, inference et monitoring du
drift prédit/réel.

Tout le code vit dans `backend/mlops/` et la configuration centralisée dans
`backend/mlops/config.py`.

---

## 1. Vue d'ensemble

Le pipeline MLOps complet s'exécute en une commande :

```bash
# depuis backend/ (utiliser l'interpréteur du venv, voir § 8)
python -m mlops.pipeline --sample
```

Il enchaîne 8 étapes :

```
 1. Collection   → workflow_runs.csv, workflow_definitions.csv, jobs.csv, steps.csv
 2. ETL          → workflow_dataset.csv + prediction_dataset.csv  (processed)
 3. Features     → regression_dataset.csv + classification_dataset.csv
 4. Entraînement → 2 pipelines sklearn (durée + risque d'échec) → models/<kind>/candidate
 5. Évaluation   → métriques sur le test + courbes (PNG) → data/evaluation
 6. Tracking     → expériences MLflow (paramètres, métriques, artefacts)
 7. Validation   → contrôle des seuils (VALITION_THRESHOLDS) sur le candidat
 8. Registry     → promotion en Production + MLflow Model Registry + registry.json
```

À l'issue de la validation, seul un candidat **au-dessus des seuils** est promu.
Le reste du repo consomme ensuite ces modèles via `mlops/inference/predictor.py`
(API REST, voir § 7) et `mlops/monitoring/tracker.py` (journal du drift, § 6).

```
backend/mlops/
├── config.py                  # TOUTE la configuration (chemins, seuils, features)
├── pipeline.py                # orchestrateur 8 étapes (python -m mlops.pipeline)
├── api.py                     # routeur FastAPI (/api/mlops/*)
├── data/
│   ├── sample_data.py         # génération du jeu de démonstration
│   ├── raw/                   # collecte brute (GitHub ou démo)
│   ├── processed/             # sortie ETL
│   ├── features/              # datasets d'entraînement
│   ├── evaluation/            # rapports JSON + matrices de confusion PNG
│   └── monitoring/            # predict.csv (journal prédit/réel)
│
├── collection/collector.py    # collecte réelle GitHub Actions
├── etl/                       # extract.py, transform.py, load.py, pipeline.py
├── features/engineering.py    # features train/serve (parité stricte)
├── training/                  # common.py, train_duration.py, train_failure.py, train.py
├── evaluation/                # evaluate_duration.py, evaluate_failure.py, evaluate.py
├── validation/validator.py    # gates de validation + promotion
├── tracking/tracking.py       # wrapper MLflow (expériences + registry)
├── inference/predictor.py     # service d'inférence (durée + risque)
└── monitoring/tracker.py      # journal des prédictions + drift
```

---

## 2. Données

### 2.1 Collecte

Deux sources :

- **Démonstration** : `mlops.data.sample_data.generate_sample_data()` génère
  par défaut **200 exécutions réalistes** (8 workflows, ~357 jobs, ~1 431 steps,
  `seed=7` → résultats reproductibles), avec des corrélations exploitables :
  durée **strictement cohérente** avec les tables jobs/steps (durée run = somme
  réelle des steps + gaps entre jobs), langue/événement spécifiques ; échecs liés
  à des features **observables à l'inférence** (branche ≠ `main`, événement
  `schedule`/`repository_dispatch`, workflow avec déploiement) et à l'historique
  par workflow (un workflow « cassé » échoue en rafale jusqu'à un push de
  correction sur `main`). C'est ce jeu qui permet le benchmark hors-ligne du
  prototype.
- **Réel** : `mlops.collection.collector.collect(repo, token, limit_runs=200)`
  appelle l'API GitHub (`/actions/runs`, `/actions/jobs`, `/actions/workflows`)
  et écrit les 4 mêmes CSV bruts. Le token doit avoir les scopes `repo`
  et `workflow`.

Les 4 fichiers bruts :

| Fichier                    | Rôle                                   |
|----------------------------|----------------------------------------|
| `workflow_runs.csv`        | 1 ligne par exécution (conclusion, durée, événement, branche…) |
| `workflow_definitions.csv` | configuration des workflows (jobs, steps, langue, runner, trigger) |
| `jobs.csv`                 | jobs exécutés (id run, statut, durée)  |
| `steps.csv`                | steps par job (statut, durée)          |

### 2.2 ETL (`mlops/etl/`)

- **Extraction** : lecture des 4 CSV.
- **Transformation** : agrégation des steps/jobs par run → colonnes d'exécution
  (`number_of_steps`, `number_of_successful_steps`, `duration_seconds`…),
  puis jointure avec la configuration du workflow. La jointure ne ramène que
  les colonnes de **configuration** (`language`, `runner`, `has_build`…) pour
  ne pas écraser les colonnes du run ; si une définition manque (YAML non
  parsé), un repli sur les valeurs d'exécution agrégées évite tout NA.
- **2 sorties** :
  - `workflow_dataset.csv` — dataset **analytique** complet (features + colonnes
    d'exécution réelles) pour l'exploration ;
  - `prediction_dataset.csv` — sous-ensemble prédictif (run + config + durée/
    conclusion) servant de base de calcul des **features d'historique** à
    l'inférence.

### 2.3 Feature engineering (`mlops/features/engineering.py`)

C'est la pièce maîtresse : **une seule définition de features est partagée par
l'entraînement et l'inférence** (parité train/serve).

Features **numériques** (14) :
`number_of_jobs`, `number_of_steps`, `number_of_actions`, `has_build`,
`has_test`, `has_deployment`, `trigger_push`, `trigger_pull_request`,
`trigger_schedule`, `trigger_repository_dispatch`, `previous_run_count`,
`previous_success_rate`, `previous_failure_rate`, `average_previous_duration`.

Features **catégorielles** (4) :
`language`, `language_version`, `runner`, `branch`.

Points clés :

- Les `trigger_*` sont codées en one-hot selon l'événement déclencheur du run
  (entraînement) / les `on_events` de la config (inférence).
- Les features d'historique (`previous_*`) ne sont **jamais** calculées avec la
  ligne courante : à l'entraînement on utilise `shift(1)` (cumcount + moyenne
  glissante décalée) ; à l'inférence on n'utilise que les exécutions
  **antérieures** à la prédiction. Aucune fuite temporelle.
- Il existe trois fonctions de normalisation : `normalize_from_lowcode`
  (config FlowOps), `normalize_from_yaml_dict` (YAML GitHub) —
  ramenant à une forme unique `{on_events, branches, jobs:[{runs_on, steps}]}`

### 2.4 Définition du sujet

- **Régression** `duration_seconds` → durée d'exécution en secondes
  (cible `duration_seconds`, modèle choisi sur MAE/R² de validation).
- **Classification** `workflow_failed` → risque d'échec de l'exécution
  (cible binaire, modèle choisi sur F1 de validation).

---

## 3. Apprentissage (`mlops/training/`)

**Séparation temporelle** (`temporal_split`) et non aléatoire :
les 15 % d'exécutions les plus récentes = **test**, les 15 % suivantes =
**validation**, le reste (le plus ancien) = **train**. Un modèle n'utilise
jamais d'information future.

**Préprocesseur** identique pour tous les modèles
(`build_preprocessor`) : `StandardScaler` sur les numériques,
`OneHotEncoder(handle_unknown="ignore")` sur les catégorielles → pipeline
sklearn `[preprocessor, model]`.

**Candidats** :

| Tâche         | Modèles comparés                                        |
|---------------|---------------------------------------------------------|
| durée         | LinearRegression, Ridge, RandomForest, GradientBoosting |
| risque d'échec| LogisticRegression(balanced), RandomForest(balanced), GradientBoosting |

**Sélection** : sur le **F1 de validation** pour la classification (classes
déséquilibrées → l'Accuracy seule trompe), sur MAE/R² pour la régression ;
AUC/R² en départage. La baseline (Dummy most-frequent) est toujours loguée
pour juger de l'intérêt réel du modèle. Sur les petits jeux (≈200 exécutions),
le F1 d'une seule tranche de validation est très bruité : la classification
sélectionne donc sur l'**AUC cross-validée** (StratifiedKFold × 5 sur
train+val) — stabilité du rang — puis logue le F1 de validation simple pour
transparence.

**Seuil de décision du classifieur** (`optimal_threshold`) : l'échec de CI est
rare (≈15-25 %). Seuiller à 0.5 rend le modèle trop conservateur (recall ≈ 0).
Le seuil est calibré sur des **prédictions out-of-fold** (chaque ligne de
train+val est prédite par un modèle entraîné sans la contenir → distribution
comparable au futur réel) : parmi les seuils à F1 quasi-maximal on garde le
plus élevé pour privilégier la précision. Il n'est jamais calculé sur le test,
et est stocké dans les métadonnées du modèle puis exposé par l'API.

Le meilleur pipeline est **ré-entraîné sur train+validation**, évalué sur le
test, puis sauvegardé en artefact candidat
(`models/<kind>/candidate/pipeline.joblib` + `metadata.json`).

---

## 4. Tracking MLflow (`mlops/tracking/tracking.py`)

MLflow 3.x n'accepte plus le stockage « fichier » (`.mlruns`) : on utilise un
backend **SQLite** auto-hébergé, `sqlite:///backend/mlruns/mlflow.db`.

> ⚠️ Attention : le module utilise sa **propre** variable
> `FLOWOPS_MLFLOW_TRACKING_URI` (surchargeable via l'environnement) et **non**
> `MLFLOW_TRACKING_URI`, afin de ne pas hériter d'une configuration machine
> externe (espaces encodés `%20`, backend distant, etc.).

3 expériences sont créées à la demande :
`flowops-duration`, `flowops-failure`, `flowops-evaluation`.

Pour chaque training run sont loggés : hyper-paramètres, métriques
`val_*` (et `test_*` pour le run des modèles sélectionnés), dataset version,
algorithme, et l'artefact modèle re-logué (`mlflow.sklearn.log_model`).

**Model Registry** : chaque promotion enregistre
`flowops-duration-model` / `flowops-failure-model` (nouvelle version) puis
effectue la transition vers le stage **Production** (`transition_to_production`).

**Consulter l'interface MLflow** :

```bash
# depuis backend/ (venv)
venv/bin/mlflow ui --backend-store-uri sqlite:///mlruns/mlflow.db --port 5001
# → http://localhost:5001
```

---

## 5. Validation & promotion (`mlops/validation/validator.py`)

Trois contrôles avant toute mise en Production :

1. **Seuils de métriques** (listés dans `config.VALIDATION_THRESHOLDS`, tous
   surchargeables par variables d'environnement) :

| Tâche     | Indicateur    | Condition         | Env                  | Défaut |
|-----------|---------------|-------------------|----------------------|--------|
| durée     | MAE           | ≤ max_mae         | `MLOPS_DURATION_MAX_MAE` | 120 s |
| durée     | RMSE          | ≤ max_rmse        | `MLOPS_DURATION_MAX_RMSE` | 240 s |
| durée     | R²            | ≥ min_r2          | `MLOPS_DURATION_MIN_R2`   | 0.40   |
| échec     | F1            | ≥ min_f1          | `MLOPS_FAILURE_MIN_F1`    | 0.50   |
| échec     | Précision     | ≥ min_precision   | `MLOPS_FAILURE_MIN_PRECISION` | 0.45 |
| échec     | Recall        | ≥ min_recall      | `MLOPS_FAILURE_MIN_RECALL` | 0.40   |
| échec     | AUC           | ≥ min_roc_auc     | `MLOPS_FAILURE_MIN_ROC_AUC` | 0.60   |

   Ces seuils sont volontairement calibrés sur les expériences (la spec
   interdit les seuils arbitraires) : sur données réelles, ajustez-les via
   l'environnement et documentez-les.

2. **Chargeabilité de l'artefact** : le pipeline candidat se charge bien.
3. **Parité des features** : les 18 colonnes attendues sont présentes.

En cas de succès : copie vers `models/<kind>/production/`, mise à jour du
`models/registry.json` et transition MLflow → Production. Sinon le candidat
est **rejeté** (aucune promotion) et l'ancien modèle reste actif. C'est le
comportement voulu : une gate bloquante, pas un simple avertissement.

---

## 6. Inférence & monitoring

### 6.1 Prédiction (`mlops/inference/predictor.py`)

Le `Predictor` charge le modèle **Production** au premier appel et le garde en
cache (`reload()` après un retrain). Il attend une config low-code FlowOps
(normalisée), construit les features d'historique depuis
`prediction_dataset.csv`, applique le préprocesseur stocké dans le pipeline
(garantie de parité), puis retourne :

```json
{
  "workflow_name": "ci-build",
  "repository": "ranto-dev/Fluxy",
  "duration_seconds": 128.4,
  "failure_probability": 0.3033,
  "failure_percentage": 30.3,
  "predicted_failure": false,
  "failure_threshold": 0.67,
  "risk_level": "medium",
  "risk_level_label": "Risque moyen",
  "history": { "previous_run_count": 3, "previous_success_rate": 0.67, ... },
  "model": {
    "duration": { "deployed": true, "version": 5, "algorithm": "ridge", ... },
    "failure": { "deployed": true, "version": 5, "algorithm": "logistic", ... }
  }
}
```

Niveau de risque (bords `config.RISK_LEVELS`, surchargeables) :

| Probabilité échec | Niveau | Libellé         |
|-------------------|--------|-----------------|
| 0.00 – 0.30       | low    | Risque faible   |
| 0.30 – 0.70       | medium | Risque moyen    |
| 0.70 – 1.00       | high   | Risque élevé    |

### 6.2 Monitoring du drift (`mlops/monitoring/tracker.py`)

Chaque prédiction de l'API est **journalisée** dans
`data/monitoring/predictions.csv` (timestamp, workflow, repo, durée prédite,
probabilité d'échec, risque, versions des modèles).

Quand l'exécution réelle se termine, on renseigne la durée/réussite réelle
du dernier run prédit correspondant (`log_actual`). Le drift est alors calculé
sur les paires prédit/réel :

- `prediction_count` — nombre de prédictions ;
- `predictions_with_actual` — nombre de paires prédit/réel disponibles ;
- `drift.pred_vs_actual_mae_seconds` — MAE prédit vs réel ;
- `latest_predictions` — les 10 dernières entrées.

C'est le point d'entrée d'une détection de drift plus avancée en production
(fenêtrage temporel, tests PSI/KS, alertes) : le journal CSV et les métadonnées
de modèle exposent déjà tout ce qu'il faut.

---

## 7. API REST (`mlops/api.py`)

Monté sur FastAPI par `app/main.py` (`create_app()`), sous le préfixe **`/api/mlops`** — `backend/main.py` se contente de réexporter `app` pour `uvicorn main:app` :

| Méthode | Endpoint                           | Description |
|---------|------------------------------------|-------------|
| GET     | `/api/mlops/status`                | État global : modèles actifs, évaluations, monitoring, nb de lignes de données |
| GET     | `/api/mlops/models`                | Modèles actifs + contenu du `registry.json` + rapports d'évaluation |
| POST    | `/api/mlops/predict`               | Prédit durée + risque depuis une config FlowOps (journalisée en monitoring) |
| POST    | `/api/mlops/retrain`               | Relance `run_pipeline` sur les données collectées puis recharge les modèles |
| POST    | `/api/mlops/log-actual`            | Renseigne durée/réussite réelle d'une prédiction (mise à jour du drift) |
| GET     | `/api/mlops/monitoring`            | État du monitoring seul |
| GET     | `/api/mlops/dataset-locations`     | Chemins absolus des datasets/modèles/évaluations |

Exemple de prédiction :

```bash
curl -s -X POST http://localhost:8000/api/mlops/predict \
  -H "Content-Type: application/json" \
  -d '{
    "name": "ci-build",
    "repository": "ranto-dev/Fluxy",
    "on_events": ["push", "pull_request"],
    "branches": "main",
    "jobs": [{
      "runs_on": "ubuntu-latest",
      "steps": [
        {"type": "checkout"},
        {"type": "setup-node", "node_version": "20"},
        {"type": "npm", "npm_command": "install"},
        {"type": "npm", "npm_command": "test"}
      ]
    }]
  }'
```

Le champ `jobs[].steps[].type` accepte : `checkout`, `setup-node`,
`npm`, `upload-artifact`, `docker`, `custom-run`.

**UI React** : le panneau « Prediction IA — MLflow » (composant
`PredictionPanel`) s'affiche dans l'éditeur de workflow et prédit
automatiquement à chaque modification de la config ; l'onglet **MLflow**
(composant `MlopsCenter`) présente les modèles actifs, les métriques,
le monitoring et un bouton « Relancer le pipeline ».

---

## 8. Guide de démarrage rapide

Prérequis : Python ≥ 3.12 (venv existant à `backend/venv/`), dépendances du
`requirements.txt` (dont `mlflow`, `scikit-learn`, `pandas`).

```bash
# 1. Jeu de démonstration + pipeline complet (collecte → registry)
cd backend
venv/bin/python -m mlops.pipeline --sample

# 2. Lancer l'application (Mongo sur 27017 : mongo-docker.sh)
venv/bin/uvicorn main:app --reload --port 8000

# 3. Vérifier l'état
curl -s http://localhost:8000/api/mlops/status

# 4. Prédire (voir § 7)
curl -s -X POST http://localhost:8000/api/mlops/predict ...

# 5. Renseigner un réel + lire le drift
curl -s -X POST http://localhost:8000/api/mlops/log-actual \
     -H "Content-Type: application/json" \
     -d '{"workflow_name":"ci-build","repository":"ranto-dev/Fluxy","duration_seconds":165,"failed":false}'
curl -s http://localhost:8000/api/mlops/monitoring   # → drift.pred_vs_actual_mae_seconds
```

### Étapes individuelles rejouables

```bash
cd backend
venv/bin/python -m mlops.data.sample_data            # génère data/raw (démo)
venv/bin/python -m mlops.etl.pipeline                # ETL + features
venv/bin/python -m mlops.training.train_duration     # régression → candidat
venv/bin/python -m mlops.training.train_failure      # classification → candidat
venv/bin/python -m mlops.evaluation.evaluate         # évaluations + MLflow
venv/bin/python -m mlops.validation.validator        # gates + promotion
venv/bin/python -m mlops.collection.collector --repo owner/repo --token ghp_xxx
```

### Utiliser de vraies données GitHub

```bash
cd backend
GITHUB_TOKEN=ghp_xxx GITHUB_REPO="owner/repo" \
  venv/bin/python -m mlops.pipeline --repo owner/repo --token ghp_xxx
```

`GITHUB_TOKEN`/`GITHUB_REPO` peuvent aussi être posés dans `backend/.env`
(`mlops/config.py` appelle lui-même `load_dotenv` : le CLI MLOps fonctionne donc sans que l'API soit lancée ; `MLOPS_*` et `FLOWOPS_MLFLOW_TRACKING_URI` se lisent pareil).

### Où sont les livrables

| Livrable            | Emplacement                                   |
|---------------------|-----------------------------------------------|
| Datasets bruts      | `backend/mlops/data/raw/`                     |
| Datasets features   | `backend/mlops/data/features/`                |
| Rapports évaluation | `backend/mlops/data/evaluation/*.json|*.png`  |
| Registre local      | `backend/mlops/models/registry.json`          |
| Modèles Production  | `backend/mlops/models/<kind>/production/`     |
| Track MLflow        | `backend/mlruns/mlflow.db` (UI : `mlflow ui`) |
| Monitoring          | `backend/mlops/data/monitoring/predictions.csv` |

---

## 9. Limites & pistes (honnêteté du prototype)

- Les données de démonstration sont **synthétiques** : elles servent à démontrer
  le cycle complet, pas à certifier une précision réelle. Avec le jeu par défaut
  (`seed=7`, 200 runs), le pipeline actuel donne ~MAE 18 s / R² ≈ 0.81 (durée)
  et F1 ≈ 0.84 / AUC ≈ 0.93 (échec, seuil ≈ 0.60) ; ces chiffres sont
  *démonstratifs* et dépendent du tirage : sur d'autres seeds (± quelques %
  d'échecs en test) les métriques oscillent fortement, c'est la variance normale
  des petits échantillons temporels.
- Les seuils de risques (`0.30`/`0.70`) sont configurables, pas « appris » ;
  les seuils de validation sont calibrés sur les expériences et surchargeables.
- La classification d'échec souffre du déséquilibre de classes : sur de vrais
  dépôts avec ~5 % d'échecs, prévoyez plus d'historique, du class-balancing
  renforcé, et une calibration du seuil rejouée à chaque retrain
  (déjà automatisée).
- Le monitoring est une première version basée sur un journal CSV : la boucle
  de fermeture prédit→réel→retrain en production est décrite mais automatisée
  ici via l'endpoint `/api/mlops/retrain`.
- La collecte réelle n'exige pour l'instant que le dernier workflow actif par
  dépôt (extension possible : multi-repos, pagination complète, salles
  d'attente API).