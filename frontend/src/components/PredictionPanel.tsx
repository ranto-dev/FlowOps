import React, { useEffect, useState } from "react";
import {
  BrainCircuit,
  Clock3,
  Gauge,
  Loader2,
  Radar,
  RefreshCw,
  ShieldAlert,
  Sparkles,
  TrendingUp,
} from "lucide-react";

interface PredictionResult {
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
    duration?: { deployed: boolean; version?: number; algorithm?: string; training_date?: string };
    failure?: { deployed: boolean; version?: number; algorithm?: string; training_date?: string };
  };
  duration_error?: string;
  failure_error?: string;
}

interface PredictionPanelProps {
  config: Record<string, unknown>;
  repository: string;
  apiUrl: string;
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

const RISK_STYLE: Record<string, string> = {
  low: "bg-emerald-50 text-emerald-700 border-emerald-200",
  medium: "bg-amber-50 text-amber-700 border-amber-200",
  high: "bg-red-50 text-red-700 border-red-200",
};

const RISK_DOT: Record<string, string> = {
  low: "bg-emerald-500",
  medium: "bg-amber-500",
  high: "bg-red-500",
};

export const PredictionPanel: React.FC<PredictionPanelProps> = ({
  config,
  repository,
  apiUrl,
}) => {
  const [prediction, setPrediction] = useState<PredictionResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPrediction = async (showLoader = false) => {
    if (!config || !repository) return;
    if (showLoader) setLoading(true);
    try {
      const res = await fetch(`${apiUrl}/api/mlops/predict`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...config, repository }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.detail || "Prediction failed");
        setPrediction(null);
      } else {
        setPrediction(data);
        setError(null);
      }
    } catch {
      setError("Unable to reach the prediction service.");
      setPrediction(null);
    } finally {
      if (showLoader) setLoading(false);
    }
  };

  useEffect(() => {
    if (!config) return;
    const t = setTimeout(() => fetchPrediction(false), 500);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config, repository]);

  if (!repository) return null;

  const p = prediction;
  const history = p?.history;
  const durationModel = p?.model?.duration;
  const failureModel = p?.model?.failure;
  const hasDuration = p?.duration_seconds !== undefined && p?.duration_seconds !== null;
  const hasFailure = p?.failure_probability !== undefined && p?.failure_probability !== null;

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white shadow-sm animate-in fade-in duration-200">
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-gradient-to-br from-purple-600 to-indigo-600 text-white rounded-xl">
            <BrainCircuit className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-900 tracking-tight">
              Prediction IA — MLflow
            </h3>
            <p className="text-[10px] text-slate-500 font-medium">
              Estimation avant exécution par le pipeline MLOps de FlowOps
            </p>
          </div>
        </div>
        <button
          onClick={() => fetchPrediction(true)}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-lg transition-all uppercase tracking-wider disabled:opacity-50"
          title="Recharger la prédiction"
        >
          {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
          Actualiser
        </button>
      </div>

      <div className="p-5">
        {error && (
          <div className="text-xs font-mono text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
            {error}
          </div>
        )}

        {!error && !loading && !prediction && (
          <div className="flex items-center gap-3 text-xs font-semibold text-slate-400 py-6 justify-center">
            <Sparkles className="w-4 h-4" /> Prédiction en attente de configuration...
          </div>
        )}

        {!error && prediction && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Durée estimée */}
            <div className="rounded-xl bg-gradient-to-br from-slate-900 to-slate-800 text-white p-4 relative overflow-hidden">
              <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                <Clock3 className="w-3.5 h-3.5" /> Durée estimée
              </div>
              <div className="mt-2 text-2xl font-black tracking-tight">
                {hasDuration ? formatDuration(p!.duration_seconds) : "—"}
              </div>
              <div className="mt-1 text-[10px] text-slate-400 font-medium">
                {hasDuration && p?.history?.average_previous_duration
                  ? `moyenne historique : ${formatDuration(p.history.average_previous_duration)}`
                  : "aucun historique disponible"}
              </div>
              {durationModel?.deployed && (
                <div className="absolute top-3 right-3 text-[9px] font-mono bg-white/10 rounded-md px-2 py-1 text-slate-300">
                  v{durationModel.version} · {durationModel.algorithm}
                </div>
              )}
            </div>

            {/* Risque d'échec */}
            <div className="rounded-xl border border-slate-200 p-4">
              <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                <ShieldAlert className="w-3.5 h-3.5" /> Risque d'échec
              </div>
              <div className="mt-1 flex items-end gap-2">
                <span className="text-2xl font-black text-slate-900">
                  {hasFailure ? `${p!.failure_percentage}%` : "—"}
                </span>
                {hasFailure && p?.risk_level && (
                  <span
                    className={`mb-0.5 text-[10px] font-bold px-2 py-0.5 rounded-lg border ${RISK_STYLE[p.risk_level]} capitalize`}
                  >
                    {p.risk_level_label}
                  </span>
                )}
              </div>
              <div className="mt-2 h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${RISK_DOT[p?.risk_level ?? "low"]}`}
                  style={{ width: `${Math.min(p?.failure_percentage ?? 0, 100)}%` }}
                />
              </div>
              {hasFailure && p?.predicted_failure !== null && (
                <div className="mt-2 text-[10px] font-mono text-slate-500">
                  échec prédit :{" "}
                  <span className={p!.predicted_failure ? "text-red-600 font-bold" : "text-emerald-600 font-bold"}>
                    {p!.predicted_failure ? "OUI" : "NON"}
                  </span>
                  {p?.failure_threshold ? ` · seuil ${(p!.failure_threshold * 100).toFixed(0)}%` : ""}
                </div>
              )}
            </div>

            {/* Historique / contexte */}
            <div className="rounded-xl border border-slate-200 p-4">
              <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                <TrendingUp className="w-3.5 h-3.5" /> Contexte appris
              </div>
              <div className="mt-2 space-y-1.5 text-xs font-medium text-slate-700">
                <div className="flex justify-between">
                  <span className="text-slate-400">Exécutions passées</span>
                  <span className="font-mono font-bold">{history?.previous_run_count ?? 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Taux de succès</span>
                  <span className="font-mono font-bold text-emerald-600">
                    {history?.previous_success_rate !== undefined
                      ? `${(history.previous_success_rate * 100).toFixed(0)}%`
                      : "—"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Taux d'échec</span>
                  <span className="font-mono font-bold text-red-600">
                    {history?.previous_failure_rate !== undefined
                      ? `${(history.previous_failure_rate * 100).toFixed(0)}%`
                      : "—"}
                  </span>
                </div>
              </div>
              {failureModel?.deployed && (
                <div className="mt-2 pt-2 border-t border-slate-100 text-[9px] font-mono text-slate-400">
                  classifieur v{failureModel.version} · {failureModel.algorithm}
                </div>
              )}
            </div>
          </div>
        )}

        {!error && prediction && (p?.duration_error || p?.failure_error) && (
          <div className="mt-3 flex items-center gap-2 text-[10px] font-mono text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
            <Radar className="w-3.5 h-3.5" />
            {p?.duration_error || p?.failure_error} — exécutez le pipeline MLOps
            (POST /api/mlops/retrain) pour déployer les modèles manquants.
          </div>
        )}

        {!error && prediction && (
          <div className="mt-3 flex items-center gap-1.5 text-[10px] font-medium text-slate-400">
            <Gauge className="w-3.5 h-3.5" />
            Prédiction enregistrée dans le monitoring (données prédit/réel pour
            le suivi du drift).
          </div>
        )}
      </div>
    </div>
  );
};