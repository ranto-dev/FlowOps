import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  PlayCircle,
  CheckCircle2,
  XCircle,
  Loader2,
  RefreshCw,
  Terminal,
  ChevronRight,
  ExternalLink,
  Layers,
  ArrowLeft,
  Calendar,
  GitBranch,
  Copy,
  Check,
  ArrowDownCircle,
  FolderGit2,
  Cog,
} from "lucide-react";
import { Badge } from "./ui/Badge";
import { apiFetch, errorDetail, getToken, isApiError } from "../lib/api";
import { useToast } from "./ui/useToast";
import { usePreferences } from "../lib/usePreferences";
import type {
  JobListResponse,
  LogsResponse,
  Project,
  RunJob as Job,
  RunListResponse,
  WorkflowRun,
} from "../@types/api";

export const History: React.FC = () => {
  const toast = useToast();
  const { t, language } = usePreferences();

  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");

  const [runs, setRuns] = useState<WorkflowRun[]>([]);
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null);

  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);

  const [logs, setLogs] = useState<string>("");
  const [logMessage, setLogMessage] = useState<string | null>(null);
  const [loadingRuns, setLoadingRuns] = useState<boolean>(false);
  const [loadingJobs, setLoadingJobs] = useState<boolean>(false);
  const [loadingLogs, setLoadingLogs] = useState<boolean>(false);

  const [copied, setCopied] = useState(false);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<Date | null>(null);

  const selectedRunIdRef = useRef<string | null>(null);
  const selectedJobIdRef = useRef<string | null>(null);
  const consoleContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    selectedRunIdRef.current = selectedRunId;
  }, [selectedRunId]);

  useEffect(() => {
    selectedJobIdRef.current = selectedJobId;
  }, [selectedJobId]);

  // Auto-scroll en bas de la console
  useEffect(() => {
    if (consoleContainerRef.current) {
      consoleContainerRef.current.scrollTop =
        consoleContainerRef.current.scrollHeight;
    }
  }, [logs]);

  // 1. Chargement des projets
  useEffect(() => {
    const loadProjects = async () => {
      try {
        const data = await apiFetch<Project[]>("/api/projects");
        setProjects(data);
        if (data.length > 0) setSelectedProjectId(data[0].id);
      } catch (err) {
        // Un 401 a déjà déclenché la déconnexion centralisée dans apiFetch :
        // on ne remonte pas d'erreur par-dessus la redirection.
        if (isApiError(err) && err.status === 401) return;
        console.error("Erreur chargement projets:", err);
        toast.error(
          "Projets indisponibles",
          errorDetail(err, "Le serveur est peut-être arrêté."),
        );
      }
    };
    loadProjects();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 2. Chargement des Runs
  const fetchRuns = useCallback(
    async (isBackground = false) => {
      if (!selectedProjectId || !getToken()) return;
      if (!isBackground) setLoadingRuns(true);
      try {
        const data = await apiFetch<RunListResponse>(
          `/api/projects/${selectedProjectId}/runs`,
        );
        const fetchedRuns: WorkflowRun[] = data.runs || [];
        const uniqueRuns = Array.from(
          new Map(fetchedRuns.map((run) => [String(run.id), run])).values(),
        );
        setRuns(uniqueRuns);
        setLastUpdatedAt(new Date());
      } catch (err) {
        if (isApiError(err) && err.status === 401) return;
        console.error("Erreur chargement des runs:", err);
        if (!isBackground) {
          toast.error(
            "Exécutions indisponibles",
            errorDetail(err, "Le serveur est peut-être arrêté."),
          );
        }
      } finally {
        if (!isBackground) setLoadingRuns(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [selectedProjectId],
  );

  useEffect(() => {
    setSelectedRunId(null);
    setSelectedJobId(null);
    setJobs([]);
    setLogs("");
    setLogMessage(null);
    fetchRuns();
  }, [selectedProjectId, fetchRuns]);

  // 3. Chargement des Jobs
  const fetchJobs = useCallback(
    async (runId: string, isBackground = false) => {
      if (!selectedProjectId || !getToken() || !runId) return;
      if (!isBackground) setLoadingJobs(true);
      try {
        const data = await apiFetch<JobListResponse>(
          `/api/projects/${selectedProjectId}/runs/${runId}/jobs`,
        );
        const fetchedJobs: Job[] = data.jobs || [];
        const uniqueJobs = Array.from(
          new Map(fetchedJobs.map((job) => [String(job.id), job])).values(),
        );
        setJobs(uniqueJobs);

        if (uniqueJobs.length > 0 && !selectedJobIdRef.current) {
          const firstJobId = uniqueJobs[0].id;
          setSelectedJobId(firstJobId);
        }
      } catch (err) {
        if (isApiError(err) && err.status === 401) return;
        console.error("Erreur chargement des jobs:", err);
        if (!isBackground) {
          toast.error(
            "Jobs indisponibles",
            errorDetail(err, "Le serveur est peut-être arrêté."),
          );
        }
      } finally {
        if (!isBackground) setLoadingJobs(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [selectedProjectId],
  );

  useEffect(() => {
    if (selectedRunId) {
      setJobs([]);
      setSelectedJobId(null);
      setLogs("");
      setLogMessage(null);
      fetchJobs(selectedRunId);
    }
  }, [selectedRunId, fetchJobs]);

  // 4. Chargement des Logs
  const fetchLogs = useCallback(
    async (runId: string, jobId: string, isBackground = false) => {
      if (!selectedProjectId || !getToken() || !runId || !jobId) return;
      if (!isBackground) setLoadingLogs(true);
      try {
        const data = await apiFetch<LogsResponse>(
          `/api/projects/${selectedProjectId}/runs/${runId}/jobs/${jobId}/logs`,
        );
        setLogs(data.logs);
        setLogMessage(
          data.available === false
            ? t("Job logs are not available yet.")
            : null,
        );
      } catch (err) {
        if (isApiError(err) && err.status === 401) return;
        console.error("Erreur chargement des logs:", err);
        if (!isBackground) {
          toast.error(
            "Logs indisponibles",
            errorDetail(err, "Le serveur est peut-être arrêté."),
          );
        }
      } finally {
        if (!isBackground) setLoadingLogs(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [selectedProjectId, t],
  );

  useEffect(() => {
    if (selectedRunId && selectedJobId) {
      fetchLogs(selectedRunId, selectedJobId);
    }
  }, [selectedRunId, selectedJobId, fetchLogs]);

  // Rafraîchit périodiquement les exécutions actives, sans polling en arrière-plan.
  useEffect(() => {
    const currentRun = runs.find((r) => r.id === selectedRunId);
    const isRunning =
      currentRun &&
      (currentRun.status === "in_progress" || currentRun.status === "queued");

    if (!isRunning) return;

    const interval = setInterval(() => {
      if (
        document.visibilityState === "visible" &&
        selectedRunIdRef.current
      ) {
        fetchRuns(true);
        fetchJobs(selectedRunIdRef.current, true);
        if (selectedJobIdRef.current) {
          fetchLogs(selectedRunIdRef.current, selectedJobIdRef.current, true);
        }
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [selectedRunId, runs, fetchRuns, fetchJobs, fetchLogs]);

  const selectedRun = runs.find((r) => r.id === selectedRunId);

  const handleCopyLogs = async () => {
    if (!logs) return;
    try {
      await navigator.clipboard.writeText(logs);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Impossible de copier les logs", error);
      toast.error(
        t("Could not copy logs"),
        t("Your browser did not allow clipboard access."),
      );
    }
  };

  const scrollToBottom = () => {
    if (consoleContainerRef.current) {
      consoleContainerRef.current.scrollTo({
        top: consoleContainerRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  };

  const renderFormattedLogLine = (line: string, index: number) => {
    let level = "INFO";
    const upperLine = line.toUpperCase();

    if (
      upperLine.includes("ERROR") ||
      upperLine.includes("FAIL") ||
      upperLine.includes("FATAL")
    ) {
      level = "ERROR";
    } else if (upperLine.includes("WARN") || upperLine.includes("WARNING")) {
      level = "WARN";
    } else if (
      upperLine.includes("SUCCESS") ||
      upperLine.includes("PASSED") ||
      upperLine.includes("OK")
    ) {
      level = "SUCCESS";
    } else if (upperLine.includes("DEBUG")) {
      level = "DEBUG";
    }

    return (
      <div
        key={index}
        className="flex items-start gap-3 hover:bg-slate-900/60 px-2 py-0.5 rounded transition-colors font-mono text-[11px] leading-relaxed group"
      >
        <span className="w-8 flex-none text-right text-slate-600 select-none text-[10px]">
          {index + 1}
        </span>

        <span className="flex-none font-bold select-none min-w-[55px]">
          {level === "ERROR" && (
            <span className="text-rose-400 bg-rose-950/60 px-1 rounded">
              [ERR]
            </span>
          )}
          {level === "WARN" && (
            <span className="text-amber-400 bg-amber-950/60 px-1 rounded">
              [WRN]
            </span>
          )}
          {level === "SUCCESS" && (
            <span className="text-emerald-400 bg-emerald-950/60 px-1 rounded">
              [OK]
            </span>
          )}
          {level === "INFO" && <span className="text-sky-400">[INF]</span>}
          {level === "DEBUG" && <span className="text-slate-500">[DBG]</span>}
        </span>

        <span
          className={`flex-1 break-all ${
            level === "ERROR"
              ? "text-rose-300 font-semibold"
              : level === "WARN"
                ? "text-amber-200"
                : level === "SUCCESS"
                  ? "text-emerald-300"
                  : "text-slate-300"
          }`}
        >
          {line}
        </span>
      </div>
    );
  };

  const renderStatusBadge = (status: string, conclusion: string | null) => {
    if (status === "in_progress" || status === "queued") {
      return (
        <Badge tone="amber" dot>
          <Loader2 className="w-3 h-3 animate-spin" />
          {status === "queued" ? t("Queued") : t("Running")}
        </Badge>
      );
    }
    if (conclusion === "success") {
      return (
        <Badge tone="green" dot>
          <CheckCircle2 className="w-3 h-3" /> {t("Succeeded")}
        </Badge>
      );
    }
    if (conclusion === "failure") {
      return (
        <Badge tone="red" dot>
          <XCircle className="w-3 h-3" /> {t("Failed")}
        </Badge>
      );
    }
    return (
      <Badge tone="neutral" dot>
        {conclusion || status}
      </Badge>
    );
  };

  return (
    <div className="flex flex-col h-[calc(100vh-5rem)] max-h-screen overflow-hidden p-1">
      {/* BARRE SUPERIEURE FIXE */}
      <div className="flex-none flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3 mb-3">
        <div>
          <h3 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Terminal className="w-5 h-5 text-purple-600" />
            {t("Workflow runs")}
          </h3>
          <p className="text-[11px] text-slate-400">
            {t("Run history and available job logs")}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <FolderGit2 className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="pl-9 pr-3 py-2 text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-100"
              aria-label={t("Select a project")}
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => {
              fetchRuns(false);
              if (selectedRunId) {
                fetchJobs(selectedRunId, false);
                if (selectedJobId)
                  fetchLogs(selectedRunId, selectedJobId, false);
              }
            }}
            disabled={loadingRuns || loadingJobs || loadingLogs}
            className="p-2 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-colors text-xs font-bold flex items-center gap-1"
            title={t("Refresh")}
          >
            <RefreshCw
              className={`w-4 h-4 ${
                loadingRuns || loadingJobs ? "animate-spin" : ""
              }`}
            />
          </button>
        </div>
      </div>
      {lastUpdatedAt && (
        <p className="mb-2 text-right text-[10px] text-slate-400" aria-live="polite">
          {t("Updated")}{" "}
          {lastUpdatedAt.toLocaleTimeString(language, {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
      )}

      {/* ======================================================== */}
      {/* VUE 1 : LISTE DE TOUS LES RUNS                           */}
      {/* ======================================================== */}
      {!selectedRunId ? (
        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex-none flex items-center justify-between pb-2">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <PlayCircle className="w-4 h-4 text-purple-600" /> {t("Recent runs")} (
              {runs.length})
            </h4>
          </div>

          <div className="flex-1 overflow-y-auto pr-1 space-y-2">
            {loadingRuns && runs.length === 0 ? (
              <div className="h-full flex items-center justify-center bg-white rounded-2xl border border-slate-100">
                <div className="text-center">
                  <Loader2 className="w-7 h-7 text-purple-600 animate-spin mx-auto mb-2" />
                  <p className="text-xs text-slate-500 font-medium">
                    {t("Loading runs...")}
                  </p>
                </div>
              </div>
            ) : runs.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
                {t("No workflow runs found.")}
              </div>
            ) : (
              runs.map((r) => (
                <button
                  type="button"
                  key={r.id}
                  onClick={() => setSelectedRunId(r.id)}
                  className="w-full p-3 text-left rounded-xl border border-slate-200 hover:border-purple-400 bg-white hover:shadow-sm transition-all cursor-pointer group flex items-center justify-between gap-3"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900 group-hover:text-purple-600 transition-colors truncate">
                        {r.name}
                      </span>
                      <span className="text-[10px] font-mono bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">
                        #{r.id}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-[11px] text-slate-500 font-mono">
                      <span className="flex items-center gap-1 text-slate-700 font-semibold truncate">
                        <GitBranch className="w-3 h-3 text-purple-500" />{" "}
                        {r.branch}
                      </span>
                      <span className="truncate">sha: {r.commit_sha}</span>
                      <span className="hidden md:flex items-center gap-1 text-slate-400">
                        <Calendar className="w-3 h-3" />
                        {new Date(r.created_at).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 flex-none">
                    {renderStatusBadge(r.status, r.conclusion)}
                    <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-purple-600 group-hover:translate-x-0.5 transition-all" />
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      ) : (
        /* ======================================================== */
        /* VUE 2 : DÉTAIL DU RUN (JOBS + CONSOLE DANS LE MÊME SCROLL) */
        /* ======================================================== */
        <div className="flex-1 flex flex-col min-h-0 overflow-y-auto pr-1 space-y-3">
          {/* HEADER BLANC DE RETOUR */}
          <div className="flex-none flex items-center justify-between gap-3 bg-white border border-slate-200 p-3 rounded-xl shadow-xs">
            <div className="flex items-center gap-3 min-w-0">
              <button
                onClick={() => {
                  setSelectedRunId(null);
                  setSelectedJobId(null);
                  setJobs([]);
                  setLogs("");
                  setLogMessage(null);
                }}
                className="flex-none px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-purple-50 text-slate-700 hover:text-purple-700 border border-slate-200 hover:border-purple-200 text-xs font-bold transition-all flex items-center gap-1.5"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                {t("Back to runs")}
              </button>

              <div className="h-5 w-px bg-slate-200 flex-none" />

              <div className="truncate space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono bg-purple-50 text-purple-700 border border-purple-200 px-1.5 py-0.5 rounded font-bold">
                    #{selectedRun?.id}
                  </span>
                  <h4 className="text-xs font-bold text-slate-900 truncate">
                    {selectedRun?.name}
                  </h4>
                </div>
                <p className="text-[10px] text-slate-400 font-mono truncate">
                  {t("Branch")}:{" "}
                  <span className="text-slate-600">{selectedRun?.branch}</span>{" "}
                  | {t("Commit")}:{" "}
                  <span className="text-slate-600">
                    {selectedRun?.commit_sha}
                  </span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-none">
              {selectedRun &&
                renderStatusBadge(selectedRun.status, selectedRun.conclusion)}
              {selectedRun?.html_url && (
                <a
                  href={selectedRun.html_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 text-slate-400 hover:text-purple-600 rounded-lg hover:bg-slate-50 transition-colors"
                  title={t("Open on GitHub")}
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              )}
            </div>
          </div>

          {/* SECTION JOBS : LISTE EN COLONNE (HAUT EN BAS) */}
          <div className="flex-none bg-white border border-slate-200 rounded-xl p-3 flex flex-col gap-2">
            <h5 className="text-[11px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <Layers className="w-3.5 h-3.5 text-purple-600" /> {t("Jobs and steps")} (
              {jobs.length})
            </h5>

            <div className="space-y-3">
              {loadingJobs && jobs.length === 0 ? (
                <div className="py-4 text-center">
                  <Loader2 className="w-5 h-5 text-purple-600 animate-spin mx-auto mb-1" />
                  <span className="text-[11px] text-slate-400">
                    {t("Loading jobs...")}
                  </span>
                </div>
              ) : (
                jobs.map((job) => {
                  const isJobSelected = selectedJobId === job.id;

                  return (
                    <div
                      key={job.id}
                      className={`border rounded-xl p-3 bg-white transition-all ${
                        isJobSelected
                          ? "border-purple-300 ring-2 ring-purple-100 shadow-xs"
                          : "border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      {/* Header du Job */}
                      <button
                        type="button"
                        onClick={() => setSelectedJobId(job.id)}
                        className="w-full text-left flex items-center justify-between cursor-pointer mb-3 pb-2 border-b border-slate-100"
                      >
                        <div className="flex items-center gap-2">
                          <Cog className="w-3.5 h-3.5 text-slate-400" />
                          <span className="font-extrabold text-slate-800 text-xs">
                            {job.name}
                          </span>
                        </div>
                        {renderStatusBadge(job.status, job.conclusion)}
                      </button>

                      {/* ÉTAPES EN COLONNE (De haut en bas) */}
                      {job.steps && job.steps.length > 0 && (
                        <div className="relative pl-3 space-y-1.5 border-l-2 border-slate-100 ml-1.5">
                          {job.steps.map((step) => {
                            const isSuccess = step.conclusion === "success";
                            const isFailure = step.conclusion === "failure";
                            const isInProgress = step.status === "in_progress";

                            return (
                              <div
                                key={step.number}
                                className={`flex items-center justify-between px-3 py-1.5 rounded-lg border text-xs font-mono transition-all ${
                                  isFailure
                                    ? "bg-rose-50 border-rose-200 text-rose-800 font-semibold"
                                    : isInProgress
                                      ? "bg-amber-50 border-amber-300 text-amber-800 animate-pulse"
                                      : isSuccess
                                        ? "bg-slate-50/50 border-slate-200 text-slate-700"
                                        : "bg-slate-100/40 border-slate-200 text-slate-400"
                                }`}
                              >
                                {/* Numéro & Nom de l'étape */}
                                <div className="flex items-center gap-2 min-w-0 pr-2">
                                  <span className="text-slate-400 font-bold text-[11px] flex-none">
                                    #{step.number}
                                  </span>
                                  <span className="truncate" title={step.name ?? undefined}>
                                    {step.name}
                                  </span>
                                </div>

                                {/* Statut simple à droite */}
                                <div className="flex-none">
                                  {isSuccess && (
                                    <span className="inline-flex items-center justify-center w-4 h-4 bg-emerald-100 text-emerald-600 rounded-full text-[10px] font-black">
                                      ✓
                                    </span>
                                  )}
                                  {isFailure && (
                                    <span className="inline-flex items-center justify-center w-4 h-4 bg-rose-100 text-rose-600 rounded-full text-[10px] font-black">
                                      ✗
                                    </span>
                                  )}
                                  {isInProgress && (
                                    <Loader2 className="w-3.5 h-3.5 text-amber-600 animate-spin" />
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* SECTION CONSOLE TERMINAL */}
          <div className="flex-none min-h-[450px] flex flex-col bg-slate-950 rounded-xl border border-slate-800 overflow-hidden shadow-2xl">
            {/* Header Terminal */}
            <div className="flex-none px-3 py-2 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
                </div>
                <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5 text-purple-400" /> bash -
                  execution.log
                </span>
              </div>

              <div className="flex items-center gap-2">
                {loadingLogs && (
                  <span className="text-[10px] font-mono text-purple-400 flex items-center gap-1 bg-purple-950/50 px-2 py-0.5 rounded border border-purple-800/50">
                    <Loader2 className="w-3 h-3 animate-spin" /> {t("Loading logs...")}
                  </span>
                )}

                <button
                  onClick={scrollToBottom}
                  className="p-1 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded transition-colors"
                  title={t("Scroll to bottom")}
                >
                  <ArrowDownCircle className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={handleCopyLogs}
                  disabled={!logs}
                  className="p-1 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded transition-colors flex items-center gap-1 text-[10px] font-mono"
                  title={t("Copy logs")}
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">{t("Copied")}</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>{t("Copy")}</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Zone de Contenu du Log */}
            <div
              ref={consoleContainerRef}
              className="flex-1 overflow-y-auto max-h-[500px] p-2 bg-slate-950 font-mono text-slate-300 select-text scrollbar-thin scrollbar-thumb-slate-800"
            >
              {loadingLogs && !logs ? (
                <div className="h-40 flex items-center justify-center text-slate-500 gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-purple-500" />
                  {t("Loading job logs...")}
                </div>
              ) : logMessage ? (
                <div className="flex min-h-40 items-center justify-center px-6 text-center text-xs text-slate-400">
                  {logMessage}
                </div>
              ) : logs ? (
                <div className="py-1">
                  {logs
                    .split("\n")
                    .map((line, idx) => renderFormattedLogLine(line, idx))}
                </div>
              ) : (
                <div className="h-40 flex items-center justify-center text-slate-600 italic text-xs">
                  {t("Select a job above to view its logs.")}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
