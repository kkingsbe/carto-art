'use client';

import Link from 'next/link';
import { ArrowRight, Map, Sparkles, ChevronRight, Cpu } from 'lucide-react';
import { Background3D } from '@/components/landing/3DBackground';
import { Button } from '@/components/ui/button';
import { trackEventAction } from '@/lib/actions/events';

interface HeroClientProps {
  showMcp: boolean;
}

export function HeroClient({ showMcp }: HeroClientProps) {
  return (
    <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden bg-[#0a0f1a]">
      {/* Dynamic Background */}
      <Background3D />

      {/* Ambient Glow Effects */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#c9a962]/10 rounded-full blur-3xl animate-pulse delay-1000" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 flex flex-col lg:flex-row items-center gap-12 lg:gap-20">

        {/* Text Content */}
        <div className="flex-1 text-center lg:text-left">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full hidden sm:inline-flex bg-white/5 border border-white/10 backdrop-blur-md mb-8 animate-float">
            <Sparkles className="w-4 h-4 text-[#c9a962]" />
            <span className="text-sm font-medium text-[#f5f0e8]/90">Now with 3D Terrain Rendering</span>
          </div>

          <h1 className="text-5xl lg:text-7xl font-bold text-[#f5f0e8] mb-6 leading-[1.1] tracking-tight">
            Map Your <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#c9a962] via-[#e5c985] to-[#b87333] animate-shimmer-text">
              Favorite Moments
            </span>
          </h1>

          <p className="text-xl text-[#d4cfc4]/80 mb-8 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
            Create stunning, museum-quality map posters of any location on Earth.
            Customize styles, colors, and 3D terrain in seconds.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
            <Link href="/editor">
              <Button
                size="lg"
                onClick={() => trackEventAction({ eventType: 'click', eventName: 'hero_create_map' })}
                className="h-14 px-8 text-lg bg-[#c9a962] hover:bg-[#b87333] text-[#0a0f1a] font-bold rounded-full shadow-[0_0_20px_rgba(201,169,98,0.3)] hover:shadow-[0_0_30px_rgba(201,169,98,0.5)] transition-all duration-300"
              >
                Create Free Map
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>

            <Link href="/gallery">
              <Button
                variant="outline"
                size="lg"
                className="h-14 px-8 text-lg bg-transparent border-[#d4cfc4]/30 text-[#d4cfc4] hover:bg-white/5 hover:text-[#f5f0e8] rounded-full backdrop-blur-sm transition-all duration-300"
              >
                Explore Gallery
              </Button>
            </Link>

            {showMcp && (
              <Link href="/developer/mcp">
                <Button
                  variant="ghost"
                  size="lg"
                  className="h-14 px-6 text-[#c9a962] hover:bg-[#c9a962]/10 rounded-full transition-all duration-300 gap-2"
                >
                  <Cpu className="w-5 h-5" />
                  MCP Server
                </Button>
              </Link>
            )}
          </div>

          <div className="mt-10 flex items-center justify-center lg:justify-start gap-x-8 gap-y-4 flex-wrap text-sm text-[#d4cfc4]/60">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
              Checking out is free
            </div>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
              No account required
            </div>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-purple-500" />
              Instant 300 DPI Download
            </div>
          </div>
        </div>

        {/* Visual Content - 3D Tilted Card */}
        <div className="flex-1 w-full max-w-xl lg:max-w-none perspective-1000">
          <div className="relative group transform transition-transform duration-700 hover:rotate-y-[-5deg] hover:rotate-x-[5deg]">
            {/* Main Card */}
            <div className="relative rounded-2xl overflow-hidden glass-card shadow-2xl border border-white/10 z-20">
              <div className="absolute inset-0 bg-gradient-to-tr from-black/20 to-transparent z-10" />
              <img
                src="/hero.jpg"
                alt="Custom Map Interface"
                className="w-full h-auto object-cover transform scale-105 group-hover:scale-110 transition-transform duration-700"
              />

              {/* Floating UI Elements for "Pro" feel */}
              <div className="absolute top-6 right-6 z-30 bg-black/60 backdrop-blur-md px-4 py-2 rounded-lg border border-white/10 shadow-xl flex items-center gap-3 animate-float delay-75">
                <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
                <span className="text-xs font-mono text-white">LIVE RENDER</span>
              </div>

              <div className="absolute bottom-6 left-6 z-30 bg-black/60 backdrop-blur-md p-4 rounded-xl border border-white/10 shadow-xl max-w-[200px] animate-float delay-100">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-white/60">Coordinates</span>
                  <Map className="w-3 h-3 text-[#c9a962]" />
                </div>
                <div className="text-xs font-mono text-white">32.16° N<br />110.96° W</div>
              </div>
            </div>

            {/* Decorative back layers */}
            <div className="absolute -inset-4 bg-gradient-to-r from-[#c9a962] to-[#b87333] opacity-20 blur-2xl -z-10 group-hover:opacity-30 transition-opacity duration-500" />
          </div>
        </div>
      </div>
    </section>
  );
}

