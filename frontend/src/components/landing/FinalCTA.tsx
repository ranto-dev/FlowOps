import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { FaGithub } from "react-icons/fa6";
import { GITHUB_URL } from "./data";
import { Button } from "./ui/button";
import { Reveal } from "./Reveal";
import { usePreferences } from "../../lib/usePreferences";

export function FinalCTA() {
  const { t } = usePreferences();
  return (
    <section aria-labelledby="cta-title" className="py-20 sm:py-24">
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
        <Reveal className="glass-flat relative isolate overflow-hidden rounded-lg border px-6 py-16 text-center sm:px-12 sm:py-20">
          <div className="bg-grid absolute inset-0 -z-10 opacity-70" aria-hidden="true" />
          <div className="aurora aurora-violet left-1/2 top-1/2 -z-10 h-80 w-[48rem] -translate-x-1/2 -translate-y-1/2" aria-hidden="true" />
          <h2
            id="cta-title"
            className="mx-auto max-w-2xl text-gradient text-balance text-4xl font-semibold tracking-tight sm:text-5xl md:text-6xl"
          >
            {t("Build your next pipeline differently.")}
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-pretty text-base leading-relaxed text-ink-muted">
            {t("Design your CI/CD workflows visually, execute them confidently and optimize them with data.")}
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button size="lg" variant="brand" asChild>
              <Link to="/auth">
                {t("Get started")}
                <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button size="lg" variant="secondary" asChild>
              <a href={GITHUB_URL} target="_blank" rel="noreferrer">
                <FaGithub className="size-4" />
                {t("View on GitHub")}
              </a>
            </Button>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
