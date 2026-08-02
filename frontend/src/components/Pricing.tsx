import { useState } from "react";
import ScrollReveal from "./utils/ScrollReveal";
import { useNavigate } from "react-router-dom";

const Pricing = () => {
  const navigate = useNavigate();
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">(
    "yearly",
  );
  return (
    <>
      <section
        id="pricing"
        className="py-20 bg-white border-b border-slate-200"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ScrollReveal className="text-center max-w-3xl mx-auto mb-12 space-y-4">
            <span className="text-xs font-black uppercase tracking-widest text-purple-600 bg-purple-50 px-3 py-1 rounded-full border border-purple-100">
              Simple Pricing
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
              Start free, scale as your team grows.
            </h2>
            <p className="text-sm text-slate-500">
              No hidden fees. Free forever for open source and side projects.
            </p>

            <div className="inline-flex items-center bg-slate-100 p-1.5 rounded-2xl border border-slate-200 mt-4">
              <button
                onClick={() => setBillingCycle("monthly")}
                className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
                  billingCycle === "monthly"
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-500"
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingCycle("yearly")}
                className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 ${
                  billingCycle === "yearly"
                    ? "bg-purple-600 text-white shadow-md"
                    : "text-slate-500"
                }`}
              >
                <span>Yearly</span>
                <span className="text-[10px] bg-purple-800 text-purple-200 px-1.5 py-0.5 rounded-md">
                  Save 20%
                </span>
              </button>
            </div>
          </ScrollReveal>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <ScrollReveal delay={100}>
              <div className="h-full p-8 bg-slate-50/80 rounded-3xl border border-slate-200 hover:border-purple-300 hover:shadow-lg transition-all duration-300 space-y-6 flex flex-col justify-between">
                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-slate-900">
                    Hobby / Open Source
                  </h3>
                  <p className="text-xs text-slate-500">
                    Perfect for individual developers and personal GitHub
                    repositories.
                  </p>
                  <div className="text-3xl font-black text-slate-900 font-mono">
                    $0{" "}
                    <span className="text-xs font-sans text-slate-400 font-normal">
                      / forever
                    </span>
                  </div>

                  <ul className="space-y-2.5 text-xs text-slate-600 pt-4 border-t border-slate-200">
                    <li className="flex items-center gap-2">
                      ✓ Up to 3 active repositories
                    </li>
                    <li className="flex items-center gap-2">
                      ✓ 500 build minutes/mo streaming
                    </li>
                    <li className="flex items-center gap-2">
                      ✓ 7 days log retention
                    </li>
                    <li className="flex items-center gap-2">
                      ✓ Community support
                    </li>
                  </ul>
                </div>

                <button
                  onClick={() => navigate("/auth")}
                  className="w-full py-3 bg-white border border-slate-200 hover:bg-slate-100 font-bold text-xs text-slate-800 rounded-xl transition-all hover:border-slate-300"
                >
                  Start Free
                </button>
              </div>
            </ScrollReveal>

            <ScrollReveal delay={200}>
              <div className="h-full p-8 bg-white rounded-3xl border-2 border-purple-600 shadow-xl hover:shadow-2xl hover:shadow-purple-600/10 hover:-translate-y-1 transition-all duration-300 space-y-6 flex flex-col justify-between relative">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-purple-600 text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider shadow-md">
                  Most Popular
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-slate-900">
                    Pro Developer
                  </h3>
                  <p className="text-xs text-slate-500">
                    For active engineering teams requiring live log streams and
                    fast search.
                  </p>
                  <div className="text-3xl font-black text-slate-900 font-mono">
                    {billingCycle === "yearly" ? "$19" : "$24"}{" "}
                    <span className="text-xs font-sans text-slate-400 font-normal">
                      / month
                    </span>
                  </div>

                  <ul className="space-y-2.5 text-xs text-slate-600 pt-4 border-t border-slate-200">
                    <li className="flex items-center gap-2 font-semibold text-slate-800">
                      ✓ Unlimited repositories
                    </li>
                    <li className="flex items-center gap-2">
                      ✓ 10,000 build minutes/mo
                    </li>
                    <li className="flex items-center gap-2">
                      ✓ 30 days log retention
                    </li>
                    <li className="flex items-center gap-2">
                      ✓ Advanced branch filtering
                    </li>
                    <li className="flex items-center gap-2">
                      ✓ Priority email support
                    </li>
                  </ul>
                </div>

                <button
                  onClick={() => navigate("/auth")}
                  className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-md transition-all hover:shadow-purple-600/30"
                >
                  Get Started Pro
                </button>
              </div>
            </ScrollReveal>

            <ScrollReveal delay={300}>
              <div className="h-full p-8 bg-slate-50/80 rounded-3xl border border-slate-200 hover:border-purple-300 hover:shadow-lg transition-all duration-300 space-y-6 flex flex-col justify-between">
                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-slate-900">
                    Enterprise
                  </h3>
                  <p className="text-xs text-slate-500">
                    Custom isolation, SOC2 compliance, and dedicated
                    infrastructure.
                  </p>
                  <div className="text-3xl font-black text-slate-900 font-mono">
                    Custom
                  </div>

                  <ul className="space-y-2.5 text-xs text-slate-600 pt-4 border-t border-slate-200">
                    <li className="flex items-center gap-2">
                      ✓ Dedicated runner infrastructure
                    </li>
                    <li className="flex items-center gap-2">
                      ✓ Unlimited log retention
                    </li>
                    <li className="flex items-center gap-2">
                      ✓ Custom SAML/SSO authentication
                    </li>
                    <li className="flex items-center gap-2">
                      ✓ Dedicated account manager
                    </li>
                  </ul>
                </div>

                <button
                  onClick={() => navigate("/auth")}
                  className="w-full py-3 bg-slate-900 hover:bg-purple-900 text-white font-bold text-xs rounded-xl transition-all"
                >
                  Contact Sales
                </button>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>
    </>
  );
};

export default Pricing;
