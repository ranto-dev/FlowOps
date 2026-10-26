import { motion, useReducedMotion } from "framer-motion";
import { ArrowDown, Cpu, Settings2 } from "lucide-react";
import { EASE } from "./motion";
import { Reveal, SectionHeader } from "./Reveal";
import { usePreferences } from "../../lib/usePreferences";

const YAML_TEXT = `name: CI

on:
  push:

jobs:
  build:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4

      - run: npm install

      - run: npm run build

      - run: npm test`;

const CONFIG_ROWS: Array<[string, string]> = [
  ["Trigger", "Push"],
  ["Runtime", "Node.js 22"],
  ["Build", "npm run build"],
  ["Test", "npm test"],
];

export function YamlPreview() {
  const { t } = usePreferences();
  const reduce = useReducedMotion();
  return (
    <section aria-labelledby="yaml-title" className="py-24 sm:py-32">
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
        <SectionHeader
          eyebrow={t("YAML generation")}
          title={
            <span id="yaml-title">
              {t("Visual configuration, valid GitHub Actions YAML.")}
            </span>
          }
        />

        <Reveal className="mx-auto mt-8 flex max-w-xl flex-col items-center gap-2 font-mono text-xs text-[#71717A]">
          <span className="rounded-md border border-[#27272A] bg-[#111113] px-3 py-1.5">
            {t("Visual configuration")}
          </span>
          <ArrowDown className="size-4" aria-hidden="true" />
          <span className="flex items-center gap-1.5 rounded-md border border-violet-500/30 bg-violet-500/10 px-3 py-1.5 text-violet-300">
            <Cpu className="size-3.5" aria-hidden="true" />
            {t("Workflow engine")}
          </span>
          <ArrowDown className="size-4" aria-hidden="true" />
          <span className="rounded-md border border-[#27272A] bg-[#111113] px-3 py-1.5">
            GitHub Actions YAML
          </span>
        </Reveal>

        <div className="mt-10 grid gap-4 lg:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, x: reduce ? 0 : -24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.7, ease: EASE }}
            className="overflow-hidden rounded-xl border border-[#27272A] bg-[#111113]"
          >
            <p className="flex items-center gap-2 border-b border-[#27272A] bg-[#18181B] px-5 py-3 font-mono text-[11px] uppercase tracking-[0.18em] text-[#71717A]">
              <Settings2 className="size-3.5" aria-hidden="true" />
              {t("Low-code")}
            </p>
            <dl className="divide-y divide-[#27272A]">
              {CONFIG_ROWS.map(([k, v]) => (
                <div key={k} className="flex items-center justify-between px-5 py-3.5">
                  <dt className="text-sm text-[#71717A]">{t(k)}</dt>
                  <dd className="font-mono text-sm text-[#FAFAFA]">{v}</dd>
                </div>
              ))}
            </dl>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: reduce ? 0 : 24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.7, ease: EASE }}
            className="overflow-hidden rounded-xl border border-[#27272A] bg-[#09090B]"
          >
            <p className="border-b border-[#27272A] bg-[#18181B] px-5 py-3 font-mono text-[11px] uppercase tracking-[0.18em] text-[#71717A]">
              workflow.yml
            </p>
            <pre className="overflow-x-auto p-5 font-mono text-[13px] leading-6 text-[#A1A1AA]">
              <code>{YAML_TEXT}</code>
            </pre>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
