'use client';

import { Globe, Palette, Mountain, Printer, Layers, Type } from 'lucide-react';

const primaryFeatures = [
  {
    icon: Globe,
    title: 'Your Place, Your Story',
    description: 'Search anywhere on Earth—from your childhood street to your dream destination',
  },
  {
    icon: Palette,
    title: 'Styles That Match Your Vibe',
    description: 'Minimalist, dramatic, vintage, or modern—find the perfect mood for your space',
  },
  {
    icon: Mountain,
    title: 'Mountains That Pop',
    description: 'Real elevation data makes terrain look like it jumps off the page',
  },
  {
    icon: Printer,
    title: 'Poster Size, No Compromises',
    description: 'Download at massive resolution—ready for professional printing up to 24×36"',
  },
];

const secondaryFeatures = [
  {
    icon: Layers,
    title: 'Layer Control',
    description: 'Toggle streets, labels, buildings, water, parks, topography independently',
  },
  {
    icon: Type,
    title: 'Typography',
    description: 'Custom title sizing, letter spacing, and coordinate overlays',
  },
  {
    icon: Globe,
    title: 'Zero Friction',
    description: 'No signup, no backend, no cost—runs entirely in your browser',
  },
];

export function Features() {
  return (
    <section className="py-24 bg-[#f5f0e8]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-[#0a0f1a] mb-4">
            Professional Maps,
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#c9a962] to-[#b87333]">
              Zero Compromises
            </span>
          </h2>
          <p className="text-lg text-[#141d2e]/70 max-w-2xl mx-auto">
            Everything you need to create gallery-quality cartographic art
          </p>
        </div>

        {/* Primary Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          {primaryFeatures.map((feature) => (
            <div
              key={feature.title}
              className="bg-white rounded-lg p-6 shadow-sm border border-[#0a0f1a]/10 hover:shadow-md transition-shadow"
            >
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-[#c9a962] to-[#b87333] flex items-center justify-center mb-4">
                <feature.icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-[#0a0f1a] mb-2">
                {feature.title}
              </h3>
              <p className="text-[#141d2e]/70">
                {feature.description}
              </p>
            </div>
          ))}
        </div>

        {/* Secondary Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {secondaryFeatures.map((feature) => (
            <div
              key={feature.title}
              className="bg-[#141d2e]/5 rounded-lg p-6 border border-[#0a0f1a]/10"
            >
              <feature.icon className="w-8 h-8 text-[#c9a962] mb-3" />
              <h3 className="text-lg font-bold text-[#0a0f1a] mb-2">
                {feature.title}
              </h3>
              <p className="text-sm text-[#141d2e]/70">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
