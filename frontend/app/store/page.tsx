
import { getMarginAdjustedVariants, getProducts } from '@/lib/actions/ecommerce';
import { groupVariantsByProduct } from '@/lib/utils/store';
import { ProductCard } from '@/components/store/ProductCard';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { trackEvent } from '@/lib/events';

export const metadata = {
    title: 'Select Product | Carto Art',
    description: 'Choose a product format for your map design.',
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

    // Track store view
    await trackEvent({
        eventType: 'store_view',
        eventName: 'store_page_loaded',
        metadata: {
            product_count: products.length,
            has_design: !!designUrl
        }
    });

    return (
        <div className="min-h-screen bg-gray-50/50 dark:bg-gray-950">
            {/* Header */}
            <div className="bg-white dark:bg-gray-900 border-b sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/editor" className="text-muted-foreground hover:text-foreground transition-colors">
                            <ChevronLeft className="w-5 h-5" />
                        </Link>
                        <h1 className="text-lg font-bold">Select Product</h1>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 py-8 md:py-12">
                <div className="text-center mb-12">
                    <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
                        Bring Your Map to Life
                    </h2>
                    <p className="mt-4 text-lg text-gray-500 dark:text-gray-400">
                        Choose the perfect format for your custom designed map.
                    </p>
                </div>

                {products.length === 0 ? (
                    <div className="text-center py-20">
                        <p className="text-gray-500">No products found.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {products.map(product => (
                            <ProductCard
                                key={product.id}
                                product={product}
                                designUrl={designUrl}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
