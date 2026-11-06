import { ArrowDown, Cpu, Settings2 } from "lucide-react";
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
  return (
    <section aria-labelledby="yaml-title" className="py-20 sm:py-24">
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
        <SectionHeader
          eyebrow={t("YAML generation")}
          title={
            <span id="yaml-title">
              {t("Visual configuration, valid GitHub Actions YAML.")}
            </span>
          }
        />

        <Reveal className="mx-auto mt-8 flex max-w-xl flex-col items-center gap-2 font-mono text-xs text-ink-subtle">
          <span className="rounded-md border border-line bg-surface-2 px-3 py-1.5">
            {t("Visual configuration")}
          </span>
          <ArrowDown className="size-4" aria-hidden="true" />
          <span className="flex items-center gap-1.5 rounded-md border border-accent/30 bg-accent/15 px-3 py-1.5 text-accent-ink">
            <Cpu className="size-3.5" aria-hidden="true" />
            {t("Workflow engine")}
          </span>
          <ArrowDown className="size-4" aria-hidden="true" />
          <span className="rounded-md border border-line bg-surface-2 px-3 py-1.5">
            {t("GitHub Actions YAML")}
          </span>
        </Reveal>

        <div className="mt-10 grid gap-4 lg:grid-cols-2">
          <Reveal className="glass-flat overflow-hidden rounded-lg border">
            <p className="flex items-center gap-2 border-b border-line px-5 py-3 font-mono text-xs text-ink-subtle">
              <Settings2 className="size-3.5" aria-hidden="true" />
              {t("Low-code")}
            </p>
            <dl className="divide-y divide-line">
              {CONFIG_ROWS.map(([k, v]) => (
                <div key={k} className="flex items-center justify-between px-5 py-3.5">
                  <dt className="text-sm text-ink-subtle">{t(k)}</dt>
                  <dd className="font-mono text-sm text-ink">{v}</dd>
                </div>
              ))}
            </dl>
          </Reveal>

          <Reveal delay={0.08} className="glass-flat overflow-hidden rounded-lg border">
            <p className="border-b border-line px-5 py-3 font-mono text-xs text-ink-subtle">
              workflow.yml
            </p>
            <pre className="overflow-x-auto bg-code p-5 font-mono text-sm leading-6 text-ink-muted">
              <code>{YAML_TEXT}</code>
            </pre>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
