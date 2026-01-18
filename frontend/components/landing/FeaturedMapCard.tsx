'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ProductGroup } from '@/lib/utils/store';
import { 
  getFeaturedProductSelectionSync,
  formatPrice,
  getProductUrl,
  FeaturedProductSelection
} from '@/lib/utils/featured-product-selection';
import { getImageDimensionsSafe, ImageDimensions } from '@/lib/utils/image-dimensions';
import { cn } from '@/lib/utils';
import { Star, ArrowRight, ShoppingBag, X, Loader2 } from 'lucide-react';
import { trackEventAction } from '@/lib/actions/events';
import type { FeaturedMap } from '@/lib/actions/featured-maps';

interface FeaturedMapCardProps {
  map: FeaturedMap;
  products: ProductGroup[];
  index: number;
}

/**
 * FeaturedMapCard - Enhanced card for featured maps with smart product CTAs
 * 
 * Mobile: Shows direct CTA with recommended product and price
 * Desktop: Shows popover with all product options on hover
 */
export function FeaturedMapCard({ map, products, index }: FeaturedMapCardProps) {
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [dimensions, setDimensions] = useState<ImageDimensions | null>(null);
  const [selection, setSelection] = useState<FeaturedProductSelection | null>(null);

  // Fetch image dimensions on mount
  useEffect(() => {
    let mounted = true;
    
    async function fetchDimensions() {
      try {
        const dims = await getImageDimensionsSafe(map.image_url);
        if (mounted) {
          setDimensions(dims);
          const sel = getFeaturedProductSelectionSync(dims, products);
          setSelection(sel);
        }
      } catch (error) {
        console.warn('Failed to get image dimensions:', error);
        if (mounted) {
          const sel = getFeaturedProductSelectionSync(null, products);
          setSelection(sel);
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    }
    
    fetchDimensions();
    
    return () => {
      mounted = false;
    };
  }, [map.image_url, products]);

  // Track product selection
  const handleProductClick = (productId: number, productTitle: string, isRecommended: boolean) => {
    trackEventAction({
      eventType: 'product_click',
      eventName: 'featured_map_product_selected',
      sessionId: crypto.randomUUID(),
      metadata: {
        map_id: map.id,
        map_title: map.title,
        product_id: productId,
        product_title: productTitle,
        is_recommended: isRecommended,
        aspect_ratio: dimensions?.aspectRatio,
        card_position: index,
      },
    });
  };

  const recommended = selection?.recommended;
  const alternatives = selection?.alternatives || [];

  return (
    <div className="group relative block h-full">
      <div className="relative h-full bg-surface-1 rounded-2xl overflow-hidden border border-border transition-all duration-300 hover:border-gold/50 hover:shadow-[var(--glow-gold)] ring-offset-2 focus-within:ring-2 flex flex-col">
        {/* Image Container */}
        <div className="aspect-[4/5] w-full overflow-hidden relative">
          <Link href={map.link_url} className="block w-full h-full">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={map.image_url}
              alt={map.title}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              loading={index < 3 ? "eager" : "lazy"}
            />

            {/* Overlay Gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent opacity-60 transition-opacity duration-300" />
          </Link>

          {/* Desktop: Floating Quick Buy Button */}
          {recommended && (
            <div 
              className="absolute bottom-4 right-4 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 hidden md:block z-10"
              onMouseEnter={() => setIsPopoverOpen(true)}
              onMouseLeave={() => setIsPopoverOpen(false)}
            >
              <button
                onClick={() => setIsPopoverOpen(!isPopoverOpen)}
                className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gold text-background shadow-lg hover:bg-gold-hover hover:scale-110 transition-all"
              >
                <ShoppingBag className="w-5 h-5" />
              </button>

              {/* Desktop Popover */}
              {isPopoverOpen && (
                <div 
                  className={cn(
                    'absolute bottom-full right-0 mb-2 w-72',
                    'bg-surface-2 rounded-xl shadow-2xl',
                    'border border-border',
                    'overflow-hidden',
                    'animate-in fade-in-0 slide-in-from-bottom-2 duration-200'
                  )}
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Header */}
                  <div className="px-4 py-3 border-b border-border-subtle flex items-center justify-between bg-surface-1">
                    <span className="text-sm font-semibold text-text-primary">
                      Quick Buy
                    </span>
                    <button
                      onClick={() => setIsPopoverOpen(false)}
                      className="p-1 rounded-full hover:bg-surface-hover transition-colors"
                    >
                      <X className="w-4 h-4 text-text-muted" />
                    </button>
                  </div>

                  {/* Product Options */}
                  <div className="p-2 space-y-1">
                    {/* Recommended Product */}
                    <Link
                      href={getProductUrl(recommended.productId, map.image_url)}
                      onClick={() => handleProductClick(recommended.productId, recommended.productTitle, true)}
                      className={cn(
                        'flex items-center gap-3 p-3 rounded-lg',
                        'bg-gold/10 hover:bg-gold/15',
                        'border-2 border-gold/50',
                        'transition-colors duration-150'
                      )}
                    >
                      <div className="flex-shrink-0">
                        <Star className="w-5 h-5 text-gold fill-gold" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-text-primary text-sm">
                            {recommended.productTitle}
                          </span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gold text-background font-medium">
                            Best
                          </span>
                        </div>
                        <p className="text-xs text-text-muted truncate">
                          {recommended.reason}
                        </p>
                      </div>
                      <div className="flex-shrink-0 text-right">
                        <span className="font-bold text-text-primary">
                          {formatPrice(recommended.startingPrice)}
                        </span>
                      </div>
                    </Link>

                    {/* Alternative Products */}
                    {alternatives.map((product) => (
                      <Link
                        key={product.productId}
                        href={getProductUrl(product.productId, map.image_url)}
                        onClick={() => handleProductClick(product.productId, product.productTitle, false)}
                        className={cn(
                          'flex items-center gap-3 p-3 rounded-lg',
                          'hover:bg-surface-hover',
                          'transition-colors duration-150'
                        )}
                      >
                        <div className="flex-shrink-0 w-5" />
                        <div className="flex-1 min-w-0">
                          <span className="font-medium text-text-primary text-sm">
                            {product.productTitle}
                          </span>
                          <p className="text-xs text-text-muted truncate">
                            {product.reason}
                          </p>
                        </div>
                        <div className="flex-shrink-0">
                          <span className="font-semibold text-text-primary">
                            {formatPrice(product.startingPrice)}
                          </span>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-6 flex flex-col flex-grow">
          <Link href={map.link_url} className="block mb-2 group-hover:text-gold transition-colors">
            <div className="flex items-start justify-between gap-4">
              <h3 className="text-xl font-bold text-text-primary">
                {map.title}
              </h3>
            </div>
          </Link>

          <Link href={map.link_url} className="flex-grow block mb-4">
            {map.description && (
              <p className="text-sm text-text-secondary line-clamp-2">
                {map.description}
              </p>
            )}
          </Link>

          {/* CTA Button - Responsive */}
          <div className="mt-auto pt-2">
            {isLoading ? (
              <div className="w-full py-3 rounded-lg bg-surface-2 flex items-center justify-center">
                <Loader2 className="w-5 h-5 animate-spin text-text-muted" />
              </div>
            ) : recommended ? (
              <>
                {/* Mobile: Direct CTA with product and price */}
                <Link
                  href={getProductUrl(recommended.productId, map.image_url)}
                  onClick={() => handleProductClick(recommended.productId, recommended.productTitle, true)}
                  className="md:hidden w-full py-3 rounded-lg bg-gold hover:bg-gold-hover active:bg-gold-active text-background font-semibold text-center transition-all duration-200 flex items-center justify-center gap-2"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>Buy as {recommended.productTitle}</span>
                  <span className="opacity-80">- {formatPrice(recommended.startingPrice)}</span>
                </Link>

                {/* Desktop: Hover-reveal CTA */}
                <Link
                  href={getProductUrl(recommended.productId, map.image_url)}
                  onClick={() => handleProductClick(recommended.productId, recommended.productTitle, true)}
                  className="hidden md:flex w-full py-3 rounded-lg bg-surface-2 group-hover:bg-gold group-hover:text-background text-text-primary font-medium text-center transition-all duration-300 items-center justify-center gap-2"
                >
                  <span className="group-hover:hidden">View Details</span>
                  <span className="hidden group-hover:inline-flex items-center gap-2">
                    Buy {recommended.productTitle} - {formatPrice(recommended.startingPrice)}
                    <ArrowRight className="w-4 h-4" />
                  </span>
                </Link>
              </>
            ) : (
              <Link
                href={`/store?image=${encodeURIComponent(map.image_url)}`}
                className="w-full py-3 rounded-lg bg-surface-2 group-hover:bg-gold group-hover:text-background text-text-primary font-medium text-center transition-all duration-300 flex items-center justify-center gap-2"
              >
                <span className="group-hover:hidden">View Details</span>
                <span className="hidden group-hover:inline-flex items-center gap-2">
                  Buy Print <ArrowRight className="w-4 h-4" />
                </span>
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
