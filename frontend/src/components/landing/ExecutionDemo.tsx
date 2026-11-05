import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Check, Circle, Loader2 } from "lucide-react";
import { Reveal, SectionHeader } from "./Reveal";
import { cn } from "../../lib/utils";
import { usePreferences } from "../../lib/usePreferences";

type StepState = "done" | "running" | "pending";

interface ExecStep {
  label: string;
}

const STEPS: ExecStep[] = [
  { label: "Checkout" },
  { label: "Setup Node" },
  { label: "Install dependencies" },
  { label: "Build" },
  { label: "Tests" },
  { label: "Deploy" },
];

const META = [
  ["Duration", "01:24"],
  ["Status", "Running"],
  ["Branch", "main"],
  ["Commit", "a81f92c"],
];

function statesFor(tick: number): StepState[] {
  return STEPS.map((_, i) => {
    if (i < tick) return "done";
    if (i === tick) return "running";
    return "pending";
  });
}

export function ExecutionDemo() {
  const { t } = usePreferences();
  const reduce = useReducedMotion();
  const [tick, setTick] = useState(reduce ? STEPS.length : 0);

  useEffect(() => {
    if (reduce) {
      setTick(STEPS.length);
      return;
    }
    // Déroulé joué une seule fois, puis figé sur l'état final.
    const id = window.setInterval(() => {
      setTick((t) => {
        if (t + 1 >= STEPS.length) window.clearInterval(id);
        return Math.min(t + 1, STEPS.length);
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [reduce]);

  const states = statesFor(tick);
  const running = tick < STEPS.length;

  return (
    <section aria-labelledby="exec-title" className="py-20 sm:py-24">
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
        <SectionHeader
          eyebrow={t("Illustrative execution")}
          title={
            <span id="exec-title">{t("Example workflow execution states.")}</span>
          }
        />
        <Reveal className="mx-auto mt-12 max-w-2xl">
          <div className="glass-strong overflow-hidden rounded-lg border">
            <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
              <p className="flex items-center gap-2 font-mono text-xs">
                <span
                  className={cn(
                    "size-2 rounded-full",
                    running ? "bg-success" : "bg-ink-subtle",
                  )}
                  aria-hidden="true"
                />
                <span className="text-ink-muted">
                  {running ? t("Workflow running") : t("Workflow finished")}
                </span>
              </p>
              <p className="font-mono text-xs text-ink-subtle">
                {t("Illustrative preview")}
              </p>
            </div>

            <ul className="divide-y divide-line bg-code">
              {STEPS.map((step, i) => {
                const s = states[i];
                return (
                  <motion.li
                    key={step.label}
                    className="flex items-center gap-3 px-5 py-3"
                    animate={{ opacity: s === "pending" ? 0.45 : 1 }}
                    transition={{ duration: 0.3 }}
                  >
                    {s === "done" && (
                      <Check className="size-4 shrink-0 text-success" aria-label={t("Done")} />
                    )}
                    {s === "running" && (
                      <Loader2 className="size-4 shrink-0 text-accent-ink" aria-label={t("Running")} />
                    )}
                    {s === "pending" && (
                      <Circle className="size-4 shrink-0 text-line-strong" aria-label={t("Pending")} />
                    )}
                    <span
                      className={cn(
                        "font-mono text-sm",
                        s === "pending" ? "text-ink-subtle" : "text-ink",
                      )}
                    >
                      {t(step.label)}
                    </span>
                  </motion.li>
                );
              })}
            </ul>

            <dl className="grid grid-cols-2 gap-px border-t border-line bg-line sm:grid-cols-4">
              {META.map(([k, v]) => (
                <div key={k} className="bg-code px-5 py-3.5">
                  <dt className="font-mono text-xs text-ink-subtle">
                    {t(k)}
                  </dt>
                  <dd
                    className={cn(
                      "mt-1 font-mono text-sm",
                      k === "Status"
                        ? running
                          ? "text-accent-ink"
                          : "text-ink-muted"
                        : "text-ink",
                    )}
                  >
                    {k === "Status" ? (running ? v : t("Done")) : v}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
