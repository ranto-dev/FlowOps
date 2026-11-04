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
    <section aria-labelledby="cta-title" className="py-24 sm:py-32">
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
        <Reveal className="overflow-hidden rounded-lg border border-line bg-surface px-6 py-16 text-center sm:px-12 sm:py-20">
          <h2
            id="cta-title"
            className="mx-auto max-w-2xl text-balance text-2xl font-semibold text-ink sm:text-3xl"
          >
            {t("Build your next pipeline differently.")}
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-pretty text-base leading-relaxed text-ink-muted">
            {t("Design your CI/CD workflows visually, execute them confidently and optimize them with data.")}
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button size="lg" asChild>
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
