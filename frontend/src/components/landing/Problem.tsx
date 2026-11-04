import { motion, useReducedMotion } from "framer-motion";
import { EyeOff, FileWarning, History } from "lucide-react";
import { SectionHeader } from "./Reveal";
import { staggerChild, staggerParent } from "./motion";
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
  const reduce = useReducedMotion();
  return (
    <section aria-labelledby="problem-title" className="py-24 sm:py-32">
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
        <SectionHeader
          eyebrow={t("The problem")}
          title={
            <span id="problem-title">
              {t("CI/CD shouldn't feel like configuration management.")}
            </span>
          }
        />
        <motion.ol
          variants={staggerParent}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
          className="mt-12 grid gap-4 md:grid-cols-3"
        >
          {PROBLEMS.map((p) => (
            <motion.li
              key={p.n}
              variants={reduce ? undefined : staggerChild}
              className="rounded-lg border border-line bg-surface p-6"
            >
              <div className="flex items-center justify-between">
                <p.icon className="size-5 text-ink-subtle" aria-hidden="true" />
                <span className="font-mono text-xs text-line-strong">
                  {p.n}
                </span>
              </div>
              <h3 className="mt-5 text-base font-semibold text-ink">
                {t(p.title)}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-muted">
                {t(p.text)}
              </p>
            </motion.li>
          ))}
        </motion.ol>
      </div>
    </section>
  );
}
