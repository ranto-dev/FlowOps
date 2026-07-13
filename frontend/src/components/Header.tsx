import React from "react";

interface HeaderProps {
  logoUrl?: string;
}

export const Header: React.FC<HeaderProps> = () => {
  return (
    <header className="w-full max-w-7xl mx-auto px-6 py-4 flex items-center justify-between border-b border-slate-100 bg-white">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-violet-600 via-purple-600 to-blue-500 flex items-center justify-center text-white font-bold text-xl shadow-md shadow-purple-500/20">
          ∞
        </div>
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-1">
            Flow
            <span className="bg-gradient-to-r from-violet-600 to-blue-500 bg-clip-text text-transparent">
              Ops
            </span>
          </h1>
          <p className="text-[10px] text-slate-400 font-medium tracking-wider uppercase">
            Visual DevOps Studio
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
        <span className="text-[11px] font-mono text-slate-500 bg-slate-50 px-2.5 py-1 rounded-full border border-slate-100">
          Engine v6.0.0
        </span>
      </div>
    </header>
  );
};
