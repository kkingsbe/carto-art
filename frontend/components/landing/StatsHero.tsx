import { getSiteStats } from '@/lib/actions/stats';
import { TrendingUp, Users, Image, Sparkles } from 'lucide-react';

export async function StatsHero() {
  const stats = await getSiteStats();

  const statCards = [
    {
      icon: Image,
      label: 'Maps Created',
      value: stats.totalMaps.toLocaleString(),
      color: 'from-[#c9a962] to-[#b87333]',
    },
    {
      icon: Users,
      label: 'Active Creators',
      value: stats.totalUsers.toLocaleString(),
      color: 'from-[#c9a962] to-[#b87333]',
    },
    {
      icon: Sparkles,
      label: 'Published to Gallery',
      value: stats.totalPublishedMaps.toLocaleString(),
      color: 'from-[#c9a962] to-[#b87333]',
    },
    {
      icon: TrendingUp,
      label: 'Created This Month',
      value: stats.recentMapsCount.toLocaleString(),
      color: 'from-[#c9a962] to-[#b87333]',
    },
  ];

  return (
    <section className="py-16 bg-gradient-to-br from-[#0a0f1a] via-[#141d2e] to-[#0a0f1a] relative overflow-hidden">
      {/* Background pattern */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 35px, #f5f0e8 35px, #f5f0e8 36px),
                           repeating-linear-gradient(90deg, transparent, transparent 35px, #f5f0e8 35px, #f5f0e8 36px)`,
        }}
      />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-[#f5f0e8] mb-3">
            Join Thousands of Creators
          </h2>
          <p className="text-lg text-[#d4cfc4]">
            Real people creating beautiful maps every day
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {statCards.map((stat) => (
            <div
              key={stat.label}
              className="bg-[#141d2e]/50 backdrop-blur-sm rounded-lg p-6 border border-[#d4cfc4]/10 hover:border-[#c9a962]/30 transition-all duration-300 hover:transform hover:scale-105"
            >
              <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${stat.color} flex items-center justify-center mb-4`}>
                <stat.icon className="w-6 h-6 text-[#0a0f1a]" />
              </div>
              <div className="text-3xl md:text-4xl font-bold text-[#f5f0e8] mb-2">
                {stat.value}
              </div>
              <div className="text-sm text-[#d4cfc4]">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
