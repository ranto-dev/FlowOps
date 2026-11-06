import {
  FolderKanban,
  MousePointerClick,
  ScrollText,
  ServerCog,
  Timer,
  Zap,
} from "lucide-react";
import { Reveal, SectionHeader } from "./Reveal";
import { ParallaxGlow, TiltCard } from "./fx";
import { usePreferences } from "../../lib/usePreferences";

const FEATURES = [
  {
    icon: MousePointerClick,
    title: "Low-Code Workflow Builder",
    text: "Compose jobs and steps visually instead of hand-writing YAML.",
  },
  {
    icon: Zap,
    title: "GitHub Actions",
    text: "Generate valid workflow files ready to commit to your repository.",
  },
  {
    icon: ServerCog,
    title: "Execution monitoring",
    text: "Trigger runs and refresh their status from GitHub Actions.",
  },
  {
    icon: ScrollText,
    title: "Workflow Logs",
    text: "Retrieve and inspect available per-job logs from one console.",
  },
  {
    icon: Timer,
    title: "Prediction",
    text: "Estimate duration and failure risk before a workflow starts when compatible models are available.",
  },
  {
    icon: FolderKanban,
    title: "Project Management",
    text: "Organize repositories, workflows and runs per project.",
  },
];

export function Features() {
  const { t } = usePreferences();
  return (
    <section
      id="features"
      aria-labelledby="features-title"
      className="relative isolate scroll-mt-24 py-20 sm:py-24"
    >
      <ParallaxGlow className="left-1/2 top-0 h-[28rem] w-[44rem] -translate-x-1/2" from={-120} to={160} />
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
        <SectionHeader
          eyebrow={t("Features")}
          title={
            <span id="features-title">
              {t("Everything a pipeline needs, in one place.")}
            </span>
          }
        />
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f, i) => (
            <Reveal key={f.title} delay={(i % 3) * 0.1} y={50} scale={0.9} rotate={14} blur={5}>
              <TiltCard className="glass-flat rounded-lg border p-6">
                <span className="flex size-10 items-center justify-center rounded-md bg-accent/15 text-accent-ink transition-colors duration-300 group-hover:bg-accent group-hover:text-white [transform:translateZ(44px)]">
                  <f.icon className="size-5 transition-transform duration-500 group-hover:rotate-[360deg]" aria-hidden="true" />
                </span>
                <h3 className="pt-4 text-lg font-medium text-ink [transform:translateZ(26px)]">{t(f.title)}</h3>
                <p className="pt-2 text-sm leading-relaxed text-ink-muted [transform:translateZ(12px)]">{t(f.text)}</p>
              </TiltCard>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
