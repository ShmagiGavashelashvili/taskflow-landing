import CtaBanner from "@/components/CtaBanner";
import FAQ from "@/components/FAQ";
import Features from "@/components/Features";
import Footer from "@/components/Footer";
import Hero from "@/components/Hero";
import HowItWorks from "@/components/HowItWorks";
import LogoStrip from "@/components/LogoStrip";
import Navbar from "@/components/Navbar";
import Pricing from "@/components/Pricing";
import ProductShowcase from "@/components/ProductShowcase";
import Testimonials from "@/components/Testimonials";

export default function Home() {
  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[60] focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:font-semibold focus:shadow-card"
      >
        Skip to content
      </a>
      <Navbar />
      <main id="main">
        <Hero />
        <LogoStrip />
        <Features />
        <HowItWorks />
        <ProductShowcase />
        <Pricing />
        <Testimonials />
        <FAQ />
        <CtaBanner />
      </main>
      <Footer />
    </>
  );
}
