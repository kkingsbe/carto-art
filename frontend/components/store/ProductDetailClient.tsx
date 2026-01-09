
'use client';

import { useSearchParams } from 'next/navigation';
import { OrderSteps } from '@/components/ecommerce/OrderSteps';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import { parseAspectRatio, variantMatchesAspectRatio, parseVariantDimensions } from '@/lib/utils/store';

import { ProductGroup } from '@/lib/utils/store';

interface ProductDetailClientProps {
    variants: any[];
    product: ProductGroup;
}

export function ProductDetailClient({ variants, product }: ProductDetailClientProps) {
    const searchParams = useSearchParams();

    const rawDesignUrl = searchParams?.get('image');
    const designUrl = rawDesignUrl === 'undefined' ? null : rawDesignUrl;
    const aspectRatio = searchParams?.get('aspect') || '2:3';
    const orientation = (searchParams?.get('orientation') as 'portrait' | 'landscape') || 'portrait';

    if (!designUrl) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-4">
                <h1 className="text-2xl font-bold mb-4">No Design Selected</h1>
                <p className="text-muted-foreground mb-8">Please select a map design first.</p>
                <Link href="/store">
                    <Button>Back to Store</Button>
                </Link>
            </div>
        );
    }

    // Filter variants based on aspect ratio
    const targetRatio = parseAspectRatio(aspectRatio, orientation);

    // Strict filtering
    const finalVariants = variants.filter(v => variantMatchesAspectRatio(v, targetRatio));

    console.log('[ProductDetailClient] Filtering variants:', {
        aspectRatio,
        orientation,
        targetRatio,
        totalParams: variants.length,
        filteredCount: finalVariants.length,
        // debug first few to see why they failed/passed
        debug: variants.slice(0, 5).map(v => ({
            name: v.name,
            dims: parseVariantDimensions(v.name),
            match: variantMatchesAspectRatio(v, targetRatio)
        }))
    });

    return (
        <div className="min-h-screen bg-gray-50/50 dark:bg-gray-950">
            {/* Header */}
            <div className="bg-white dark:bg-gray-900 border-b sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        {/* Back to Products List */}
                        <Link href={`/store?${searchParams?.toString()}`} className="text-muted-foreground hover:text-foreground transition-colors">
                            <ChevronLeft className="w-5 h-5" />
                        </Link>
                        <h1 className="text-lg font-bold">Order {product.title}</h1>
                    </div>
                </div>
            </div>

            <OrderSteps
                variants={finalVariants}
                designUrl={designUrl}
                aspectRatio={aspectRatio}
                orientation={orientation}
                product={{
                    description: product.description,
                    features: product.features
                }}
            />
        </div>
    );
}
