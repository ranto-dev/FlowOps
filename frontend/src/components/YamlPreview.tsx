import React, { useState } from "react";
import { Code2, Check, Copy, AlertCircle, Loader2 } from "lucide-react";

interface YamlPreviewProps {
  yaml: string | null;
  loading: boolean;
  error: string | null;
}

export const YamlPreview: React.FC<YamlPreviewProps> = ({
  yaml,
  loading,
  error,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (yaml) {
      navigator.clipboard.writeText(yaml);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="w-full max-w-xl bg-slate-950 text-slate-100 rounded-2xl shadow-xl overflow-hidden border border-slate-800 flex flex-col h-[580px]">
      {/* Barre d'en-tête style éditeur de code */}
      <div className="bg-slate-900 px-4 py-3 border-b border-slate-800 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Code2 className="w-4 h-4 text-indigo-400" />
          <span className="text-xs font-mono font-medium text-slate-400">
            main.yml
          </span>
        </div>
        {yaml && (
          <button
            onClick={handleCopy}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors flex items-center gap-1 text-xs"
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

      {/* Contenu principal de l'aperçu */}
      <div className="p-4 flex-1 overflow-auto font-mono text-xs leading-relaxed flex flex-col justify-center items-stretch">
        {loading && (
          <div className="flex flex-col items-center justify-center text-slate-400 gap-2">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
            <p>Calcul et structuration du fichier YAML...</p>
          </div>
        )}

        {error && (
          <div className="flex flex-col items-center justify-center text-center p-4 bg-red-950/20 border border-red-900/50 rounded-xl text-red-400 gap-2 m-4">
            <AlertCircle className="w-6 h-6" />
            <p className="font-sans font-medium">{error}</p>
          </div>
        )}

        {yaml && !loading && (
          <pre className="text-left whitespace-pre select-all text-emerald-400 bg-transparent p-2">
            <code>{yaml}</code>
          </pre>
        )}

        {!yaml && !loading && !error && (
          <div className="text-center text-slate-500 font-sans px-6">
            <div className="w-12 h-12 rounded-full bg-slate-900 flex items-center justify-center mx-auto mb-3 border border-slate-800">
              <Code2 className="w-5 h-5 text-slate-600" />
            </div>
            <p className="text-sm font-medium">Aucun workflow généré</p>
            <p className="text-xs text-slate-600 mt-1">
              Configurez les étapes à gauche et lancez la génération pour voir
              votre fichier GitHub Action ici.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
