import {
  Activity,
  ArrowRight,
  Code2,
  Cpu,
  Server,
  Workflow,
} from "lucide-react";
import { useRef } from "react";
import { FaGithub } from "react-icons/fa6";
import { useNavigate } from "react-router-dom";

const Hero = () => {
  const heroRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  return (
    <>
      <section
        ref={heroRef}
        className="pt-16 pb-16 md:pt-28 md:pb-24 overflow-hidden bg-white selection:bg-purple-200"
      >
        <div className="absolute inset-0 z-0 pointer-events-none opacity-30">
          <svg
            className="absolute w-full h-full text-slate-900/20"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <pattern
                id="square-grid"
                width="24"
                height="24"
                patternUnits="userSpaceOnUse"
              >
                <path
                  d="M 24 0 L 0 0 0 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1"
                />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#square-grid)" />
          </svg>
        </div>

        <div className="absolute inset-0 z-0 bg-[radial-gradient(ellipse_at_center,transparent_20%,white_85%)] pointer-events-none" />

        <div className="max-w-5xl mx-auto px-4 text-center space-y-6 relative z-10">
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-black text-slate-900 tracking-tight leading-[1.1]">
            Build, test, and monitor pipelines at the{" "}
            <span className="bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-800 bg-clip-text text-transparent hover:brightness-125 transition-all">
              speed of thought.
            </span>
          </h1>

          <p className="max-w-2xl mx-auto text-base sm:text-lg text-slate-500 font-normal leading-relaxed">
            The developer-first platform to observe, debug, and streamline your
            GitHub Actions workflows with real-time logs and zero-friction DX.
          </p>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => navigate("/auth")}
              className="relative overflow-hidden w-full sm:w-auto px-8 py-4 bg-purple-600 hover:bg-purple-700 text-white font-bold text-sm rounded-2xl shadow-lg shadow-purple-600/30 hover:shadow-purple-600/50 hover:-translate-y-1 active:translate-y-0 transition-all duration-300 flex items-center justify-center gap-2 group"
            >
              <span className="relative z-10">Deploy Now with GitHub</span>
              <ArrowRight className="w-4 h-4 relative z-10 group-hover:translate-x-1 transition-transform" />
              <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
            </button>

            <a
              href="#developer"
              className="w-full sm:w-auto px-8 py-4 bg-white hover:bg-slate-50 text-slate-800 font-bold text-sm rounded-2xl border border-slate-200/90 shadow-sm hover:shadow-md hover:border-purple-300 hover:-translate-y-1 active:translate-y-0 transition-all duration-300 flex items-center justify-center gap-2"
            >
              <Code2 className="w-4 h-4 text-purple-600" />
              <span>Explore Developer API</span>
            </a>
          </div>

          <div className="pt-10 flex flex-col items-center gap-3 text-xs text-slate-400 font-medium">
            <span className="tracking-widest text-[11px] font-bold text-slate-400 uppercase">
              Trusted by modern engineering teams
            </span>
            <div className="flex flex-wrap items-center justify-center gap-8 opacity-70 font-mono font-bold text-slate-600 text-sm">
              <span className="flex items-center gap-1.5 hover:text-purple-600 transition-colors cursor-default">
                <FaGithub className="w-4 h-4" /> GITHUB ACTIONS
              </span>
              <span className="flex items-center gap-1.5 hover:text-purple-600 transition-colors cursor-default">
                <Server className="w-4 h-4" /> KUBERNETES
              </span>
              <span className="flex items-center gap-1.5 hover:text-purple-600 transition-colors cursor-default">
                <Workflow className="w-4 h-4" /> DOCKER
              </span>
              <span className="flex items-center gap-1.5 hover:text-purple-600 transition-colors cursor-default">
                <Cpu className="w-4 h-4" /> AWS RUNNERS
              </span>
            </div>
          </div>
        </div>

        <div className="max-w-5xl mx-auto mt-12 px-4 relative z-10">
          <div className="bg-slate-900 rounded-3xl p-3 sm:p-4 shadow-2xl border border-slate-800 hover:border-purple-500/40 transition-all duration-500 transform hover:-translate-y-1 group">
            <div className="flex items-center justify-between pb-3 px-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-rose-500/80 group-hover:bg-rose-500 transition-colors" />
                <div className="w-3 h-3 rounded-full bg-amber-500/80 group-hover:bg-amber-500 transition-colors" />
                <div className="w-3 h-3 rounded-full bg-emerald-500/80 group-hover:bg-emerald-500 transition-colors" />
                <span className="ml-2 text-xs font-mono text-slate-400">
                  flowops-console — pipeline.log
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs font-mono text-purple-400 bg-purple-950/50 px-2.5 py-1 rounded-lg border border-purple-800/50">
                <Activity className="w-3.5 h-3.5 animate-pulse" /> Live
                Streaming
              </div>
            </div>

            <div className="p-4 font-mono text-xs text-slate-300 space-y-2 overflow-x-auto">
              <div className="flex items-center gap-2 text-slate-500">
                <span>[10:42:01]</span>{" "}
                <span className="text-purple-400 font-bold">[INF]</span>{" "}
                <span>Initializing FlowOps Runner v2.4.0...</span>
              </div>
              <div className="flex items-center gap-2 text-slate-500">
                <span>[10:42:03]</span>{" "}
                <span className="text-sky-400 font-bold">[GIT]</span>{" "}
                <span>
                  Checked out commit{" "}
                  <code className="text-slate-200">#8f3a1b2</code> on branch{" "}
                  <code className="text-slate-200">main</code>
                </span>
              </div>
              <div className="flex items-center gap-2 text-slate-500">
                <span>[10:42:05]</span>{" "}
                <span className="text-emerald-400 font-bold">[OK]</span>{" "}
                <span className="text-emerald-300">
                  Step #1 Set up job completed in 1.2s
                </span>
              </div>
              <div className="flex items-center gap-2 text-slate-500">
                <span>[10:42:18]</span>{" "}
                <span className="text-emerald-400 font-bold">[OK]</span>{" "}
                <span className="text-emerald-300">
                  Build succeeded. Deployment bundle ready.
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default Hero;
