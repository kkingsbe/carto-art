import { Background3D } from '@/components/landing/3DBackground';
import { Sparkles } from 'lucide-react';
import { SiteStats } from '@/lib/actions/stats';

interface GalleryHeroProps {
  stats?: SiteStats;
}

export default function GalleryHero({ stats }: GalleryHeroProps) {
  return (
    <section className="relative min-h-[50vh] flex items-center justify-center overflow-hidden bg-[#0a0f1a]">
      <Background3D />

      {/* Ambient Glow Effects */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#c9a962]/10 rounded-full blur-3xl animate-pulse delay-1000" />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center h-full px-4 py-20 text-center">

        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-md mb-8 animate-float">
          <Sparkles className="w-4 h-4 text-[#c9a962]" />
          <span className="text-sm font-medium text-[#f5f0e8]/90">Community Showcase</span>
        </div>

        <h1 className="text-5xl md:text-7xl font-bold mb-6 tracking-tight">
          <span className="text-[#f5f0e8]">Community </span>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#c9a962] via-[#e5c985] to-[#b87333] animate-shimmer-text">
            Gallery
          </span>
        </h1>

        <p className="text-xl text-[#d4cfc4]/80 max-w-2xl mb-12 leading-relaxed">
          Discover stunning map posters created by creators worldwide.
          <br className="hidden md:block" />
          Get inspired by beautiful cartographic designs.
        </p>

        {/* Stats Badges */}
        <div className="flex flex-wrap gap-4 md:gap-8 justify-center animate-fade-in-up">
          <div className="flex flex-col items-center bg-white/5 border border-white/10 backdrop-blur-md rounded-2xl px-8 py-4 min-w-[140px] hover:bg-white/10 transition-colors">
            <span className="text-3xl font-bold text-[#c9a962]">
              {stats ? stats.totalExports.toLocaleString() : '500+'}
            </span>
            <span className="text-sm text-[#d4cfc4]/60 uppercase tracking-wider mt-1">Maps Created</span>
          </div>
          <div className="flex flex-col items-center bg-white/5 border border-white/10 backdrop-blur-md rounded-2xl px-8 py-4 min-w-[140px] hover:bg-white/10 transition-colors">
            <span className="text-3xl font-bold text-[#c9a962]">
              {stats ? stats.totalUsers.toLocaleString() : '100+'}
            </span>
            <span className="text-sm text-[#d4cfc4]/60 uppercase tracking-wider mt-1">Active Creators</span>
          </div>
          <div className="flex flex-col items-center bg-white/5 border border-white/10 backdrop-blur-md rounded-2xl px-8 py-4 min-w-[140px] hover:bg-white/10 transition-colors">
            <span className="text-3xl font-bold text-[#c9a962]">Daily</span>
            <span className="text-sm text-[#d4cfc4]/60 uppercase tracking-wider mt-1">New Additions</span>
          </div>
        </div>
      </div>
    </section>
  );
}
