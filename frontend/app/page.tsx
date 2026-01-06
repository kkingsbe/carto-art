import { Hero } from '@/components/landing/Hero';
import { Features } from '@/components/landing/Features';
import { StyleShowcase } from '@/components/landing/StyleShowcase';
import { FinalCTA } from '@/components/landing/FinalCTA';
import { Footer } from '@/components/landing/Footer';
import { FAQSchema } from '@/components/seo/FAQSchema';
import { HowToSchema } from '@/components/seo/HowToSchema';
import { ChangelogModal } from '@/components/changelog/ChangelogModal';

export default async function LandingPage() {
  return (
    <main className="min-h-screen bg-[#0a0f1a] text-[#f5f0e8] selection:bg-[#c9a962]/30">
      <FAQSchema />
      <HowToSchema />
      <Hero />
      <Features />
      <StyleShowcase />
      <FinalCTA />
      <Footer />
      <ChangelogModal showFloatingButton />
    </main>
  );
}
