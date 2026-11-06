import {
  Container,
  Download,
  GitBranch,
  Package,
  Settings2,
  TerminalSquare,
  Upload,
} from "lucide-react";
import { useRef } from "react";
import { motion, useReducedMotion, useScroll, useSpring, useTransform } from "framer-motion";
import { SectionHeader } from "./Reveal";
import { ParallaxGlow, ScrollChain, TiltCard } from "./fx";
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
  const ref = useRef<HTMLDivElement>(null);
  // La fenêtre se redresse (3D) pendant qu'on défile jusqu'à elle.
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 95%", "start 35%"] });
  const p = useSpring(scrollYProgress, { stiffness: 110, damping: 28, mass: 0.4 });
  const rotateX = useTransform(p, [0, 1], [reduce ? 0 : 28, 0]);
  const scale = useTransform(p, [0, 1], [reduce ? 1 : 0.88, 1]);
  return (
    <section
      id="how-it-works"
      aria-labelledby="builder-title"
      className="relative isolate scroll-mt-24 py-20 sm:py-24"
    >
      <ParallaxGlow className="left-1/2 top-1/3 h-96 w-[40rem] -translate-x-1/2" from={-100} to={140} />
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
        <SectionHeader
          eyebrow={t("Low-code builder")}
          title={<span id="builder-title">{t("Build workflows visually.")}</span>}
          description={t("Configure your pipeline without writing YAML from scratch.")}
        />
        <div ref={ref} className="mx-auto mt-12 max-w-md" style={{ perspective: 1400 }}>
          <motion.div
            style={{ rotateX, scale, transformOrigin: "50% 0%" }}
            className="glass-flat overflow-hidden rounded-lg border shadow-2xl"
          >
            <div className="flex items-center gap-2 border-b border-line px-4 py-3" aria-hidden="true">
              <span className="size-2.5 rounded-full bg-line-strong" />
              <span className="size-2.5 rounded-full bg-line-strong" />
              <span className="size-2.5 rounded-full bg-line-strong" />
              <span className="ml-2 font-mono text-xs text-ink-subtle">workflow</span>
            </div>
            <div className="p-5" role="list" aria-label={t("Pipeline nodes")}>
              <ScrollChain
                count={NODES.length}
                renderItem={(i, active) => {
                  const node = NODES[i];
                  return (
                    <TiltCard
                      max={7}
                      className={`flex items-center gap-4 rounded-md border bg-surface-2 px-4 py-3 transition-colors duration-500 ${
                        active ? "border-accent/50 shadow-[0_0_28px_-8px_rgb(139_92_246/0.7)]" : "border-line"
                      }`}
                    >
                      <span
                        className={`flex size-9 shrink-0 items-center justify-center rounded-md transition-colors duration-500 [transform:translateZ(28px)] ${
                          active ? "bg-accent text-white" : "bg-accent/15 text-accent-ink"
                        }`}
                      >
                        <node.icon className="size-4" aria-hidden="true" />
                      </span>
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-xs text-ink-subtle">{String(i + 1).padStart(2, "0")}</span>
                        <span className="text-sm font-medium text-ink">{t(node.label)}</span>
                      </div>
                    </TiltCard>
                  );
                }}
              />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
