import { useState } from "react";
import ScrollReveal from "./utils/ScrollReveal";
import { Check, CheckCircle, Copy } from "lucide-react";

const DeveloperApi = () => {
  const [copiedCode, setCopiedCode] = useState(false);
  const [activeTab, setActiveTab] = useState<"cli" | "curl" | "sdk">("cli");
  const codeSnippets = {
    cli: `$ flowops login\n✔ GitHub OAuth Success!\n$ flowops watch --repo org/main-api --branch main\n[10:42:01] Connecting to WebSocket...\n[10:42:02] Live Streaming Job #4082`,
    curl: `curl -X POST https://api.flowops.dev/v1/stream \\\n  -H "Authorization: Bearer fo_live_998372" \\\n  -d '{"repo": "org/main-api", "follow": true}'`,
    sdk: `import { FlowOps } from "@flowops/sdk";\n\nconst client = new FlowOps({ apiKey: process.env.FLOWOPS_KEY });\nclient.workflows.on("log", (log) => console.log(log.message));`,
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(codeSnippets[activeTab]);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };
  return (
    <>
      <section
        id="developer"
        className="py-20 bg-slate-900 text-white relative overflow-hidden"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <ScrollReveal className="lg:col-span-5 space-y-6">
              <span className="text-xs font-black uppercase tracking-widest text-purple-400 bg-purple-950 px-3 py-1 rounded-full border border-purple-800">
                Developer API & CLI
              </span>
              <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
                Control your pipelines directly from your terminal or scripts.
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                FlowOps provides a developer-friendly CLI and REST/WebSocket API
                so you can integrate real-time build telemetry into your custom
                tools.
              </p>

              <div className="space-y-3 pt-2 text-xs">
                <div className="flex items-center gap-2 text-slate-300">
                  <CheckCircle className="w-4 h-4 text-purple-400" />
                  <span>Programmatic WebSocket log subscription</span>
                </div>
                <div className="flex items-center gap-2 text-slate-300">
                  <CheckCircle className="w-4 h-4 text-purple-400" />
                  <span>Zero setup required for GitHub Actions</span>
                </div>
              </div>
            </ScrollReveal>

            {/* Code Box */}
            <ScrollReveal delay={150} className="lg:col-span-7">
              <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4 hover:border-slate-700 transition-all duration-300">
                <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setActiveTab("cli")}
                      className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all ${
                        activeTab === "cli"
                          ? "bg-purple-600 text-white shadow-md shadow-purple-600/30"
                          : "text-slate-400 hover:text-white"
                      }`}
                    >
                      CLI
                    </button>
                    <button
                      onClick={() => setActiveTab("curl")}
                      className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all ${
                        activeTab === "curl"
                          ? "bg-purple-600 text-white shadow-md shadow-purple-600/30"
                          : "text-slate-400 hover:text-white"
                      }`}
                    >
                      CURL
                    </button>
                    <button
                      onClick={() => setActiveTab("sdk")}
                      className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all ${
                        activeTab === "sdk"
                          ? "bg-purple-600 text-white shadow-md shadow-purple-600/30"
                          : "text-slate-400 hover:text-white"
                      }`}
                    >
                      Node.js SDK
                    </button>
                  </div>

                  <button
                    onClick={handleCopyCode}
                    className="p-2 text-slate-400 hover:text-white transition-colors bg-slate-900 hover:bg-slate-800 rounded-lg border border-slate-800"
                    title="Copy code"
                  >
                    {copiedCode ? (
                      <Check className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>

                <pre className="p-4 font-mono text-xs text-purple-300 overflow-x-auto leading-relaxed">
                  <code>{codeSnippets[activeTab]}</code>
                </pre>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>
    </>
  );
};

export default DeveloperApi;
