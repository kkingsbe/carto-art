import { Background3D } from '@/components/landing/3DBackground';
import { Sparkles, Search, MapPin, Users, Calendar } from 'lucide-react';
import { SiteStats } from '@/lib/actions/stats';

interface GalleryHeroProps {
  stats?: SiteStats;
}

export default function GalleryHero({ stats }: GalleryHeroProps) {
  return (
    <section className="relative min-h-[55vh] flex items-center justify-center overflow-hidden bg-[#0a0f1a]">
      <Background3D />

      {/* Ambient Glow Effects */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#c9a962]/10 rounded-full blur-3xl animate-pulse delay-1000" />

      {/* Additional floating orbs */}
      <div className="absolute top-1/3 right-1/3 w-64 h-64 bg-purple-500/5 rounded-full blur-2xl animate-float" />

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

        <p className="text-xl text-[#d4cfc4]/80 max-w-2xl mb-8 leading-relaxed">
          Discover stunning map posters created by creators worldwide.
          <br className="hidden md:block" />
          Get inspired by beautiful cartographic designs.
        </p>

        {/* Search Bar */}
        <div className="relative max-w-lg w-full mx-auto mb-12">
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-[#c9a962]/30 via-[#e5c985]/20 to-[#b87333]/30 rounded-full blur opacity-0 group-hover:opacity-100 transition duration-500" />
            <div className="relative flex items-center">
              <Search className="absolute left-5 w-5 h-5 text-white/40 pointer-events-none" />
              <input
                type="text"
                placeholder="Search by location, creator, or style..."
                className="w-full pl-14 pr-6 py-4 rounded-full
                  bg-white/5 border border-white/10 backdrop-blur-md
                  text-white placeholder:text-white/40
                  focus:border-[#c9a962]/50 focus:ring-2 focus:ring-[#c9a962]/20 focus:outline-none
                  transition-all duration-300 text-base"
              />
              <button className="absolute right-2 px-4 py-2 rounded-full bg-gradient-to-r from-[#c9a962] to-[#b87333] text-[#0a0f1a] font-semibold text-sm hover:opacity-90 transition-opacity">
                Search
              </button>
            </div>
          </div>
        </div>

        {/* Stats Badges */}
        <div className="flex flex-wrap gap-4 md:gap-6 justify-center animate-fade-in-up">
          {/* Maps Created */}
          <div className="stat-card-animated group">
            <div className="flex flex-col items-center px-8 py-5 min-w-[150px] transition-all duration-300 hover:scale-105">
              <div className="flex items-center gap-2 mb-2">
                <MapPin className="w-4 h-4 text-[#c9a962]" />
                <span className="text-3xl font-bold text-[#c9a962]">
                  {stats ? stats.totalExports.toLocaleString() : '500+'}
                </span>
              </div>
              <span className="text-xs text-[#d4cfc4]/60 uppercase tracking-wider font-semibold">Maps Created</span>
            </div>
          </div>

          {/* Active Creators */}
          <div className="stat-card-animated group">
            <div className="flex flex-col items-center px-8 py-5 min-w-[150px] transition-all duration-300 hover:scale-105">
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-4 h-4 text-[#c9a962]" />
                <span className="text-3xl font-bold text-[#c9a962]">
                  {stats ? stats.totalUsers.toLocaleString() : '100+'}
                </span>
              </div>
              <span className="text-xs text-[#d4cfc4]/60 uppercase tracking-wider font-semibold">Active Creators</span>
            </div>
          </div>

          {/* Daily Updates */}
          <div className="stat-card-animated group">
            <div className="flex flex-col items-center px-8 py-5 min-w-[150px] transition-all duration-300 hover:scale-105">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-4 h-4 text-[#c9a962]" />
                <span className="text-3xl font-bold text-[#c9a962]">Daily</span>
              </div>
              <span className="text-xs text-[#d4cfc4]/60 uppercase tracking-wider font-semibold">New Additions</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
