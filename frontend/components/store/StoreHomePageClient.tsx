'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ProductGroup } from '@/lib/utils/store';
import { FeaturedProductCard } from './FeaturedProductCard';
import { 
  getFeaturedProductSelectionSync, 
  formatPrice, 
  getProductUrl,
  FeaturedProductSelection 
} from '@/lib/utils/featured-product-selection';
import { getImageDimensionsSafe, ImageDimensions } from '@/lib/utils/image-dimensions';
import { cn } from '@/lib/utils';
import { ShoppingBag, ArrowRight, Star, Loader2 } from 'lucide-react';
import { trackEventAction } from '@/lib/actions/events';
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
                <h2 className="text-2xl font-bold text-gray-900 dark:text-text-primary mb-4">
                    No Products Available
                </h2>
                <p className="text-gray-500 dark:text-text-secondary">
                    Check back soon for new products.
                </p>
            </div>
        );
    }

    // If no featured maps exist, show products with placeholder designs
    if (featuredMaps.length === 0) {
        return (
            <div className="max-w-7xl mx-auto px-4 py-8 md:py-12">
                <div className="text-center mb-12">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-text-primary mb-4">
                        Our Products
                    </h2>
                    <p className="text-gray-500 dark:text-text-secondary mb-6">
                        Choose a product type to get started with your custom map.
                    </p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {products.map((product, index) => (
                        <ProductTypeCard
                            key={product.id}
                            product={product}
                            index={index}
                        />
                    ))}
                </div>

                <div className="mt-16 text-center">
                    <Link
                        href="/editor"
                        className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-gray-900 dark:bg-gold text-white dark:text-background font-semibold hover:bg-gray-800 dark:hover:bg-gold-hover transition-all duration-200 hover:scale-105 active:scale-95"
                    >
                        Create Your Own Map
                        <ArrowRight className="w-5 h-5" />
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 py-8 md:py-12">
            {/* Featured Maps Section */}
            <div className="mb-16">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-text-primary">
                            Featured Designs
                        </h2>
                        <p className="text-gray-500 dark:text-text-secondary mt-1">
                            Ready-to-order maps from our curated collection
                        </p>
                    </div>
                    <Link
                        href="/explore"
                        className="hidden md:flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-text-secondary hover:text-gray-900 dark:hover:text-text-primary transition-colors"
                    >
                        View all
                        <ArrowRight className="w-4 h-4" />
                    </Link>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                    {featuredMaps.slice(0, 6).map((map, index) => (
                        <FeaturedMapWithProduct
                            key={map.id}
                            map={map}
                            products={products}
                            index={index}
                        />
                    ))}
                </div>

                {/* Mobile view all link */}
                <div className="mt-8 text-center md:hidden">
                    <Link
                        href="/explore"
                        className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-text-secondary"
                    >
                        View all designs
                        <ArrowRight className="w-4 h-4" />
                    </Link>
                </div>
            </div>

            {/* Products Section */}
            <div className="relative pt-16">
                {/* Section divider */}
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gray-200 dark:via-border to-transparent" />
                
                <div className="text-center mb-12">
                    <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-text-primary mb-4">
                        Shop by Product
                    </h2>
                    <p className="text-gray-500 dark:text-text-secondary max-w-2xl mx-auto">
                        Choose your preferred format and create a custom map of any location
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                    {products.map((product, index) => (
                        <ProductTypeCard
                            key={product.id}
                            product={product}
                            index={index}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}

/**
 * Featured map card with smart product recommendation
 */
function FeaturedMapWithProduct({
    map,
    products,
    index,
}: {
    map: FeaturedMap;
    products: ProductGroup[];
    index: number;
}) {
    const [isLoading, setIsLoading] = useState(true);
    const [selection, setSelection] = useState<FeaturedProductSelection | null>(null);

    useEffect(() => {
        let mounted = true;

        async function loadSelection() {
            try {
                const dims = await getImageDimensionsSafe(map.image_url);
                if (mounted) {
                    setSelection(getFeaturedProductSelectionSync(dims, products));
                }
            } catch {
                if (mounted) {
                    setSelection(getFeaturedProductSelectionSync(null, products));
                }
            } finally {
                if (mounted) {
                    setIsLoading(false);
                }
            }
        }

        loadSelection();
        return () => { mounted = false; };
    }, [map.image_url, products]);

    const handleClick = () => {
        if (selection) {
            trackEventAction({
                eventType: 'product_click',
                eventName: 'featured_map_clicked',
                sessionId: crypto.randomUUID(),
                metadata: {
                    map_id: map.id,
                    map_title: map.title,
                    recommended_product_id: selection.recommended.productId,
                    card_position: index,
                },
            });
        }
    };

    const recommended = selection?.recommended;

    return (
        <div className="group relative">
            <Link
                href={recommended ? getProductUrl(recommended.productId, map.image_url) : map.link_url}
                onClick={handleClick}
                className="block"
            >
                <div className="relative rounded-2xl overflow-hidden bg-gray-100 dark:bg-surface-1 border border-gray-200 dark:border-border transition-all duration-300 hover:shadow-xl dark:hover:shadow-[var(--glow-gold)] hover:border-gray-300 dark:hover:border-gold/50 hover:-translate-y-1">
                    {/* Image */}
                    <div className="aspect-[4/5] relative overflow-hidden">
                        <img
                            src={map.image_url}
                            alt={map.title}
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                            loading={index < 3 ? "eager" : "lazy"}
                        />
                        
                        {/* Gradient overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 dark:from-background/80 via-transparent to-transparent" />

                        {/* Recommended badge */}
                        {recommended && (
                            <div className="absolute top-3 left-3">
                                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gold text-background text-xs font-bold shadow-lg">
                                    <Star className="w-3 h-3 fill-current" />
                                    Best as {recommended.productTitle}
                                </div>
                            </div>
                        )}

                        {/* Price badge */}
                        {recommended && !isLoading && (
                            <div className="absolute bottom-3 right-3">
                                <div className="px-3 py-1.5 rounded-full bg-white/95 dark:bg-surface-2/95 backdrop-blur-sm text-sm font-bold text-gray-900 dark:text-text-primary shadow-lg border border-transparent dark:border-border">
                                    from {formatPrice(recommended.startingPrice)}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Content */}
                    <div className="p-4">
                        <h3 className="font-bold text-gray-900 dark:text-text-primary group-hover:text-gray-700 dark:group-hover:text-gold transition-colors">
                            {map.title}
                        </h3>
                        {map.description && (
                            <p className="text-sm text-gray-500 dark:text-text-secondary mt-1 line-clamp-1">
                                {map.description}
                            </p>
                        )}
                        
                        {/* CTA */}
                        <div className="mt-3 flex items-center justify-between">
                            {isLoading ? (
                                <div className="flex items-center gap-2 text-gray-400 dark:text-text-muted">
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    <span className="text-sm">Loading...</span>
                                </div>
                            ) : recommended ? (
                                <span className="text-sm font-medium text-gray-600 dark:text-text-secondary group-hover:text-gray-900 dark:group-hover:text-gold transition-colors">
                                    Buy as {recommended.productTitle}
                                </span>
                            ) : (
                                <span className="text-sm font-medium text-gray-600 dark:text-text-secondary">
                                    View options
                                </span>
                            )}
                            <ArrowRight className="w-4 h-4 text-gray-400 dark:text-text-muted group-hover:text-gray-900 dark:group-hover:text-gold group-hover:translate-x-1 transition-all" />
                        </div>
                    </div>
                </div>
            </Link>
        </div>
    );
}

/**
 * Product type card for browsing by product
 */
function ProductTypeCard({
    product,
    index,
}: {
    product: ProductGroup;
    index: number;
}) {
    const handleClick = () => {
        trackEventAction({
            eventType: 'product_click',
            eventName: 'product_type_clicked',
            sessionId: crypto.randomUUID(),
            metadata: {
                product_id: product.id,
                product_title: product.title,
                card_position: index,
            },
        });
    };

    return (
        <Link
            href={`/store/${product.id}`}
            onClick={handleClick}
            className="group block"
        >
            <div className="relative rounded-2xl overflow-hidden bg-white dark:bg-surface-1 border border-gray-200 dark:border-border transition-all duration-300 hover:shadow-xl dark:hover:shadow-[var(--glow-gold)] hover:border-gray-300 dark:hover:border-gold/50 hover:-translate-y-1">
                {/* Image */}
                <div className="aspect-[4/3] relative overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 dark:from-surface-2 dark:to-surface-1">
                    {product.thumbnailVariant?.image_url ? (
                        <img
                            src={product.thumbnailVariant.image_url}
                            alt={product.title}
                            className="w-full h-full object-contain p-8 transition-transform duration-500 group-hover:scale-105"
                            loading="lazy"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center">
                            <ShoppingBag className="w-16 h-16 text-gray-300 dark:text-text-subtle" />
                        </div>
                    )}
                </div>

                {/* Content */}
                <div className="p-5">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-text-primary group-hover:text-gray-700 dark:group-hover:text-gold transition-colors">
                        {product.title}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-text-secondary mt-1 line-clamp-2">
                        {product.description}
                    </p>
                    
                    <div className="mt-4 flex items-center justify-between">
                        <div>
                            <span className="text-xs text-gray-400 dark:text-text-muted uppercase tracking-wider">
                                From
                            </span>
                            <div className="text-xl font-bold text-gray-900 dark:text-text-primary">
                                ${Math.ceil(product.startingPrice / 100)}
                            </div>
                        </div>
                        <div className={cn(
                            "flex items-center gap-2 px-4 py-2 rounded-full",
                            "bg-gray-100 dark:bg-surface-2 group-hover:bg-gray-900 dark:group-hover:bg-gold",
                            "text-gray-900 dark:text-text-primary group-hover:text-white dark:group-hover:text-background",
                            "font-medium text-sm transition-all duration-300"
                        )}>
                            <span>Shop</span>
                            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                        </div>
                    </div>
                </div>
            </div>
        </Link>
    );
}
