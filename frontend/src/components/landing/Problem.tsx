import { Card } from "../ui/Card";
import { EyeOff, FileWarning, History } from "lucide-react";
import { Reveal, SectionHeader } from "./Reveal";
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

export function Problem() {
  const { t } = usePreferences();
  return (
    <section aria-labelledby="problem-title" className="py-20 sm:py-24">
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
          {PROBLEMS.map((p, i) => (
            <Reveal as="li" key={p.n} delay={i * 0.06}>
              <Card variant="flat" className="h-full p-6">
              <div className="flex items-center justify-between">
                <span className="flex size-10 items-center justify-center rounded-md bg-accent/15 text-accent-ink">
                  <p.icon className="size-5" aria-hidden="true" />
                </span>
                <span className="font-mono text-xs text-ink-subtle">
                  {p.n}
                </span>
              </div>
              <h3 className="mt-5 text-base font-semibold text-ink">
                {t(p.title)}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-muted">
                {t(p.text)}
              </p>
              </Card>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  );
}
