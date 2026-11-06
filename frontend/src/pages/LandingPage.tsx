import { Navbar } from "../components/landing/Navbar";
import { Hero } from "../components/landing/Hero";
import { HowItWorks } from "../components/landing/HowItWorks";
import { Problem } from "../components/landing/Problem";
import { Solution } from "../components/landing/Solution";
import { WorkflowBuilder } from "../components/landing/WorkflowBuilder";
import { YamlPreview } from "../components/landing/YamlPreview";
import { ExecutionDemo } from "../components/landing/ExecutionDemo";
import { MLOpsSection } from "../components/landing/MLOpsSection";
import { Features } from "../components/landing/Features";
import { DeveloperExperience } from "../components/landing/DeveloperExperience";
import { TechStack } from "../components/landing/TechStack";
import { FAQ } from "../components/landing/FAQ";
import { FinalCTA } from "../components/landing/FinalCTA";
import { Footer } from "../components/landing/Footer";
import { usePreferences } from "../lib/usePreferences";
import { Separator } from "../components/landing/ui/separator";

const LandingPage: React.FC = () => {
  const { t } = usePreferences();
  return (
    <div className="landing-root min-h-screen font-sans text-ink antialiased">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[60] focus:rounded-md focus:bg-surface-2 focus:px-4 focus:py-2 focus:text-sm focus:text-ink"
      >
        {t("Skip to content")}
      </a>
      <Navbar />
      <main id="main">
        <Hero />
        {/* Sections sous la ligne de flottaison : rendu différé (content-visibility) */}
        <div className="cv-auto">
          <Problem />
        </div>
        <div className="cv-auto">
          <Solution />
        </div>
        <HowItWorks />
        <Separator className="mx-auto w-full max-w-6xl opacity-60" />
        <div className="cv-auto">
          <WorkflowBuilder />
        </div>
        <div className="cv-auto">
          <YamlPreview />
        </div>
        <div className="cv-auto">
          <ExecutionDemo />
        </div>
        <div className="cv-auto">
          <MLOpsSection />
        </div>
        <div className="cv-auto">
          <Features />
        </div>
        <div className="cv-auto">
          <DeveloperExperience />
        </div>
        <div className="cv-auto">
          <TechStack />
        </div>
        <div className="cv-auto">
          <FAQ />
        </div>
        <div className="cv-auto">
          <FinalCTA />
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default LandingPage;
