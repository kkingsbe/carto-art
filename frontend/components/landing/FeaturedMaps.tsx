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
    <section className="py-20 bg-gray-50 dark:bg-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-2 mb-4">
            <TrendingUp className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
              Featured Maps
            </h2>
          </div>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Top-rated creations from our community
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
            className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 transition-colors"
          >
            View Full Gallery
          </Link>
        </div>
      </div>
    </section>
  );
}
