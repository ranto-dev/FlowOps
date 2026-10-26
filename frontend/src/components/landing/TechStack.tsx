import { motion, useReducedMotion } from "framer-motion";
import { Reveal, SectionHeader } from "./Reveal";
import { staggerChild, staggerParent } from "./motion";
import { usePreferences } from "../../lib/usePreferences";

const STACK: Array<{ group: string; items: string[] }> = [
  { group: "Frontend", items: ["React", "TypeScript", "Tailwind CSS", "shadcn/ui"] },
  { group: "Backend", items: ["FastAPI", "Python"] },
  { group: "CI/CD", items: ["GitHub Actions"] },
  { group: "MLOps", items: ["Scikit-learn", "MLflow"] },
  { group: "Database", items: ["MongoDB"] },
];

export function TechStack() {
  const { t } = usePreferences();
  const reduce = useReducedMotion();
  return (
    <section aria-labelledby="stack-title" className="py-24 sm:py-32">
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
        <SectionHeader
          eyebrow={t("Stack")}
          title={<span id="stack-title">{t("A modern, boring-in-a-good-way stack.")}</span>}
          description={t("No exotic dependencies. Standard tools, assembled cleanly.")}
        />
        <motion.dl
          variants={staggerParent}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
          className="mx-auto mt-12 grid max-w-4xl gap-4 sm:grid-cols-2 lg:grid-cols-3"
        >
          {STACK.map((s) => (
            <motion.div
              key={s.group}
              variants={reduce ? undefined : staggerChild}
              className="rounded-xl border border-[#27272A] bg-[#111113] p-5"
            >
              <dt className="font-mono text-[11px] uppercase tracking-[0.2em] text-violet-300/90">
                {t(s.group)}
              </dt>
              <dd className="mt-3 flex flex-wrap gap-2">
                {s.items.map((item) => (
                  <span
                    key={item}
                    className="rounded-md border border-[#27272A] bg-[#18181B] px-2.5 py-1 font-mono text-xs text-[#A1A1AA]"
                  >
                    {item}
                  </span>
                ))}
              </dd>
            </motion.div>
          ))}
          <Reveal className="rounded-xl border border-dashed border-[#3f3f46] p-5 sm:col-span-2 lg:col-span-1">
            <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-[#71717A]">
              {t("Data flow")}
            </p>
            <p className="mt-3 font-mono text-xs leading-6 text-[#A1A1AA]">
              React → FastAPI → GitHub Actions
              <br />
              → execution data → MLflow → predictions
            </p>
          </Reveal>
        </motion.dl>
      </div>
    </section>
  );
}
