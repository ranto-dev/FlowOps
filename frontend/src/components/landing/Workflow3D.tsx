import { useEffect, useState } from "react";
import type { PointerEvent, ReactNode } from "react";
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from "framer-motion";
import { CheckCircle2, FileCode, Layers, Play, Plus, Settings } from "lucide-react";
import { usePreferences } from "../../lib/usePreferences";
import { cn } from "../../lib/utils";

const EASE = [0.21, 0.47, 0.32, 0.98] as const;

/**
 * Maquette 3D = formulaire de configuration (gauche) + aperçu YAML avec prédiction (droite).
 * Boucle : les étapes s'ajoutent une à une, le YAML se génère en miroir, la prédiction se met à jour.
 */
const STEPS = [
  { type: "Checkout", detail: "actions/checkout@v4", yaml: ["- uses: actions/checkout@v4"] },
  {
    type: "Set up Node.js",
    detail: "node 22",
    yaml: ["- uses: actions/setup-node@v4", "  with:", "    node-version: 22"],
  },
  { type: "Run npm", detail: "npm ci", yaml: ["- run: npm ci"] },
  { type: "Run npm", detail: "npm run build", yaml: ["- run: npm run build"] },
];

const HEAD = [
  "name: CI",
  "on:",
  "  push:",
  "    branches: [main]",
  "  repository_dispatch:",
  "    types: [flowops_trigger]",
  "jobs:",
  "  build:",
  "    runs-on: ubuntu-latest",
  "    steps:",
];

const DURATION = [null, 18, 52, 96, 128];
const RISK = [null, 4, 9, 14, 23];
const FINAL = STEPS.length + 1; // stade « généré / enregistré »
const TICK_MS = 1500;

function buildYaml(count: number): { text: string; fresh: boolean }[] {
  const lines = HEAD.map((text) => ({ text, fresh: false }));
  STEPS.slice(0, count).forEach((s, i) => {
    s.yaml.forEach((y) => lines.push({ text: `      ${y}`, fresh: i === count - 1 }));
  });
  return lines;
}

/** Coloration minimale, mêmes règles que le YamlPreview de l'app. */
function highlight(line: string): ReactNode {
  const m = line.match(/^(\s*(?:- )?)([\w.\-/]+)(:)(.*)$/);
  if (!m) return <span className="text-success">{line}</span>;
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

function FakeField({ label, value, mono = true }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="min-w-0">
      <span className="mb-1 block text-xs font-medium text-ink-muted">{label}</span>
      <div
        className={cn(
          "truncate rounded-md border border-line-strong bg-surface-2 px-3 py-1.5 text-xs text-ink",
          mono && "font-mono",
        )}
      >
        {value}
      </div>
    </div>
  );
}

export function Workflow3D() {
  const { t } = usePreferences();
  const reduce = useReducedMotion();
  const [stage, setStage] = useState(reduce ? FINAL : 0);

  useEffect(() => {
    if (reduce) return;
    const id = window.setInterval(
      () => setStage((s) => (s >= FINAL ? 0 : s + 1)),
      TICK_MS,
    );
    return () => window.clearInterval(id);
  }, [reduce]);

  const count = Math.min(stage, STEPS.length);
  const lines = buildYaml(count);
  const duration = DURATION[count];
  const risk = RISK[count];
  const done = stage >= FINAL;

  // Tilt souris : mx/my ∈ [-0.5, 0.5] → ressorts → rotations.
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 80, damping: 18 });
  const sy = useSpring(my, { stiffness: 80, damping: 18 });
  const tiltY = useTransform(sx, [-0.5, 0.5], [-10, 10]);
  const tiltX = useTransform(sy, [-0.5, 0.5], [22, 10]);
  const rotateX = reduce ? 14 : tiltX;
  const rotateY = reduce ? 0 : tiltY;

  const onMove = (e: PointerEvent<HTMLDivElement>) => {
    if (reduce) return;
    const r = e.currentTarget.getBoundingClientRect();
    mx.set((e.clientX - r.left) / r.width - 0.5);
    my.set((e.clientY - r.top) / r.height - 0.5);
  };
  const onLeave = () => {
    mx.set(0);
    my.set(0);
  };

  return (
    <div
      id="product"
      role="img"
      aria-label={t("Illustrative workflow preview")}
      className="relative mx-auto w-full max-w-5xl scroll-mt-24"
      style={{ perspective: 1600 }}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
    >
      <div
        aria-hidden="true"
        className="aurora aurora-violet -inset-x-10 -bottom-10 top-1/3 !animate-none opacity-80"
      />
      <motion.div
        initial={reduce ? false : { opacity: 0, y: 60, rotateX: 34 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.1, delay: 0.3, ease: EASE }}
        style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
        className="glass-strong relative rounded-lg border shadow-[0_40px_120px_-20px_rgb(0_0_0/0.8)]"
      >
        {/* barre de fenêtre */}
        <div className="flex items-center justify-between border-b border-line px-4 py-3">
          <div className="flex items-center gap-2" aria-hidden="true">
            <span className="size-2.5 rounded-full bg-line-strong" />
            <span className="size-2.5 rounded-full bg-line-strong" />
            <span className="size-2.5 rounded-full bg-line-strong" />
          </div>
          <p className="font-mono text-xs text-ink-subtle">FlowOps · ci.yaml</p>
          <span className="flex items-center gap-1.5 font-mono text-xs text-success">
            <span className="size-1.5 animate-pulse rounded-full bg-success" aria-hidden="true" />
            {t("Live")}
          </span>
        </div>

        <div
          className="grid gap-4 p-4 text-left md:grid-cols-2"
          style={{ transformStyle: "preserve-3d" }}
        >
          {/* ---- Formulaire de configuration ---- */}
          <motion.div
            style={{ z: 20, transformStyle: "preserve-3d" }}
            className="flex min-w-0 flex-col gap-4 rounded-md bg-surface-2/40 p-4"
          >
            <h3 className="flex items-center gap-2 text-sm font-semibold text-ink">
              <Settings className="size-4 text-accent-ink" aria-hidden="true" /> 1. {t("Pipeline configuration")}
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <FakeField label={t("Workflow filename")} value="ci.yaml" />
              <FakeField label={t("Branch filter")} value="main" />
            </div>
            <div>
              <span className="mb-1 block text-xs font-medium text-ink-muted">{t("Trigger events")}</span>
              <div className="flex flex-wrap gap-3 rounded-md border border-line-strong bg-surface-2 px-3 py-2">
                {[
                  ["push", true],
                  ["pull_request", false],
                  ["workflow_dispatch", false],
                ].map(([ev, on]) => (
                  <span key={String(ev)} className="flex items-center gap-1.5 text-xs text-ink">
                    <span
                      className={cn(
                        "flex size-3.5 items-center justify-center rounded-sm border",
                        on ? "border-accent bg-accent text-white" : "border-line-strong",
                      )}
                    >
                      {on && <CheckCircle2 className="size-2.5" />}
                    </span>
                    {String(ev)}
                  </span>
                ))}
              </div>
            </div>

            <h3 className="flex items-center gap-2 text-sm font-semibold text-ink">
              <Layers className="size-4 text-accent-ink" aria-hidden="true" /> 2. {t("Jobs and orchestration")}
            </h3>
            <div className="flex flex-wrap gap-2">
              <span className="rounded-full border border-accent/30 bg-accent/15 px-3 py-1 text-xs font-medium text-accent-ink">
                build
              </span>
              <span className="rounded-full border border-line-strong bg-surface-2/50 px-3 py-1 text-xs text-ink-muted">
                test
              </span>
              <span className="flex items-center gap-1 rounded-full border border-dashed border-line-strong px-3 py-1 text-xs text-ink-subtle">
                <Plus className="size-3" aria-hidden="true" /> {t("Add job")}
              </span>
            </div>
            <div className="rounded-md border border-line-strong bg-surface p-3">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-semibold text-ink">{t("Workflow steps")}</span>
                <span className="font-mono text-xs text-ink-subtle">ubuntu-latest</span>
              </div>
              <ol className="flex min-h-[8.5rem] flex-col gap-1.5">
                {STEPS.slice(0, count).map((s, i) => (
                  <motion.li
                    key={`${s.detail}-${i}`}
                    initial={reduce ? false : { opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, ease: EASE }}
                    className={cn(
                      "flex items-center justify-between rounded-md border px-2.5 py-1.5 text-xs",
                      i === count - 1 && !done
                        ? "border-accent/50 bg-surface-2 shadow-[0_0_24px_-6px_rgb(139_92_246/0.6)]"
                        : "border-line bg-surface-2/50",
                    )}
                  >
                    <span className="flex items-center gap-2 text-ink">
                      <CheckCircle2 className="size-3.5 text-accent-ink" aria-hidden="true" />
                      {i + 1}. {t(s.type)}
                    </span>
                    <span className="font-mono text-ink-subtle">{s.detail}</span>
                  </motion.li>
                ))}
              </ol>
            </div>
            <div
              className={cn(
                "flex items-center justify-center gap-2 rounded-full bg-ink px-4 py-2 text-xs font-medium text-canvas transition-transform duration-300",
                done ? "glow-accent scale-[1.03]" : "opacity-90",
              )}
            >
              <Play className="size-3.5 fill-current" aria-hidden="true" />
              {t("Generate workflow YAML")}
            </div>
          </motion.div>

          {/* ---- Aperçu YAML + prédiction ---- */}
          <motion.div
            style={{ z: 45, transformStyle: "preserve-3d" }}
            className="flex min-w-0 flex-col overflow-hidden rounded-md border border-line bg-code"
          >
            <div className="flex items-center gap-2 border-b border-line px-4 py-2.5 font-mono text-xs text-ink">
              <FileCode className="size-4 text-accent-ink" aria-hidden="true" />
              ci.yaml
            </div>
            <pre className="h-[15.5rem] overflow-hidden px-3 py-3 font-mono text-xs leading-5">
              <code className="block">
                {lines.map((l, i) => (
                  <span
                    key={`${i}-${l.text}`}
                    className={cn("flex", l.fresh && !done && "bg-accent/10")}
                  >
                    <span className="w-8 shrink-0 select-none pr-3 text-right text-ink-subtle">{i + 1}</span>
                    <span className="whitespace-pre">{highlight(l.text)}</span>
                  </span>
                ))}
              </code>
            </pre>
            <motion.div
              style={{ z: 70 }}
              className="flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-line bg-surface px-4 py-2.5 text-xs tabular-nums text-ink"
            >
              <span className="font-medium text-ink-muted">
                {t(duration == null ? "Prediction pending" : "Predictions available")}
              </span>
              <span>
                {t("Estimated duration")}:{" "}
                <strong className="font-mono font-semibold">{duration == null ? "—" : `${duration}s`}</strong>
              </span>
              <span className="text-ink-subtle" aria-hidden="true">|</span>
              <span>
                {t("Failure risk")}:{" "}
                <strong className="font-mono font-semibold">{risk == null ? "—" : `${risk}%`}</strong>
              </span>
            </motion.div>
          </motion.div>
        </div>

        {/* toast flottant une fois le workflow généré */}
        <motion.div
          animate={{ opacity: done ? 1 : 0, y: done ? 0 : 12 }}
          transition={{ duration: 0.4 }}
          style={{ z: 110 }}
          className="glass-strong absolute -bottom-5 right-6 hidden items-center gap-2 rounded-md border border-success/30 px-3.5 py-2.5 text-xs text-ink shadow-2xl sm:flex"
        >
          <CheckCircle2 className="size-4 text-success" aria-hidden="true" />
          {t("Workflow committed to")} <span className="font-mono text-success">.github/workflows/</span>
        </motion.div>
      </motion.div>
    </div>
  );
}
