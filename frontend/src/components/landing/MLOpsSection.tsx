import { useEffect, useRef } from "react";
import { useInView, useReducedMotion } from "framer-motion";
import { Clock3, ShieldAlert } from "lucide-react";
import { Card } from "../ui/Card";
import { Reveal, SectionHeader } from "./Reveal";
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

/** Compteur animé : met à jour le texte du nœud directement (pas de setState à chaque image). */
function CountUp({ to, active, duration = 1200 }: { to: number; active: boolean; duration?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const reduce = useReducedMotion();
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (reduce) {
      node.textContent = String(to);
      return;
    }
    if (!active) return;
    let raf = 0;
    const start = performance.now();
    const step = (now: number) => {
      const p = Math.min((now - start) / duration, 1);
      node.textContent = String(Math.round(to * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [active, reduce, to, duration]);
  return <span ref={ref}>{reduce ? to : 0}</span>;
}

export function MLOpsSection() {
  const { t } = usePreferences();
  const counterRef = useRef<HTMLDivElement>(null);
  const counterInView = useInView(counterRef, { once: true, amount: 0.4 });

  return (
    <section
      id="mlops"
      aria-labelledby="mlops-title"
      className="scroll-mt-24 py-20 sm:py-24"
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
          <Reveal>
          <Card variant="flat" className="h-full p-6">
            <div className="flex items-center gap-3 text-sm font-medium text-ink-muted">
              <span className="flex size-9 items-center justify-center rounded-md bg-accent/15 text-accent-ink">
                <Clock3 className="size-4" aria-hidden="true" />
              </span>
              {t("Estimated duration")}
            </div>
            <p className="mt-4 text-3xl font-semibold tabular-nums text-ink">
              <CountUp to={128} active={counterInView} />
              <span className="ml-1 text-base font-medium text-ink-subtle">{t("sec")}</span>
            </p>
            <p className="mt-2 font-mono text-xs text-ink-subtle">
              {t("Illustrative value")}
            </p>
          </Card>
          </Reveal>

          <Reveal delay={0.1}>
          <Card variant="flat" className="h-full p-6">
            <div className="flex items-center gap-3 text-sm font-medium text-ink-muted">
              <span className="flex size-9 items-center justify-center rounded-md bg-accent/15 text-accent-ink">
                <ShieldAlert className="size-4" aria-hidden="true" />
              </span>
              {t("Failure risk")}
            </div>
            <p className="mt-4 text-3xl font-semibold tabular-nums text-ink">
              <CountUp to={23} active={counterInView} />
              <span className="ml-1 text-base font-medium text-ink-subtle">%</span>
            </p>
            <p className="mt-2 font-mono text-xs text-ink-subtle">{t("Illustrative value")}</p>
          </Card>
          </Reveal>
        </div>

        <Reveal className="mx-auto mt-4 max-w-3xl">
        <Card variant="flat" className="p-6">
          <div className="flex items-center justify-between font-mono text-xs">
            <span className="text-ink-muted">{t("Pipeline prediction")}</span>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="cursor-help text-ink-subtle underline decoration-dotted underline-offset-4">
                    <CountUp to={23} active={counterInView} />% {t("failure probability")}
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  {t("A model estimates failure risk when the failure classifier is available.")}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <div
            className="mt-3 h-2 overflow-hidden rounded-full bg-surface-2"
            role="progressbar"
            aria-valuenow={23}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={t("Failure probability")}
          >
            <div
              className="h-full origin-left rounded-full bg-accent transition-transform duration-1000 ease-out motion-reduce:transition-none"
              style={{ transform: `scaleX(${counterInView ? 0.23 : 0})` }}
            />
          </div>
          <p className="mt-3 font-mono text-xs leading-relaxed text-ink-subtle">
            {t("Illustrative values only. In the workspace, predictions come from available local models.")}
          </p>
        </Card>
        </Reveal>

        {/* pipeline chain */}
        <div className="mx-auto mt-16 max-w-2xl">
          <Reveal>
            <h3 className="text-center font-mono text-xs text-ink-subtle">
              {t("From execution to prediction")}
            </h3>
          </Reveal>
          <ol className="mt-6 flex flex-col items-center">
            {PIPELINE.map((step, i) => (
              <Reveal as="li" key={step} delay={Math.min(i, 5) * 0.05} className="flex flex-col items-center">
                <span
                  className={
                    i === 0 || i === PIPELINE.length - 1
                      ? "rounded-md border border-accent/30 bg-accent/15 px-4 py-2 font-mono text-sm text-accent-ink"
                      : "rounded-md border border-line bg-surface-2 px-4 py-2 font-mono text-sm text-ink-muted"
                  }
                >
                  {t(step)}
                </span>
                {i < PIPELINE.length - 1 && (
                  <span aria-hidden="true" className="py-1 font-mono text-ink-subtle">
                    ↓
                  </span>
                )}
              </Reveal>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
