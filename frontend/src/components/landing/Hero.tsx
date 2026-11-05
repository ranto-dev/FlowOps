import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { FaGithub } from "react-icons/fa6";
import { GITHUB_URL } from "./data";
import { Button } from "./ui/button";
import { EASE } from "./motion";
import { usePreferences } from "../../lib/usePreferences";

const TECH = [
  "GitHub Actions",
  "React",
  "FastAPI",
  "Python",
  "Docker",
  "MLflow",
];

export function Hero() {
  const { t } = usePreferences();
  const reduce = useReducedMotion();
  const anim = (delay: number) => ({
    initial: { opacity: 0, y: reduce ? 0 : 12 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.4, delay, ease: EASE },
  });

  return (
    <section
      className="relative halo-vivid pt-20 sm:pt-28"
      aria-labelledby="hero-title"
    >
      <div className="relative mx-auto flex w-full max-w-6xl flex-col items-center px-4 text-center sm:px-6">
        <motion.h1
          id="hero-title"
          {...anim(0.1)}
          className="max-w-4xl text-balance text-4xl font-bold leading-[1.1] tracking-tight text-ink sm:text-5xl lg:text-6xl"
        >
          {t("Build CI/CD workflows")}{" "}
          <span className="text-brand">
            {t("without the YAML complexity.")}
          </span>
        </motion.h1>

        <motion.p
          {...anim(0.2)}
          className="mt-6 max-w-xl text-pretty text-base leading-relaxed text-ink-muted sm:text-lg"
        >
          {t(
            "Design, generate, execute and optimize GitHub Actions workflows through a powerful low-code interface.",
          )}
        </motion.p>

        <motion.div
          {...anim(0.3)}
          className="mt-8 flex w-full flex-col items-center justify-center gap-3 sm:w-auto sm:flex-row"
        >
          <Button size="lg" variant="brand" className="w-full sm:w-auto" asChild>
            <Link to="/auth">
              {t("Get started")}
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
              {t("View on GitHub")}
            </a>
          </Button>
        </motion.div>

        <motion.p
          {...anim(0.4)}
          className="mt-5 font-mono text-xs text-ink-subtle"
        >
          {t("Built for developers")}{" "}
          <span aria-hidden="true" className="mx-1 text-line-strong">
            •
          </span>{" "}
          Powered by GitHub Actions
        </motion.p>

        <motion.div {...anim(0.5)} className="mt-16 w-full sm:mt-20">
          <p className="font-mono text-xs text-ink-subtle">
            {t("Built for modern development teams")}
          </p>
          <ul
            aria-label="Technologies"
            className="mt-5 flex flex-wrap items-center justify-center gap-x-8 gap-y-3"
          >
            {TECH.map((t) => (
              <li
                key={t}
                className="font-mono text-sm text-ink-subtle transition-colors hover:text-ink-muted"
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
