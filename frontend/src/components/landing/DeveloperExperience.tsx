import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useReducedMotion } from "framer-motion";
import { Reveal, SectionHeader } from "./Reveal";

const COMMANDS = [
  "flowops workflow generate",
  "flowops workflow run",
  "flowops workflow logs",
  "flowops model train",
];

const OUTPUT: Record<string, string> = {
  "flowops workflow generate": "✓ workflow.yml written — 3 jobs, 7 steps",
  "flowops workflow run": "✓ run #42 started on ubuntu-latest",
  "flowops workflow logs": "✓ streaming logs for job build (live)",
  "flowops model train": "✓ training complete — metrics logged to MLflow",
};

function useCliDemo(active: boolean, reduce: boolean): string[] {
  const [shown, setShown] = useState<string[]>(reduce ? [...COMMANDS, ""] : []);

  useEffect(() => {
    if (!active || reduce) {
      if (reduce) setShown([...COMMANDS, "done"]);
      return;
    }
    setShown([]);
    let cmdIndex = 0;
    let cancelled = false;
    const timers: number[] = [];
    const next = () => {
      if (cancelled) return;
      if (cmdIndex >= COMMANDS.length) {
        timers.push(window.setTimeout(() => !cancelled && setShown((s) => [...s, "done"]), 800));
        return;
      }
      const cmd = COMMANDS[cmdIndex];
      timers.push(
        window.setTimeout(() => {
          if (cancelled) return;
          setShown((s) => [...s, `$ ${cmd}`, OUTPUT[cmd]]);
          cmdIndex += 1;
          next();
        }, 1100),
      );
    };
    next();
    return () => {
      cancelled = true;
      timers.forEach((t) => window.clearTimeout(t));
    };
  }, [active, reduce]);

  return shown;
}

export function DeveloperExperience() {
  const reduce = useReducedMotion();
  const [inView, setInView] = useState(false);
  const lines = useCliDemo(inView, reduce ?? false);

  return (
    <section aria-labelledby="dx-title" className="py-24 sm:py-32">
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
        <SectionHeader
          eyebrow="Developer experience"
          title={<span id="dx-title">Designed for developers.</span>}
          description="The same workflows, available from your terminal."
        />
        <Reveal className="mx-auto mt-12 max-w-2xl">
          <motion.div
            onViewportEnter={() => setInView(true)}
            className="overflow-hidden rounded-xl border border-[#27272A] bg-[#09090B]"
          >
            <div
              className="flex items-center gap-2 border-b border-[#27272A] bg-[#18181B] px-4 py-3"
              aria-hidden="true"
            >
              <span className="size-2.5 rounded-full bg-[#3f3f46]" />
              <span className="size-2.5 rounded-full bg-[#3f3f46]" />
              <span className="size-2.5 rounded-full bg-[#3f3f46]" />
            </div>
            <div
              className="min-h-56 overflow-x-auto p-5 font-mono text-[13px] leading-7"
              aria-label="CLI demo"
            >
              {lines.map((line, i) =>
                line === "done" ? (
                  <p key={`done-${i}`} className="text-[#71717A]">
                    — ready.
                  </p>
                ) : (
                  <p
                    key={`${line}-${i}`}
                    className={line.startsWith("$") ? "whitespace-pre text-[#FAFAFA]" : "whitespace-pre text-emerald-400/90"}
                  >
                    {line}
                  </p>
                ),
              )}
              <span
                className="animate-landing-blink inline-block h-4 w-2 translate-y-0.5 bg-violet-400"
                aria-hidden="true"
              />
            </div>
          </motion.div>
        </Reveal>
      </div>
    </section>
  );
}
