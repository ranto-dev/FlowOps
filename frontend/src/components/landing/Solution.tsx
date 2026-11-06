import { MousePointerClick, PlayCircle, TrendingUp } from "lucide-react";
import { Reveal, SectionHeader } from "./Reveal";
import { ParallaxGlow, TiltCard } from "./fx";
import { usePreferences } from "../../lib/usePreferences";

const PILLARS = [
  {
    icon: MousePointerClick,
    title: "Design",
    text: "Configure workflows visually.",
    visual: (
      <div className="flex flex-col gap-2 font-mono text-xs" aria-hidden="true">
        {["push → main", "node 22 · ubuntu", "npm run build"].map((t, i) => (
          <span
            key={t}
            style={{ transitionDelay: `${i * 60}ms` }}
            className="rounded-md border border-line bg-code px-3 py-2 text-ink-muted transition-all duration-300 group-hover:translate-x-2 group-hover:border-accent/40 group-hover:text-ink"
          >
            {t}
          </span>
        ))}
      </div>
    ),
  },
  {
    icon: PlayCircle,
    title: "Execute",
    text: "Trigger GitHub Actions runs and refresh their execution status.",
    visual: (
      <div className="flex flex-col gap-2 font-mono text-xs" aria-hidden="true">
        {[
          ["✓", "Checkout", "text-success"],
          ["✓", "Setup Node", "text-success"],
          ["◉", "Build — running", "text-accent-ink"],
        ].map(([mark, label, color]) => (
          <span
            key={label}
            className="flex items-center gap-2 rounded-md border border-line bg-code px-3 py-2 text-ink-muted"
          >
            <span className={`${color} ${mark === "◉" ? "animate-pulse" : ""}`}>{mark}</span> {label}
          </span>
        ))}
      </div>
    ),
  },
  {
    icon: TrendingUp,
    title: "Optimize",
    text: "Use execution data and Machine Learning to predict and optimize your pipelines.",
    visual: (
      <div className="flex flex-col gap-2 font-mono text-xs" aria-hidden="true">
        <span className="rounded-md border border-line bg-code px-3 py-2 text-ink-muted">
          duration <span className="text-ink">≈ 128s</span>
        </span>
        <span className="rounded-md border border-line bg-code px-3 py-2 text-ink-muted transition-colors duration-300 group-hover:border-accent/40">
          failure risk <span className="text-accent-ink">23% · example</span>
        </span>
      </div>
    ),
  },
];

export function Solution() {
  const { t } = usePreferences();
  return (
    <section aria-labelledby="solution-title" className="relative isolate py-20 sm:py-24">
      <ParallaxGlow tone="indigo" className="-right-40 top-20 h-96 w-96" />
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
        <SectionHeader
          eyebrow={t("The solution")}
          title={
            <span id="solution-title">
              {t("One workflow.")}
              <br />
              {t("One interface. Complete visibility.")}
            </span>
          }
        />
        <div className="mt-12 grid gap-4 lg:grid-cols-3">
          {PILLARS.map((p, i) => (
            <Reveal key={p.title} delay={i * 0.12} x={i === 0 ? -60 : i === 2 ? 60 : 0} y={i === 1 ? 70 : 20} scale={0.92} blur={6}>
              <TiltCard className="glass-flat flex h-full flex-col rounded-lg border p-6">
                <span className="flex size-10 items-center justify-center rounded-md bg-accent/15 text-accent-ink [transform:translateZ(40px)]">
                  <p.icon className="size-5 transition-transform duration-300 group-hover:scale-125" aria-hidden="true" />
                </span>
                <h3 className="mt-4 text-xl font-semibold text-ink [transform:translateZ(24px)]">{t(p.title)}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-muted">{t(p.text)}</p>
                <div className="mt-6 flex-1 [transform:translateZ(16px)]">{p.visual}</div>
              </TiltCard>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
