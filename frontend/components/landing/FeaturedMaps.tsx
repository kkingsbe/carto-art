import { getActiveFeaturedMaps } from '@/lib/actions/featured-maps';
import { isFeatureEnabled } from '@/lib/feature-flags';
import Link from 'next/link';
import { ArrowRight, ShoppingBag } from 'lucide-react';
import { cn } from '@/lib/utils'; // Assuming this exists, typical in shadcn

export async function FeaturedMaps() {
  const [isEnabled, maps] = await Promise.all([
    isFeatureEnabled('ecommerce'),
    getActiveFeaturedMaps()
  ]);

  if (!isEnabled || maps.length === 0) {
    return null;
  }

  return (
    <section className="py-24 relative overflow-hidden">
      {/* Background enhancement */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0a0f1a] via-[#0f1623] to-[#0a0f1a]" />
      <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.03] mix-blend-overlay pointer-events-none" />

      <div className="container relative mx-auto px-4 md:px-6 z-10">
        <div className="flex flex-col items-center text-center space-y-4 mb-12">
          <h2 className="text-3xl md:text-5xl font-bold tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-amber-200 via-white to-amber-200 animate-gradient-x">
            Featured Collections
          </h2>
          <p className="max-w-[700px] text-gray-400 md:text-xl">
            Explore our curated selection of beautiful map prints, ready to frame.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {maps.map((map, index) => (
            <Link
              key={map.id}
              href={map.link_url}
              className="group relative block h-full"
            >
              <div className="relative h-full bg-[#111827] rounded-2xl overflow-hidden border border-gray-800 transition-all duration-300 hover:border-amber-500/50 hover:shadow-[0_0_30px_rgba(245,158,11,0.15)] ring-offset-2 focus-visible:ring-2">
                {/* Image Container */}
                <div className="aspect-[4/5] w-full overflow-hidden relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={map.image_url}
                    alt={map.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    loading={index < 3 ? "eager" : "lazy"}
                  />

                  {/* Overlay Gradient */}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0a0f1a] via-transparent to-transparent opacity-60 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-300" />
                </div>

                {/* Content */}
                <div className="absolute bottom-0 left-0 right-0 p-6 md:translate-y-2 md:group-hover:translate-y-0 transition-transform duration-300">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xl font-bold text-white group-hover:text-amber-200 transition-colors">
                      {map.title}
                    </h3>
                    <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-4 group-hover:translate-x-0">
                      <ArrowRight className="w-4 h-4 text-amber-500" />
                    </div>
                  </div>

                  {map.description && (
                    <p className="text-sm text-gray-300 line-clamp-2 md:opacity-0 md:group-hover:opacity-100 transition-all duration-300 delay-75">
                      {map.description}
                    </p>
                  )}

                  {/* Mobile Only CTA - Visible by default on mobile, implied on desktop via interactions */}
                  <div className="mt-4 md:hidden flex items-center text-sm font-medium text-amber-500">
                    Shop Now <ArrowRight className="w-4 h-4 ml-1" />
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-16 text-center">
          <Link
            href="/store"
            className="inline-flex items-center justify-center gap-2 px-8 py-3 rounded-full bg-amber-500 hover:bg-amber-400 text-black font-semibold transition-all hover:scale-105 active:scale-95"
          >
            <ShoppingBag className="w-5 h-5" />
            View Full Collection
          </Link>
        </div>
      </div>
    </section>
  );
}
