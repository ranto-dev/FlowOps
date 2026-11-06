import { useEffect, useRef } from "react";
import { useInView, useReducedMotion } from "framer-motion";
import { Clock3, ShieldAlert } from "lucide-react";
import { Reveal, SectionHeader } from "./Reveal";
import { ParallaxGlow, ScrollChain, TiltCard } from "./fx";
import { Card } from "../ui/Card";
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

const BARS = [38, 62, 45, 80, 55, 92, 70, 100, 66, 84];

/** Jauge circulaire : l'arc se dessine quand la section entre à l'écran. */
function RingGauge({ value, active }: { value: number; active: boolean }) {
  const C = 2 * Math.PI * 40;
  return (
    <svg viewBox="0 0 100 100" className="size-24 -rotate-90" aria-hidden="true">
      <circle cx="50" cy="50" r="40" fill="none" strokeWidth="8" className="stroke-surface-2" />
      <circle
        cx="50"
        cy="50"
        r="40"
        fill="none"
        strokeWidth="8"
        strokeLinecap="round"
        className="stroke-accent-ink drop-shadow-[0_0_6px_rgb(139_92_246)]"
        style={{
          strokeDasharray: C,
          strokeDashoffset: active ? C * (1 - value / 100) : C,
          transition: "stroke-dashoffset 1.4s cubic-bezier(0.21,0.47,0.32,0.98)",
        }}
      />
    </svg>
  );
}

export function MLOpsSection() {
  const { t } = usePreferences();
  const counterRef = useRef<HTMLDivElement>(null);
  const counterInView = useInView(counterRef, { once: true, amount: 0.4 });

  return (
    <section
      id="mlops"
      aria-labelledby="mlops-title"
      className="relative isolate scroll-mt-24 py-20 sm:py-24"
    >
      <ParallaxGlow className="-right-40 top-24 h-[30rem] w-[30rem]" from={-120} to={160} />
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
          <Reveal x={-50} scale={0.92} blur={5}>
            <TiltCard className="glass-flat rounded-lg border p-6">
              <div className="flex items-center gap-3 text-sm font-medium text-ink-muted [transform:translateZ(24px)]">
                <span className="flex size-9 items-center justify-center rounded-md bg-accent/15 text-accent-ink">
                  <Clock3 className="size-4" aria-hidden="true" />
                </span>
                {t("Estimated duration")}
              </div>
              <p className="mt-4 text-4xl font-semibold tabular-nums text-ink [transform:translateZ(36px)]">
                <CountUp to={128} active={counterInView} />
                <span className="ml-1 text-base font-medium text-ink-subtle">{t("sec")}</span>
              </p>
              <div className="mt-4 flex h-12 items-end gap-1" aria-hidden="true">
                {BARS.map((h, i) => (
                  <span
                    key={i}
                    className="w-full origin-bottom rounded-sm bg-accent/60 transition-all duration-700 group-hover:bg-accent-ink"
                    style={{
                      height: `${h}%`,
                      transform: `scaleY(${counterInView ? 1 : 0})`,
                      transitionDelay: `${i * 70}ms`,
                    }}
                  />
                ))}
              </div>
              <p className="mt-3 font-mono text-xs text-ink-subtle">{t("Illustrative value")}</p>
            </TiltCard>
          </Reveal>

          <Reveal x={50} scale={0.92} blur={5} delay={0.1}>
            <TiltCard className="glass-flat rounded-lg border p-6">
              <div className="flex items-center gap-3 text-sm font-medium text-ink-muted [transform:translateZ(24px)]">
                <span className="flex size-9 items-center justify-center rounded-md bg-accent/15 text-accent-ink">
                  <ShieldAlert className="size-4" aria-hidden="true" />
                </span>
                {t("Failure risk")}
              </div>
              <div className="mt-4 flex items-center justify-between [transform:translateZ(36px)]">
                <p className="text-4xl font-semibold tabular-nums text-ink">
                  <CountUp to={23} active={counterInView} />
                  <span className="ml-1 text-base font-medium text-ink-subtle">%</span>
                </p>
                <RingGauge value={23} active={counterInView} />
              </div>
              <p className="mt-3 font-mono text-xs text-ink-subtle">{t("Illustrative value")}</p>
            </TiltCard>
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
          <ScrollChain
            className="mt-6"
            gap="h-7"
            count={PIPELINE.length}
            renderItem={(i, active) => {
              const edge = i === 0 || i === PIPELINE.length - 1;
              return (
                <div className="flex justify-center">
                  <span
                    className={`rounded-md border px-4 py-2 font-mono text-sm transition-all duration-500 hover:scale-110 ${
                      edge
                        ? "border-accent/40 bg-accent/15 text-accent-ink"
                        : active
                          ? "border-accent/40 bg-surface-2 text-ink shadow-[0_0_24px_-6px_rgb(139_92_246/0.7)]"
                          : "border-line bg-surface-2 text-ink-muted"
                    }`}
                  >
                    {t(PIPELINE[i])}
                  </span>
                </div>
              );
            }}
          />
        </div>
      </div>
    </section>
  );
}
