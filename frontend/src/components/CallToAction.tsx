import { ArrowRight, Sparkles } from "lucide-react";
import ScrollReveal from "./utils/ScrollReveal";
import { useNavigate } from "react-router-dom";

const CallToAction = () => {
  const navigate = useNavigate();
  return (
    <>
      <section className="py-20 bg-white border-t border-slate-200 relative overflow-hidden">
        <ScrollReveal className="max-w-4xl mx-auto px-4 text-center space-y-6 relative z-10">
          <div className="w-14 h-14 bg-purple-100 text-purple-600 rounded-3xl flex items-center justify-center mx-auto shadow-xs hover:rotate-12 transition-transform duration-300">
            <Sparkles className="w-7 h-7" />
          </div>

          <h2 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight">
            Ready to transform your CI/CD workflow?
          </h2>

          <p className="text-sm sm:text-base text-slate-500 max-w-xl mx-auto">
            Get started in under 60 seconds with GitHub Device Flow
            authentication.
          </p>

          <div className="pt-2">
            <button
              onClick={() => navigate("/auth")}
              className="px-8 py-4 bg-purple-600 hover:bg-purple-700 text-white font-bold text-sm rounded-2xl shadow-xl hover:shadow-purple-700/30 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300 inline-flex items-center gap-2 group"
            >
              <span>Start Monitoring for Free</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </ScrollReveal>
      </section>
    </>
  );
};

export default CallToAction;
