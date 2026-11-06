import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";
import { Reveal, SectionHeader } from "./Reveal";
import { ParallaxGlow, TiltCard } from "./fx";
import { usePreferences } from "../../lib/usePreferences";

interface Line {
  kind: "cmd" | "out" | "done";
  text: string;
}

const SCRIPT: Line[] = [
  { kind: "cmd", text: "cd backend && venv/bin/python -m uvicorn main:app --reload --port 8000" },
  { kind: "out", text: "INFO:     Uvicorn running on http://127.0.0.1:8000" },
  { kind: "cmd", text: "cd frontend && pnpm dev" },
  { kind: "out", text: "  VITE ready in 312 ms" },
  { kind: "out", text: "  ➜  Local:   http://localhost:5173/" },
  { kind: "done", text: "" },
];

const sleep = (ms: number) => new Promise((r) => window.setTimeout(r, ms));

/** Frappe caractère par caractère, sortie des serveurs en flux, puis boucle. */
function useCliDemo(active: boolean, reduce: boolean): Line[] {
  const [lines, setLines] = useState<Line[]>(reduce ? SCRIPT : []);

  useEffect(() => {
    if (reduce) {
      setLines(SCRIPT);
      return;
    }
    if (!active) return;
    let cancelled = false;
    (async () => {
      while (!cancelled) {
        setLines([]);
        for (const item of SCRIPT) {
          if (cancelled) return;
          if (item.kind === "cmd") {
            setLines((l) => [...l, { ...item, text: "" }]);
            for (let i = 1; i <= item.text.length; i++) {
              if (cancelled) return;
              await sleep(22);
              setLines((l) => [...l.slice(0, -1), { ...item, text: item.text.slice(0, i) }]);
            }
            await sleep(350);
          } else {
            await sleep(item.kind === "done" ? 500 : 250);
            if (cancelled) return;
            setLines((l) => [...l, item]);
          }
        }
        await sleep(4500);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [active, reduce]);

  return lines;
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
    <section aria-labelledby="dx-title" className="relative isolate py-20 sm:py-24">
      <ParallaxGlow tone="indigo" className="left-10 top-10 h-80 w-80" />
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
        <SectionHeader
          eyebrow={t("Local development")}
          title={<span id="dx-title">{t("Run FlowOps locally.")}</span>}
          description={t("Start the API and frontend locally using the documented repository commands.")}
        />
        <Reveal className="mx-auto mt-12 max-w-2xl" y={60} rotate={16} scale={0.94} blur={6}>
          <div ref={terminalRef} className="h-full">
            <TiltCard max={6} className="glass-flat overflow-hidden rounded-lg border">
              <div className="flex items-center gap-2 border-b border-line px-4 py-3" aria-hidden="true">
                <span className="size-2.5 rounded-full bg-line-strong transition-colors group-hover:bg-danger" />
                <span className="size-2.5 rounded-full bg-line-strong transition-colors group-hover:bg-warning" />
                <span className="size-2.5 rounded-full bg-line-strong transition-colors group-hover:bg-success" />
              </div>
              <div
                className="min-h-56 overflow-x-auto bg-code p-5 font-mono text-sm leading-7"
                aria-label={t("Local development command examples")}
              >
                {lines.map((line, i) => {
                  const last = i === lines.length - 1;
                  if (line.kind === "done")
                    return (
                      <p key={i} className="text-ink-subtle">
                        — {t("ready.")}
                      </p>
                    );
                  return (
                    <p
                      key={i}
                      className={`whitespace-pre ${line.kind === "cmd" ? "text-ink" : "text-success"}`}
                    >
                      {line.kind === "cmd" && <span className="text-accent-ink">$ </span>}
                      {line.text}
                      {last && line.kind === "cmd" && (
                        <span className="animate-caret ml-0.5 inline-block h-4 w-2 translate-y-0.5 bg-accent-ink" />
                      )}
                    </p>
                  );
                })}
                {lines.length > 0 && lines[lines.length - 1].kind !== "cmd" && (
                  <p className="text-ink">
                    <span className="text-accent-ink">$ </span>
                    <span className="animate-caret inline-block h-4 w-2 translate-y-0.5 bg-accent-ink" />
                  </p>
                )}
              </div>
            </TiltCard>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
