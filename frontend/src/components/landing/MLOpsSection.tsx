import { useEffect, useRef, useState } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";
import { Clock3, ShieldAlert } from "lucide-react";
import { Reveal, SectionHeader } from "./Reveal";
import { EASE, staggerChild, staggerParent } from "./motion";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip";
import { usePreferences } from "../../lib/usePreferences";

const PIPELINE = [
  "GitHub Actions",
  "Execution Data",
  "ETL",
  "Feature Engineering",
  "ML Training",
  "MLflow",
  "Model Registry",
  "FastAPI",
  "FlowOps",
];

function useCountUp(target: number, active: boolean, reduce: boolean, duration = 1200): number {
  const [value, setValue] = useState(reduce ? target : 0);
  useEffect(() => {
    if (!active || reduce) {
      if (reduce) setValue(target);
      return;
    }
    let raf = 0;
    const start = performance.now();
    const step = (now: number) => {
      const p = Math.min((now - start) / duration, 1);
      setValue(Math.round(target * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [active, reduce, target, duration]);
  return value;
}

export function MLOpsSection() {
  const { t } = usePreferences();
  const reduce = useReducedMotion();
  const counterRef = useRef<HTMLDivElement>(null);
  const counterInView = useInView(counterRef, { once: true, amount: 0.4 });
  const duration = useCountUp(128, counterInView, reduce ?? false);
  const risk = useCountUp(23, counterInView, reduce ?? false);

  return (
    <section
      id="mlops"
      aria-labelledby="mlops-title"
      className="scroll-mt-24 py-24 sm:py-32"
    >
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
        <SectionHeader
          eyebrow={t("MLOps · AI predictions")}
          title={
            <span id="mlops-title">
              {t("Don't just run pipelines. Predict them.")}
            </span>
          }
          description={t("FlowOps uses execution history and machine learning to estimate pipeline duration and failure risk before the workflow starts when compatible models are available.")}
        />

        <div
          ref={counterRef}
          className="mx-auto mt-12 grid max-w-3xl gap-4 sm:grid-cols-2"
        >
          <Reveal className="rounded-lg border border-line bg-surface p-6">
            <div className="flex items-center gap-2 font-mono text-xs text-ink-subtle">
              <Clock3 className="size-4" aria-hidden="true" />
              {t("Estimated duration")}
            </div>
            <p className="mt-3 text-3xl font-semibold text-ink">
              {duration}
              <span className="ml-1 text-base font-medium text-ink-subtle">{t("sec")}</span>
            </p>
            <p className="mt-2 font-mono text-xs text-ink-subtle">
              {t("Illustrative value")}
            </p>
          </Reveal>

          <Reveal delay={0.1} className="rounded-lg border border-line bg-surface p-6">
            <div className="flex items-center gap-2 font-mono text-xs text-ink-subtle">
              <ShieldAlert className="size-4" aria-hidden="true" />
              {t("Failure risk")}
            </div>
            <p className="mt-3 text-3xl font-semibold text-ink">
              {risk}
              <span className="ml-1 text-base font-medium text-ink-subtle">%</span>
            </p>
            <p className="mt-2 font-mono text-xs text-ink-subtle">{t("Illustrative value")}</p>
          </Reveal>
        </div>

        <Reveal className="mx-auto mt-4 max-w-3xl rounded-lg border border-line bg-surface p-6">
          <div className="flex items-center justify-between font-mono text-xs">
            <span className="text-ink-muted">{t("Pipeline prediction")}</span>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="cursor-help text-ink-subtle underline decoration-dotted underline-offset-4">
                    {risk}% {t("failure probability")}
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  {t("A model estimates failure risk when the failure classifier is available.")}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <div
            className="mt-3 h-2 overflow-hidden rounded-full bg-line"
            role="progressbar"
            aria-valuenow={risk}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={t("Failure probability")}
          >
            <motion.div
              className="h-full rounded-full bg-accent"
              initial={{ width: 0 }}
              whileInView={{ width: `${risk}%` }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ duration: reduce ? 0 : 1, ease: EASE }}
            />
          </div>
          <p className="mt-3 font-mono text-xs leading-relaxed text-ink-subtle">
            {t("Illustrative values only. In the workspace, predictions come from available local models.")}
          </p>
        </Reveal>

        {/* pipeline chain */}
        <div className="mx-auto mt-16 max-w-2xl">
          <Reveal>
            <h3 className="text-center font-mono text-xs text-ink-subtle">
              {t("From execution to prediction")}
            </h3>
          </Reveal>
          <motion.ol
            variants={staggerParent}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.2 }}
            className="mt-6 flex flex-col items-center"
          >
            {PIPELINE.map((step, i) => (
              <motion.li
                key={step}
                variants={reduce ? undefined : staggerChild}
                className="flex flex-col items-center"
              >
                <span
                  className={
                    i === 0 || i === PIPELINE.length - 1
                      ? "rounded-md border border-accent/30 bg-accent/15 px-4 py-2 font-mono text-sm text-accent-ink"
                      : "rounded-md border border-line bg-surface px-4 py-2 font-mono text-sm text-ink-muted"
                  }
                >
                  {t(step)}
                </span>
                {i < PIPELINE.length - 1 && (
                  <span aria-hidden="true" className="py-1 font-mono text-line-strong">
                    ↓
                  </span>
                )}
              </motion.li>
            ))}
          </motion.ol>
        </div>
      </div>
    </section>
  );
}
