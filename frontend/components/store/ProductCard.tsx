
'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ProductGroup, parseAspectRatio, findBestMatchingVariant, variantMatchesAspectRatio } from '@/lib/utils/store';
import { FrameMockupRenderer } from '@/components/ecommerce/FrameMockupRenderer';
import { cn, getSessionId } from '@/lib/utils';
import { ArrowRight, AlertTriangle, Sparkles } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { trackEventAction } from '@/lib/actions/events';
import { Skeleton } from '@/components/ui/skeleton';

interface ProductCardProps {
    product: ProductGroup;
    designUrl?: string; // Signed URL from Supabase
    featured?: boolean; // Show featured badge
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

export function ProductCard({ product, designUrl: propDesignUrl, featured = false }: ProductCardProps) {
    const searchParams = useSearchParams();
    const [imageLoaded, setImageLoaded] = useState(false);
    const [isHovered, setIsHovered] = useState(false);

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
        <Link
            href={href}
            className="group block h-full select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 rounded-2xl"
            onClick={handleProductClick}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <div ref={cardRef} className={cn(
                "relative flex flex-col h-full overflow-hidden rounded-2xl",
                "bg-white dark:bg-gray-950",
                "border border-gray-200/80 dark:border-gray-800/80",
                "transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)]",
                "shadow-sm",
                "group-hover:shadow-[0_20px_50px_-12px_rgba(0,0,0,0.15)] dark:group-hover:shadow-[0_20px_50px_-12px_rgba(0,0,0,0.4)]",
                "group-hover:border-gray-300/80 dark:group-hover:border-gray-700/80",
                "group-hover:-translate-y-1.5"
            )}>
                {/* Image Container with subtle wall texture */}
                <div className="relative aspect-[4/5] overflow-hidden">
                    {/* Background with subtle gradient and pattern */}
                    <div className="absolute inset-0 bg-gradient-to-br from-gray-100 via-gray-50 to-gray-100 dark:from-gray-900 dark:via-gray-850 dark:to-gray-900" />

                    {/* Subtle noise texture overlay */}
                    <div
                        className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]"
                        style={{
                            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
                        }}
                    />

                    {/* Vignette effect */}
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(0,0,0,0.03)_100%)] dark:bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(0,0,0,0.15)_100%)]" />

                    {/* Badges container */}
                    <div className="absolute top-3 left-3 right-3 z-20 flex justify-between items-start pointer-events-none">
                        {/* Featured badge */}
                        {featured && (
                            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[10px] font-bold shadow-lg shadow-amber-500/25">
                                <Sparkles className="w-3 h-3" />
                                Featured
                            </div>
                        )}

                        {/* Warning badge */}
                        {showWarning && (
                            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-100/95 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300 text-[10px] font-bold shadow-sm border border-amber-200/50 dark:border-amber-700/50 backdrop-blur-sm ml-auto">
                                <AlertTriangle className="w-3 h-3" />
                                Closest Match
                            </div>
                        )}
                    </div>

                    {/* Product image with enhanced presentation */}
                    <div className="relative z-0 w-full h-full flex items-center justify-center p-6 sm:p-8">
                        {/* Loading skeleton */}
                        {!imageLoaded && (
                            <div className="absolute inset-8 flex items-center justify-center">
                                <Skeleton className="w-3/4 h-4/5 rounded-sm" />
                            </div>
                        )}

                        {/* Image wrapper with shadow and transform effects */}
                        <div
                            className={cn(
                                "relative transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)]",
                                "group-hover:scale-[1.03]",
                                imageLoaded ? "opacity-100" : "opacity-0"
                            )}
                            style={{
                                transform: isHovered ? 'perspective(1000px) rotateY(-1deg) rotateX(1deg)' : 'perspective(1000px) rotateY(0) rotateX(0)',
                                transition: 'transform 0.7s cubic-bezier(0.23, 1, 0.32, 1)',
                            }}
                        >
                            {/* Frame shadow - separate element for better effect */}
                            <div
                                className={cn(
                                    "absolute -inset-2 rounded-sm transition-all duration-700",
                                    "bg-gradient-to-br from-black/0 via-black/5 to-black/15 dark:from-black/0 dark:via-black/20 dark:to-black/40",
                                    "blur-xl",
                                    "group-hover:blur-2xl group-hover:-inset-4 group-hover:from-black/0 group-hover:via-black/10 group-hover:to-black/25"
                                )}
                            />

                            {designUrl && displayVariant.mockup_template_url ? (
                                <FrameMockupRenderer
                                    templateUrl={displayVariant.mockup_template_url}
                                    printArea={getSafePrintArea(displayVariant.mockup_print_area)}
                                    designUrl={designUrl}
                                    className="relative max-w-full max-h-full object-contain"
                                    alt={product.title}
                                    onRendered={() => setImageLoaded(true)}
                                />
                            ) : (
                                <img
                                    src={displayVariant.image_url || '/placeholder.png'}
                                    alt={product.title}
                                    className="relative max-w-full max-h-full object-contain"
                                    onLoad={() => setImageLoaded(true)}
                                />
                            )}
                        </div>
                    </div>

                    {/* Subtle bottom gradient for text readability */}
                    <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-white/50 to-transparent dark:from-gray-950/50 pointer-events-none" />
                </div>

                {/* Content section with refined typography */}
                <div className="flex flex-col flex-1 p-5 pt-4">
                    <div className="flex-1 space-y-1.5">
                        <h3 className={cn(
                            "font-semibold text-base text-gray-900 dark:text-gray-50 leading-snug",
                            "transition-colors duration-300",
                            "group-hover:text-gray-700 dark:group-hover:text-white"
                        )}>
                            {product.title}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 leading-relaxed">
                            {product.description}
                        </p>
                    </div>

                    {/* Price and CTA section */}
                    <div className="mt-5 pt-4 flex items-end justify-between border-t border-gray-100 dark:border-gray-800/60">
                        <div className="flex flex-col gap-0.5">
                            <span className="text-[10px] font-medium uppercase tracking-wider text-gray-400 dark:text-gray-500">
                                From
                            </span>
                            <div className="flex items-baseline gap-1">
                                <span className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">
                                    ${Math.ceil(displayPrice / 100)}
                                </span>
                            </div>
                        </div>

                        {/* CTA button with animated arrow */}
                        <div className={cn(
                            "relative flex items-center gap-2 px-4 py-2 rounded-full",
                            "bg-gray-900 dark:bg-white",
                            "text-sm font-medium text-white dark:text-gray-900",
                            "transition-all duration-300 ease-out",
                            "group-hover:bg-gray-800 dark:group-hover:bg-gray-100",
                            "group-hover:shadow-lg group-hover:shadow-gray-900/10 dark:group-hover:shadow-white/10"
                        )}>
                            <span className="relative">
                                View Options
                            </span>
                            <ArrowRight className={cn(
                                "w-4 h-4 transition-transform duration-300 ease-out",
                                "group-hover:translate-x-0.5"
                            )} />
                        </div>
                    </div>
                </div>
            </div>
        </Link>
    );
}
