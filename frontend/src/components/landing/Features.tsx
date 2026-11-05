import { motion, useReducedMotion } from "framer-motion";
import {
  FolderKanban,
  MousePointerClick,
  ScrollText,
  ServerCog,
  Timer,
  Zap,
} from "lucide-react";
import { SectionHeader } from "./Reveal";
import { staggerChild, staggerParent } from "./motion";
import { Card } from "../ui/Card";
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
  const reduce = useReducedMotion();
  return (
    <section
      id="features"
      aria-labelledby="features-title"
      className="scroll-mt-24 py-20 sm:py-24"
    >
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
        <SectionHeader
          eyebrow={t("Features")}
          title={
            <span id="features-title">
              {t("Everything a pipeline needs, in one place.")}
            </span>
          }
        />
        <motion.div
          variants={staggerParent}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.1 }}
          className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
        >
          {FEATURES.map((f) => (
            <motion.div key={f.title} variants={reduce ? undefined : staggerChild}>
              <Card interactive className="h-full p-6">
                <span className="flex size-10 items-center justify-center rounded-md bg-accent/15 text-accent-ink">
                  <f.icon className="size-5" aria-hidden="true" />
                </span>
                <h3 className="pt-4 text-base font-semibold text-ink">
                  {t(f.title)}
                </h3>
                <p className="pt-2 text-sm leading-relaxed text-ink-muted">
                  {t(f.text)}
                </p>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
