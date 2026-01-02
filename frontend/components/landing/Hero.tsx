'use client';

import Link from 'next/link';
import { ArrowRight, Map } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-[#0a0f1a] via-[#141d2e] to-[#0a0f1a]">
      {/* Topographic background pattern */}
      <div
        className="absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 35px, #f5f0e8 35px, #f5f0e8 36px),
                           repeating-linear-gradient(90deg, transparent, transparent 35px, #f5f0e8 35px, #f5f0e8 36px)`,
        }}
      />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        {/* Logo/Brand */}
        <div className="flex items-center justify-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 shadow-lg flex items-center justify-center">
            <Map className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-[#f5f0e8]">Carto-Art</h2>
        </div>

        {/* FREE Badge */}
        <div className="mb-6">
          <Badge className="bg-gradient-to-r from-[#c9a962] to-[#b87333] text-[#0a0f1a] font-bold px-6 py-2 text-base hover:shadow-lg transition-shadow">
            100% FREE FOREVER
          </Badge>
        </div>

        {/* Main Headline */}
        <h1 className="text-5xl md:text-7xl font-bold text-[#f5f0e8] mb-6 leading-tight">
          Transform Any Location
          <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#c9a962] to-[#b87333]">
            Into Personalized Wall Art
          </span>
        </h1>

        {/* Subheading */}
        <p className="text-xl md:text-2xl text-[#d4cfc4] max-w-3xl mx-auto mb-8 leading-relaxed">
          Turn any place into personalized wall art—in minutes.
          <br />
          No signup. No watermarks. No catch.
        </p>

        {/* Trust Indicators */}
        <div className="flex flex-wrap items-center justify-center gap-4 md:gap-8 text-sm md:text-base text-[#d4cfc4] mb-12">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-[#c9a962]" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            24×36" at 300 DPI
          </div>
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-[#c9a962]" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            Mountains look real
          </div>
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-[#c9a962]" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            No Watermarks
          </div>
        </div>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-6">
          <Link
            href="/editor"
            className="group px-8 py-4 bg-gradient-to-r from-[#c9a962] to-[#b87333] text-[#0a0f1a] font-bold rounded-lg hover:shadow-2xl transition-all duration-300 flex items-center gap-2 text-lg"
          >
            Create Your Free Poster
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link
            href="/gallery"
            className="px-8 py-4 bg-transparent border-2 border-[#d4cfc4] text-[#d4cfc4] font-bold rounded-lg hover:bg-[#d4cfc4]/10 transition-all duration-300 text-lg"
          >
            Browse Gallery
          </Link>
        </div>

        {/* Visual Preview */}
        <div className="mt-16 relative max-w-5xl mx-auto">
          <div className="relative rounded-lg overflow-hidden shadow-2xl border border-[#d4cfc4]/20 bg-[#141d2e]">
            <img
              src="/hero.jpg"
              alt="Map Poster Editor Preview - Beautiful minimalist city map with customizable styles and colors"
              className="w-full h-auto"
              loading="eager"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
