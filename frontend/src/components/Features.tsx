import { Activity, GitBranch } from "lucide-react";
import ScrollReveal from "./utils/ScrollReveal";

const Features = () => {
  return (
    <>
      <section
        id="features"
        className="py-20 bg-white border-y border-slate-200/80 relative"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ScrollReveal className="text-center max-w-3xl mx-auto mb-16 space-y-3">
            <span className="text-xs font-black uppercase tracking-widest text-purple-600 bg-purple-50 px-3 py-1 rounded-full border border-purple-100">
              Developer Experience
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
              Everything you need to ship code with total confidence.
            </h2>
            <p className="text-sm text-slate-500">
              Built for speed, clarity, and reliability. Say goodbye to opaque
              logs and clunky CI/CD interfaces.
            </p>
          </ScrollReveal>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <ScrollReveal delay={100} className="md:col-span-2">
              <div className="h-full p-8 rounded-3xl bg-slate-50/80 border border-slate-200/80 hover:border-purple-300 hover:shadow-xl hover:shadow-purple-600/5 hover:-translate-y-1 transition-all duration-300 space-y-4 flex flex-col justify-between group">
                <div className="space-y-2">
                  <div className="w-10 h-10 rounded-2xl bg-purple-100 text-purple-600 flex items-center justify-center font-bold group-hover:scale-110 group-hover:rotate-6 transition-transform">
                    <Activity className="w-5 h-5" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 group-hover:text-purple-600 transition-colors">
                    Real-Time Step-by-Step Streaming
                  </h3>
                  <p className="text-xs text-slate-500 leading-relaxed max-w-lg">
                    Watch your workflows execute live with precise millisecond
                    logs, color-coded level tags, and automatic bottom
                    scrolling.
                  </p>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs font-mono text-xs space-y-2 group-hover:border-purple-200 transition-all">
                  <div className="flex items-center justify-between text-slate-400 text-[10px]">
                    <span>JOB: build-and-test</span>
                    <span className="text-emerald-600 font-bold">
                      ✓ SUCCESS (42s)
                    </span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-purple-600 w-full animate-pulse" />
                  </div>
                </div>
              </div>
            </ScrollReveal>

            <ScrollReveal delay={200}>
              <div className="h-full p-8 rounded-3xl bg-slate-50/80 border border-slate-200/80 hover:border-purple-300 hover:shadow-xl hover:shadow-purple-600/5 hover:-translate-y-1 transition-all duration-300 space-y-4 flex flex-col justify-between group">
                <div className="space-y-2">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold group-hover:scale-110 group-hover:-rotate-6 transition-transform">
                    <GitBranch className="w-5 h-5" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                    Branch & Commit Tracking
                  </h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Filter execution histories by branch, commit SHA, or trigger
                    event in one click.
                  </p>
                </div>

                <div className="p-3 bg-white rounded-xl border border-slate-200 text-xs font-mono space-y-1.5 group-hover:border-indigo-200 transition-all">
                  <div className="text-purple-600 font-bold flex items-center gap-1">
                    <GitBranch className="w-3.5 h-3.5" /> main
                  </div>
                  <div className="text-slate-400 text-[10px]">
                    sha: 8f3a1b2 • 2 mins ago
                  </div>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>
    </>
  );
};

export default Features;
