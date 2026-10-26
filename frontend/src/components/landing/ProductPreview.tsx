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
          initial={{ opacity: 0, y: reduce ? 0 : 48 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.7, ease: EASE }}
          className="overflow-hidden rounded-xl border border-[#27272A] bg-[#111113] shadow-2xl shadow-black/50"
        >
          {/* window chrome */}
          <div className="flex items-center justify-between border-b border-[#27272A] bg-[#18181B] px-4 py-3">
            <div className="flex items-center gap-2" aria-hidden="true">
              <span className="size-2.5 rounded-full bg-[#3f3f46]" />
              <span className="size-2.5 rounded-full bg-[#3f3f46]" />
              <span className="size-2.5 rounded-full bg-[#3f3f46]" />
            </div>
            <p className="font-mono text-xs text-[#71717A]">
              FlowOps <span aria-hidden="true">—</span> workflow.yml
            </p>
            <span className="flex items-center gap-1.5 font-mono text-[11px] text-emerald-400">
              <span className="size-1.5 rounded-full bg-emerald-400" aria-hidden="true" />
              {t("Ready")}
            </span>
          </div>

          <div className="grid gap-0 lg:grid-cols-2">
            <motion.div
              variants={staggerParent}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, amount: 0.3 }}
              className="flex flex-col gap-3 border-b border-[#27272A] p-5 sm:p-6 lg:border-b-0 lg:border-r"
            >
              <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-[#71717A]">
                {t("Workflow")}
              </p>
              {STEPS.map((step) => (
                <motion.div
                  key={step.label}
                  variants={reduce ? undefined : staggerChild}
                  className="rounded-lg border border-[#27272A] bg-[#18181B] p-3.5"
                >
                  <p className="text-[11px] font-medium uppercase tracking-wider text-[#71717A]">
                    {t(step.label)}
                  </p>
                  <p className="mt-1 font-mono text-sm text-[#FAFAFA]">
                    {step.value}
                  </p>
                  <p className="mt-0.5 font-mono text-[11px] text-[#71717A]">
                    {step.detail}
                  </p>
                </motion.div>
              ))}
              <motion.div
                variants={reduce ? undefined : staggerChild}
                className="mt-1 flex items-center justify-center gap-2 rounded-lg bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white"
                aria-hidden="true"
              >
                <Play className="size-4" />
                {t("Generate workflow")}
              </motion.div>
            </motion.div>

            <div
              className="bg-[#09090B] p-5 sm:p-6"
              aria-label={t("Example generated YAML")}
            >
              <p className="mb-3 font-mono text-[11px] uppercase tracking-[0.18em] text-[#71717A]">
                {t("Example generated YAML")}
              </p>
              <pre className="min-h-36 overflow-x-auto font-mono text-[12px] leading-6 text-[#A1A1AA]">
                <code>{YAML_EXAMPLE}</code>
              </pre>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
