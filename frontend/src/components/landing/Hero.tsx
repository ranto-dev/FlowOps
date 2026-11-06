import { Link } from "react-router-dom";
import type { CSSProperties } from "react";
import { ArrowRight } from "lucide-react";
import { FaDocker, FaGithub, FaPython, FaReact } from "react-icons/fa6";
import { SiFastapi, SiMlflow } from "react-icons/si";
import { Marquee } from "./Marquee";
import { Workflow3D } from "./Workflow3D";
import { GITHUB_URL } from "./data";
import { Button } from "./ui/button";
import { usePreferences } from "../../lib/usePreferences";

const TECH = [
  { label: "GitHub Actions", icon: <FaGithub /> },
  { label: "React", icon: <FaReact /> },
  { label: "FastAPI", icon: <SiFastapi /> },
  { label: "Python", icon: <FaPython /> },
  { label: "Docker", icon: <FaDocker /> },
  { label: "MLflow", icon: <SiMlflow /> },
];

/** Entrée en fondu par CSS (compositeur) ; le décalage passe par la variable `--delay`. */
const fadeDelay = (seconds: number) => ({ "--delay": `${seconds}s` }) as CSSProperties;

export function Hero() {
  const { t } = usePreferences();

  return (
    <section
      className="relative isolate overflow-hidden pb-4 pt-32 sm:pt-36 lg:pt-40"
      aria-labelledby="hero-title"
    >
      <div className="halo-vivid" aria-hidden="true" />
      <div className="bg-grid absolute inset-0 -z-10" aria-hidden="true" />
      <div className="aurora aurora-violet left-1/2 top-[-12rem] -z-10 h-[34rem] w-[60rem] -translate-x-1/2" aria-hidden="true" />
      <div className="aurora aurora-indigo right-[-10rem] top-24 -z-10 size-[26rem] [animation-delay:-6s]" aria-hidden="true" />
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
        <div className="text-center">
          <h1
            id="hero-title"
            style={fadeDelay(0.1)}
            className="animate-fade-up text-gradient mx-auto max-w-5xl text-balance text-5xl font-semibold leading-[1.02] tracking-[-0.045em] text-ink sm:text-6xl lg:text-7xl"
          >
            {t("Build CI/CD workflows")}{" "}
            <span className="text-brand">
              {t("without the YAML complexity.")}
            </span>
          </h1>

          <p
            style={fadeDelay(0.2)}
            className="animate-fade-up mx-auto mt-7 max-w-2xl text-pretty text-lg leading-relaxed text-ink-muted sm:text-xl"
          >
            {t(
              "Design, generate, execute and optimize GitHub Actions workflows through a powerful low-code interface.",
            )}
          </p>

          <div
            style={fadeDelay(0.3)}
            className="animate-fade-up mt-8 flex w-full flex-col items-center justify-center gap-3 sm:w-auto sm:flex-row"
          >
            <Button
              size="lg"
              variant="brand"
              className="w-full sm:w-auto"
              asChild
            >
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
          </div>

          <p
            style={fadeDelay(0.4)}
            className="animate-fade-up mt-5 font-mono text-xs text-ink-subtle"
          >
            {t("Built for developers")}{" "}
            <span aria-hidden="true" className="mx-1 text-line-strong">
              •
            </span>{" "}
            Powered by GitHub Actions
          </p>
        </div>
      </div>

      <div className="mt-16 px-4 sm:mt-20 sm:px-6">
        <Workflow3D />
      </div>

      <div className="mx-auto mt-20 w-full max-w-6xl px-4 sm:mt-24 sm:px-6">
      <div
        style={fadeDelay(0.5)}
        className="animate-fade-up border-t border-line/70 pt-7"
      >
        <p className="text-center font-mono text-xs text-ink-subtle">
          {t("Built for modern development teams")}
        </p>
        <div className="mt-6"><Marquee items={TECH} label={t("Technologies")} /></div>
      </div>
      </div>
    </section>
  );
}
