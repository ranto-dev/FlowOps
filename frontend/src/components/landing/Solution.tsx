import { motion, useReducedMotion } from "framer-motion";
import { MousePointerClick, PlayCircle, TrendingUp } from "lucide-react";
import { SectionHeader } from "./Reveal";
import { staggerChild, staggerParent } from "./motion";
import { usePreferences } from "../../lib/usePreferences";

const PILLARS = [
  {
    icon: MousePointerClick,
    title: "Design",
    text: "Configure workflows visually.",
    visual: (
      <div className="flex flex-col gap-2 font-mono text-xs" aria-hidden="true">
        {["push → main", "node 22 · ubuntu", "npm run build"].map((t) => (
          <span
            key={t}
            className="rounded-md border border-[#27272A] bg-[#09090B] px-3 py-2 text-[#A1A1AA]"
          >
            {t}
          </span>
        ))}
      </div>
    ),
  },
  {
    icon: PlayCircle,
    title: "Execute",
    text: "Trigger GitHub Actions runs and refresh their execution status.",
    visual: (
      <div className="flex flex-col gap-2 font-mono text-xs" aria-hidden="true">
        {[
          ["✓", "Checkout", "text-emerald-400"],
          ["✓", "Setup Node", "text-emerald-400"],
          ["◉", "Build — running", "text-violet-300"],
        ].map(([mark, label, color]) => (
          <span
            key={label}
            className="flex items-center gap-2 rounded-md border border-[#27272A] bg-[#09090B] px-3 py-2 text-[#A1A1AA]"
          >
            <span className={color}>{mark}</span> {label}
          </span>
        ))}
      </div>
    ),
  },
  {
    icon: TrendingUp,
    title: "Optimize",
    text: "Use execution data and Machine Learning to predict and optimize your pipelines.",
    visual: (
      <div className="flex flex-col gap-2 font-mono text-xs" aria-hidden="true">
        <span className="rounded-md border border-[#27272A] bg-[#09090B] px-3 py-2 text-[#A1A1AA]">
          duration <span className="text-[#FAFAFA]">≈ 128s</span>
        </span>
        <span className="rounded-md border border-[#27272A] bg-[#09090B] px-3 py-2 text-[#A1A1AA]">
          failure risk <span className="text-violet-300">23% · example</span>
        </span>
      </div>
    ),
  },
];

export function Solution() {
  const { t } = usePreferences();
  const reduce = useReducedMotion();
  return (
    <section aria-labelledby="solution-title" className="py-24 sm:py-32">
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
        <SectionHeader
          eyebrow={t("The solution")}
          title={
            <span id="solution-title">
              {t("One workflow.")}
              <br />
              {t("One interface. Complete visibility.")}
            </span>
          }
        />
        <motion.div
          variants={staggerParent}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
          className="mt-12 grid gap-4 lg:grid-cols-3"
        >
          {PILLARS.map((p) => (
            <motion.article
              key={p.title}
              variants={reduce ? undefined : staggerChild}
              className="flex flex-col rounded-xl border border-[#27272A] bg-[#111113] p-6 transition-colors hover:border-zinc-700"
            >
              <p.icon className="size-5 text-violet-400" aria-hidden="true" />
              <h3 className="mt-4 text-xl font-semibold tracking-tight text-[#FAFAFA]">
                {t(p.title)}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-[#A1A1AA]">
                {t(p.text)}
              </p>
              <div className="mt-6 flex-1">{p.visual}</div>
            </motion.article>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
