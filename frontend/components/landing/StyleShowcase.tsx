'use client';

import { useState } from 'react';
import { styleComparisons } from '@/lib/data/styleShowcase';
import { ArrowRight, ChevronLeft, ChevronRight, Layers } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

export function StyleShowcase() {
  const [activeIndex, setActiveIndex] = useState(0);

  const nextSlide = () => {
    setActiveIndex((prev) => (prev + 1) % styleComparisons.length);
  };

  const prevSlide = () => {
    setActiveIndex((prev) => (prev - 1 + styleComparisons.length) % styleComparisons.length);
  };

  return (
    <section className="py-24 bg-[#0a0f1a] relative overflow-hidden">
      {/* Background Gradients */}
      <div className="absolute top-1/4 -right-1/4 w-[800px] h-[800px] bg-[#c9a962]/5 rounded-full blur-3xl opacity-50" />
      <div className="absolute bottom-1/4 -left-1/4 w-[800px] h-[800px] bg-blue-500/5 rounded-full blur-3xl opacity-50" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-md mb-6">
            <Layers className="w-4 h-4 text-[#c9a962]" />
            <span className="text-sm font-medium text-[#f5f0e8]/90">Unlimited Possibilities</span>
          </div>

          <h2 className="text-4xl md:text-5xl font-bold text-[#f5f0e8] mb-6">
            Same Data.
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#c9a962] to-[#b87333]">
              Totally Different Vibe.
            </span>
          </h2>
          <p className="text-lg text-[#d4cfc4]/70 max-w-2xl mx-auto">
            See how different styles transform the same location into unique art pieces. From minimal monochrome to vibrant topographic heatmaps.
          </p>
        </div>

        {/* Carousel Container */}
        <div className="relative">
          {/* Main Showcase Area */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

            {/* Visuals - Interactive Slider */}
            <div className="relative aspect-[4/5] lg:aspect-square w-full max-w-lg mx-auto group">
              {/* Background Cards Stack Effect */}
              <div className="absolute top-4 -right-4 w-full h-full rounded-2xl border border-white/5 bg-white/5 backdrop-blur-sm -z-10 transform group-hover:rotate-6 transition-transform duration-500" />
              <div className="absolute top-8 -right-8 w-full h-full rounded-2xl border border-white/5 bg-white/5 backdrop-blur-sm -z-20 transform group-hover:rotate-12 transition-transform duration-500" />

              {/* Primary Card */}
              <div className="relative w-full h-full rounded-2xl overflow-hidden glass-card border border-white/10 shadow-2xl">
                {/* Animated Transition Wrapper */}
                <div
                  className="absolute inset-0 transition-opacity duration-500"
                  key={activeIndex}
                >
                  <img
                    src={styleComparisons[activeIndex].afterImage}
                    alt={styleComparisons[activeIndex].afterStyle}
                    className="w-full h-full object-cover"
                  />

                  <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/90 to-transparent">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[#c9a962] font-mono text-sm mb-1">{styleComparisons[activeIndex].location}</p>
                        <h3 className="text-white font-bold text-xl">{styleComparisons[activeIndex].afterStyle}</h3>
                      </div>
                      <div className="px-3 py-1 bg-white/10 rounded-full border border-white/20 text-xs text-white">
                        MapLibre Render
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Navigation Buttons (Floating) */}
              <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 flex gap-4">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={prevSlide}
                  className="rounded-full w-12 h-12 border-[#d4cfc4]/20 bg-[#0a0f1a] text-[#f5f0e8] hover:bg-[#c9a962] hover:text-[#0a0f1a] shadow-lg transition-all"
                >
                  <ChevronLeft className="w-5 h-5" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={nextSlide}
                  className="rounded-full w-12 h-12 border-[#d4cfc4]/20 bg-[#0a0f1a] text-[#f5f0e8] hover:bg-[#c9a962] hover:text-[#0a0f1a] shadow-lg transition-all"
                >
                  <ChevronRight className="w-5 h-5" />
                </Button>
              </div>
            </div>

            {/* Configurator / Details */}
            <div className="space-y-8">
              <div className="space-y-4">
                {styleComparisons.map((item, index) => (
                  <div
                    key={item.id}
                    onClick={() => setActiveIndex(index)}
                    className={cn(
                      "p-4 rounded-xl cursor-pointer border transition-all duration-300",
                      activeIndex === index
                        ? "bg-[#c9a962]/10 border-[#c9a962] shadow-[0_0_20px_rgba(201,169,98,0.1)]"
                        : "bg-white/5 border-white/5 hover:bg-white/10"
                    )}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className={cn(
                        "font-bold text-lg",
                        activeIndex === index ? "text-[#c9a962]" : "text-[#f5f0e8]"
                      )}>
                        {item.afterStyle}
                      </h4>
                      {activeIndex === index && <ArrowRight className="w-4 h-4 text-[#c9a962]" />}
                    </div>
                    <p className="text-[#d4cfc4]/60 text-sm">{item.description}</p>
                  </div>
                ))}
              </div>

              <div className="pt-8 border-t border-white/10">
                <div className="flex items-center gap-4 text-[#d4cfc4]/60 text-sm">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  <span>All styles available for free in the editor</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

