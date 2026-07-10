import React, { useState } from "react";
import {
  Code2,
  Check,
  Copy,
  AlertCircle,
  Loader2,
  FileCode,
  Folder,
} from "lucide-react";
import type { VirtualFile } from "../@types/workflow";

interface YamlPreviewProps {
  files: VirtualFile[];
  activeFileId: string;
  onSelectFile: (id: string) => void;
  onAddFile: () => void;
  loading: boolean;
  error: string | null;
}

export const YamlPreview: React.FC<YamlPreviewProps> = ({
  files,
  activeFileId,
  onSelectFile,
  onAddFile,
  loading,
  error,
}) => {
  const [copied, setCopied] = useState(false);
  const activeFile = files.find((f) => f.id === activeFileId);

  const handleCopy = () => {
    if (activeFile?.yaml) {
      navigator.clipboard.writeText(activeFile.yaml);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="w-full lg:w-5/12 bg-slate-950 text-slate-100 rounded-2xl shadow-xl overflow-hidden border border-slate-800 flex flex-col h-[85vh]">
      {/* 📁 EXPLORATEUR DE FICHIERS VIRTUEL */}
      <div className="bg-slate-900/80 p-3 border-b border-slate-800">
        <div className="flex justify-between items-center mb-2 px-1">
          <span className="text-[11px] font-bold text-slate-400 tracking-wider uppercase flex items-center gap-1.5">
            <Folder className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />{" "}
            .github / workflows
          </span>
          <button
            onClick={onAddFile}
            className="text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-200 px-2 py-0.5 rounded transition-colors"
          >
            + Nouveau Workflow
          </button>
        </div>

        {/* Onglets de navigation des fichiers */}
        <div className="flex flex-wrap gap-1">
          {files.map((file) => (
            <button
              key={file.id}
              onClick={() => onSelectFile(file.id)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-mono border transition-all ${
                file.id === activeFileId
                  ? "bg-slate-800 text-white border-slate-700"
                  : "bg-transparent text-slate-400 border-transparent hover:bg-slate-900"
              }`}
            >
              <FileCode
                className={`w-3.5 h-3.5 ${file.id === activeFileId ? "text-indigo-400" : "text-slate-500"}`}
              />
              {file.filename || "sans-nom.yml"}
            </button>
          ))}
        </div>
      </div>

      {/* Barre d'actions du fichier courant */}
      <div className="bg-slate-900/40 px-4 py-2 border-b border-slate-900 flex justify-between items-center text-xs">
        <span className="font-mono text-slate-500 text-[11px]">
          Éditeur actif
        </span>
        {activeFile?.yaml && (
          <button
            onClick={handleCopy}
            className="text-slate-400 hover:text-white flex items-center gap-1 text-[11px] transition-colors"
          >
            {copied ? (
              <Check className="w-3.5 h-3.5 text-green-400" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
            {copied ? "Copié !" : "Copier"}
          </button>
        )}
      </div>

      {/* Fenêtre Code Editor */}
      <div className="p-4 flex-1 overflow-auto font-mono text-xs flex flex-col justify-start items-stretch">
        {loading && (
          <div className="flex flex-col items-center justify-center text-slate-400 gap-2 h-full">
            <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
            <p className="text-[11px]">Génération de la syntaxe YAML...</p>
          </div>
        )}

        {error && (
          <div className="flex flex-col items-center justify-center p-4 bg-red-950/30 border border-red-900/50 rounded-xl text-red-400 gap-1.5 m-2">
            <AlertCircle className="w-5 h-5" />
            <p className="font-sans font-medium text-center">{error}</p>
          </div>
        )}

        {activeFile?.yaml && !loading && !error && (
          <pre className="text-left whitespace-pre text-emerald-400 p-1 selection:bg-slate-800">
            <code>{activeFile.yaml}</code>
          </pre>
        )}

        {!activeFile?.yaml && !loading && !error && (
          <div className="text-center text-slate-500 font-sans my-auto px-6">
            <Code2 className="w-8 h-8 text-slate-700 mx-auto mb-2" />
            <p className="text-xs font-semibold">Fichier non synchronisé</p>
            <p className="text-[11px] text-slate-600 mt-0.5">
              Cliquez sur le bouton bleu{" "}
              <span className="text-indigo-400">"Generate Configuration"</span>{" "}
              pour hydrater ce fichier.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
