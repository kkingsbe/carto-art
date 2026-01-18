import { getMarginAdjustedVariants, getProducts } from '@/lib/actions/ecommerce';
import { groupVariantsByProduct } from '@/lib/utils/store';
import { getActiveFeaturedMaps } from '@/lib/actions/featured-maps';
import { StoreHomePageClient } from '@/components/store/StoreHomePageClient';
import { ProductHero } from '@/components/store/ProductHero';
import { ProductComparisonTable } from '@/components/store/ProductComparisonTable';
import Link from 'next/link';
import { ChevronLeft, Palette } from 'lucide-react';

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
        <div className="min-h-screen bg-gray-50/50 dark:bg-background">
            {/* Header */}
            <div className="bg-white dark:bg-surface-1 border-b border-gray-200 dark:border-border sticky top-0 z-50 backdrop-blur-sm bg-white/95 dark:bg-surface-1/95">
                <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/" className="text-muted-foreground hover:text-foreground transition-colors">
                            <ChevronLeft className="w-5 h-5" />
                        </Link>
                        <h1 className="text-lg font-bold text-gray-900 dark:text-text-primary">Store</h1>
                    </div>
                    <Link 
                        href="/editor"
                        className="flex items-center gap-2 px-4 py-2 rounded-full bg-gray-100 dark:bg-surface-2 hover:bg-gray-200 dark:hover:bg-surface-hover text-sm font-medium transition-all duration-200 text-gray-900 dark:text-text-primary border border-transparent dark:border-border"
                    >
                        <Palette className="w-4 h-4" />
                        <span className="hidden sm:inline">Create Your Own</span>
                        <span className="sm:hidden">Create</span>
                    </Link>
                </div>
            </div>

            {/* Hero Section */}
            <ProductHero
                title="Premium Map Prints"
                subtitle="Transform your favorite places into stunning wall art. Museum-quality prints, ready to hang."
            />

            {/* Main Content */}
            <StoreHomePageClient
                products={featuredProducts}
                featuredMaps={featuredMaps}
            />

            {/* Product Comparison Section */}
            {products.length > 0 && (
                <div className="relative">
                    {/* Section divider with gradient */}
                    <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gray-200 dark:via-border to-transparent" />
                    
                    <div className="max-w-7xl mx-auto px-4 py-16">
                        <ProductComparisonTable products={products} />
                    </div>
                </div>
            )}

            {/* CTA Section */}
            <div className="relative bg-gray-900 dark:bg-surface-1 overflow-hidden">
                {/* Decorative gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-gold/5 via-transparent to-copper/5 pointer-events-none" />
                
                <div className="relative max-w-7xl mx-auto px-4 py-16 text-center">
                    <h2 className="text-2xl md:text-3xl font-bold text-white dark:text-text-primary mb-4">
                        Create Your Own Custom Map
                    </h2>
                    <p className="text-gray-400 dark:text-text-secondary mb-8 max-w-2xl mx-auto">
                        Design a unique map of any location in the world. Choose your style, colors, and format to create the perfect piece for your space.
                    </p>
                    <Link
                        href="/editor"
                        className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-white dark:bg-gold text-gray-900 dark:text-background font-semibold hover:bg-gray-100 dark:hover:bg-gold-hover transition-all duration-200 hover:scale-105 active:scale-95 shadow-lg dark:shadow-[var(--glow-gold)]"
                    >
                        <Palette className="w-5 h-5" />
                        Start Designing
                    </Link>
                </div>
            </div>
        </div>
    );
}
