import { useRef } from "react";
import { motion, useMotionValueEvent, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { GitCommitHorizontal, MousePointerClick, Play, Timer } from "lucide-react";
import { useState } from "react";
import { SectionHeader } from "./Reveal";
import { usePreferences } from "../../lib/usePreferences";

const STEPS = [
  { icon: MousePointerClick, title: "Design", text: "Compose jobs and steps in the visual builder." },
  { icon: GitCommitHorizontal, title: "Commit", text: "FlowOps commits the generated YAML to .github/workflows/." },
  { icon: Play, title: "Execute", text: "Trigger the run and follow its status from GitHub Actions." },
  { icon: Timer, title: "Predict", text: "Get an estimated duration and failure risk before it starts." },
];

/** Section pilotée par le scroll : un rail se remplit et les étapes s'allument une à une. */
export function HowItWorks() {
  const { t } = usePreferences();
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 0.8", "end 0.6"] });
  const fill = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);
  const [progress, setProgress] = useState(reduce ? 1 : 0);
  useMotionValueEvent(scrollYProgress, "change", (v) => setProgress(v));

  return (
    <section id="flow" aria-labelledby="how-title" className="relative scroll-mt-24 py-20 sm:py-28">
      <div
        aria-hidden="true"
        className="aurora aurora-violet inset-x-0 top-1/4 mx-auto h-96 max-w-3xl !animate-none opacity-40"
      />
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
        <SectionHeader
          eyebrow={t("How it works")}
          title={<span id="how-title">{t("From idea to running pipeline in four steps.")}</span>}
        />
        <div ref={ref} className="relative mx-auto mt-16 max-w-4xl">
          <div className="absolute left-[12.5%] right-[12.5%] top-[26px] hidden h-px bg-line md:block" aria-hidden="true">
            <motion.div
              style={{ width: reduce ? "100%" : fill }}
              className="h-full bg-accent shadow-[0_0_12px_rgb(139_92_246)]"
            />
          </div>
          <ol className="grid gap-8 md:grid-cols-4 md:gap-4">
            {STEPS.map((s, i) => {
              const active = reduce || progress >= (i - 0.4) / (STEPS.length - 1);
              return (
                <motion.li
                  key={s.title}
                  animate={{ opacity: active ? 1 : 0.35, scale: active ? 1 : 0.94 }}
                  transition={{ duration: 0.4 }}
                  className="relative flex flex-col items-center text-center"
                >
                  <span className="glass-flat relative z-10 flex size-[52px] items-center justify-center rounded-lg border shadow-lg">
                    <s.icon className="size-5 text-accent-ink" aria-hidden="true" />
                  </span>
                  <p className="mt-2 font-mono text-xs text-ink-subtle">0{i + 1}</p>
                  <h3 className="mt-1 text-lg font-medium text-ink">{t(s.title)}</h3>
                  <p className="mt-1.5 text-sm text-ink-muted">{t(s.text)}</p>
                </motion.li>
              );
            })}
          </ol>
        </div>
      </div>
    </section>
  );
}
