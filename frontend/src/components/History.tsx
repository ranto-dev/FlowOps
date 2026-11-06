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
import { Button } from "./ui/Button";
import { Card } from "./ui/Card";
import { Select } from "./ui/Field";
import { EmptyState, LoadingState } from "./ui/States";
import { StatusBadge } from "./ui/StatusBadge";
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
          t("Projects unavailable"),
          errorDetail(err, t("The server may be down.")),
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
            t("Runs unavailable"),
            errorDetail(err, t("The server may be down.")),
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
            t("Jobs unavailable"),
            errorDetail(err, t("The server may be down.")),
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
            t("Logs unavailable"),
            errorDetail(err, t("The server may be down.")),
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
        className="flex items-start gap-3 rounded-md px-2 py-0.5 font-mono text-xs leading-relaxed transition-colors hover:bg-surface/60"
      >
        <span className="w-8 flex-none select-none text-right text-ink-subtle">
          {index + 1}
        </span>

        <span className="min-w-[55px] flex-none select-none font-medium">
          {level === "ERROR" && (
            <span className="rounded-md bg-danger/10 px-1 text-danger">
              [ERR]
            </span>
          )}
          {level === "WARN" && (
            <span className="rounded-md bg-warning/10 px-1 text-warning">
              [WRN]
            </span>
          )}
          {level === "SUCCESS" && (
            <span className="rounded-md bg-success/10 px-1 text-success">
              [OK]
            </span>
          )}
          {level === "INFO" && <span className="text-info">[INF]</span>}
          {level === "DEBUG" && (
            <span className="text-ink-subtle">[DBG]</span>
          )}
        </span>

        <span
          className={`flex-1 break-all ${
            level === "ERROR"
              ? "font-semibold text-danger"
              : level === "WARN"
                ? "text-warning"
                : level === "SUCCESS"
                  ? "text-success"
                  : "text-ink"
          }`}
        >
          {line}
        </span>
      </div>
    );
  };

  const formatDuration = (start: string | null, end: string | null) => {
    if (!start || !end) return null;
    const ms = new Date(end).getTime() - new Date(start).getTime();
    if (!Number.isFinite(ms) || ms < 0) return null;
    const totalSeconds = Math.round(ms / 1000);
    if (totalSeconds < 60) return `${totalSeconds}s`;
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}m ${seconds.toString().padStart(2, "0")}s`;
  };

  return (
    <div className="flex min-h-[30rem] flex-col overflow-hidden p-1">
      {/* BARRE SUPERIEURE FIXE */}
      <section
        aria-label={t("History filters")}
        className="mb-3 flex flex-none flex-col justify-end gap-3 glass rounded-lg border p-3 sm:flex-row sm:items-center"
      >
        <div className="flex items-center gap-2">
          <div className="relative">
            <FolderGit2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-subtle" />
            <Select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="pl-9 pr-3"
              aria-label={t("Select a project")}
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </Select>
          </div>

          <Button
            variant="secondary"
            onClick={() => {
              fetchRuns(false);
              if (selectedRunId) {
                fetchJobs(selectedRunId, false);
                if (selectedJobId)
                  fetchLogs(selectedRunId, selectedJobId, false);
              }
            }}
            disabled={loadingRuns || loadingJobs || loadingLogs}
            title={t("Refresh")}
            aria-label={t("Refresh")}
            className="px-2.5"
          >
            <RefreshCw
              className={`h-4 w-4 ${
                loadingRuns || loadingJobs ? "animate-spin" : ""
              }`}
            />
          </Button>
        </div>
      </section>
      {lastUpdatedAt && (
        <p className="mb-2 text-right text-xs text-ink-subtle" aria-live="polite">
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
        <div className="flex min-h-0 flex-1 flex-col">
          <div className="flex flex-none items-center justify-between pb-2">
            <h4 className="flex items-center gap-1.5 text-sm font-medium text-ink-muted">
              <PlayCircle className="h-4 w-4 text-accent-ink" />{" "}
              {t("Recent runs")} ({runs.length})
            </h4>
          </div>

          <div className="flex-1 overflow-y-auto pr-1">
            {loadingRuns && runs.length === 0 ? (
              <LoadingState label={t("Loading runs...")} />
            ) : runs.length === 0 ? (
              <EmptyState title={t("No workflow runs found.")} />
            ) : (
              <Card className="divide-y divide-line overflow-hidden">
                {runs.map((r) => (
                  <button
                    type="button"
                    key={r.id}
                    onClick={() => setSelectedRunId(r.id)}
                    className="group flex w-full cursor-pointer items-center justify-between gap-3 p-3 text-left transition-colors hover:bg-surface-2"
                  >
                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="truncate text-sm font-medium text-ink">
                          {r.name}
                        </span>
                        <span className="font-mono text-xs text-ink-subtle">
                          #{r.id}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 text-xs text-ink-muted">
                        {r.event && <span>{r.event}</span>}
                        <span className="flex items-center gap-1 truncate">
                          <GitBranch className="h-3 w-3" /> {r.branch}
                        </span>
                        <span className="truncate font-mono">
                          {r.commit_sha}
                        </span>
                        <span className="hidden items-center gap-1 md:flex">
                          <Calendar className="h-3 w-3" />
                          {new Date(r.created_at).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-none items-center gap-3">
                      <StatusBadge status={r.status} conclusion={r.conclusion} />
                      <ChevronRight className="h-4 w-4 text-ink-subtle transition-colors group-hover:text-accent-ink" />
                    </div>
                  </button>
                ))}
              </Card>
            )}
          </div>
        </div>
      ) : (
        /* ======================================================== */
        /* VUE 2 : DÉTAIL DU RUN (JOBS + CONSOLE DANS LE MÊME SCROLL) */
        /* ======================================================== */
        <div className="flex min-h-0 flex-1 flex-col space-y-3 overflow-y-auto pr-1">
          {/* EN-TÊTE DU RUN */}
          <Card className="flex flex-none items-center justify-between gap-3 p-3">
            <div className="flex min-w-0 items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSelectedRunId(null);
                  setSelectedJobId(null);
                  setJobs([]);
                  setLogs("");
                  setLogMessage(null);
                }}
                className="flex-none"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                {t("Back to runs")}
              </Button>

              <div className="h-5 w-px flex-none bg-line" />

              <div className="space-y-0.5 truncate">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs text-ink-subtle">
                    #{selectedRun?.id}
                  </span>
                  <h4 className="truncate text-sm font-medium text-ink">
                    {selectedRun?.name}
                  </h4>
                </div>
                <p className="truncate text-xs text-ink-muted">
                  {t("Branch")}: <span className="text-ink">{selectedRun?.branch}</span>{" "}
                  | {t("Commit")}:{" "}
                  <span className="font-mono text-ink">
                    {selectedRun?.commit_sha}
                  </span>
                </p>
              </div>
            </div>

            <div className="flex flex-none items-center gap-2">
              {selectedRun && (
                <StatusBadge
                  status={selectedRun.status}
                  conclusion={selectedRun.conclusion}
                />
              )}
              {selectedRun?.html_url && (
                <a
                  href={selectedRun.html_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-md p-1.5 text-accent-ink transition-colors hover:bg-surface-2"
                  title={t("Open on GitHub")}
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
              )}
            </div>
          </Card>

          {/* SECTION JOBS : LISTE EN COLONNE (HAUT EN BAS) */}
          <Card className="flex flex-none flex-col gap-2 p-3">
            <h5 className="flex items-center gap-1.5 text-sm font-medium text-ink-muted">
              <Layers className="h-4 w-4 text-accent-ink" /> {t("Jobs and steps")} (
              {jobs.length})
            </h5>

            <div className="space-y-3">
              {loadingJobs && jobs.length === 0 ? (
                <LoadingState label={t("Loading jobs...")} />
              ) : (
                jobs.map((job) => {
                  const isJobSelected = selectedJobId === job.id;
                  const jobDuration = formatDuration(
                    job.started_at,
                    job.completed_at,
                  );

                  return (
                    <div
                      key={job.id}
                      className={`rounded-md border bg-surface-2/50 p-3 transition-colors ${
                        isJobSelected
                          ? "border-accent/30 bg-accent/15"
                          : "border-line hover:border-line-strong"
                      }`}
                    >
                      {/* Header du Job */}
                      <button
                        type="button"
                        onClick={() => setSelectedJobId(job.id)}
                        className="mb-3 flex w-full cursor-pointer items-center justify-between border-b border-line pb-2 text-left"
                      >
                        <div className="flex items-center gap-2">
                          <Cog className="h-3.5 w-3.5 text-ink-subtle" />
                          <span className="text-sm font-medium text-ink">
                            {job.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          {jobDuration && (
                            <span className="font-mono text-xs text-ink-muted">
                              {jobDuration}
                            </span>
                          )}
                          <StatusBadge
                            status={job.status}
                            conclusion={job.conclusion}
                          />
                        </div>
                      </button>

                      {/* ÉTAPES EN COLONNE (De haut en bas) */}
                      {job.steps && job.steps.length > 0 && (
                        <div className="relative ml-1.5 space-y-1 border-l-2 border-line pl-3">
                          {job.steps.map((step) => {
                            const isSuccess = step.conclusion === "success";
                            const isFailure = step.conclusion === "failure";
                            const isInProgress = step.status === "in_progress";
                            const stepDuration = formatDuration(
                              step.started_at,
                              step.completed_at,
                            );

                            return (
                              <div
                                key={step.number}
                                className={`flex items-center justify-between rounded-md px-3 py-1.5 font-mono text-xs ${
                                  isFailure
                                    ? "bg-danger/10 text-danger"
                                    : isInProgress
                                      ? "bg-info/10 text-info"
                                      : isSuccess
                                        ? "text-ink"
                                        : "text-ink-subtle"
                                }`}
                              >
                                {/* Numéro & Nom de l'étape */}
                                <div className="flex min-w-0 items-center gap-2 pr-2">
                                  <span className="flex-none text-ink-subtle">
                                    #{step.number}
                                  </span>
                                  <span className="truncate" title={step.name ?? undefined}>
                                    {step.name}
                                  </span>
                                </div>

                                {/* Durée et état à droite */}
                                <div className="flex flex-none items-center gap-2">
                                  {stepDuration && (
                                    <span className="text-ink-muted">
                                      {stepDuration}
                                    </span>
                                  )}
                                  {isSuccess && (
                                    <CheckCircle2 className="h-3.5 w-3.5 text-success" />
                                  )}
                                  {isFailure && (
                                    <XCircle className="h-3.5 w-3.5 text-danger" />
                                  )}
                                  {isInProgress && (
                                    <Loader2 className="h-3.5 w-3.5 animate-spin text-info" />
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
          </Card>

          {/* SECTION CONSOLE TERMINAL */}
          <div className="flex min-h-[450px] flex-none flex-col overflow-hidden rounded-lg border border-line bg-code">
            {/* Header Terminal */}
            <div className="flex flex-none items-center justify-between border-b border-line bg-surface px-3 py-2">
              <span className="flex items-center gap-1.5 font-mono text-xs text-ink-muted">
                <Terminal className="h-3.5 w-3.5 text-accent-ink" /> bash -
                execution.log
              </span>

              <div className="flex items-center gap-2">
                {loadingLogs && (
                  <span className="flex items-center gap-1 font-mono text-xs text-ink-muted">
                    <Loader2 className="h-3 w-3 animate-spin" /> {t("Loading logs...")}
                  </span>
                )}

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={scrollToBottom}
                  className="px-2"
                  title={t("Scroll to bottom")}
                  aria-label={t("Scroll to bottom")}
                >
                  <ArrowDownCircle className="h-3.5 w-3.5" />
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCopyLogs}
                  disabled={!logs}
                  title={t("Copy logs")}
                >
                  {copied ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-success" />
                      <span className="text-success">{t("Copied")}</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" />
                      <span>{t("Copy")}</span>
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Zone de Contenu du Log */}
            <div
              ref={consoleContainerRef}
              className="max-h-[500px] flex-1 select-text overflow-y-auto bg-code p-2 font-mono text-ink [scrollbar-color:var(--color-line-strong)_transparent] [scrollbar-width:thin]"
            >
              {loadingLogs && !logs ? (
                <div className="flex h-40 items-center justify-center gap-2 text-sm text-ink-muted">
                  <Loader2 className="h-4 w-4 animate-spin text-accent-ink" />
                  {t("Loading job logs...")}
                </div>
              ) : logMessage ? (
                <div className="flex min-h-40 items-center justify-center px-6 text-center text-sm text-ink-muted">
                  {logMessage}
                </div>
              ) : logs ? (
                <div className="py-1">
                  {logs
                    .split("\n")
                    .map((line, idx) => renderFormattedLogLine(line, idx))}
                </div>
              ) : (
                <div className="flex h-40 items-center justify-center text-sm text-ink-muted">
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
