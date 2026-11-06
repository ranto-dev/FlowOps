import { useRef, useState } from "react";
import type { PointerEvent, ReactNode } from "react";
import {
  motion,
  useMotionValue,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from "framer-motion";
import { cn } from "../../lib/utils";

interface TiltCardProps {
  children: ReactNode;
  className?: string;
  /** Inclinaison maximale en degrés. */
  max?: number;
}

/**
 * Carte 3D : s'incline vers le curseur (ressort), grossit légèrement et reflète un halo violet.
 * Les enfants peuvent se détacher en profondeur via `[transform:translateZ(Npx)]`.
 */
export function TiltCard({ children, className, max = 9 }: TiltCardProps) {
  const reduce = useReducedMotion();
  const mx = useMotionValue(0.5);
  const my = useMotionValue(0.5);
  const sx = useSpring(mx, { stiffness: 220, damping: 20 });
  const sy = useSpring(my, { stiffness: 220, damping: 20 });
  const rotateY = useTransform(sx, [0, 1], [-max, max]);
  const rotateX = useTransform(sy, [0, 1], [max, -max]);

  const onMove = (e: PointerEvent<HTMLDivElement>) => {
    if (reduce || e.pointerType !== "mouse") return;
    const r = e.currentTarget.getBoundingClientRect();
    mx.set((e.clientX - r.left) / r.width);
    my.set((e.clientY - r.top) / r.height);
    e.currentTarget.style.setProperty("--mx", `${e.clientX - r.left}px`);
    e.currentTarget.style.setProperty("--my", `${e.clientY - r.top}px`);
  };
  const onLeave = () => {
    mx.set(0.5);
    my.set(0.5);
  };

  return (
    <div style={{ perspective: 900 }} className="h-full">
      <motion.div
        onPointerMove={onMove}
        onPointerLeave={onLeave}
        whileHover={reduce ? undefined : { scale: 1.025 }}
        transition={{ type: "spring", stiffness: 260, damping: 22 }}
        style={reduce ? undefined : { rotateX, rotateY, transformStyle: "preserve-3d" }}
        className={cn("group relative h-full", className)}
      >
        <div className="tilt-glare" aria-hidden="true" />
        {children}
      </motion.div>
    </div>
  );
}

interface ScrollChainProps {
  count: number;
  renderItem: (index: number, active: boolean) => ReactNode;
  className?: string;
  /** Hauteur du connecteur (classe Tailwind). */
  gap?: string;
}

/** Chaîne verticale pilotée par le scroll : les nœuds s'allument, les connecteurs se remplissent. */
export function ScrollChain({ count, renderItem, className, gap = "h-8" }: ScrollChainProps) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLOListElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 0.8", "end 0.55"] });
  const [p, setP] = useState(reduce ? 1 : 0);
  useMotionValueEvent(scrollYProgress, "change", (v) => setP(reduce ? 1 : v));

  return (
    <ol ref={ref} className={cn("flex flex-col items-stretch", className)}>
      {Array.from({ length: count }, (_, i) => {
        const active = p * count >= i || p >= 0.999;
        const fill = Math.min(Math.max(p * count - i, 0), 1);
        return (
          <li key={i} className="flex flex-col items-center">
            <motion.div
              animate={{ opacity: active ? 1 : 0.35, scale: active ? 1 : 0.94 }}
              transition={{ duration: 0.45, ease: [0.21, 0.47, 0.32, 0.98] }}
              className="w-full"
            >
              {renderItem(i, active)}
            </motion.div>
            {i < count - 1 && (
              <span
                aria-hidden="true"
                className={cn("relative block w-px overflow-hidden bg-line-strong", gap)}
              >
                <span
                  className="absolute inset-0 origin-top bg-accent shadow-[0_0_10px_rgb(139_92_246)]"
                  style={{ transform: `scaleY(${fill})` }}
                />
                {fill >= 1 && (
                  <span className="beam-y absolute inset-x-0 top-0 block h-1/3 bg-accent-ink" />
                )}
              </span>
            )}
          </li>
        );
      })}
    </ol>
  );
}

/** Halo décoratif en parallaxe : dérive verticalement pendant que la section défile. */
export function ParallaxGlow({
  className,
  from = -80,
  to = 120,
  tone = "violet",
}: {
  className?: string;
  from?: number;
  to?: number;
  tone?: "violet" | "indigo";
}) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], [from, to]);
  return (
    <motion.div
      ref={ref}
      aria-hidden="true"
      style={{ y }}
      className={cn("pointer-events-none absolute -z-10", className)}
    >
      <div className={cn("aurora inset-0", tone === "violet" ? "aurora-violet" : "aurora-indigo")} />
    </motion.div>
  );
}
