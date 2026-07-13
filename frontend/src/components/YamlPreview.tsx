import React from "react";
import {
  Plus,
  RefreshCcw,
  Save,
  FileCode,
  Copy,
  Loader2,
  CheckCircle,
} from "lucide-react";
import type { VirtualFile } from "../@types/workflow";

interface YamlPreviewProps {
  activeFile: VirtualFile;
  loading: boolean;
  onNewWorkflow: () => void;
  onReconfigure: () => void;
  onSaveToServer: () => void;
  saveStatus: string | null;
}

export const YamlPreview: React.FC<YamlPreviewProps> = ({
  activeFile,
  loading,
  onNewWorkflow,
  onReconfigure,
  onSaveToServer,
  saveStatus,
}) => {
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

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col bg-slate-950 rounded-3xl shadow-2xl overflow-hidden border border-slate-800 text-left animate-in fade-in slide-in-from-bottom-4 duration-300">
      {/* BARRE DE CONTRÔLE SUPÉRIEURE */}
      <div className="bg-slate-900/80 px-6 py-4 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <div className="w-2.5 h-2.5 rounded-full bg-purple-500 animate-ping"></div>
          <span className="text-xs font-mono font-bold text-slate-300 flex items-center gap-1.5">
            <FileCode className="w-4 h-4 text-purple-400" />
            {activeFile.filename || "production-pipeline.yaml"}
          </span>
        </div>

        {/* LES TROIS BOUTONS */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={onNewWorkflow}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold text-[11px] rounded-xl transition-all border border-slate-700"
          >
            <Plus className="w-3.5 h-3.5" />
            New Workflow
          </button>
          <button
            onClick={onReconfigure}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold text-[11px] rounded-xl transition-all border border-slate-700"
          >
            <RefreshCcw className="w-3.5 h-3.5" />
            Reconfigure Workflow
          </button>
          <button
            onClick={onSaveToServer}
            disabled={loading}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-violet-600 to-purple-600 hover:opacity-90 text-white font-black text-[11px] rounded-xl transition-all shadow-md shadow-purple-900/20 disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Save className="w-3.5 h-3.5" />
            )}
            Save Workflow Configuration
          </button>
        </div>
      </div>

      {/* RECEPTACLE DE CODE SOURCE AVEC NUMÉROTATION DE LIGNES */}
      <div className="flex-1 p-6 overflow-auto font-mono text-xs leading-relaxed relative min-h-[450px] bg-slate-950">
        {saveStatus && (
          <div className="mb-4 p-3 bg-emerald-950/40 border border-emerald-800/40 rounded-xl text-emerald-400 text-[11px] font-medium flex items-center gap-2">
            <CheckCircle className="w-4 h-4" /> {saveStatus}
          </div>
        )}

        <button
          onClick={copyToClipboard}
          className="absolute top-4 right-4 p-2 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg border border-slate-800 transition-colors z-10"
          title="Copier le code"
        >
          {copied ? (
            <span className="text-[10px] text-emerald-400 font-bold px-1">
              Copied!
            </span>
          ) : (
            <Copy className="w-3.5 h-3.5" />
          )}
        </button>

        {activeFile.yaml ? (
          <div className="flex items-start select-text pt-2">
            {/* Gouttière des numéros de ligne (non sélectionnable au clic/glissé) */}
            <div className="flex flex-col text-right pr-4 text-slate-600 select-none border-r border-slate-800/60 min-w-[2.5rem]">
              {yamlLines.map((_, index) => (
                <span
                  key={index}
                  className="h-5 text-[11px] font-medium tracking-sm"
                >
                  {index + 1}
                </span>
              ))}
            </div>

            {/* Contenu du code YAML */}
            <div className="flex flex-col pl-4 text-purple-300 overflow-x-auto w-full">
              {yamlLines.map((line, index) => (
                <span
                  key={index}
                  className="h-5 whitespace-pre block hover:bg-slate-900/40 px-1 rounded transition-colors text-emerald-400 font-medium"
                >
                  {line || " "}
                </span>
              ))}
            </div>
          </div>
        ) : (
          <div className="h-full flex items-center justify-center text-slate-600 text-center py-20">
            Génération du flux en cours...
          </div>
        )}
      </div>
    </div>
  );
};
