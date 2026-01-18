import { getMarginAdjustedVariants, getProducts } from '@/lib/actions/ecommerce';
import { groupVariantsByProduct } from '@/lib/utils/store';
import { ProductCard } from '@/components/store/ProductCard';
import { ProductHero } from '@/components/store/ProductHero';
import { ProductComparisonTable } from '@/components/store/ProductComparisonTable';
import Link from 'next/link';
import { ChevronLeft, Award, Truck, Shield } from 'lucide-react';
import { StorePageTracker } from '@/components/store/StorePageTracker';

export const metadata = {
    title: 'Select Product | Carto Art',
    description: 'Choose a product format for your map design. Options include prints, framed posters, and canvas.',
    openGraph: {
        title: 'Select Product - Carto-Art Store',
        description: 'Choose the perfect format for your custom map design.',
        url: '/store',
        locale: 'en_US',
        type: 'website',
        images: [
            {
                url: '/hero.jpg',
                width: 1200,
                height: 630,
                alt: 'Carto-Art Store - Map Poster Products',
            },
        ],
    },
    twitter: {
        card: 'summary_large_image',
        title: 'Select Product - Carto-Art Store',
        description: 'Choose the perfect format for your custom map design.',
        images: ['/hero.jpg'],
    },
};

interface StorePageProps {
    searchParams: { [key: string]: string | string[] | undefined };
}

export default async function StorePage({ searchParams }: StorePageProps) {
    // 1. Fetch data
    const [allVariants, productsData] = await Promise.all([
        getMarginAdjustedVariants(),
        getProducts()
    ]);

    // 2. Group into products
    const products = groupVariantsByProduct(allVariants, productsData);

    // 3. Get design URL for preview (await searchParams for Next.js 15+)
    const params = await searchParams;
    const designUrl = typeof params.image === 'string' ? params.image : undefined;

    return (
        <div className="min-h-screen bg-gray-50/50 dark:bg-background">
            <StorePageTracker
                productCount={products.length}
                hasDesign={!!designUrl}
            />

            {/* Header */}
            <div className="bg-white dark:bg-surface-1 border-b border-gray-200 dark:border-border sticky top-0 z-50 backdrop-blur-sm bg-white/95 dark:bg-surface-1/95">
                <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/editor" className="text-muted-foreground hover:text-foreground transition-colors">
                            <ChevronLeft className="w-5 h-5" />
                        </Link>
                        <h1 className="text-lg font-bold text-gray-900 dark:text-text-primary">Select Product</h1>
                    </div>
                </div>
            </div>

            {/* Hero Section */}
            <ProductHero />

            {/* Main Content with gradient background */}
            <div className="relative">
                {/* Subtle gradient overlay for depth */}
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-gray-50/50 dark:via-surface-1/20 to-gray-50/50 dark:to-background pointer-events-none" />
                
                <div className="relative max-w-7xl mx-auto px-4 py-8 md:py-12">
                    {products.length === 0 ? (
                        <div className="text-center py-20">
                            <p className="text-gray-500 dark:text-text-muted">No products found.</p>
                        </div>
                    ) : (
                        <>
                            {/* Product Cards Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 mb-16">
                                {products.map(product => (
                                    <ProductCard
                                        key={product.id}
                                        product={product}
                                        designUrl={designUrl}
                                    />
                                ))}
                            </div>

                            {/* Section Divider */}
                            <div className="relative py-8">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-gray-200 dark:border-border" />
                                </div>
                                <div className="relative flex justify-center">
                                    <span className="bg-gray-50 dark:bg-background px-4 text-sm text-gray-500 dark:text-text-muted">
                                        Compare Options
                                    </span>
                                </div>
                            </div>

                            {/* Comparison Table */}
                            <div className="pt-8">
                                <ProductComparisonTable
                                    products={products}
                                    designUrl={designUrl}
                                />
                            </div>

                            {/* Additional Info Section */}
                            <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
                                <InfoCard
                                    icon={Award}
                                    title="Premium Quality"
                                    description="All our products are printed on museum-quality materials with archival inks that last a lifetime."
                                />
                                <InfoCard
                                    icon={Truck}
                                    title="Fast Shipping"
                                    description="Orders are printed and shipped within 3-5 business days. Free shipping on orders over $75."
                                />
                                <InfoCard
                                    icon={Shield}
                                    title="Satisfaction Guaranteed"
                                    description="Not happy with your order? We'll make it right with our 100% satisfaction guarantee."
                                />
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

function InfoCard({ 
    icon: Icon, 
    title, 
    description 
}: { 
    icon: React.ComponentType<{ className?: string }>;
    title: string; 
    description: string;
}) {
    return (
        <div className="text-center p-6 rounded-xl bg-white dark:bg-surface-1 border border-gray-200 dark:border-border transition-all duration-200 hover:border-gray-300 dark:hover:border-border-interactive hover:shadow-lg dark:hover:shadow-[var(--glow-gold)]">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 dark:bg-surface-2 mb-4">
                <Icon className="w-6 h-6 text-gray-600 dark:text-gold" />
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-text-primary mb-2">
                {title}
            </h3>
            <p className="text-sm text-gray-500 dark:text-text-secondary">
                {description}
            </p>
        </div>
    );
}
