
'use client';

import Link from 'next/link';
import { ProductGroup, parseAspectRatio, variantMatchesAspectRatio } from '@/lib/utils/store';
import { FrameMockupRenderer } from '@/components/ecommerce/FrameMockupRenderer';
import { cn } from '@/lib/utils';
import { ArrowRight } from 'lucide-react';
import { useSearchParams } from 'next/navigation';

interface ProductCardProps {
    product: ProductGroup;
    designUrl?: string; // Signed URL from Supabase
}

// Safely parse print area which might be a JSON string
function getSafePrintArea(area: any) {
    if (!area) return null;
    let parsed = area;
    if (typeof area === 'string') {
        try { parsed = JSON.parse(area); } catch (e) { return null; }
    }
    return parsed;
}

export function ProductCard({ product, designUrl: propDesignUrl }: ProductCardProps) {
    const searchParams = useSearchParams();

    // Use prop if available, otherwise try to get from URL (client navigation)
    const designUrl = propDesignUrl || searchParams?.get('image') || undefined;

    // Preserve all existing params (image, aspect, orientation, etc.)
    const query = new URLSearchParams(searchParams?.toString());

    // Construct link
    const href = `/store/${product.id}?${query.toString()}`;

    // Determine which variant to show as thumbnail
    // If user has a specific aspect ratio, try to find a matching variant
    const aspect = searchParams?.get('aspect');
    const orientation = searchParams?.get('orientation') as 'portrait' | 'landscape' | undefined;

    let displayVariant = product.thumbnailVariant;

    if (aspect) {
        const targetRatio = parseAspectRatio(aspect, orientation);
        const bestVariant = product.variants.find(v =>
            v.mockup_template_url && variantMatchesAspectRatio(v, targetRatio)
        );

        if (bestVariant) {
            displayVariant = bestVariant;
        }
    }

    return (
        <Link href={href} className="group block h-full">
            <div className={cn(
                "relative flex flex-col h-full overflow-hidden rounded-2xl",
                "bg-white dark:bg-gray-900",
                "border border-gray-200 dark:border-gray-800",
                "transition-all duration-300",
                "hover:shadow-2xl hover:shadow-blue-500/10 hover:-translate-y-1 hover:border-blue-500/20"
            )}>
                {/* Image Container */}
                <div className="relative aspect-[4/5] bg-gray-50 dark:bg-gray-800/50 flex items-center justify-center p-6 overflow-hidden">
                    {/* Background Glow */}
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                    <div className="relative z-10 w-full h-full flex items-center justify-center transition-transform duration-500 group-hover:scale-105">
                        {designUrl && displayVariant.mockup_template_url ? (
                            <FrameMockupRenderer
                                templateUrl={displayVariant.mockup_template_url}
                                printArea={getSafePrintArea(displayVariant.mockup_print_area)}
                                designUrl={designUrl}
                                className="max-w-full max-h-full object-contain shadow-xl"
                                alt={product.title}
                            />
                        ) : (
                            <img
                                src={displayVariant.image_url || '/placeholder.png'}
                                alt={product.title}
                                className="max-w-full max-h-full object-contain shadow-lg"
                            />
                        )}
                    </div>
                </div>

                {/* Content */}
                <div className="p-5 flex flex-col flex-1">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {product.title}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 line-clamp-2 mb-4 flex-1">
                        {product.description}
                    </p>

                    <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-100 dark:border-gray-800">
                        <div className="text-lg font-semibold text-gray-900 dark:text-white">
                            from ${Math.ceil(product.minPrice / 100)}
                        </div>
                        <span className="flex items-center gap-1 text-sm font-medium text-blue-600 dark:text-blue-400 group-hover:translate-x-1 transition-transform">
                            Select <ArrowRight className="w-4 h-4 ml-0.5" />
                        </span>
                    </div>
                </div>
            </div>
        </Link>
    );
}
