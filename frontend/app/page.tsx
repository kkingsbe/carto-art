import { Hero } from '@/components/landing/Hero';
import { Features } from '@/components/landing/Features';
import { HowItWorks } from '@/components/landing/HowItWorks';
import { UseCases } from '@/components/landing/UseCases';
import { StyleShowcase } from '@/components/landing/StyleShowcase';
import { FeaturedMaps } from '@/components/landing/FeaturedMaps';
import { FAQ } from '@/components/landing/FAQ';
import { Comparison } from '@/components/landing/Comparison';
import { TrustSignals } from '@/components/landing/TrustSignals';
import { FinalCTA } from '@/components/landing/FinalCTA';
import { Footer } from '@/components/landing/Footer';

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      <Hero />
      <Features />
      <HowItWorks />
      <UseCases />
      <StyleShowcase />
      <FeaturedMaps />
      <FAQ />
      <Comparison />
      <TrustSignals />
      <FinalCTA />
      <Footer />
    </div>
  );
}
