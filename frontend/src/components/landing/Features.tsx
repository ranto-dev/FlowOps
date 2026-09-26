import { motion, useReducedMotion } from "framer-motion";
import {
  Boxes,
  FolderKanban,
  LineChart,
  MousePointerClick,
  ScrollText,
  ServerCog,
  Timer,
  Zap,
} from "lucide-react";
import { SectionHeader } from "./Reveal";
import { staggerChild, staggerParent } from "./motion";
import { Card, CardDescription, CardHeader, CardTitle } from "./ui/card";

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
    title: "Real-time Execution",
    text: "Trigger runs and follow every job as it happens.",
  },
  {
    icon: ScrollText,
    title: "Workflow Logs",
    text: "Stream and inspect per-job logs from a single console.",
  },
  {
    icon: Timer,
    title: "Prediction",
    text: "Estimate duration and failure risk before a workflow starts.",
  },
  {
    icon: Boxes,
    title: "MLOps",
    text: "Retrain models on your own execution data with one command.",
  },
  {
    icon: LineChart,
    title: "Model Tracking",
    text: "Every model version, metric and threshold tracked in MLflow.",
  },
  {
    icon: FolderKanban,
    title: "Project Management",
    text: "Organize repositories, workflows and runs per project.",
  },
];

export function Features() {
  const reduce = useReducedMotion();
  return (
    <section
      id="features"
      aria-labelledby="features-title"
      className="scroll-mt-24 py-24 sm:py-32"
    >
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
        <SectionHeader
          eyebrow="Features"
          title={
            <span id="features-title">
              Everything a pipeline needs, in one place.
            </span>
          }
        />
        <motion.div
          variants={staggerParent}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.1 }}
          className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
        >
          {FEATURES.map((f) => (
            <motion.div key={f.title} variants={reduce ? undefined : staggerChild}>
              <Card className="h-full p-6 transition-colors hover:border-zinc-700">
                <f.icon className="size-5 text-violet-300" aria-hidden="true" />
                <CardHeader className="p-0 pt-4">
                  <CardTitle className="text-[15px]">{f.title}</CardTitle>
                </CardHeader>
                <CardDescription className="pt-2 text-[13px]">
                  {f.text}
                </CardDescription>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
