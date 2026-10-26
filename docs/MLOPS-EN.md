# FlowOps MLOps

FlowOps includes a local pipeline for collecting workflow-run data, preparing
features, training duration and failure models, evaluating candidates, and
tracking predictions.

## Run the pipeline

From `backend/`:

```bash
venv/bin/python -m mlops.pipeline --sample
```

The `--sample` option creates reproducible synthetic data for local
demonstration. It is not historical data from a user's repositories.

To collect real GitHub Actions data, use the collector with a repository and
GitHub token:

```bash
venv/bin/python -m mlops.collection.collector --repo owner/repository --token <github-token>
```

Treat the token as a secret; do not commit it or place it in documentation.

## Pipeline stages

The pipeline collects workflow runs and definitions, processes them into
datasets, engineers shared train/serve features, trains duration-regression and
failure-classification candidates, evaluates them, records experiments in
MLflow, validates candidates against configured thresholds, and promotes
eligible models.

Configuration and output paths live in `backend/mlops/config.py`. MLflow uses
the `FLOWOPS_MLFLOW_TRACKING_URI` setting. Generated datasets, models,
evaluation reports and MLflow state are local artifacts.

## Feature parity and predictions

`backend/mlops/features/engineering.py` is shared by training and inference so
that both paths use the same feature definitions. Historical features only use
runs that predate the prediction.

The prediction API is `POST /api/mlops/predict`. It returns an estimate only
when the relevant compatible model is deployed. Missing models remain
unavailable rather than being represented as zero risk. Inspect
`GET /api/mlops/status` and `GET /api/mlops/models` for model and evaluation
status.

## Monitoring

Predictions are recorded locally for comparison with actual outcomes.
`POST /api/mlops/log-actual` records an observed duration and failure result;
`GET /api/mlops/monitoring` reports monitoring status. This local API is
intended for trusted deployments and should not be exposed publicly without
appropriate authentication and access controls.
