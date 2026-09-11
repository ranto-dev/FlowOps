import React, { useEffect, useState } from "react";
import {
  Activity,
  BrainCircuit,
  Database,
  FlaskConical,
  Loader2,
  RefreshCw,
  RotateCw,
  Server,
  TrendingDown,
} from "lucide-react";

interface ModelCard {
  deployed: boolean;
  version?: number;
  algorithm?: string;
  training_date?: string;
  dataset_version?: string;
  threshold?: number;
  metrics?: Record<string, number>;
}

interface LatestPrediction {
  workflow_name?: string;
  repository?: string;
  duration_predicted?: number | string;
  failure_probability?: number | string;
  duration_actual?: number | string;
  risk_level?: string;
  timestamp?: string;
}

interface StatusData {
  models?: { duration?: ModelCard; failure?: ModelCard };
  evaluations?: Record<string, unknown>;
  monitoring?: {
    prediction_count?: number;
    predictions_with_actual?: number;
    drift?: { pred_vs_actual_mae_seconds?: number | null };
    latest_predictions?: LatestPrediction[];
  };
  data?: { regression_rows?: number; classification_rows?: number };
  note?: string;
}

interface MlopsCenterProps {
  apiUrl: string;
  token: string | null;
}

const formatDate = (iso?: string) =>
  iso ? new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" }) : "—";

const metric = (m: Record<string, number> | undefined, key: string, digits = 2) =>
  m && m[key] !== undefined && m[key] !== null ? Number(m[key]).toFixed(digits) : "—";

const MetricChip: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="flex items-center justify-between px-3 py-1.5 bg-slate-50 rounded-lg">
    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{label}</span>
    <span className="text-[11px] font-mono font-bold text-slate-700">{value}</span>
  </div>
);

export const MlopsCenter: React.FC<MlopsCenterProps> = ({ apiUrl, token }) => {
  const [status, setStatus] = useState<StatusData | null>(null);
  const [loading, setLoading] = useState(true);
  const [retraining, setRetraining] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadStatus = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${apiUrl}/api/mlops/status`);
      if (!res.ok) throw new Error("status unavailable");
      setStatus(await res.json());
      setError(null);
    } catch {
      setError("Le service MLOps est indisponible (backend arrêté ?).");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const retrain = async () => {
    if (!confirm("Relancer l'entraînement complet sur les données collectées ?")) return;
    setRetraining(true);
    try {
      const res = await fetch(`${apiUrl}/api/mlops/retrain`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json();
      alert(
        res.ok
          ? `Pipeline retrainé.\nDuration validé : ${data.summary?.validation?.duration}\nFailure validé : ${data.summary?.validation?.failure}`
          : `Erreur : ${data.detail || "retrain failed"}`,
      );
      await loadStatus();
    } catch {
      alert("Échec de communication pendant le retrain.");
    } finally {
      setRetraining(false);
    }
  };

  const d = status?.models?.duration;
  const f = status?.models?.failure;
  const dt = status?.monitoring?.drift?.pred_vs_actual_mae_seconds;

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-gradient-to-br from-purple-600 to-indigo-600 text-white rounded-xl">
            <BrainCircuit className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-900 tracking-tight">
              MLflow Center
            </h2>
            <p className="text-[11px] text-slate-500 font-medium">
              Cycle MLOps : entraînement, validation, registre de modèles et monitoring des prédictions
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadStatus}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[10px] rounded-xl uppercase tracking-wider transition-all disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
            Rafraîchir
          </button>
          <button
            onClick={retrain}
            disabled={retraining}
            className="flex items-center gap-1.5 px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold text-[10px] rounded-xl uppercase tracking-wider transition-all shadow-sm disabled:opacity-60"
          >
            {retraining ? <Loader2 className="w-3 h-3 animate-spin" /> : <RotateCw className="w-3 h-3" />}
            {retraining ? "Entraînement..." : "Relancer le pipeline"}
          </button>
        </div>
      </div>

      {error && (
        <div className="text-xs font-mono text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">{error}</div>
      )}

      {loading && !status && !error && (
        <div className="py-16 flex flex-col items-center gap-3 bg-white rounded-2xl border border-slate-200/80">
          <Loader2 className="w-7 h-7 text-purple-600 animate-spin" />
          <span className="text-xs font-semibold text-slate-500">Chargement de l'état MLOps...</span>
        </div>
      )}

      {status && (
        <>
          {/* Modèles actifs */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Modèle duration */}
            <div className="rounded-2xl border border-slate-200/80 bg-white shadow-sm p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-slate-900 text-white rounded-lg">
                    <FlaskConical className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-slate-900 uppercase tracking-wide">
                      Prédiction de durée
                    </h4>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                      d?.deployed ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"
                    }`}>
                      {d?.deployed ? "● En production" : "Aucun modèle déployé"}
                    </span>
                  </div>
                </div>
                {d?.deployed && (
                  <span className="text-[10px] font-mono font-bold bg-purple-50 text-purple-700 border border-purple-200 rounded-lg px-2 py-1">
                    v{d.version ?? "?"} · {d.algorithm}
                  </span>
                )}
              </div>
              {d?.deployed ? (
                <>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <MetricChip label="MAE" value={metric(d.metrics, "mae") + " s"} />
                    <MetricChip label="RMSE" value={metric(d.metrics, "rmse") + " s"} />
                    <MetricChip label="R²" value={metric(d.metrics, "r2")} />
                    <MetricChip label="Erreur rel." value={d.metrics?.["relative_error"] !== undefined
                      ? (Number(d.metrics["relative_error"]) * 100).toFixed(1) + " %"
                      : "—"} />
                  </div>
                  <div className="mt-3 flex items-center gap-4 text-[10px] text-slate-400 font-medium">
                    <span className="flex items-center gap-1"><Database className="w-3 h-3" /> {d.dataset_version || "—"}</span>
                    <span className="flex items-center gap-1"><Server className="w-3 h-3" /> {formatDate(d.training_date)}</span>
                  </div>
                </>
              ) : (
                <div className="mt-3 text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 font-medium">
                  Lancez le pipeline MLOps pour déployer le modèle de durée.
                </div>
              )}
            </div>

            {/* Modèle failure */}
            <div className="rounded-2xl border border-slate-200/80 bg-white shadow-sm p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-red-600 text-white rounded-lg">
                    <Activity className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-slate-900 uppercase tracking-wide">
                      Risque d'échec
                    </h4>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                      f?.deployed ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"
                    }`}>
                      {f?.deployed ? "● En production" : "Aucun modèle déployé"}
                    </span>
                  </div>
                </div>
                {f?.deployed && (
                  <span className="text-[10px] font-mono font-bold bg-red-50 text-red-700 border border-red-200 rounded-lg px-2 py-1">
                    v{f.version ?? "?"} · {f.algorithm}
                    {f.threshold !== undefined ? ` · seuil ${(f.threshold * 100).toFixed(0)}%` : ""}
                  </span>
                )}
              </div>
              {f?.deployed ? (
                <>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <MetricChip label="F1" value={metric(f.metrics, "f1")} />
                    <MetricChip label="AUC" value={metric(f.metrics, "roc_auc")} />
                    <MetricChip label="Precision" value={metric(f.metrics, "precision")} />
                    <MetricChip label="Recall" value={metric(f.metrics, "recall")} />
                  </div>
                  <div className="mt-3 flex items-center gap-4 text-[10px] text-slate-400 font-medium">
                    <span className="flex items-center gap-1"><Database className="w-3 h-3" /> {f.dataset_version || "—"}</span>
                    <span className="flex items-center gap-1"><Server className="w-3 h-3" /> {formatDate(f.training_date)}</span>
                  </div>
                </>
              ) : (
                <div className="mt-3 text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 font-medium">
                  Lancez le pipeline MLOps pour déployer le classifieur d'échec.
                </div>
              )}
            </div>
          </div>

          {/* Monitoring */}
          <div className="rounded-2xl border border-slate-200/80 bg-white shadow-sm">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-emerald-600 text-white rounded-lg">
                  <TrendingDown className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-slate-900 uppercase tracking-wide">
                    Monitoring des prédictions
                  </h4>
                  <p className="text-[10px] text-slate-500 font-medium">
                    Drift prédit/réel suivi dans le journal CSV
                  </p>
                </div>
              </div>
              <button
                onClick={loadStatus}
                className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg uppercase tracking-wider transition-all"
              >
                <RefreshCw className="w-3 h-3" /> Recharger
              </button>
            </div>

            <div className="p-5 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="rounded-xl bg-slate-900 text-white p-4 text-center">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Prédictions</div>
                <div className="text-3xl font-black mt-1">{status.monitoring?.prediction_count ?? 0}</div>
              </div>
              <div className="rounded-xl border border-slate-200 p-4 text-center">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Avec réel renseigné</div>
                <div className="text-3xl font-black mt-1">{status.monitoring?.predictions_with_actual ?? 0}</div>
              </div>
              <div className="rounded-xl border border-slate-200 p-4 text-center">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Drift MAE</div>
                <div className="text-3xl font-black mt-1">
                  {dt !== undefined && dt !== null ? `${(dt / 60).toFixed(1)}m` : "—"}
                </div>
                <div className="text-[9px] text-slate-400 mt-0.5">prédit vs réel (secondes)</div>
              </div>
            </div>

            <div className="px-5 pb-5">
              {status.monitoring?.latest_predictions?.length ? (
                <div className="overflow-x-auto rounded-xl border border-slate-100">
                  <table className="w-full text-left text-[11px]">
                    <thead className="bg-slate-50 text-slate-500 font-black uppercase tracking-wider text-[9px]">
                      <tr>
                        <th className="px-3 py-2">Workflow</th>
                        <th className="px-3 py-2">Dépôt</th>
                        <th className="px-3 py-2">Durée prédite</th>
                        <th className="px-3 py-2">Durée réelle</th>
                        <th className="px-3 py-2">Risque</th>
                        <th className="px-3 py-2">Date</th>
                      </tr>
                    </thead>
                    <tbody className="text-slate-700 font-medium">
                      {status.monitoring.latest_predictions.slice(0, 6).map((row, i) => (
                        <tr key={i} className="border-t border-slate-100">
                          <td className="px-3 py-2 font-mono">{row.workflow_name || "—"}</td>
                          <td className="px-3 py-2 font-mono text-purple-700">{row.repository || "—"}</td>
                          <td className="px-3 py-2 font-mono">{row.duration_predicted ?? "—"}s</td>
                          <td className="px-3 py-2 font-mono">
                            {row.duration_actual !== undefined && row.duration_actual !== ""? `${row.duration_actual}s` : "(en attente)"}
                          </td>
                          <td className="px-3 py-2">
                            <span className="font-bold capitalize">{row.risk_level || "—"}</span>
                          </td>
                          <td className="px-3 py-2 font-mono text-slate-400">{row.timestamp?.slice(0, 16) || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-[11px] text-slate-400 text-center py-6 border border-dashed border-slate-200 rounded-xl font-medium">
                  Aucune prédiction enregistrée. Effectuez une prédiction depuis la vue de configuration de workflow.
                </div>
              )}
            </div>

            {status.note && (
              <div className="mx-5 mb-5 text-[10px] font-mono text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
                ℹ️ {status.note}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};