import { getActiveFeaturedMaps } from '@/lib/actions/featured-maps';
import { getMarginAdjustedVariants, getProducts } from '@/lib/actions/ecommerce';
import { groupVariantsByProduct } from '@/lib/utils/store';
import { isFeatureEnabled } from '@/lib/feature-flags';
import Link from 'next/link';
import { ShoppingBag } from 'lucide-react';
import { FeaturedMapCard } from './FeaturedMapCard';

export async function FeaturedMaps() {
  const [isEnabled, maps, allVariants, productsData] = await Promise.all([
    isFeatureEnabled('ecommerce'),
    getActiveFeaturedMaps(),
    getMarginAdjustedVariants(),
    getProducts()
  ]);

  if (!isEnabled || maps.length === 0) {
    return null;
  }

  // Group variants by products for the ProductQuickBuy component
  const products = groupVariantsByProduct(allVariants, productsData);

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
            <FeaturedMapCard
              key={map.id}
              map={map}
              products={products}
              index={index}
            />
          ))}
        </div>

        <div className="mt-16 text-center">
          <Link
            href="/store-home"
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
