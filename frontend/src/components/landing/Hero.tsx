import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { FaGithub } from "react-icons/fa6";
import { GITHUB_URL } from "./data";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { EASE } from "./motion";

const TECH = [
  "GitHub Actions",
  "React",
  "FastAPI",
  "Python",
  "Docker",
  "MLflow",
];

export function Hero() {
  const reduce = useReducedMotion();
  const anim = (delay: number) => ({
    initial: { opacity: 0, y: reduce ? 0 : 28 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.7, delay, ease: EASE },
  });

  return (
    <section className="relative overflow-hidden pt-36 sm:pt-44" aria-labelledby="hero-title">
      {/* subtle grid backdrop, no flashy gradients */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.025)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.025)_1px,transparent_1px)] bg-[size:56px_56px] [mask-image:radial-gradient(ellipse_70%_60%_at_50%_0%,black,transparent)]"
      />
      <div className="relative mx-auto flex w-full max-w-6xl flex-col items-center px-4 text-center sm:px-6">
        <motion.div {...anim(0)}>
          <Badge variant="accent" className="gap-2">
            <span className="size-1.5 rounded-full bg-violet-400" aria-hidden="true" />
            Open source CI/CD workflow platform
          </Badge>
        </motion.div>

        <motion.h1
          id="hero-title"
          {...anim(0.1)}
          className="mt-6 max-w-3xl text-balance text-4xl font-bold leading-[1.05] tracking-tight text-[#FAFAFA] sm:text-6xl lg:text-7xl"
        >
          Build CI/CD workflows{" "}
          <span className="text-violet-300">
            without the YAML complexity.
          </span>
        </motion.h1>

        <motion.p
          {...anim(0.2)}
          className="mt-6 max-w-xl text-pretty text-base leading-relaxed text-[#A1A1AA] sm:text-lg"
        >
          Design, generate, execute and optimize GitHub Actions workflows
          through a powerful low-code interface.
        </motion.p>

        <motion.div
          {...anim(0.3)}
          className="mt-8 flex w-full flex-col items-center justify-center gap-3 sm:w-auto sm:flex-row"
        >
          <Button size="lg" className="w-full sm:w-auto" asChild>
            <Link to="/auth">
              Get Started
              <ArrowRight className="size-4" />
            </Link>
          </Button>
          <Button
            size="lg"
            variant="secondary"
            className="w-full sm:w-auto"
            asChild
          >
            <a href={GITHUB_URL} target="_blank" rel="noreferrer">
              <FaGithub className="size-4" />
              View on GitHub
            </a>
          </Button>
        </motion.div>

        <motion.p
          {...anim(0.4)}
          className="mt-5 font-mono text-xs tracking-wide text-[#71717A]"
        >
          Built for developers{" "}
          <span aria-hidden="true" className="mx-1 text-[#3f3f46]">
            •
          </span>{" "}
          Powered by GitHub Actions
        </motion.p>

        <motion.div {...anim(0.5)} className="mt-16 w-full sm:mt-20">
          <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-[#71717A]">
            Built for modern development teams
          </p>
          <ul
            aria-label="Technologies"
            className="mt-5 flex flex-wrap items-center justify-center gap-x-8 gap-y-3"
          >
            {TECH.map((t) => (
              <li
                key={t}
                className="font-mono text-sm text-[#71717A] transition-colors hover:text-[#A1A1AA]"
              >
                {t}
              </li>
            ))}
          </ul>
        </motion.div>
      </div>
    </section>
  );
}
