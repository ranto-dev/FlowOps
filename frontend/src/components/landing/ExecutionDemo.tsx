import { useEffect, useRef, useState } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";
import { Check, Circle, Loader2 } from "lucide-react";
import { SectionHeader } from "./Reveal";
import { ParallaxGlow, TiltCard } from "./fx";
import { cn } from "../../lib/utils";
import { usePreferences } from "../../lib/usePreferences";

type StepState = "done" | "running" | "pending";

const STEPS = [
  { label: "Checkout", time: "1s" },
  { label: "Setup Node", time: "3s" },
  { label: "Install dependencies", time: "12s" },
  { label: "Build", time: "24s" },
  { label: "Tests", time: "18s" },
  { label: "Deploy", time: "6s" },
];

const LOGS = [
  "Cloning repository…",
  "Using Node 22.x",
  "added 1284 packages",
  "vite build · 312 modules",
  "42 tests passed",
  "Deployment complete",
];

const META = [
  ["Duration", "01:24"],
  ["Status", "Running"],
  ["Branch", "main"],
  ["Commit", "a81f92c"],
];

function statesFor(tick: number): StepState[] {
  return STEPS.map((_, i) => (i < tick ? "done" : i === tick ? "running" : "pending"));
}

export function ExecutionDemo() {
  const { t } = usePreferences();
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { amount: 0.4 });
  const [tick, setTick] = useState(reduce ? STEPS.length : 0);

  // Joue quand la section est visible, boucle avec une pause sur l'état final.
  useEffect(() => {
    if (reduce) {
      setTick(STEPS.length);
      return;
    }
    if (!inView) return;
    const id = window.setInterval(() => {
      setTick((v) => (v >= STEPS.length + 2 ? 0 : v + 1));
    }, 1100);
    return () => window.clearInterval(id);
  }, [inView, reduce]);

  const done = Math.min(tick, STEPS.length);
  const states = statesFor(done);
  const running = done < STEPS.length;
  const pct = Math.round((done / STEPS.length) * 100);

  return (
    <section aria-labelledby="exec-title" className="relative isolate py-20 sm:py-24">
      <ParallaxGlow className="left-1/4 top-10 h-96 w-96" />
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
        <SectionHeader
          eyebrow={t("Illustrative execution")}
          title={<span id="exec-title">{t("Example workflow execution states.")}</span>}
        />
        <div ref={ref} className="mx-auto mt-12 max-w-2xl">
          <TiltCard max={5} className="glass-flat overflow-hidden rounded-lg border">
            <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
              <p className="flex items-center gap-2 font-mono text-xs">
                <span className="relative flex size-2">
                  {running && <span className="animate-pulse-ring absolute inline-flex size-2 rounded-full bg-success" />}
                  <span className={cn("relative size-2 rounded-full", running ? "bg-success" : "bg-ink-subtle")} />
                </span>
                <span className="text-ink-muted">{running ? t("Workflow running") : t("Workflow finished")}</span>
              </p>
              <p className="font-mono text-xs tabular-nums text-ink-subtle">{pct}%</p>
            </div>

            {/* progression globale */}
            <div className="h-0.5 bg-line">
              <div
                className="h-full origin-left bg-accent shadow-[0_0_12px_rgb(139_92_246)] transition-transform duration-1000 ease-out"
                style={{ transform: `scaleX(${pct / 100})` }}
              />
            </div>

            <ul className="divide-y divide-line bg-code">
              {STEPS.map((step, i) => {
                const s = states[i];
                return (
                  <motion.li
                    key={step.label}
                    className={cn(
                      "relative flex items-center gap-3 overflow-hidden px-5 py-3",
                      s === "running" && "shimmer bg-accent/10",
                    )}
                    animate={{ opacity: s === "pending" ? 0.4 : 1, x: s === "running" ? 6 : 0 }}
                    transition={{ type: "spring", stiffness: 220, damping: 22 }}
                  >
                    {s === "done" && (
                      <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 400, damping: 14 }}>
                        <Check className="size-4 shrink-0 text-success" aria-label={t("Done")} />
                      </motion.span>
                    )}
                    {s === "running" && (
                      <Loader2 className="size-4 shrink-0 animate-spin text-accent-ink" aria-label={t("Running")} />
                    )}
                    {s === "pending" && <Circle className="size-4 shrink-0 text-line-strong" aria-label={t("Pending")} />}
                    <span className={cn("font-mono text-sm", s === "pending" ? "text-ink-subtle" : "text-ink")}>
                      {t(step.label)}
                    </span>
                    <span className="ml-auto truncate font-mono text-xs text-ink-subtle">
                      {s === "done" ? step.time : s === "running" ? LOGS[i] : ""}
                    </span>
                  </motion.li>
                );
              })}
            </ul>

            <dl className="grid grid-cols-2 gap-px border-t border-line bg-line sm:grid-cols-4">
              {META.map(([k, v]) => (
                <div key={k} className="bg-code px-5 py-3.5">
                  <dt className="font-mono text-xs text-ink-subtle">{t(k)}</dt>
                  <dd
                    className={cn(
                      "mt-1 font-mono text-sm",
                      k === "Status" ? (running ? "text-accent-ink" : "text-success") : "text-ink",
                    )}
                  >
                    {k === "Status" ? (running ? v : t("Done")) : v}
                  </dd>
                </div>
              ))}
            </dl>
          </TiltCard>
        </div>
      </div>
    </section>
  );
}
