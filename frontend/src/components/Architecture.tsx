import { BarChart2, Workflow } from "lucide-react";
import ScrollReveal from "./utils/ScrollReveal";
import { FaGithub } from "react-icons/fa6";

const ArchitectureEngine = () => {
  return (
    <>
      <section id="architecture" className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ScrollReveal className="text-center max-w-3xl mx-auto mb-16 space-y-3">
            <span className="text-xs font-black uppercase tracking-widest text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">
              Engine & Infrastructure
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
              Designed for low latency & ultimate security.
            </h2>
            <p className="text-sm text-slate-500">
              How FlowOps intercepts, processes, and streams logs from your
              GitHub infrastructure to your workspace.
            </p>
          </ScrollReveal>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            <ScrollReveal delay={100}>
              <div className="p-6 bg-white border border-slate-200 rounded-3xl shadow-xs hover:shadow-lg hover:border-purple-300 hover:-translate-y-1 transition-all duration-300 space-y-4">
                <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center font-bold border border-purple-100">
                  <FaGithub className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">
                  1. GitHub Webhook / Device OAuth
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  When a commit is pushed, GitHub triggers the pipeline. FlowOps
                  authenticates seamlessly via encrypted OAuth tokens.
                </p>
              </div>
            </ScrollReveal>

            <ScrollReveal delay={200}>
              <div className="p-6 bg-white border border-purple-300 shadow-md rounded-3xl space-y-4 ring-2 ring-purple-600/10 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                <div className="w-12 h-12 bg-purple-600 text-white rounded-2xl flex items-center justify-center font-bold shadow-md shadow-purple-600/30">
                  <Workflow className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">
                  2. Real-Time Parser Engine
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Logs are sanitized, level-parsed (INFO, WARN, ERR), and
                  processed through high-throughput WebSocket channels.
                </p>
              </div>
            </ScrollReveal>

            <ScrollReveal delay={300}>
              <div className="p-6 bg-white border border-slate-200 rounded-3xl shadow-xs hover:shadow-lg hover:border-emerald-300 hover:-translate-y-1 transition-all duration-300 space-y-4">
                <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center font-bold border border-emerald-100">
                  <BarChart2 className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">
                  3. Instant Workspace Delivery
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  View instant build states, step timers, and live stdout
                  directly in your FlowOps workspace dashboard.
                </p>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>
    </>
  );
};

export default ArchitectureEngine;
