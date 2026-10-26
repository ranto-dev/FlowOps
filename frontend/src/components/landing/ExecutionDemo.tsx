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
    const id = window.setInterval(() => {
      setTick((t) => (t >= STEPS.length ? 0 : t + 1));
    }, 1400);
    return () => window.clearInterval(id);
  }, [reduce]);

  const states = statesFor(tick);
  const running = tick < STEPS.length;

  return (
    <section aria-labelledby="exec-title" className="py-24 sm:py-32">
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
        <SectionHeader
          eyebrow={t("Illustrative execution")}
          title={
            <span id="exec-title">{t("Example workflow execution states.")}</span>
          }
        />
        <Reveal className="mx-auto mt-12 max-w-2xl">
          <div className="overflow-hidden rounded-xl border border-[#27272A] bg-[#111113]">
            <div className="flex items-center justify-between border-b border-[#27272A] bg-[#18181B] px-5 py-3.5">
              <p className="flex items-center gap-2 font-mono text-xs">
                <span
                  className={cn(
                    "size-2 rounded-full",
                    running ? "animate-pulse bg-emerald-400" : "bg-[#71717A]",
                  )}
                  aria-hidden="true"
                />
                <span className="text-[#A1A1AA]">
                  {running ? t("Workflow running") : t("Workflow finished")}
                </span>
              </p>
              <p className="font-mono text-[11px] text-[#71717A]">
                {t("Illustrative preview")}
              </p>
            </div>

            <ul className="divide-y divide-[#27272A]">
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
                      <Check className="size-4 shrink-0 text-emerald-400" aria-label={t("Done")} />
                    )}
                    {s === "running" && (
                      <Loader2 className="size-4 shrink-0 animate-spin text-violet-300" aria-label={t("Running")} />
                    )}
                    {s === "pending" && (
                      <Circle className="size-4 shrink-0 text-[#3f3f46]" aria-label={t("Pending")} />
                    )}
                    <span
                      className={cn(
                        "font-mono text-sm",
                        s === "pending" ? "text-[#71717A]" : "text-[#FAFAFA]",
                      )}
                    >
                      {t(step.label)}
                    </span>
                  </motion.li>
                );
              })}
            </ul>

            <dl className="grid grid-cols-2 gap-px border-t border-[#27272A] bg-[#27272A] sm:grid-cols-4">
              {META.map(([k, v]) => (
                <div key={k} className="bg-[#111113] px-5 py-3.5">
                  <dt className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#71717A]">
                    {t(k)}
                  </dt>
                  <dd
                    className={cn(
                      "mt-1 font-mono text-sm",
                      k === "Status"
                        ? running
                          ? "text-violet-300"
                          : "text-[#A1A1AA]"
                        : "text-[#FAFAFA]",
                    )}
                  >
                    {k === "Status" ? (running ? v                     : t("Done")) : v}
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
