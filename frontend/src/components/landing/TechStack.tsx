import { Reveal, SectionHeader } from "./Reveal";
import { ParallaxGlow, TiltCard } from "./fx";
import { usePreferences } from "../../lib/usePreferences";

const STACK: Array<{ group: string; items: string[] }> = [
  { group: "Frontend", items: ["React", "TypeScript", "Tailwind CSS", "shadcn/ui"] },
  { group: "Backend", items: ["FastAPI", "Python"] },
  { group: "CI/CD", items: ["GitHub Actions"] },
  { group: "MLOps", items: ["Scikit-learn", "MLflow"] },
  { group: "Database", items: ["MongoDB"] },
];

const FLOW = ["React", "FastAPI", "GitHub Actions", "execution data", "MLflow", "predictions"];

export function TechStack() {
  const { t } = usePreferences();
  return (
    <section aria-labelledby="stack-title" className="relative isolate py-20 sm:py-24">
      <ParallaxGlow className="left-1/2 top-0 h-96 w-[36rem] -translate-x-1/2" />
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
        <SectionHeader
          eyebrow={t("Stack")}
          title={<span id="stack-title">{t("A modern, boring-in-a-good-way stack.")}</span>}
          description={t("No exotic dependencies. Standard tools, assembled cleanly.")}
        />
        <dl className="mx-auto mt-12 grid max-w-4xl gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {STACK.map((s, i) => (
            <Reveal key={s.group} delay={(i % 3) * 0.1} y={50} scale={0.9} rotate={14} blur={5}>
              <TiltCard className="glass-flat rounded-lg border p-5">
                <dt className="text-sm font-semibold text-ink [transform:translateZ(24px)]">{t(s.group)}</dt>
                <dd className="mt-3 flex flex-wrap gap-2 [transform:translateZ(36px)]">
                  {s.items.map((item, j) => (
                    <span
                      key={item}
                      style={{ transitionDelay: `${j * 50}ms` }}
                      className="rounded-md border border-line bg-surface-2 px-2.5 py-1 font-mono text-xs text-ink-muted transition-all duration-300 group-hover:-translate-y-1 group-hover:border-accent/50 group-hover:text-ink"
                    >
                      {item}
                    </span>
                  ))}
                </dd>
              </TiltCard>
            </Reveal>
          ))}
          <Reveal className="rounded-lg border border-dashed border-line-strong p-5 sm:col-span-2 lg:col-span-1" y={50} scale={0.9} blur={5}>
            <p className="font-mono text-xs text-ink-subtle">{t("Data flow")}</p>
            <div className="mt-3 flex flex-wrap items-center gap-1.5 font-mono text-xs" aria-hidden="true">
              {FLOW.map((node, i) => (
                <span key={node} className="flex items-center gap-1.5">
                  <span
                    style={{ "--delay": `${i * 0.5}s` } as React.CSSProperties}
                    className="animate-chip-glow rounded-md border border-line px-2 py-1"
                  >
                    {node}
                  </span>
                  {i < FLOW.length - 1 && <span className="text-ink-subtle">→</span>}
                </span>
              ))}
            </div>
            <p className="sr-only">React → FastAPI → GitHub Actions → execution data → MLflow → predictions</p>
          </Reveal>
        </dl>
      </div>
    </section>
  );
}
