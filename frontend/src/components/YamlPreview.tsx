import React from "react";
import {
  Plus,
  RefreshCcw,
  Save,
  FileCode,
  Copy,
  Check,
  CheckCircle,
} from "lucide-react";
import type { VirtualFile } from "../@types/workflow";
import type { PredictionSnapshot } from "../@types/api";
import { usePreferences } from "../lib/usePreferences";
import { Button } from "./ui/Button";
import { CodeSurface } from "./ui/CodeSurface";

interface YamlPreviewProps {
  activeFile: VirtualFile;
  loading: boolean;
  onNewWorkflow: () => void;
  onReconfigure: () => void;
  onSaveToServer: () => void;
  saveStatus: string | null;
  prediction: PredictionSnapshot;
}

export const YamlPreview: React.FC<YamlPreviewProps> = ({
  activeFile,
  loading,
  onNewWorkflow,
  onReconfigure,
  onSaveToServer,
  saveStatus,
  prediction,
}) => {
  const { t } = usePreferences();
  const [copied, setCopied] = React.useState(false);

  const copyToClipboard = () => {
    if (activeFile.yaml) {
      navigator.clipboard.writeText(activeFile.yaml);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Découpage du code YAML en lignes pour la numérotation
  const yamlLines = activeFile.yaml ? activeFile.yaml.split("\n") : [];
  // Supprime la dernière ligne vide si nécessaire pour éviter un numéro fantôme
  if (yamlLines.length > 1 && yamlLines[yamlLines.length - 1] === "") {
    yamlLines.pop();
  }
  const failurePercentage =
    prediction.prediction?.failure_percentage ??
    (prediction.prediction?.failure_probability != null
      ? prediction.prediction.failure_probability * 100
      : null);

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-4 text-left">
      <div className="glass divide-y divide-line rounded-lg border">
      {/* BARRE DE CONTRÔLE SUPÉRIEURE */}
      <div className="flex flex-col justify-between gap-3 px-4 py-3 sm:flex-row sm:items-center">
        <span className="flex items-center gap-2 font-mono text-xs text-ink">
          <FileCode className="h-4 w-4 text-accent-ink" />
          {activeFile.filename || "production-pipeline.yaml"}
        </span>

        {/* LES TROIS BOUTONS */}
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={onNewWorkflow}
            disabled={loading}
          >
            <Plus className="h-3.5 w-3.5" />
            {t("New workflow")}
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={onReconfigure}
            disabled={loading}
          >
            <RefreshCcw className="h-3.5 w-3.5" />
            {t("Reconfigure")}
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={onSaveToServer}
            loading={loading}
          >
            {!loading && <Save className="h-3.5 w-3.5" />}
            {t("Save workflow")}
          </Button>
        </div>
      </div>

      <div
        className="flex flex-wrap items-center gap-x-3 gap-y-2 px-4 py-3 text-sm tabular-nums text-ink"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        <span className="font-medium text-ink-muted">
          {t(PREDICTION_STATUS_LABELS[prediction.status])}
        </span>
        {prediction.status === "error" && prediction.error && (
          <span className="text-danger" title={prediction.error}>
            {prediction.error}
          </span>
        )}
        <span>
          {t("Estimated duration")}:{" "}
          <strong className="font-mono font-semibold">
            {prediction.prediction?.duration_seconds != null &&
            Number.isFinite(prediction.prediction.duration_seconds)
              ? `${Math.round(prediction.prediction.duration_seconds)}s`
              : "—"}
          </strong>
        </span>
        <span className="text-ink-subtle" aria-hidden="true">|</span>
        <span>
          {t("Failure risk")}:{" "}
          <strong className="font-mono font-semibold">
            {failurePercentage != null && Number.isFinite(failurePercentage)
              ? `${Math.round(failurePercentage)}%`
              : "—"}
          </strong>
        </span>
      </div>
      </div>

      {/* CODE SOURCE AVEC NUMÉROTATION DE LIGNES (opaque) */}
      <div className="relative min-h-[450px]">
        {saveStatus && (
          <div className="mb-4 flex items-center gap-2 rounded-md border border-success/30 bg-success/10 p-3 text-xs font-medium text-success">
            <CheckCircle className="h-4 w-4" /> {saveStatus}
          </div>
        )}

        <Button
          variant="secondary"
          size="sm"
          onClick={copyToClipboard}
          className="absolute right-3 top-3 z-10"
          title="Copier le code"
          aria-label="Copier le code"
        >
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5 text-success" /> Copied!
            </>
          ) : (
            <Copy className="h-3.5 w-3.5" />
          )}
        </Button>

        {activeFile.yaml ? (
          <CodeSurface className="max-h-[600px] select-text text-xs">
            <code className="block">
              {yamlLines.map((line, index) => (
                <span key={index} className="flex">
                  <span className="w-10 shrink-0 select-none pr-4 text-right text-ink-subtle">
                    {index + 1}
                  </span>
                  <span className="whitespace-pre">{highlight(line)}</span>
                </span>
              ))}
            </code>
          </CodeSurface>
        ) : (
          <div className="flex items-center justify-center py-20 text-center text-sm text-ink-muted">
            Génération du flux en cours...
          </div>
        )}
      </div>
    </div>
  );
};

const PREDICTION_STATUS_LABELS: Record<PredictionSnapshot["status"], string> = {
  pending: "Prediction pending",
  available: "Predictions available",
  partial: "Some predictions unavailable",
  unavailable: "Predictions unavailable",
  error: "Prediction service error",
};

/** Coloration minimale d'une ligne YAML avec les tokens du thème. */
const highlight = (line: string): React.ReactNode => {
  if (!line) return " ";
  if (line.trimStart().startsWith("#")) {
    return <span className="text-ink-muted">{line}</span>;
  }
  const m = line.match(/^(\s*(?:- )?)([\w.\-/]+)(:)(.*)$/);
  if (!m) return <span className="text-success">{line}</span>;
  const [, indent, key, colon, rest] = m;
  return (
    <>
      {indent}
      <span className="text-accent-ink">{key}</span>
      <span className="text-ink-muted">{colon}</span>
      <span className="text-success">{rest}</span>
    </>
  );
};
