import React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="flex-1 flex flex-col items-center justify-center bg-white px-6 text-center animate-in fade-in duration-200">
      <div className="space-y-4 max-w-xl">
        <span className="text-[10px] font-extrabold tracking-widest text-purple-600 bg-purple-50 px-3 py-1 rounded-full uppercase border border-purple-100">
          Next-Gen DevOps Platform
        </span>
        <h2 className="text-4xl font-black tracking-tight text-slate-900 sm:text-5xl">
          Build CI/CD Pipelines <br />
          <span className="bg-gradient-to-r from-violet-600 to-blue-500 bg-clip-text text-transparent">
            With Zero Code
          </span>
        </h2>
        <p className="text-sm text-slate-500 max-w-md mx-auto">
          FlowOps abstractifies complex GitHub Actions syntax into an
          interactive, visual topology mapping system.
        </p>
        <div className="pt-4">
          <button
            onClick={() => navigate("/auth")}
            className="px-6 py-3 bg-slate-900 text-white font-bold text-xs uppercase tracking-widest rounded-xl hover:bg-slate-800 transition-all shadow-md inline-flex items-center gap-2"
          >
            Get Started <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
