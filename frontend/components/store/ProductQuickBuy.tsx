'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { ProductGroup } from '@/lib/utils/store';
import { 
  FeaturedProductSelection, 
  getFeaturedProductSelectionSync,
  formatPrice,
  getProductUrl,
  ProductRecommendation
} from '@/lib/utils/featured-product-selection';
import { getImageDimensionsSafe, ImageDimensions } from '@/lib/utils/image-dimensions';
import { cn } from '@/lib/utils';
import { Star, ArrowRight, ShoppingBag, X, Loader2 } from 'lucide-react';
import { trackEventAction } from '@/lib/actions/events';

interface ProductQuickBuyProps {
  imageUrl: string;
  mapTitle: string;
  mapId: string;
  products: ProductGroup[];
  className?: string;
  /** Mobile: show direct CTA, Desktop: show popover */
  variant?: 'mobile' | 'desktop' | 'auto';
}

/**
 * ProductQuickBuy - Mini product selector for featured maps
 * 
 * Mobile: Shows a direct CTA button with the recommended product
 * Desktop: Shows a popover with all product options on hover
 */
export function ProductQuickBuy({
  imageUrl,
  mapTitle,
  mapId,
  products,
  className,
  variant = 'auto',
}: ProductQuickBuyProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [dimensions, setDimensions] = useState<ImageDimensions | null>(null);
  const [selection, setSelection] = useState<FeaturedProductSelection | null>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch image dimensions on mount
  useEffect(() => {
    let mounted = true;
    
    async function fetchDimensions() {
      try {
        const dims = await getImageDimensionsSafe(imageUrl);
        if (mounted) {
          setDimensions(dims);
          const sel = getFeaturedProductSelectionSync(dims, products);
          setSelection(sel);
        }
      } catch (error) {
        console.warn('Failed to get image dimensions for quick buy:', error);
        // Use default selection
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
  }, [imageUrl, products]);

  // Handle click outside to close popover
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Track product selection
  const handleProductClick = (product: ProductRecommendation, isRecommended: boolean) => {
    trackEventAction({
      eventType: 'product_click',
      eventName: 'quick_buy_product_selected',
      sessionId: crypto.randomUUID(),
      metadata: {
        map_id: mapId,
        map_title: mapTitle,
        product_id: product.productId,
        product_title: product.productTitle,
        is_recommended: isRecommended,
        price: product.startingPrice,
        aspect_ratio: dimensions?.aspectRatio,
      },
    });
  };

  // Handle hover for desktop popover
  const handleMouseEnter = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsOpen(true);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setIsOpen(false);
    }, 150);
  };

  if (isLoading || !selection) {
    return (
      <div className={cn('flex items-center justify-center', className)}>
        <Loader2 className="w-5 h-5 animate-spin text-gray-400 dark:text-text-muted" />
      </div>
    );
  }

  const { recommended, alternatives } = selection;
  const isMobile = variant === 'mobile' || (variant === 'auto' && typeof window !== 'undefined' && window.innerWidth < 768);

  // Mobile: Direct CTA button
  if (isMobile) {
    return (
      <Link
        href={getProductUrl(recommended.productId, imageUrl)}
        onClick={() => handleProductClick(recommended, true)}
        className={cn(
          'w-full py-3 px-4 rounded-lg',
          'bg-amber-500 dark:bg-gold hover:bg-amber-400 dark:hover:bg-gold-hover active:bg-amber-600 dark:active:bg-gold-active',
          'text-black dark:text-background font-semibold text-center',
          'transition-all duration-200',
          'flex items-center justify-center gap-2',
          className
        )}
      >
        <ShoppingBag className="w-4 h-4" />
        <span>Buy as {recommended.productTitle}</span>
        <span className="opacity-80">- {formatPrice(recommended.startingPrice)}</span>
      </Link>
    );
  }

  // Desktop: Popover with all options
  return (
    <div
      ref={popoverRef}
      className={cn('relative', className)}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'w-full py-3 px-4 rounded-lg',
          'bg-gray-800 dark:bg-surface-2 hover:bg-amber-500 dark:hover:bg-gold hover:text-black dark:hover:text-background',
          'text-white dark:text-text-primary font-medium text-center',
          'transition-all duration-300',
          'flex items-center justify-center gap-2',
          isOpen && 'bg-amber-500 dark:bg-gold text-black dark:text-background'
        )}
      >
        <span className={cn(!isOpen && 'group-hover:hidden')}>
          {isOpen ? 'Select Product' : 'View Details'}
        </span>
        {!isOpen && (
          <span className="hidden group-hover:inline-flex items-center gap-2">
            Buy Print <ArrowRight className="w-4 h-4" />
          </span>
        )}
      </button>

      {/* Popover */}
      {isOpen && (
        <div
          className={cn(
            'absolute bottom-full left-0 right-0 mb-2 z-50',
            'bg-white dark:bg-surface-2 rounded-xl shadow-2xl',
            'border border-gray-200 dark:border-border',
            'overflow-hidden',
            'animate-in fade-in-0 slide-in-from-bottom-2 duration-200'
          )}
        >
          {/* Header */}
          <div className="px-4 py-3 border-b border-gray-100 dark:border-border-subtle flex items-center justify-between">
            <span className="text-sm font-semibold text-gray-900 dark:text-text-primary">
              Quick Buy
            </span>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-surface-hover transition-colors"
            >
              <X className="w-4 h-4 text-gray-500 dark:text-text-muted" />
            </button>
          </div>

          {/* Product Options */}
          <div className="p-2 space-y-1">
            {/* Recommended Product */}
            <Link
              href={getProductUrl(recommended.productId, imageUrl)}
              onClick={() => handleProductClick(recommended, true)}
              className={cn(
                'flex items-center gap-3 p-3 rounded-lg',
                'bg-amber-50 dark:bg-gold/10 hover:bg-amber-100 dark:hover:bg-gold/15',
                'border-2 border-amber-500/50 dark:border-gold/50',
                'transition-colors duration-150'
              )}
            >
              <div className="flex-shrink-0">
                <Star className="w-5 h-5 text-amber-500 dark:text-gold fill-amber-500 dark:fill-gold" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-gray-900 dark:text-text-primary">
                    {recommended.productTitle}
                  </span>
                  <span className="text-xs px-1.5 py-0.5 rounded-full bg-amber-500 dark:bg-gold text-black dark:text-background font-medium">
                    Best Match
                  </span>
                </div>
                <p className="text-xs text-gray-500 dark:text-text-muted truncate">
                  {recommended.reason}
                </p>
              </div>
              <div className="flex-shrink-0 text-right">
                <span className="font-bold text-gray-900 dark:text-text-primary">
                  {formatPrice(recommended.startingPrice)}
                </span>
                <span className="text-xs text-gray-500 dark:text-text-muted block">from</span>
              </div>
            </Link>

            {/* Alternative Products */}
            {alternatives.map((product) => (
              <Link
                key={product.productId}
                href={getProductUrl(product.productId, imageUrl)}
                onClick={() => handleProductClick(product, false)}
                className={cn(
                  'flex items-center gap-3 p-3 rounded-lg',
                  'hover:bg-gray-50 dark:hover:bg-surface-hover',
                  'transition-colors duration-150'
                )}
              >
                <div className="flex-shrink-0 w-5" />
                <div className="flex-1 min-w-0">
                  <span className="font-medium text-gray-900 dark:text-text-primary">
                    {product.productTitle}
                  </span>
                  <p className="text-xs text-gray-500 dark:text-text-muted truncate">
                    {product.reason}
                  </p>
                </div>
                <div className="flex-shrink-0 text-right">
                  <span className="font-semibold text-gray-900 dark:text-text-primary">
                    {formatPrice(product.startingPrice)}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-text-muted block">from</span>
                </div>
              </Link>
            ))}
          </div>

          {/* Footer */}
          <div className="px-4 py-2 border-t border-gray-100 dark:border-border-subtle bg-gray-50 dark:bg-surface-1">
            <p className="text-xs text-gray-500 dark:text-text-muted text-center">
              Free shipping on orders over $75
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Simplified mobile-only quick buy button
 */
export function QuickBuyButton({
  imageUrl,
  products,
  className,
}: {
  imageUrl: string;
  products: ProductGroup[];
  className?: string;
}) {
  const [selection, setSelection] = useState<FeaturedProductSelection | null>(null);

  useEffect(() => {
    async function load() {
      const dims = await getImageDimensionsSafe(imageUrl);
      setSelection(getFeaturedProductSelectionSync(dims, products));
    }
    load();
  }, [imageUrl, products]);

  if (!selection) {
    return (
      <div className={cn('h-12 bg-gray-200 dark:bg-surface-1 rounded-lg animate-pulse', className)} />
    );
  }

  const { recommended } = selection;

  return (
    <Link
      href={getProductUrl(recommended.productId, imageUrl)}
      className={cn(
        'inline-flex items-center justify-center gap-2',
        'px-6 py-3 rounded-full',
        'bg-amber-500 dark:bg-gold hover:bg-amber-400 dark:hover:bg-gold-hover active:bg-amber-600 dark:active:bg-gold-active',
        'text-black dark:text-background font-semibold',
        'transition-all duration-200 hover:scale-105 active:scale-95',
        className
      )}
    >
      <ShoppingBag className="w-5 h-5" />
      <span>Buy as {recommended.productTitle} - {formatPrice(recommended.startingPrice)}</span>
    </Link>
  );
}
