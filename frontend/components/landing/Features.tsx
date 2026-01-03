'use client';

import { Globe, Palette, Mountain, Printer, Layers, Type, Code, Zap, Smartphone, Share2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FeatureCardProps {
  title: string;
  description: string;
  icon: React.ElementType;
  className?: string;
}

function FeatureCard({ title, description, icon: Icon, className }: FeatureCardProps) {
  return (
    <div className={cn(
      "group relative p-6 rounded-2xl overflow-hidden glass-card border border-white/10 hover:border-[#c9a962]/50 transition-all duration-300 hover:shadow-lg hover:-translate-y-1",
      className
    )}>
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      <div className="relative z-10">
        <div className="w-12 h-12 rounded-xl bg-[#c9a962]/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
          <Icon className="w-6 h-6 text-[#c9a962] group-hover:text-[#e5c985] transition-colors" />
        </div>

        <h3 className="text-xl font-bold text-[#f5f0e8] mb-2">{title}</h3>
        <p className="text-[#d4cfc4]/70 leading-relaxed text-sm">{description}</p>
      </div>
    </div>
  );
}

export function Features() {
  return (
    <section className="py-24 bg-[#0a0f1a] relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-1/3 h-1/3 bg-blue-500/5 rounded-full blur-[100px]" />
      <div className="absolute bottom-0 left-0 w-1/3 h-1/3 bg-[#c9a962]/5 rounded-full blur-[100px]" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="text-center mb-20">
          <h2 className="text-4xl md:text-5xl font-bold text-[#f5f0e8] mb-6 tracking-tight">
            Professional Maps,
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#c9a962] to-[#b87333]">
              Zero Compromises
            </span>
          </h2>
          <p className="text-lg text-[#d4cfc4]/60 max-w-2xl mx-auto">
            Everything you need to create gallery-quality cartographic art, powered by modern rendering technology.
          </p>
        </div>

        {/* Bento Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[minmax(200px,auto)]">
          {/* Large Hero Feature */}
          <div className="md:col-span-2 row-span-2 relative group rounded-3xl overflow-hidden glass-card border border-white/10 p-8">
            <div className="absolute inset-0 bg-gradient-to-br from-[#c9a962]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative z-10 h-full flex flex-col justify-between">
              <div>
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#c9a962] to-[#b87333] flex items-center justify-center mb-6 shadow-lg shadow-[#c9a962]/20">
                  <Globe className="w-8 h-8 text-[#0a0f1a]" />
                </div>
                <h3 className="text-3xl font-bold text-[#f5f0e8] mb-4">Your Place, Your Story</h3>
                <p className="text-[#d4cfc4]/80 text-lg max-w-md">
                  Search anywhere on Earth—from your childhood street to your dream destination. Our global database covers every village, city, and mountain peak with extreme precision.
                </p>
              </div>

              {/* Visual decoration for the large card */}
              <div className="mt-8 flex gap-2 opacity-50">
                <div className="h-1 w-12 bg-[#c9a962] rounded-full" />
                <div className="h-1 w-6 bg-[#d4cfc4] rounded-full" />
                <div className="h-1 w-2 bg-[#d4cfc4] rounded-full" />
              </div>
            </div>
          </div>

          <FeatureCard
            title="Styles That Match Your Vibe"
            description="Minimalist, dramatic, vintage, or modern—find the perfect mood for your space with our curated themes."
            icon={Palette}
          />

          <FeatureCard
            title="Mountains That Pop"
            description="Real elevation data makes terrain look like it jumps off the page with realistic hillshading."
            icon={Mountain}
          />

          {/* Wide Feature */}
          <div className="md:col-span-2 md:col-start-2 p-8 rounded-2xl glass-card border border-white/10 relative overflow-hidden group">
            <div className="absolute right-0 top-0 w-64 h-full bg-gradient-to-l from-[#c9a962]/10 to-transparent" />
            <div className="relative z-10 flex items-start gap-6">
              <div className="w-12 h-12 rounded-xl bg-[#c9a962]/10 flex-shrink-0 flex items-center justify-center">
                <Printer className="w-6 h-6 text-[#c9a962]" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-[#f5f0e8] mb-2">Print-Ready-Resolution</h3>
                <p className="text-[#d4cfc4]/70">Download at massive resolution (up to 24×36" @ 300DPI) ready for professional printing services. No pixely blurs, just crisp vector-sharp lines.</p>
              </div>
            </div>
          </div>

          <FeatureCard
            title="Layer Control"
            description="Toggle streets, labels, buildings, water, parks, and topography independently."
            icon={Layers}
          />

          <FeatureCard
            title="Typography"
            description="Custom title sizing, letter spacing, and coordinate overlays for that designer look."
            icon={Type}
          />

          <FeatureCard
            title="Zero Friction"
            description="No signup, no backend, no cost—runs entirely in your browser instantly."
            icon={Zap}
          />
        </div>
      </div>
    </section>
  );
}

