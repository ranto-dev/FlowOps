import { motion, useReducedMotion } from "framer-motion";
import { Play } from "lucide-react";
import { EASE } from "./motion";
import { staggerChild, staggerParent } from "./motion";
import { usePreferences } from "../../lib/usePreferences";

const STEPS = [
  { label: "Trigger", value: "Push", detail: "on: push → main" },
  { label: "Build", value: "npm run build", detail: "node: 22" },
  { label: "Test", value: "npm test", detail: "ubuntu-latest" },
];

const YAML_EXAMPLE = `name: CI

on:
  push:
    branches: [main]
  repository_dispatch:
    types: [flowops_trigger]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm run build`;

export function ProductPreview() {
  const { t } = usePreferences();
  const reduce = useReducedMotion();

  return (
    <section
      id="product"
      aria-label={t("Illustrative workflow preview")}
      className="scroll-mt-24"
    >
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: reduce ? 0 : 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.4, ease: EASE }}
          className="overflow-hidden rounded-lg border border-line bg-surface"
        >
          {/* window chrome */}
          <div className="flex items-center justify-between border-b border-line bg-surface-2 px-4 py-3">
            <div className="flex items-center gap-2" aria-hidden="true">
              <span className="size-2.5 rounded-full bg-line-strong" />
              <span className="size-2.5 rounded-full bg-line-strong" />
              <span className="size-2.5 rounded-full bg-line-strong" />
            </div>
            <p className="font-mono text-xs text-ink-subtle">
              FlowOps <span aria-hidden="true">—</span> workflow.yml
            </p>
            <span className="flex items-center gap-1.5 font-mono text-xs text-success">
              <span className="size-1.5 rounded-full bg-success" aria-hidden="true" />
              {t("Ready")}
            </span>
          </div>

          <div className="grid gap-0 lg:grid-cols-2">
            <motion.div
              variants={staggerParent}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, amount: 0.3 }}
              className="flex flex-col gap-3 border-b border-line p-5 sm:p-6 lg:border-b-0 lg:border-r"
            >
              <p className="font-mono text-xs text-ink-subtle">
                {t("Workflow")}
              </p>
              {STEPS.map((step) => (
                <motion.div
                  key={step.label}
                  variants={reduce ? undefined : staggerChild}
                  className="rounded-lg border border-line bg-surface-2 p-3.5"
                >
                  <p className="text-xs font-medium text-ink-subtle">
                    {t(step.label)}
                  </p>
                  <p className="mt-1 font-mono text-sm text-ink">
                    {step.value}
                  </p>
                  <p className="mt-0.5 font-mono text-xs text-ink-subtle">
                    {step.detail}
                  </p>
                </motion.div>
              ))}
              <motion.div
                variants={reduce ? undefined : staggerChild}
                className="mt-1 flex items-center justify-center gap-2 rounded-md bg-accent px-4 py-2.5 text-sm font-semibold text-white"
                aria-hidden="true"
              >
                <Play className="size-4" />
                {t("Generate workflow")}
              </motion.div>
            </motion.div>

            <div
              className="bg-code p-5 sm:p-6"
              aria-label={t("Example generated YAML")}
            >
              <p className="mb-3 font-mono text-xs text-ink-subtle">
                {t("Example generated YAML")}
              </p>
              <pre className="min-h-36 overflow-x-auto font-mono text-xs leading-6 text-ink-muted">
                <code>{YAML_EXAMPLE}</code>
              </pre>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
