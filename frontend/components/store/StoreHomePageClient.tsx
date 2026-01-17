'use client';

import { ProductGroup } from '@/lib/utils/store';
import { FeaturedProductCard } from './FeaturedProductCard';
import type { FeaturedMap } from '@/lib/actions/featured-maps';

interface StoreHomePageClientProps {
    products: ProductGroup[];
    featuredMaps: FeaturedMap[];
}

export function StoreHomePageClient({ products, featuredMaps }: StoreHomePageClientProps) {
    // Handle empty states
    if (products.length === 0) {
        return (
            <div className="max-w-7xl mx-auto px-4 py-16 text-center">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                    No Products Available
                </h2>
                <p className="text-gray-500 dark:text-gray-400">
                    Check back soon for new products.
                </p>
            </div>
        );
    }

    // If no featured maps exist, show a message and redirect to full store
    if (featuredMaps.length === 0) {
        return (
            <div className="max-w-7xl mx-auto px-4 py-16 text-center">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                    No Featured Maps Available
                </h2>
                <p className="text-gray-500 dark:text-gray-400 mb-6">
                    Featured maps are being curated. Browse all products in the meantime.
                </p>
                <a
                    href="/store"
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-medium hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors"
                >
                    Browse All Products
                </a>
            </div>
        );
    }

    // Get the featured map for a given product index (cycle through available maps)
    const getFeaturedMapForProduct = (productIndex: number): FeaturedMap => {
        return featuredMaps[productIndex % featuredMaps.length];
    };

    return (
        <div className="max-w-7xl mx-auto px-4 py-8 md:py-12">
            {/* Header */}
            <div className="text-center mb-12 md:mb-16">
                <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-gray-900 dark:text-white mb-4">
                    Featured Products
                </h1>
                <p className="text-lg text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">
                    Discover our curated collection of premium map prints, posters, and canvas art featuring stunning designs from our featured artists.
                </p>
            </div>

            {/* Products Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10">
                {products.map((product, index) => {
                    const featuredMap = getFeaturedMapForProduct(index);
                    return (
                        <FeaturedProductCard
                            key={product.id}
                            product={product}
                            featuredMap={featuredMap}
                            index={index}
                        />
                    );
                })}
            </div>

            {/* CTA Section */}
            <div className="mt-16 md:mt-20 text-center">
                <p className="text-gray-500 dark:text-gray-400 mb-4">
                    Looking for more options?
                </p>
                <a
                    href="/store"
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                >
                    View All Products
                </a>
            </div>
        </div>
    );
}
