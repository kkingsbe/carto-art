import Link from 'next/link';
import { ArrowRight, Map as MapIcon, Sparkles } from 'lucide-react';

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-[#0a0f1a] via-[#1a1f2e] to-[#0a0f1a] text-[#f5f0e8]">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6">
              Create Stunning Map Posters
            </h1>
            <p className="text-xl md:text-2xl text-[#d4cfc4]/80 max-w-3xl mx-auto mb-8">
              Design beautiful custom map posters with 3D terrain, multiple styles, and high-resolution export.
              <span className="text-[#c9a962]">Free forever.</span>
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link
                href="/editor"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full bg-[#c9a962] hover:bg-[#e0c47c] text-[#0a0f1a] font-semibold text-lg transition-all hover:scale-105 hover:shadow-[0_0_20px_rgba(201,169,98,0.4)]"
              >
                Start Creating
                <MapIcon className="w-5 h-5" />
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </div>

        {/* Background decoration */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#c9a962]/10 rounded-full blur-[120px]" />
      </section>

      {/* Features Section */}
      <section className="py-24 bg-[#0a0f1a]/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">
              Powerful Features
            </h2>
            <p className="text-[#d4cfc4]/70 text-lg max-w-2xl mx-auto">
              Everything you need to create professional-quality map posters
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard
              icon={<MapIcon className="w-8 h-8" />}
              title="3D Terrain"
              description="Add depth and realism with volumetric terrain and 3D buildings"
            />
            <FeatureCard
              icon={<Sparkles className="w-8 h-8" />}
              title="Multiple Styles"
              description="Choose from Minimal, Vintage, Dark, and more designer styles"
            />
            <FeatureCard
              icon={<MapIcon className="w-8 h-8" />}
              title="Customizable"
              description="Adjust colors, typography, borders, and aspect ratios"
            />
            <FeatureCard
              icon={<MapIcon className="w-8 h-8" />}
              title="High-Res Export"
              description="Export up to 36 inch posters at 150 DPI for professional printing"
            />
            <FeatureCard
              icon={<MapIcon className="w-8 h-8" />}
              title="Free Forever"
              description="No signup required, no limits, completely free to use"
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-[#0a0f1a]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Ready to Create?
          </h2>
          <p className="text-[#d4cfc4]/70 text-lg mb-8 max-w-2xl mx-auto">
            Start designing your custom map poster in seconds. No account required.
          </p>
          <Link
            href="/editor"
            className="inline-flex items-center justify-center gap-2 px-10 py-5 rounded-full bg-[#c9a962] hover:bg-[#e0c47c] text-[#0a0f1a] font-bold text-xl transition-all hover:scale-105 hover:shadow-[0_0_30px_rgba(201,169,98,0.5)]"
          >
            Launch Editor
            <ArrowRight className="w-6 h-6" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 bg-[#0a0f1a] border-t border-[#1a1f2e]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-[#d4cfc4]/60">
          <p>© 2026 Carto-Art. Free map poster editor.</p>
        </div>
      </footer>
    </main>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="bg-white/5 dark:bg-white/5 backdrop-blur-sm border border-[#1a1f2e]/20 rounded-2xl p-6 hover:border-[#c9a962]/30 transition-all">
      <div className="flex items-center gap-4 mb-4">
        <div className="flex-shrink-0 text-[#c9a962]">
          {icon}
        </div>
        <h3 className="text-xl font-semibold text-[#f5f0e8]">
          {title}
        </h3>
      </div>
      <p className="text-[#d4cfc4]/80">
        {description}
      </p>
    </div>
  );
}
