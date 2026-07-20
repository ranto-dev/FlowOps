import React, { useEffect, useRef, useState } from "react";
import { Terminal } from "xterm";
import { FitAddon } from "xterm-addon-fit";
import "xterm/css/xterm.css";
import {
  Terminal as TerminalIcon,
  Play,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";

export const History: React.FC = () => {
  const terminalRef = useRef<HTMLDivElement | null>(null);
  const xtermRef = useRef<Terminal | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  // États de contrôle du flux
  const [streamStatus, setStreamStatus] = useState<
    "idle" | "streaming" | "finished" | "error"
  >("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const lineCountRef = useRef(0); // Traque si on a reçu des données

  const demoProjectId = "6a5a53fe720b81e645ba37a9";
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

  useEffect(() => {
    if (!terminalRef.current) return;

    // Initialisation d'Xterm.js
    const term = new Terminal({
      cursorBlink: true,
      fontSize: 12,
      fontFamily: "Courier New, monospace",
      theme: {
        background: "#0f172a",
        foreground: "#f8fafc",
      },
    });

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    term.open(terminalRef.current);
    fitAddon.fit();

    term.writeln("\x1b[1;35m⚡ FlowOps Telemetry Engine Activated.\x1b[0m");
    term.writeln(
      "Click 'Stream Pipeline Logs' above to hook into the backend session.\r\n",
    );

    xtermRef.current = term;

    const handleResize = () => fitAddon.fit();
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      term.dispose();
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, []);

  // Gestion du stream SSE

  const startLogStream = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    lineCountRef.current = 0;
    setStreamStatus("streaming");
    setErrorMessage(null);

    xtermRef.current?.clear();
    xtermRef.current?.writeln(
      "\x1b[34mConnecting to live execution log pipe...\x1b[0m\r",
    );

    const source = new EventSource(
      `${API_URL}/api/projects/${demoProjectId}/logs/stream`,
    );
    eventSourceRef.current = source;

    // Écouteur pour les événements nommés "log_message"
    source.addEventListener("log_message", (event: MessageEvent) => {
      lineCountRef.current += 1;
      xtermRef.current?.writeln(event.data);
    });

    // Écouteur générique de secours
    source.onmessage = (event: MessageEvent) => {
      lineCountRef.current += 1;
      xtermRef.current?.writeln(event.data);
    };

    source.onerror = () => {
      source.close(); // Ferme le canal proprement

      if (lineCountRef.current > 0) {
        // Le flux s'est terminé après avoir affiché les logs = SUCCÈS
        setStreamStatus("finished");
        xtermRef.current?.writeln(
          "\r\n\x1b[1;32m[SUCCESS] Pipeline execution finished.\x1b[0m",
        );
      } else {
        // Aucune donnée reçue = Erreur 422/500/404 initiale
        setStreamStatus("error");
        setErrorMessage(
          "422 or Server Error: Verify backend function signature for project_id.",
        );
        xtermRef.current?.writeln(
          "\r\n\x1b[1;31m[ERROR] Failed to establish initial handshake with stream endpoint.\x1b[0m",
        );
      }
    };
  };

  const stopLogStream = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      xtermRef.current?.writeln(
        "\n\x1b[31m🛑 Stream connection manually closed by developer.\x1b[0m",
      );
    }
    setStreamStatus("idle");
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200 text-left">
      <div>
        <h3 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
          <TerminalIcon className="w-5 h-5 text-purple-600" /> Real-time
          Execution Logs
        </h3>
        <p className="text-xs text-slate-400">
          Stream production system outputs, test frameworks telemetry, and cloud
          deployments trees.
        </p>
      </div>

      {/* PANNEAU DE CONTRÔLE */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl border border-slate-100 bg-slate-50/50">
        <div className="flex items-center gap-3">
          {streamStatus !== "streaming" ? (
            <button
              onClick={startLogStream}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl flex items-center gap-2 transition-all uppercase tracking-wider"
            >
              <Play className="w-3.5 h-3.5 fill-white" /> Stream Pipeline Logs
            </button>
          ) : (
            <button
              onClick={stopLogStream}
              className="px-4 py-2 bg-red-50 text-red-600 border border-red-100 hover:bg-red-100 font-bold text-xs rounded-xl flex items-center gap-2 transition-all uppercase tracking-wider"
            >
              <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Disconnect
              Stream
            </button>
          )}
        </div>

        {/* INDICATEUR D'ÉTAT DYNAMIQUE */}
        <div className="text-xs font-mono font-bold">
          {streamStatus === "streaming" && (
            <span className="text-emerald-600 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>{" "}
              LIVE_STREAMING
            </span>
          )}
          {streamStatus === "finished" && (
            <span className="text-purple-600 flex items-center gap-1.5 bg-purple-50 px-2.5 py-1 rounded-md border border-purple-100">
              <CheckCircle className="w-3.5 h-3.5 text-purple-500" />{" "}
              PIPELINE_COMPLETED
            </span>
          )}
          {streamStatus === "error" && (
            <span className="text-red-500 flex items-center gap-1.5">
              🛑 STREAM_FAILED
            </span>
          )}
          {streamStatus === "idle" && (
            <span className="text-slate-400">IDLE</span>
          )}
        </div>
      </div>

      {/* ALERTES ERREURS SÉVÈRES */}
      {streamStatus === "error" && errorMessage && (
        <div className="p-3 bg-amber-50 border border-amber-200 text-amber-700 rounded-xl text-xs flex items-center gap-2 font-medium">
          <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />{" "}
          {errorMessage}
        </div>
      )}

      {/* L'ÉCRAN DU TERMINAL XTERM.JS */}
      <div className="p-4 bg-[#0f172a] rounded-2xl border border-slate-800 shadow-2xl relative">
        <div className="absolute top-3 right-4 flex gap-1.5 z-10">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500/40"></div>
          <div className="w-2.5 h-2.5 rounded-full bg-amber-500/40"></div>
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/40"></div>
        </div>
        <div
          ref={terminalRef}
          className="w-full min-h-[350px] font-mono text-xs overflow-hidden"
        />
      </div>
    </div>
  );
};
