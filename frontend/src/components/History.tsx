import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  PlayCircle,
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  RefreshCw,
  Terminal,
  ChevronRight,
  ChevronDown,
  ExternalLink,
  Layers,
} from "lucide-react";

interface Project {
  id: string;
  name: string;
  repository: string;
}

interface WorkflowRun {
  id: string;
  name: string;
  status: "queued" | "in_progress" | "completed";
  conclusion: "success" | "failure" | "cancelled" | null;
  event: string;
  branch: string;
  commit_sha: string;
  created_at: string;
  updated_at: string;
  html_url: string;
}

interface Step {
  name: string;
  status: string;
  conclusion: string | null;
  number: number;
  started_at: string;
  completed_at: string;
}

interface Job {
  id: string;
  name: string;
  status: string;
  conclusion: string | null;
  started_at: string;
  completed_at: string;
  steps: Step[];
}

export const History: React.FC = () => {
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";
  const token = localStorage.getItem("flowops_token");

  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");

  const [runs, setRuns] = useState<WorkflowRun[]>([]);
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null);

  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);

  const [logs, setLogs] = useState<string>("");
  const [loadingRuns, setLoadingRuns] = useState<boolean>(false);
  const [loadingJobs, setLoadingJobs] = useState<boolean>(false);
  const [loadingLogs, setLoadingLogs] = useState<boolean>(false);

  const [expandedJobId, setExpandedJobId] = useState<string | null>(null);

  // Utilisation de Refs pour éviter les boucles d'effets infinies pendant le polling
  const selectedRunIdRef = useRef<string | null>(null);
  const selectedJobIdRef = useRef<string | null>(null);

  useEffect(() => {
    selectedRunIdRef.current = selectedRunId;
  }, [selectedRunId]);

  useEffect(() => {
    selectedJobIdRef.current = selectedJobId;
  }, [selectedJobId]);

  // 1. Récupération de la liste des projets
  useEffect(() => {
    const loadProjects = async () => {
      try {
        const res = await fetch(`${API_URL}/api/projects`);
        if (res.ok) {
          const data = await res.json();
          setProjects(data);
          if (data.length > 0) {
            setSelectedProjectId(data[0].id);
          }
        }
      } catch (err) {
        console.error("Erreur chargement projets:", err);
      }
    };
    loadProjects();
  }, [API_URL]);

  // 2. Récupération des Runs
  const fetchRuns = useCallback(
    async (isBackground = false) => {
      if (!selectedProjectId || !token) return;
      if (!isBackground) setLoadingRuns(true);
      try {
        const res = await fetch(
          `${API_URL}/api/projects/${selectedProjectId}/runs`,
          { headers: { Authorization: `Bearer ${token}` } },
        );
        if (res.ok) {
          const data = await res.json();
          const fetchedRuns: WorkflowRun[] = data.runs || [];
          setRuns(fetchedRuns);

          // Si aucun run n'est sélectionné, on prend le premier par défaut
          if (fetchedRuns.length > 0 && !selectedRunIdRef.current) {
            setSelectedRunId(fetchedRuns[0].id);
          }
        }
      } catch (err) {
        console.error("Erreur chargement des runs:", err);
      } finally {
        if (!isBackground) setLoadingRuns(false);
      }
    },
    [API_URL, selectedProjectId, token],
  );

  // Réinitialiser les données lors du changement de projet
  useEffect(() => {
    setSelectedRunId(null);
    setSelectedJobId(null);
    setJobs([]);
    setLogs("");
    fetchRuns();
  }, [selectedProjectId, fetchRuns]);

  // 3. Récupération des Jobs
  const fetchJobs = useCallback(
    async (runId: string, isBackground = false) => {
      if (!selectedProjectId || !token || !runId) return;
      if (!isBackground) setLoadingJobs(true);
      try {
        const res = await fetch(
          `${API_URL}/api/projects/${selectedProjectId}/runs/${runId}/jobs`,
          { headers: { Authorization: `Bearer ${token}` } },
        );
        if (res.ok) {
          const data = await res.json();
          const fetchedJobs: Job[] = data.jobs || [];
          setJobs(fetchedJobs);

          // Sélectionne le premier job seulement si aucun job n'est encore sélectionné
          if (fetchedJobs.length > 0 && !selectedJobIdRef.current) {
            const firstJobId = fetchedJobs[0].id;
            setSelectedJobId(firstJobId);
            setExpandedJobId(firstJobId);
          }
        }
      } catch (err) {
        console.error("Erreur chargement des jobs:", err);
      } finally {
        if (!isBackground) setLoadingJobs(false);
      }
    },
    [API_URL, selectedProjectId, token],
  );

  // Charger les jobs dès que le runId sélectionné change
  useEffect(() => {
    if (selectedRunId) {
      setJobs([]);
      setSelectedJobId(null);
      setLogs("");
      fetchJobs(selectedRunId);
    }
  }, [selectedRunId, fetchJobs]);

  // 4. Récupération des Logs
  const fetchLogs = useCallback(
    async (runId: string, jobId: string, isBackground = false) => {
      if (!selectedProjectId || !token || !runId || !jobId) return;
      if (!isBackground) setLoadingLogs(true);
      try {
        const res = await fetch(
          `${API_URL}/api/projects/${selectedProjectId}/runs/${runId}/jobs/${jobId}/logs`,
          { headers: { Authorization: `Bearer ${token}` } },
        );
        if (res.ok) {
          const data = await res.json();
          setLogs(data.logs || "Aucun log disponible.");
        }
      } catch (err) {
        console.error("Erreur chargement des logs:", err);
      } finally {
        if (!isBackground) setLoadingLogs(false);
      }
    },
    [API_URL, selectedProjectId, token],
  );

  // Charger les logs dès que le jobId change
  useEffect(() => {
    if (selectedRunId && selectedJobId) {
      fetchLogs(selectedRunId, selectedJobId);
    }
  }, [selectedRunId, selectedJobId, fetchLogs]);

  // 5. Polling sécurisé en arrière-plan
  useEffect(() => {
    const currentRun = runs.find((r) => r.id === selectedRunId);
    const isRunning =
      currentRun &&
      (currentRun.status === "in_progress" || currentRun.status === "queued");

    if (!isRunning) return;

    const interval = setInterval(() => {
      if (selectedRunIdRef.current) {
        fetchRuns(true);
        fetchJobs(selectedRunIdRef.current, true);
        if (selectedJobIdRef.current) {
          fetchLogs(selectedRunIdRef.current, selectedJobIdRef.current, true);
        }
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [selectedRunId, runs, fetchRuns, fetchJobs, fetchLogs]);

  const selectedRun = runs.find((r) => r.id === selectedRunId);

  // Helper statut
  const renderStatusBadge = (status: string, conclusion: string | null) => {
    if (status === "in_progress" || status === "queued") {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200/60 animate-pulse">
          <Loader2 className="w-3 h-3 animate-spin" />
          {status === "queued" ? "En attente" : "En cours"}
        </span>
      );
    }
    if (conclusion === "success") {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
          Succès
        </span>
      );
    }
    if (conclusion === "failure") {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200/60">
          <XCircle className="w-3 h-3 text-rose-600" />
          Échec
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600">
        <Clock className="w-3 h-3" />
        {conclusion || status}
      </span>
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* HEADER ET SÉLECTEUR DE PROJET */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <h3 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Terminal className="w-5 h-5 text-purple-600" />
            Execution Logs & Monitoring
          </h3>
          <p className="text-xs text-slate-400">
            Suivi temps réel et conservation des journaux d'exécution GitHub
            Actions
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            className="p-2.5 text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-100"
          >
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                📁 {p.name}
              </option>
            ))}
          </select>

          <button
            onClick={() => fetchRuns(false)}
            disabled={loadingRuns}
            className="p-2.5 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-colors text-xs font-bold flex items-center gap-1.5"
            title="Rafraîchir"
          >
            <RefreshCw
              className={`w-4 h-4 ${loadingRuns ? "animate-spin" : ""}`}
            />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* COLONNE GAUCHE: RUNS (4 cols) */}
        <div className="lg:col-span-4 space-y-3">
          <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <PlayCircle className="w-4 h-4 text-slate-500" /> Runs récents
          </h4>

          {loadingRuns && runs.length === 0 ? (
            <div className="py-12 text-center">
              <Loader2 className="w-6 h-6 text-purple-600 animate-spin mx-auto mb-2" />
              <span className="text-xs text-slate-400">Chargement...</span>
            </div>
          ) : runs.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-2xl">
              Aucun workflow exécuté pour ce projet.
            </div>
          ) : (
            <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
              {runs.map((r) => {
                const isSelected = selectedRunId === r.id;
                return (
                  <div
                    key={r.id}
                    onClick={() => setSelectedRunId(r.id)}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                      isSelected
                        ? "border-purple-500 bg-purple-50/40 shadow-sm"
                        : "border-slate-100 hover:border-slate-200 bg-white"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <span className="text-xs font-black text-slate-800 line-clamp-1">
                        {r.name}
                      </span>
                      {renderStatusBadge(r.status, r.conclusion)}
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                      <span>
                        🌿 {r.branch} ({r.commit_sha})
                      </span>
                      <span>
                        {new Date(r.created_at).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* COLONNE DROITE: PANNEAU DÉTAILS ET LOGS (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          {selectedRun ? (
            <>
              {/* HEADER RUN */}
              <div className="p-4 bg-slate-900 text-white rounded-2xl flex flex-wrap items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-mono bg-slate-800 text-slate-300 px-2 py-0.5 rounded-md">
                      Run #{selectedRun.id}
                    </span>
                    <a
                      href={selectedRun.html_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] text-purple-400 hover:underline flex items-center gap-1"
                    >
                      GitHub <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                  <h4 className="text-sm font-bold">{selectedRun.name}</h4>
                </div>

                <div>
                  {renderStatusBadge(
                    selectedRun.status,
                    selectedRun.conclusion,
                  )}
                </div>
              </div>

              {/* JOBS ET ETAPES */}
              <div className="space-y-2">
                <h5 className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  <Layers className="w-3.5 h-3.5" /> Jobs & Étapes
                </h5>

                {loadingJobs && jobs.length === 0 ? (
                  <div className="py-6 text-center">
                    <Loader2 className="w-5 h-5 text-purple-600 animate-spin mx-auto" />
                  </div>
                ) : (
                  <div className="space-y-2">
                    {jobs.map((job) => {
                      const isExpanded = expandedJobId === job.id;
                      const isJobSelected = selectedJobId === job.id;

                      return (
                        <div
                          key={job.id}
                          className={`border rounded-xl overflow-hidden transition-all bg-white ${
                            isJobSelected
                              ? "border-purple-300 ring-2 ring-purple-100"
                              : "border-slate-200"
                          }`}
                        >
                          <div
                            onClick={() => {
                              setSelectedJobId(job.id);
                              setExpandedJobId(isExpanded ? null : job.id);
                            }}
                            className={`p-3 flex items-center justify-between cursor-pointer ${
                              isJobSelected
                                ? "bg-purple-50/30"
                                : "hover:bg-slate-50"
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              {isExpanded ? (
                                <ChevronDown className="w-4 h-4 text-slate-400" />
                              ) : (
                                <ChevronRight className="w-4 h-4 text-slate-400" />
                              )}
                              <span className="text-xs font-bold text-slate-800">
                                ⚙️ Job: {job.name}
                              </span>
                            </div>
                            {renderStatusBadge(job.status, job.conclusion)}
                          </div>

                          {isExpanded && job.steps && (
                            <div className="border-t border-slate-100 bg-slate-50/50 p-2 space-y-1">
                              {job.steps.map((step) => (
                                <div
                                  key={step.number}
                                  className="flex items-center justify-between px-3 py-1.5 rounded-lg text-[11px] font-mono text-slate-600 hover:bg-white"
                                >
                                  <span className="flex items-center gap-2">
                                    <span className="text-slate-400">
                                      #{step.number}
                                    </span>
                                    <span>{step.name}</span>
                                  </span>
                                  <span>
                                    {step.conclusion === "success" && (
                                      <span className="text-emerald-600 font-bold">
                                        ✓
                                      </span>
                                    )}
                                    {step.conclusion === "failure" && (
                                      <span className="text-rose-600 font-bold">
                                        ✗
                                      </span>
                                    )}
                                    {step.status === "in_progress" && (
                                      <Loader2 className="w-3 h-3 text-amber-500 animate-spin inline" />
                                    )}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* LOGS CONSOLE */}
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between">
                  <h5 className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    <Terminal className="w-3.5 h-3.5" /> Output Console
                  </h5>
                  {loadingLogs && (
                    <span className="text-[10px] font-mono text-purple-600 flex items-center gap-1">
                      <Loader2 className="w-3 h-3 animate-spin" /> Mise à
                      jour...
                    </span>
                  )}
                </div>

                <div className="bg-slate-950 text-slate-200 font-mono text-[11px] p-4 rounded-2xl max-h-[450px] overflow-y-auto leading-relaxed border border-slate-800 shadow-inner">
                  {loadingLogs && !logs ? (
                    <div className="py-8 text-center text-slate-500 flex items-center justify-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-purple-500" />
                      Chargement des logs depuis GitHub...
                    </div>
                  ) : logs ? (
                    <pre className="whitespace-pre-wrap break-all font-mono">
                      {logs}
                    </pre>
                  ) : (
                    <span className="text-slate-600 italic">
                      Cliquez sur un job ci-dessus pour charger ses logs...
                    </span>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="py-24 text-center text-slate-400 text-xs border border-dashed border-slate-200 rounded-2xl">
              Sélectionnez une exécution à gauche pour afficher ses détails et
              ses logs.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
