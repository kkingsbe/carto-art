
'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { ProductGroup, parseAspectRatio, findBestMatchingVariant, variantMatchesAspectRatio } from '@/lib/utils/store';
import { FrameMockupRenderer } from '@/components/ecommerce/FrameMockupRenderer';
import { cn, getSessionId } from '@/lib/utils';
import { ArrowRight, AlertTriangle } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { trackEventAction } from '@/lib/actions/events';

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
    // Handle case where "undefined" string is passed in URL
    const rawDesignUrl = searchParams?.get('image');
    let designUrl = propDesignUrl;

    if (!designUrl && rawDesignUrl && rawDesignUrl !== 'undefined') {
        designUrl = rawDesignUrl;
    }

    // Preserve all existing params (image, aspect, orientation, etc.)
    const query = new URLSearchParams(searchParams?.toString());

    // Clean up "undefined" image param from the query used for links
    if (query.get('image') === 'undefined') {
        query.delete('image');
    }

    // Construct link
    const href = `/store/${product.id}?${query.toString()}`;

    // Determine which variant to show as thumbnail
    // If user has a specific aspect ratio, try to find a matching variant
    const aspect = searchParams?.get('aspect');
    const orientation = searchParams?.get('orientation') as 'portrait' | 'landscape' | undefined;

    let displayVariant = product.thumbnailVariant;
    let showWarning = false;
    let displayPrice = product.startingPrice;

    if (aspect) {
        // Use provided orientation or infer from aspect ratio
        const effectiveOrientation = orientation || (parseAspectRatio(aspect) < 1 ? 'portrait' : 'landscape');
        const targetRatio = parseAspectRatio(aspect, effectiveOrientation);

        // Filter variants to match the user's aspect ratio (same logic as ProductDetailClient)
        const filteredVariants = product.variants.filter(v => variantMatchesAspectRatio(v, targetRatio));

        // Calculate min price from filtered variants only
        if (filteredVariants.length > 0) {
            displayPrice = Math.min(...filteredVariants.map(v => v.display_price_cents));
        }

        const match = findBestMatchingVariant(product.variants, targetRatio, effectiveOrientation);

        if (match) {
            displayVariant = match.variant;
            showWarning = !match.isExactMatch;
        }
    }

    // Track product view when card becomes visible
    const cardRef = useRef<HTMLDivElement>(null);
    const hasTrackedRef = useRef(false);

    useEffect(() => {
        if (!cardRef.current || hasTrackedRef.current) return;

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting && !hasTrackedRef.current) {
                        hasTrackedRef.current = true;
                        trackEventAction({
                            eventType: 'product_view',
                            eventName: 'product_card_viewed',
                            sessionId: getSessionId(),
                            metadata: {
                                product_id: product.id,
                                product_type: product.title,
                                min_price: Math.ceil(displayPrice / 100)
                            }
                        });
                    }
                });
            },
            { threshold: 0.5 } // Track when 50% visible
        );

        observer.observe(cardRef.current);
        return () => observer.disconnect();
    }, [product.id, product.title, displayPrice]);

    // Track product click when user navigates to product detail
    const handleProductClick = () => {
        trackEventAction({
            eventType: 'product_click',
            eventName: 'product_card_clicked',
            sessionId: getSessionId(),
            metadata: {
                product_id: product.id,
                product_type: product.title,
                min_price: Math.ceil(displayPrice / 100),
                aspect_ratio: aspect,
                orientation: orientation
            }
        });
    };

    return (
        <Link href={href} className="group block h-full" onClick={handleProductClick}>
            <div ref={cardRef} className={cn(
                "relative flex flex-col h-full overflow-hidden rounded-2xl",
                "bg-white dark:bg-gray-900",
                "border border-gray-200 dark:border-gray-800",
                "transition-all duration-300",
                "hover:shadow-2xl hover:shadow-blue-500/10 hover:-translate-y-1 hover:border-blue-500/20"
            )}>
                {/* Image Container */}
                <div className="relative min-h-[280px] bg-gray-50 dark:bg-gray-800/50 flex items-center justify-center p-6 overflow-hidden">
                    {/* Background Glow */}
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                    {showWarning && (
                        <div className="absolute top-3 right-3 z-20 flex items-center gap-1.5 px-2 py-1 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 text-[10px] font-bold shadow-sm border border-amber-200 dark:border-amber-800">
                            <AlertTriangle className="w-3 h-3" />
                            Closest Match
                        </div>
                    )}

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
                            from ${Math.ceil(displayPrice / 100)}
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
