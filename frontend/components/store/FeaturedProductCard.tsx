'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ProductGroup, parseAspectRatio, findBestMatchingVariant, variantMatchesAspectRatio } from '@/lib/utils/store';
import { FrameMockupRenderer } from '@/components/ecommerce/FrameMockupRenderer';
import { cn } from '@/lib/utils';
import { ArrowRight, Sparkles } from 'lucide-react';
import { trackEventAction } from '@/lib/actions/events';
import { Skeleton } from '@/components/ui/skeleton';
import type { FeaturedMap } from '@/lib/actions/featured-maps';

interface FeaturedProductCardProps {
    product: ProductGroup;
    featuredMap: FeaturedMap;
    index: number;
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

export function FeaturedProductCard({ product, featuredMap, index }: FeaturedProductCardProps) {
    const [imageLoaded, setImageLoaded] = useState(false);
    const [imageError, setImageError] = useState(false);
    const [isHovered, setIsHovered] = useState(false);

    // Use the featured map image URL as the design URL
    const designUrl = featuredMap.image_url;

    // Construct link with featured map image (only if image_url exists and is not empty)
    const href = designUrl && !imageError
        ? `/store/${product.id}?image=${encodeURIComponent(designUrl)}`
        : `/store/${product.id}`;

    // Use thumbnail variant for display
    const displayVariant = product.thumbnailVariant;
    const displayPrice = product.startingPrice;

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
                            eventName: 'featured_product_card_viewed',
                            sessionId: crypto.randomUUID(),
                            metadata: {
                                product_id: product.id,
                                product_type: product.title,
                                min_price: Math.ceil(displayPrice / 100),
                                featured_map_id: featuredMap.id,
                                featured_map_title: featuredMap.title,
                                card_position: index
                            }
                        });
                    }
                });
            },
            { threshold: 0.5 }
        );

        observer.observe(cardRef.current);
        return () => observer.disconnect();
    }, [product.id, product.title, displayPrice, featuredMap.id, featuredMap.title, index]);

    // Track product click when user navigates to product detail
    const handleProductClick = () => {
        trackEventAction({
            eventType: 'product_click',
            eventName: 'featured_product_card_clicked',
            sessionId: crypto.randomUUID(),
            metadata: {
                product_id: product.id,
                product_type: product.title,
                min_price: Math.ceil(displayPrice / 100),
                featured_map_id: featuredMap.id,
                featured_map_title: featuredMap.title,
                card_position: index
            }
        });
    };

    return (
        <Link
            href={href}
            className="group block h-full select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 rounded-3xl"
            onClick={handleProductClick}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <div ref={cardRef} className={cn(
                "relative flex flex-col h-full overflow-hidden rounded-3xl",
                "bg-white dark:bg-gray-950",
                "border border-gray-200/80 dark:border-gray-800/80",
                "transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)]",
                "shadow-sm",
                "group-hover:shadow-[0_25px_60px_-15px_rgba(0,0,0,0.2)] dark:group-hover:shadow-[0_25px_60px_-15px_rgba(0,0,0,0.5)]",
                "group-hover:border-gray-300/80 dark:group-hover:border-gray-700/80",
                "group-hover:-translate-y-2"
            )}>
                {/* Featured badge */}
                <div className="absolute top-4 left-4 z-20 pointer-events-none">
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-bold shadow-lg shadow-amber-500/30">
                        <Sparkles className="w-3.5 h-3.5" />
                        Featured
                    </div>
                </div>

                {/* Image Container with enhanced presentation */}
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
                                "group-hover:scale-[1.05]",
                                imageLoaded ? "opacity-100" : "opacity-0"
                            )}
                            style={{
                                transform: isHovered ? 'perspective(1000px) rotateY(-2deg) rotateX(2deg)' : 'perspective(1000px) rotateY(0) rotateX(0)',
                                transition: 'transform 0.7s cubic-bezier(0.23, 1, 0.32, 1)',
                            }}
                        >
                            {/* Frame shadow - separate element for better effect */}
                            <div
                                className={cn(
                                    "absolute -inset-3 rounded-sm transition-all duration-700",
                                    "bg-gradient-to-br from-black/0 via-black/5 to-black/15 dark:from-black/0 dark:via-black/20 dark:to-black/40",
                                    "blur-xl",
                                    "group-hover:blur-2xl group-hover:-inset-5 group-hover:from-black/0 group-hover:via-black/10 group-hover:to-black/25"
                                )}
                            />

                            {designUrl && !imageError && displayVariant.mockup_template_url ? (
                                <FrameMockupRenderer
                                    templateUrl={displayVariant.mockup_template_url}
                                    printArea={getSafePrintArea(displayVariant.mockup_print_area)}
                                    designUrl={designUrl}
                                    className="relative max-w-full max-h-full object-contain"
                                    alt={`${product.title} with ${featuredMap.title}`}
                                    onRendered={() => setImageLoaded(true)}
                                    onError={() => {
                                        setImageError(true);
                                        setImageLoaded(true);
                                    }}
                                />
                            ) : (
                                <img
                                    src={displayVariant.image_url || '/placeholder.png'}
                                    alt={product.title}
                                    className="relative max-w-full max-h-full object-contain"
                                    onLoad={() => setImageLoaded(true)}
                                    onError={() => {
                                        setImageError(true);
                                        setImageLoaded(true);
                                    }}
                                />
                            )}
                        </div>
                    </div>

                    {/* Subtle bottom gradient for text readability */}
                    <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-white/60 to-transparent dark:from-gray-950/60 pointer-events-none" />
                </div>

                {/* Content section with refined typography */}
                <div className="flex flex-col flex-1 p-6 pt-5">
                    {/* Featured map title */}
                    <div className="mb-3">
                        <p className="text-xs font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400 mb-1">
                            {featuredMap.title}
                        </p>
                        {featuredMap.description && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1">
                                {featuredMap.description}
                            </p>
                        )}
                    </div>

                    <div className="flex-1 space-y-2">
                        <h3 className={cn(
                            "font-bold text-lg text-gray-900 dark:text-gray-50 leading-snug",
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
                    <div className="mt-6 pt-5 flex items-end justify-between border-t border-gray-100 dark:border-gray-800/60">
                        <div className="flex flex-col gap-0.5">
                            <span className="text-[10px] font-medium uppercase tracking-wider text-gray-400 dark:text-gray-500">
                                From
                            </span>
                            <div className="flex items-baseline gap-1">
                                <span className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
                                    ${Math.ceil(displayPrice / 100)}
                                </span>
                            </div>
                        </div>

                        {/* CTA button with animated arrow */}
                        <div className={cn(
                            "relative flex items-center gap-2 px-5 py-2.5 rounded-full",
                            "bg-gray-900 dark:bg-white",
                            "text-sm font-semibold text-white dark:text-gray-900",
                            "transition-all duration-300 ease-out",
                            "group-hover:bg-gray-800 dark:group-hover:bg-gray-100",
                            "group-hover:shadow-lg group-hover:shadow-gray-900/10 dark:group-hover:shadow-white/10"
                        )}>
                            <span className="relative">
                                View Options
                            </span>
                            <ArrowRight className={cn(
                                "w-4 h-4 transition-transform duration-300 ease-out",
                                "group-hover:translate-x-1"
                            )} />
                        </div>
                    </div>
                </div>
            </div>
        </Link>
    );
}
