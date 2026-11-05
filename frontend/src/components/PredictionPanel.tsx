import React, { useEffect, useRef, useState } from "react";
import {
  BrainCircuit,
  Clock3,
  Gauge,
  Radar,
  RefreshCw,
  ShieldAlert,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { apiFetch, isApiError } from "../lib/api";
import type { PredictionResult, PredictionSnapshot } from "../@types/api";
import type { FlowOpsWorkflowConfig } from "../@types/workflow";
import { usePreferences } from "../lib/usePreferences";
import { cn } from "../lib/utils";
import { Badge, type BadgeTone } from "./ui/Badge";
import { Button } from "./ui/Button";

interface PredictionPanelProps {
  config: FlowOpsWorkflowConfig;
  repository: string;
  onPredictionChange?: (snapshot: PredictionSnapshot) => void;
}

const formatDuration = (seconds: number | null): string => {
  if (seconds === null || seconds === undefined) return "—";
  const min = Math.floor(seconds / 60);
  const sec = Math.round(seconds % 60);
  if (min >= 60) {
    const h = Math.floor(min / 60);
    return `${h}h ${min % 60}m ${sec}s`;
  }
  return min > 0 ? `${min}m ${sec}s` : `${sec}s`;
};

const RISK_TONE: Record<string, BadgeTone> = {
  low: "green",
  medium: "amber",
  high: "red",
};

const RISK_BAR: Record<string, string> = {
  low: "bg-success",
  medium: "bg-warning",
  high: "bg-danger",
};

export const PredictionPanel: React.FC<PredictionPanelProps> = ({
  config,
  repository,
  onPredictionChange,
}) => {
  const { t } = usePreferences();
  const [prediction, setPrediction] = useState<PredictionResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const requestId = useRef(0);

  const fetchPrediction = async (showLoader = false) => {
    if (!config || !repository) return;
    const currentRequestId = ++requestId.current;
    setError(null);
    onPredictionChange?.({ status: "pending", prediction: null });
    if (showLoader) setLoading(true);
    try {
      const data = await apiFetch<PredictionResult>("/api/mlops/predict", {
        method: "POST",
        body: { ...config, repository },
        auth: false,
      });
      if (currentRequestId !== requestId.current) return;
      setPrediction(data);
      const failurePercentage =
        data.failure_percentage ??
        (data.failure_probability != null
          ? data.failure_probability * 100
          : null);
      const hasDuration =
        data.duration_seconds != null &&
        Number.isFinite(data.duration_seconds);
      const hasFailure =
        failurePercentage != null && Number.isFinite(failurePercentage);
      onPredictionChange?.({
        status:
          hasDuration && hasFailure
            ? "available"
            : hasDuration || hasFailure
              ? "partial"
              : "unavailable",
        prediction: data,
      });
      setError(null);
    } catch (err) {
      if (currentRequestId !== requestId.current) return;
      const message = isApiError(err)
        ? err.detail
        : "Unable to reach the prediction service.";
      setError(message);
      setPrediction(null);
      onPredictionChange?.({ status: "error", prediction: null, error: message });
    } finally {
      if (showLoader && currentRequestId === requestId.current) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    if (!config) return;
    requestId.current += 1;
    setPrediction(null);
    setLoading(false);
    setError(null);
    onPredictionChange?.({ status: "pending", prediction: null });
    const t = setTimeout(() => fetchPrediction(false), 500);
    return () => {
      clearTimeout(t);
      requestId.current += 1;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config, repository, onPredictionChange]);

  if (!repository) return null;

  const p = prediction;
  const history = p?.history;
  const durationModel = p?.model?.duration;
  const failureModel = p?.model?.failure;
  const hasDuration =
    p?.duration_seconds != null && Number.isFinite(p.duration_seconds);
  const failurePercentage =
    p?.failure_percentage ??
    (p?.failure_probability != null ? p.failure_probability * 100 : null);
  const hasFailure =
    failurePercentage != null && Number.isFinite(failurePercentage);

  return (
    <div className="glass rounded-lg border">
      <div className="flex items-center justify-between border-b border-line px-4 py-3">
        <div className="flex items-center gap-3">
          <BrainCircuit className="h-4 w-4 text-accent-ink" />
          <div>
            <h3 className="text-sm font-semibold text-ink">
              {t("Workflow predictions")}
            </h3>
            <p className="text-xs text-ink-muted">
              {t("Estimates from available FlowOps models")}
            </p>
          </div>
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => fetchPrediction(true)}
          loading={loading}
          title={t("Refresh prediction")}
        >
          {!loading && <RefreshCw className="h-3.5 w-3.5" />}
          {t("Refresh")}
        </Button>
      </div>

      <div className="p-4">
        {error && (
          <div className="rounded-md border border-danger/30 bg-danger/10 px-4 py-3 font-mono text-xs text-danger">
            {error}
          </div>
        )}

        {!error && !loading && !prediction && (
          <div className="flex items-center justify-center gap-3 py-6 text-sm text-ink-muted">
            <Sparkles className="h-4 w-4" /> {t("Waiting for a workflow prediction...")}
          </div>
        )}

        {!error && prediction && (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {/* Durée estimée */}
            <div className="rounded-md border border-line bg-surface-2/50 p-3">
              <div className="flex items-center gap-1.5 text-xs font-medium text-ink-muted">
                <Clock3 className="h-3.5 w-3.5" /> {t("Estimated duration")}
              </div>
              <div className="mt-2 text-xl font-semibold tabular-nums text-ink">
                {hasDuration && p ? formatDuration(p.duration_seconds) : "—"}
              </div>
              <div className="mt-1 text-xs text-ink-muted">
                {hasDuration && p?.history?.average_previous_duration
                  ? `${t("Historical average")}: ${formatDuration(p.history.average_previous_duration)}`
                  : t("No historical duration available")}
              </div>
              {durationModel?.deployed && (
                <div className="mt-2 font-mono text-xs text-ink-subtle">
                  v{durationModel.version} · {durationModel.algorithm}
                </div>
              )}
            </div>

            {/* Risque d'échec */}
            <div className="rounded-md border border-line bg-surface-2/50 p-3">
              <div className="flex items-center gap-1.5 text-xs font-medium text-ink-muted">
                <ShieldAlert className="h-3.5 w-3.5" /> {t("Failure risk")}
              </div>
              <div className="mt-2 flex items-center gap-2">
                <span className="text-xl font-semibold tabular-nums text-ink">
                  {hasFailure ? `${failurePercentage}%` : "—"}
                </span>
                {hasFailure && p?.risk_level && (
                  <Badge
                    tone={RISK_TONE[p.risk_level] ?? "neutral"}
                    className="capitalize"
                  >
                    {p.risk_level_label}
                  </Badge>
                )}
              </div>
              {hasFailure && p ? (
                <div
                  className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-surface-2"
                  role="img"
                  aria-label={`${t("Failure risk")}: ${failurePercentage}%`}
                >
                  <div
                    className={cn(
                      "h-full rounded-full transition-all",
                      RISK_BAR[p.risk_level ?? ""] ?? "bg-ink-subtle",
                    )}
                    style={{
                      width: `${Math.max(0, Math.min(failurePercentage ?? 0, 100))}%`,
                    }}
                  />
                </div>
              ) : (
                <p className="mt-2 text-xs text-warning">
                  {t("Failure model is not available.")}
                </p>
              )}
              {hasFailure &&
                p &&
                p.predicted_failure !== null &&
                p.predicted_failure !== undefined && (
                <div className="mt-2 font-mono text-xs text-ink-muted">
                  {t("Predicted failure")}:{" "}
                  <span className={p.predicted_failure ? "font-semibold text-danger" : "font-semibold text-success"}>
                    {p.predicted_failure ? t("Yes") : t("No")}
                  </span>
                  {p.failure_threshold ? ` · ${t("threshold")} ${(p.failure_threshold * 100).toFixed(0)}%` : ""}
                </div>
              )}
            </div>

            {/* Historique / contexte */}
            <div className="sm:col-span-2 rounded-md border border-line bg-surface-2/50 p-3">
              <div className="flex items-center gap-1.5 text-xs font-medium text-ink-muted">
                <TrendingUp className="h-3.5 w-3.5" /> {t("Historical context")}
              </div>
              <div className="mt-2 space-y-1.5 text-sm text-ink">
                <div className="flex justify-between">
                  <span className="text-ink-muted">{t("Previous runs")}</span>
                  <span className="font-mono font-medium">{history?.previous_run_count ?? "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-ink-muted">{t("Success rate")}</span>
                  <span className="font-mono font-medium text-success">
                    {history?.previous_success_rate !== undefined
                      ? `${(history.previous_success_rate * 100).toFixed(0)}%`
                      : "—"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-ink-muted">{t("Failure rate")}</span>
                  <span className="font-mono font-medium text-danger">
                    {history?.previous_failure_rate !== undefined
                      ? `${(history.previous_failure_rate * 100).toFixed(0)}%`
                      : "—"}
                  </span>
                </div>
              </div>
              {failureModel?.deployed && (
                <div className="mt-2 border-t border-line pt-2 font-mono text-xs text-ink-subtle">
                  classifieur v{failureModel.version} · {failureModel.algorithm}
                </div>
              )}
            </div>
          </div>
        )}

        {!error && prediction && (p?.duration_error || p?.failure_error) && (
          <div className="mt-3 flex items-center gap-2 rounded-md border border-warning/30 bg-warning/10 px-3 py-2 font-mono text-xs text-warning">
            <Radar className="h-3.5 w-3.5" />
            <span>
              {p?.duration_error || p?.failure_error} —{" "}
              {t("Predictions are unavailable until compatible models are deployed.")}
            </span>
          </div>
        )}

        {!error && prediction && (
          <div className="mt-3 flex items-center gap-1.5 text-xs text-ink-subtle">
            <Gauge className="h-3.5 w-3.5" />
            {t("Prediction recorded for monitoring (predicted and actual values support drift tracking).")}
          </div>
        )}
      </div>
    </div>
  );
};
