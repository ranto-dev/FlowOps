import { EyeOff, FileWarning, History } from "lucide-react";
import { Reveal, SectionHeader } from "./Reveal";
import { ParallaxGlow, TiltCard } from "./fx";
import { usePreferences } from "../../lib/usePreferences";

const PROBLEMS = [
  {
    n: "01",
    icon: FileWarning,
    title: "YAML complexity",
    text: "Writing and maintaining large workflow files quickly becomes difficult.",
  },
  {
    n: "02",
    icon: EyeOff,
    title: "Limited visibility",
    text: "Understanding what happens during a workflow execution can be difficult.",
  },
  {
    n: "03",
    icon: History,
    title: "Reactive optimization",
    text: "Most CI/CD systems only tell you that something went wrong after the execution.",
  },
];

/** Mini-illustrations : chaque carte « casse » au survol (jitter, flou, échec tardif). */
function YamlMess() {
  const rows = ["on: [push, pull_request", "  branches: main,", "jobs:build:", "   steps: - run", "uses: actions/checkout@"];
  return (
    <div className="[transform:translateZ(30px)] rounded-md border border-line bg-code p-3 font-mono text-xs" aria-hidden="true">
      {rows.map((r, i) => (
        <p
          key={r}
          style={{ "--delay": `${i * 0.03}s` } as React.CSSProperties}
          className={`jitter whitespace-pre ${i === 2 ? "text-danger" : "text-ink-subtle"}`}
        >
          {r}
        </p>
      ))}
      <p className="mt-1 text-danger">✕ Invalid workflow file</p>
    </div>
  );
}

function BlurredLogs() {
  return (
    <div className="[transform:translateZ(30px)] relative overflow-hidden rounded-md border border-line bg-code p-3 font-mono text-xs" aria-hidden="true">
      <div className="space-y-1 blur-[3px] transition-[filter] duration-500 group-hover:blur-[1px]">
        {["▸ step 4 · running…", "▸ ??? ", "▸ exit code 1", "▸ ▒▒▒▒▒▒▒▒▒▒"].map((l) => (
          <p key={l} className="text-ink-muted">{l}</p>
        ))}
      </div>
      <span className="animate-scan absolute inset-x-0 top-0 block h-1/2 bg-accent/10" />
    </div>
  );
}

function LateFailure() {
  return (
    <div className="[transform:translateZ(30px)] rounded-md border border-line bg-code p-3 font-mono text-xs" aria-hidden="true">
      <div className="h-2 overflow-hidden rounded-full bg-surface-2">
        <div className="h-full w-full origin-left rounded-full bg-success transition-[transform,background-color] duration-700 group-hover:bg-danger" />
      </div>
      <div className="mt-2 flex justify-between text-ink-subtle">
        <span>42 min</span>
        <span className="text-danger opacity-40 transition-opacity duration-300 group-hover:opacity-100">✕ failed</span>
      </div>
    </div>
  );
}

const VISUALS = [YamlMess, BlurredLogs, LateFailure];

export function Problem() {
  const { t } = usePreferences();
  return (
    <section aria-labelledby="problem-title" className="relative isolate py-20 sm:py-24">
      <ParallaxGlow className="-left-40 top-10 h-96 w-96" />
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
        <SectionHeader
          eyebrow={t("The problem")}
          title={
            <span id="problem-title">
              {t("CI/CD shouldn't feel like configuration management.")}
            </span>
          }
        />
        <ol className="mt-12 grid gap-4 md:grid-cols-3">
          {PROBLEMS.map((p, i) => {
            const Visual = VISUALS[i];
            return (
              <Reveal as="li" key={p.n} delay={i * 0.12} rotate={18} y={60} scale={0.94} blur={6}>
                <TiltCard className="glass-flat flex flex-col rounded-lg border p-6">
                  <div className="flex items-center justify-between">
                    <span className="flex size-10 items-center justify-center rounded-md bg-accent/15 text-accent-ink [transform:translateZ(40px)]">
                      <p.icon className="size-5 transition-transform duration-300 group-hover:rotate-[-8deg] group-hover:scale-110" aria-hidden="true" />
                    </span>
                    <span className="font-mono text-4xl font-semibold text-line-strong transition-colors duration-300 group-hover:text-accent-ink [transform:translateZ(20px)]">
                      {p.n}
                    </span>
                  </div>
                  <h3 className="mt-5 text-lg font-medium text-ink">{t(p.title)}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-ink-muted">{t(p.text)}</p>
                  <div className="mt-5"><Visual /></div>
                </TiltCard>
              </Reveal>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
