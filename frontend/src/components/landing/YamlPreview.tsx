import { useRef, useState } from "react";
import {
  motion,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from "framer-motion";
import { Cpu, Settings2 } from "lucide-react";
import { SectionHeader } from "./Reveal";
import { ParallaxGlow } from "./fx";
import { cn } from "../../lib/utils";
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

const LINES = YAML_TEXT.split("\n");

/** Chaque ligne de configuration pilote un bloc de YAML (index de la ligne qui la déclenche). */
const CONFIG_ROWS: Array<[string, string, number]> = [
  ["Trigger", "Push", LINES.findIndex((l) => l.includes("push:"))],
  ["Runtime", "Node.js 22", LINES.findIndex((l) => l.includes("setup-node"))],
  ["Build", "npm run build", LINES.findIndex((l) => l.includes("npm run build"))],
  ["Test", "npm test", LINES.findIndex((l) => l.includes("npm test"))],
];

function highlight(line: string) {
  const m = line.match(/^(\s*(?:- )?)([\w.\-/]+)(:)(.*)$/);
  if (!m) return <span className="text-success">{line || " "}</span>;
  const [, indent, key, colon, rest] = m;
  return (
    <>
      {indent}
      <span className="text-accent-ink">{key}</span>
      <span className="text-ink-muted">{colon}</span>
      <span className="text-success">{rest}</span>
    </>
  );
}

export function YamlPreview() {
  const { t } = usePreferences();
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 0.9", "end 0.45"] });
  const sp = useSpring(scrollYProgress, { stiffness: 110, damping: 28, mass: 0.4 });
  // Les deux panneaux arrivent en V (rotation Y opposée) puis se mettent face à face.
  const leftRY = useTransform(sp, [0, 1], [reduce ? 0 : 22, 0]);
  const rightRY = useTransform(sp, [0, 1], [reduce ? 0 : -22, 0]);
  const leftX = useTransform(sp, [0, 1], [reduce ? 0 : -50, 0]);
  const rightX = useTransform(sp, [0, 1], [reduce ? 0 : 50, 0]);

  const [visible, setVisible] = useState(reduce ? LINES.length : 0);
  useMotionValueEvent(scrollYProgress, "change", (v) =>
    setVisible(reduce ? LINES.length : Math.min(LINES.length, Math.ceil(v * 1.25 * LINES.length))),
  );
  const reached = CONFIG_ROWS.filter(([, , idx]) => visible > idx).length;

  return (
    <section aria-labelledby="yaml-title" className="relative isolate py-20 sm:py-24">
      <ParallaxGlow tone="indigo" className="-right-32 top-1/4 h-96 w-96" />
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
        <SectionHeader
          eyebrow={t("YAML generation")}
          title={<span id="yaml-title">{t("Visual configuration, valid GitHub Actions YAML.")}</span>}
        />

        <div
          ref={ref}
          className="mt-12 grid items-stretch gap-4 lg:grid-cols-[1fr_auto_1fr]"
          style={{ perspective: 1400 }}
        >
          <motion.div
            style={{ rotateY: leftRY, x: leftX, transformOrigin: "100% 50%" }}
            className="glass-flat overflow-hidden rounded-lg border"
          >
            <p className="flex items-center gap-2 border-b border-line px-5 py-3 font-mono text-xs text-ink-subtle">
              <Settings2 className="size-3.5" aria-hidden="true" />
              {t("Low-code")}
            </p>
            <dl className="divide-y divide-line">
              {CONFIG_ROWS.map(([k, v], i) => {
                const on = i < reached;
                const current = i === reached - 1;
                return (
                  <div
                    key={k}
                    className={cn(
                      "flex items-center justify-between px-5 py-4 transition-all duration-500",
                      current ? "bg-accent/15" : on ? "bg-accent/5" : "opacity-50",
                    )}
                  >
                    <dt className="flex items-center gap-2 text-sm text-ink-subtle">
                      <span
                        className={cn(
                          "size-1.5 rounded-full transition-colors duration-500",
                          on ? "bg-accent-ink" : "bg-line-strong",
                          current && "animate-pulse",
                        )}
                      />
                      {t(k)}
                    </dt>
                    <dd className="font-mono text-sm text-ink">{v}</dd>
                  </div>
                );
              })}
            </dl>
          </motion.div>

          {/* moteur : flux lumineux entre les deux panneaux */}
          <div className="flex items-center justify-center lg:flex-col" aria-hidden="true">
            <span className="relative block h-10 w-px overflow-hidden bg-line-strong lg:h-16">
              <span className="beam-y absolute inset-x-0 top-0 block h-1/3 bg-accent-ink" />
            </span>
            <span className="relative flex size-12 items-center justify-center rounded-full border border-accent/40 bg-accent/15 text-accent-ink glow-accent">
              <span className="animate-pulse-ring absolute inset-0 rounded-full border border-accent" />
              <Cpu className="size-5" />
            </span>
            <span className="relative block h-10 w-px overflow-hidden bg-line-strong lg:h-16">
              <span className="beam-y absolute inset-x-0 top-0 block h-1/3 bg-accent-ink [animation-delay:1.1s]" />
            </span>
          </div>

          <motion.div
            style={{ rotateY: rightRY, x: rightX, transformOrigin: "0% 50%" }}
            className="glass-flat overflow-hidden rounded-lg border"
          >
            <p className="border-b border-line px-5 py-3 font-mono text-xs text-ink-subtle">workflow.yml</p>
            <pre className="h-[22rem] overflow-hidden bg-code p-5 font-mono text-sm leading-6 text-ink-muted">
              <code className="block">
                {LINES.map((line, i) => (
                  <span
                    key={i}
                    className={cn(
                      "block whitespace-pre transition-all duration-300",
                      i < visible ? "translate-x-0 opacity-100" : "-translate-x-3 opacity-0",
                      i === visible - 1 && "bg-accent/10",
                    )}
                  >
                    {highlight(line)}
                  </span>
                ))}
              </code>
            </pre>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
