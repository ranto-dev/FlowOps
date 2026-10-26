import { motion, useReducedMotion } from "framer-motion";
import {
  Container,
  Download,
  GitBranch,
  Package,
  Settings2,
  TerminalSquare,
  Upload,
} from "lucide-react";
import { SectionHeader } from "./Reveal";
import { usePreferences } from "../../lib/usePreferences";

const NODES = [
  { icon: GitBranch, label: "Trigger" },
  { icon: Download, label: "Checkout repository" },
  { icon: Settings2, label: "Set up Node.js" },
  { icon: Package, label: "Run npm script" },
  { icon: Container, label: "Build Docker image" },
  { icon: Upload, label: "Upload artifact" },
  { icon: TerminalSquare, label: "Custom command" },
];

export function WorkflowBuilder() {
  const { t } = usePreferences();
  const reduce = useReducedMotion();
  return (
    <section
      id="how-it-works"
      aria-labelledby="builder-title"
      className="scroll-mt-24 py-24 sm:py-32"
    >
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
        <SectionHeader
          eyebrow={t("Low-code builder")}
          title={<span id="builder-title">{t("Build workflows visually.")}</span>}
          description={t("Configure your pipeline without writing YAML from scratch.")}
        />
        <div className="mx-auto mt-12 max-w-md" role="list" aria-label={t("Pipeline nodes")}>
          {NODES.map((node, i) => (
            <div key={node.label}>
              <motion.div
                role="listitem"
                initial={{ opacity: 0, y: reduce ? 0 : 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.6 }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                className="flex items-center gap-4 rounded-xl border border-[#27272A] bg-[#111113] px-5 py-4 transition-colors hover:border-zinc-700"
              >
                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-[#27272A] bg-[#18181B]">
                  <node.icon className="size-4 text-violet-300" aria-hidden="true" />
                </span>
                <div className="flex items-center gap-3">
                  <span className="font-mono text-[11px] text-[#71717A]">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="text-[15px] font-medium text-[#FAFAFA]">
                    {t(node.label)}
                  </span>
                </div>
              </motion.div>
              {i < NODES.length - 1 && (
                <div
                  className="flex justify-center py-1"
                  aria-hidden="true"
                >
                  <svg width="2" height="26" className="overflow-visible">
                    <line
                      x1="1"
                      y1="0"
                      x2="1"
                      y2="26"
                      stroke="#3f3f46"
                      strokeWidth="2"
                      className={reduce ? undefined : "landing-flow-line"}
                    />
                  </svg>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
