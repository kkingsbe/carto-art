import { Hero } from '@/components/landing/Hero';
import { Features } from '@/components/landing/Features';
import { FeaturedMaps } from '@/components/landing/FeaturedMaps';
import { Comparison } from '@/components/landing/Comparison';
import { TechStack } from '@/components/landing/TechStack';
import { FinalCTA } from '@/components/landing/FinalCTA';
import { Footer } from '@/components/landing/Footer';

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      <Hero />
      <Features />
      <FeaturedMaps />
      <Comparison />
      <TechStack />
      <FinalCTA />
      <Footer />
    </div>
  );
}
