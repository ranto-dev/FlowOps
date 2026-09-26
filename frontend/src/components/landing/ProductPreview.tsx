import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ChevronRight, GitBranch, Play } from "lucide-react";
import { EASE } from "./motion";
import { staggerChild, staggerParent } from "./motion";

const STEPS = [
  { label: "Trigger", value: "Push", detail: "on: push → main" },
  { label: "Build", value: "npm run build", detail: "node: 22" },
  { label: "Test", value: "npm test", detail: "ubuntu-latest" },
];

const TERMINAL_LINES = [
  "$ flowops workflow generate",
  "✓ workflow.yml generated (3 jobs, 7 steps)",
  "$ flowops workflow run --watch",
  "✓ run #42 queued on ubuntu-latest",
];

function useTerminalTyping(active: boolean, reduce: boolean): string[] {
  const [count, setCount] = useState(reduce ? TERMINAL_LINES.length : 0);

  useEffect(() => {
    if (!active || reduce) {
      if (reduce) setCount(TERMINAL_LINES.length);
      return;
    }
    setCount(0);
    const id = window.setInterval(() => {
      setCount((c) => {
        if (c >= TERMINAL_LINES.length) {
          window.clearInterval(id);
          return c;
        }
        return c + 1;
      });
    }, 650);
    return () => window.clearInterval(id);
  }, [active, reduce]);

  return TERMINAL_LINES.slice(0, count);
}

export function ProductPreview() {
  const reduce = useReducedMotion();
  const [inView, setInView] = useState(false);
  const lines = useTerminalTyping(inView, reduce ?? false);

  return (
    <section id="product" aria-label="FlowOps product preview" className="scroll-mt-24">
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: reduce ? 0 : 48 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.7, ease: EASE }}
          onViewportEnter={() => setInView(true)}
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
              Ready
            </span>
          </div>

          <div className="grid gap-0 lg:grid-cols-2">
            {/* builder mock */}
            <motion.div
              variants={staggerParent}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, amount: 0.3 }}
              className="flex flex-col gap-3 border-b border-[#27272A] p-5 sm:p-6 lg:border-b-0 lg:border-r"
            >
              <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-[#71717A]">
                Workflow
              </p>
              {STEPS.map((step) => (
                <motion.div
                  key={step.label}
                  variants={reduce ? undefined : staggerChild}
                  className="rounded-lg border border-[#27272A] bg-[#18181B] p-3.5"
                >
                  <p className="text-[11px] font-medium uppercase tracking-wider text-[#71717A]">
                    {step.label}
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
                Generate Workflow
              </motion.div>
            </motion.div>

            {/* terminal mock */}
            <div className="bg-[#09090B] p-5 sm:p-6" aria-label="Terminal output demo">
              <div className="mb-3 flex items-center gap-2 font-mono text-[11px] text-[#71717A]">
                <GitBranch className="size-3.5" />
                main
              </div>
              <div className="min-h-36 font-mono text-[13px] leading-7">
                {lines.map((line) => (
                  <p
                    key={line}
                    className={
                      line.startsWith("$")
                        ? "text-[#FAFAFA]"
                        : "text-emerald-400/90"
                    }
                  >
                    {line.startsWith("$") ? (
                      line
                    ) : (
                      <span className="flex items-start gap-1">
                        <ChevronRight
                          className="mt-1.5 size-3.5 shrink-0"
                          aria-hidden="true"
                        />
                        {line.slice(2)}
                      </span>
                    )}
                  </p>
                ))}
                <span
                  className="animate-landing-blink inline-block h-4 w-2 translate-y-0.5 bg-violet-400"
                  aria-hidden="true"
                />
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
