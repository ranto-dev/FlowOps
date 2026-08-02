import Header from "../components/Header";
import Hero from "../components/Hero";
import Features from "../components/Features";
import ArchitectureEngine from "../components/Architecture";
import DeveloperApi from "../components/DeveloperApi";
import Pricing from "../components/Pricing";
import FAQ from "../components/FAQ";
import CallToAction from "../components/CallToAction";
import Footer from "../components/Footer";
import Layout from "../components/Layout";

const LandingPage: React.FC = () => {
  return (
    <Layout>
      <Header />
      <Hero />
      <Features />
      <ArchitectureEngine />
      <DeveloperApi />
      <Pricing />
      <FAQ />
      <CallToAction />
      <Footer />
    </Layout>
  );
};

export default LandingPage;
