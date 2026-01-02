import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { getSiteStats } from '@/lib/actions/stats';

export async function FinalCTA() {
  const stats = await getSiteStats();
  return (
    <section className="py-24 bg-gradient-to-br from-[#0a0f1a] via-[#141d2e] to-[#0a0f1a] relative overflow-hidden">
      {/* Background pattern */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 35px, #f5f0e8 35px, #f5f0e8 36px),
                           repeating-linear-gradient(90deg, transparent, transparent 35px, #f5f0e8 35px, #f5f0e8 36px)`,
        }}
      />

      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-4xl md:text-5xl font-bold text-[#f5f0e8] mb-6">
          Your Location.
          <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#c9a962] to-[#b87333]">
            Your Art.
          </span>
        </h2>

        <p className="text-xl text-[#d4cfc4] mb-6 max-w-2xl mx-auto leading-relaxed">
          Every poster you create is yours. No watermarks, no subscriptions, no accounts.
          Just print-ready art from the places that matter to you.
        </p>

        {/* Social proof */}
        <p className="text-sm text-[#d4cfc4]/60 mb-8">
          Join {stats.totalUsers.toLocaleString()}+ creators who've made {stats.totalMaps.toLocaleString()}+ maps
        </p>

        <Link
          href="/editor"
          className="group inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-[#c9a962] to-[#b87333] text-[#0a0f1a] font-bold rounded-lg hover:shadow-2xl transition-all duration-300 text-lg"
        >
          Start Creating — It&apos;s Free
          <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>
    </section>
  );
}
