import { Navbar } from "../components/landing/Navbar";
import { Hero } from "../components/landing/Hero";
import { ProductPreview } from "../components/landing/ProductPreview";
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
import { Separator } from "../components/landing/ui/separator";

const LandingPage: React.FC = () => {
  return (
    <div className="landing-dark min-h-screen bg-[#09090B] font-sans text-[#FAFAFA] antialiased">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[60] focus:rounded-lg focus:bg-[#18181B] focus:px-4 focus:py-2 focus:text-sm focus:text-white"
      >
        Skip to content
      </a>
      <Navbar />
      <main id="main">
        <Hero />
        <div className="pt-16 sm:pt-24">
          <ProductPreview />
        </div>
        <Problem />
        <Solution />
        <Separator className="mx-auto w-full max-w-6xl opacity-60" />
        <WorkflowBuilder />
        <YamlPreview />
        <ExecutionDemo />
        <MLOpsSection />
        <Features />
        <DeveloperExperience />
        <TechStack />
        <FAQ />
        <FinalCTA />
      </main>
      <Footer />
    </div>
  );
};

export default LandingPage;
