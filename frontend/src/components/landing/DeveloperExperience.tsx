import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";
import { Reveal, SectionHeader } from "./Reveal";
import { usePreferences } from "../../lib/usePreferences";

const COMMANDS = [
  "cd backend && venv/bin/python -m uvicorn main:app --reload --port 8000",
  "cd frontend && pnpm dev",
];

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
          setShown((s) => [...s, `$ ${cmd}`]);
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
  const { t } = usePreferences();
  const reduce = useReducedMotion();
  const [inView, setInView] = useState(false);
  const terminalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = terminalRef.current;
    if (!node || typeof IntersectionObserver === "undefined") {
      setInView(true);
      return;
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          io.disconnect();
        }
      },
      { threshold: 0.3 },
    );
    io.observe(node);
    return () => io.disconnect();
  }, []);
  const lines = useCliDemo(inView, reduce ?? false);

  return (
    <section aria-labelledby="dx-title" className="py-20 sm:py-24">
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
        <SectionHeader
          eyebrow={t("Local development")}
          title={<span id="dx-title">{t("Run FlowOps locally.")}</span>}
          description={t("Start the API and frontend locally using the documented repository commands.")}
        />
        <Reveal className="mx-auto mt-12 max-w-2xl">
          <div
            ref={terminalRef}
            className="glass-flat overflow-hidden rounded-lg border"
          >
            <div
              className="flex items-center gap-2 border-b border-line px-4 py-3"
              aria-hidden="true"
            >
              <span className="size-2.5 rounded-full bg-line-strong" />
              <span className="size-2.5 rounded-full bg-line-strong" />
              <span className="size-2.5 rounded-full bg-line-strong" />
            </div>
            <div
              className="min-h-56 overflow-x-auto bg-code p-5 font-mono text-sm leading-7"
              aria-label={t("Local development command examples")}
            >
              {lines.map((line, i) =>
                line === "done" ? (
                  <p key={`done-${i}`} className="text-ink-subtle">
                    — {t("ready.")}
                  </p>
                ) : (
                  <p
                    key={`${line}-${i}`}
                    className={line.startsWith("$") ? "whitespace-pre text-ink" : "whitespace-pre text-success"}
                  >
                    {line}
                  </p>
                ),
              )}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
