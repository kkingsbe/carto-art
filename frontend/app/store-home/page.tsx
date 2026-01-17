import { getMarginAdjustedVariants, getProducts } from '@/lib/actions/ecommerce';
import { groupVariantsByProduct } from '@/lib/utils/store';
import { getActiveFeaturedMaps } from '@/lib/actions/featured-maps';
import { StoreHomePageClient } from '@/components/store/StoreHomePageClient';

export const metadata = {
    title: 'Store | Carto Art',
    description: 'Browse our collection of custom map prints, posters, and canvas art featuring stunning designs from our featured artists.',
    openGraph: {
        title: 'Store - Carto Art',
        description: 'Discover our curated collection of premium map prints, posters, and canvas art featuring stunning designs from our featured artists.',
        url: '/store-home',
        locale: 'en_US',
        type: 'website',
        images: [
            {
                url: '/hero.jpg',
                width: 1200,
                height: 630,
                alt: 'Carto Art Store - Featured Map Products',
            },
        ],
    },
    twitter: {
        card: 'summary_large_image',
        title: 'Store - Carto Art',
        description: 'Discover our curated collection of premium map prints, posters, and canvas art.',
        images: ['/hero.jpg'],
    },
};

export default async function StoreHomePage() {
    // Fetch data in parallel
    const [featuredMaps, allVariants, productsData] = await Promise.all([
        getActiveFeaturedMaps(),
        getMarginAdjustedVariants(),
        getProducts()
    ]);

    // Group variants by products
    const products = groupVariantsByProduct(allVariants, productsData);

    // Show first 6 products (or fewer if not available)
    const featuredProducts = products.slice(0, 6);

    return (
        <div className="min-h-screen bg-gray-50/50 dark:bg-gray-950">
            <StoreHomePageClient
                products={featuredProducts}
                featuredMaps={featuredMaps}
            />
        </div>
    );
}
