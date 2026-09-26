import { useEffect, useRef, useState } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";
import { Clock3, ShieldAlert } from "lucide-react";
import { Reveal, SectionHeader } from "./Reveal";
import { EASE, staggerChild, staggerParent } from "./motion";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip";

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
          eyebrow="MLOps · AI predictions"
          title={
            <span id="mlops-title">
              Don&apos;t just run pipelines. Predict them.
            </span>
          }
          description="FlowOps uses execution history and Machine Learning to estimate pipeline duration and failure risk before the workflow starts."
        />

        <div
          ref={counterRef}
          className="mx-auto mt-12 grid max-w-3xl gap-4 sm:grid-cols-2"
        >
          <Reveal className="rounded-xl border border-[#27272A] bg-[#111113] p-6">
            <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.18em] text-[#71717A]">
              <Clock3 className="size-4" aria-hidden="true" />
              Estimated duration
            </div>
            <p className="mt-3 text-5xl font-bold tracking-tight text-[#FAFAFA]">
              {duration}
              <span className="ml-1 text-lg font-medium text-[#71717A]">sec</span>
            </p>
            <p className="mt-2 font-mono text-xs text-[#71717A]">
              ridge model · test MAE 17.5s
            </p>
          </Reveal>

          <Reveal delay={0.1} className="rounded-xl border border-[#27272A] bg-[#111113] p-6">
            <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.18em] text-[#71717A]">
              <ShieldAlert className="size-4" aria-hidden="true" />
              Failure risk
            </div>
            <p className="mt-3 text-5xl font-bold tracking-tight text-[#FAFAFA]">
              {risk}
              <span className="ml-1 text-lg font-medium text-[#71717A]">%</span>
            </p>
            <p className="mt-2 font-mono text-xs text-emerald-400">Low risk</p>
          </Reveal>
        </div>

        <Reveal className="mx-auto mt-4 max-w-3xl rounded-xl border border-[#27272A] bg-[#111113] p-6">
          <div className="flex items-center justify-between font-mono text-xs">
            <span className="text-[#A1A1AA]">Pipeline prediction</span>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="cursor-help text-[#71717A] underline decoration-dotted underline-offset-4">
                    {risk}% failure probability
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  Estimated by the failure classifier before execution starts.
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <div
            className="mt-3 h-2 overflow-hidden rounded-full bg-[#27272A]"
            role="progressbar"
            aria-valuenow={risk}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Failure probability"
          >
            <motion.div
              className="h-full rounded-full bg-emerald-400"
              initial={{ width: 0 }}
              whileInView={{ width: `${risk}%` }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ duration: reduce ? 0 : 1, ease: EASE }}
            />
          </div>
          <p className="mt-3 font-mono text-[11px] leading-relaxed text-[#71717A]">
            Example output. Production models are tracked in MLflow and
            retrained from collected execution data.
          </p>
        </Reveal>

        {/* pipeline chain */}
        <div className="mx-auto mt-16 max-w-2xl">
          <Reveal>
            <h3 className="text-center font-mono text-[11px] uppercase tracking-[0.22em] text-[#71717A]">
              From execution to prediction
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
                      ? "rounded-lg border border-violet-500/30 bg-violet-500/10 px-4 py-2 font-mono text-[13px] text-violet-200"
                      : "rounded-lg border border-[#27272A] bg-[#111113] px-4 py-2 font-mono text-[13px] text-[#A1A1AA]"
                  }
                >
                  {step}
                </span>
                {i < PIPELINE.length - 1 && (
                  <span aria-hidden="true" className="py-1 font-mono text-[#3f3f46]">
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
