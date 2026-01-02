import Link from 'next/link';
import { getFeed } from '@/lib/actions/feed';
import { MapCard } from '@/components/feed/MapCard';
import { TrendingUp } from 'lucide-react';

export async function FeaturedMaps() {
  // Fetch top 3 rated maps
  const topMaps = await getFeed('top', 0, 3);

  // Don't render if no maps available
  if (topMaps.length === 0) {
    return null;
  }

  return (
    <section className="py-24 bg-[#f5f0e8]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-2 mb-4">
            <TrendingUp className="w-8 h-8 text-[#c9a962]" />
            <h2 className="text-4xl md:text-5xl font-bold text-[#0a0f1a]">
              Community
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#c9a962] to-[#b87333]">
                Creations
              </span>
            </h2>
          </div>
          <p className="text-xl text-[#141d2e]/70 max-w-2xl mx-auto">
            See what others are making—get inspired for your own
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {topMaps.map((map) => (
            <MapCard key={map.id} map={map} />
          ))}
        </div>

        <div className="text-center">
          <Link
            href="/gallery"
            className="inline-flex items-center justify-center px-8 py-4 border-2 border-[#0a0f1a] text-base font-bold rounded-lg text-[#0a0f1a] bg-white hover:bg-[#0a0f1a] hover:text-[#f5f0e8] transition-all duration-300"
          >
            View Full Gallery
          </Link>
        </div>
      </div>
    </section>
  );
}
