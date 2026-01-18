'use client';

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { ShoppingBag, ChevronUp, Loader2 } from 'lucide-react';
import { parseVariantDimensions } from '@/lib/utils/store';

interface Variant {
  id: number;
  name: string;
  display_price_cents: number;
}

interface MobileStickyCartProps {
  productTitle: string;
  selectedVariant: Variant | null;
  onContinue: () => void;
  isProcessing?: boolean;
  className?: string;
}

/**
 * MobileStickyCart - Fixed bottom CTA for mobile checkout flow
 * Shows product info and primary action button
 */
export function MobileStickyCart({
  productTitle,
  selectedVariant,
  onContinue,
  isProcessing = false,
  className,
}: MobileStickyCartProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  // Hide on scroll down, show on scroll up
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      // Always show if near top
      if (currentScrollY < 100) {
        setIsVisible(true);
        setLastScrollY(currentScrollY);
        return;
      }

      // Hide when scrolling down, show when scrolling up
      if (currentScrollY > lastScrollY) {
        setIsVisible(false);
      } else {
        setIsVisible(true);
      }
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  if (!selectedVariant) return null;

  const dimensions = parseVariantDimensions(selectedVariant.name);
  const sizeLabel = dimensions
    ? `${dimensions.width}×${dimensions.height}"`
    : selectedVariant.name;
  const price = Math.ceil(selectedVariant.display_price_cents / 100);

  return (
    <div
      className={cn(
        "fixed bottom-0 left-0 right-0 z-50 md:hidden",
        "transform transition-transform duration-300 ease-out",
        isVisible ? "translate-y-0" : "translate-y-full",
        className
      )}
    >
      {/* Gradient fade */}
      <div className="h-6 bg-gradient-to-t from-white dark:from-surface-2 to-transparent pointer-events-none" />
      
      {/* Main content */}
      <div className="bg-white dark:bg-surface-2 border-t border-gray-200 dark:border-border backdrop-blur-sm px-4 py-3 pb-safe">
        <div className="flex items-center gap-4">
          {/* Product info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-gray-900 dark:text-text-primary truncate">
                {productTitle}
              </span>
              <span className="text-gray-400 dark:text-text-subtle">•</span>
              <span className="text-gray-600 dark:text-text-secondary text-sm">
                {sizeLabel}
              </span>
            </div>
            <div className="text-xl font-bold text-gray-900 dark:text-gold">
              ${price}
            </div>
          </div>

          {/* CTA Button - Gold accent */}
          <button
            onClick={onContinue}
            disabled={isProcessing}
            className={cn(
              "flex items-center justify-center gap-2",
              "px-6 py-3 rounded-full",
              "bg-gray-900 dark:bg-gold text-white dark:text-background",
              "font-semibold text-sm",
              "transition-all duration-200",
              "hover:bg-gray-800 dark:hover:bg-gold-hover",
              "active:scale-95",
              "disabled:opacity-50 disabled:cursor-not-allowed"
            )}
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Processing...</span>
              </>
            ) : (
              <>
                <ShoppingBag className="w-4 h-4" />
                <span>Continue</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Expanded mobile cart with size selector
 */
export function MobileStickyCartExpanded({
  productTitle,
  selectedVariant,
  variants,
  onSelectVariant,
  onContinue,
  isProcessing = false,
  className,
}: MobileStickyCartProps & {
  variants: Variant[];
  onSelectVariant: (variant: Variant) => void;
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!selectedVariant) return null;

  const dimensions = parseVariantDimensions(selectedVariant.name);
  const sizeLabel = dimensions
    ? `${dimensions.width}×${dimensions.height}"`
    : selectedVariant.name;
  const price = Math.ceil(selectedVariant.display_price_cents / 100);

  return (
    <div
      className={cn(
        "fixed bottom-0 left-0 right-0 z-50 md:hidden",
        "bg-white dark:bg-surface-2 border-t border-gray-200 dark:border-border",
        "backdrop-blur-sm",
        "transition-all duration-300 ease-out",
        className
      )}
    >
      {/* Expand/collapse handle */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-center py-2 text-gray-400 dark:text-text-muted hover:text-gray-600 dark:hover:text-text-secondary"
      >
        <ChevronUp
          className={cn(
            "w-5 h-5 transition-transform duration-300",
            isExpanded && "rotate-180"
          )}
        />
      </button>

      {/* Expanded content - Size selector */}
      {isExpanded && (
        <div className="px-4 pb-4 border-b border-gray-100 dark:border-border-subtle">
          <div className="text-sm font-medium text-gray-700 dark:text-text-secondary mb-3">
            Select Size
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
            {variants.map((variant) => {
              const dims = parseVariantDimensions(variant.name);
              const label = dims ? `${dims.width}×${dims.height}"` : variant.name;
              const isSelected = variant.id === selectedVariant.id;

              return (
                <button
                  key={variant.id}
                  onClick={() => onSelectVariant(variant)}
                  className={cn(
                    "flex-shrink-0 px-4 py-2 rounded-lg border-2 transition-all",
                    isSelected
                      ? "border-gold bg-gold/10 dark:bg-gold/15"
                      : "border-gray-200 dark:border-border hover:border-gray-300 dark:hover:border-border-interactive"
                  )}
                >
                  <div className={cn(
                    "text-sm font-medium",
                    isSelected
                      ? "text-gold"
                      : "text-gray-900 dark:text-text-primary"
                  )}>
                    {label}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-text-muted">
                    ${Math.ceil(variant.display_price_cents / 100)}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="px-4 py-3 pb-safe">
        <div className="flex items-center gap-4">
          {/* Product info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-gray-900 dark:text-text-primary truncate">
                {productTitle}
              </span>
              <span className="text-gray-400 dark:text-text-subtle">•</span>
              <span className="text-gray-600 dark:text-text-secondary text-sm">
                {sizeLabel}
              </span>
            </div>
            <div className="text-xl font-bold text-gray-900 dark:text-gold">
              ${price}
            </div>
          </div>

          {/* CTA Button - Gold accent */}
          <button
            onClick={onContinue}
            disabled={isProcessing}
            className={cn(
              "flex items-center justify-center gap-2",
              "px-6 py-3 rounded-full",
              "bg-gray-900 dark:bg-gold text-white dark:text-background",
              "font-semibold text-sm",
              "transition-all duration-200",
              "hover:bg-gray-800 dark:hover:bg-gold-hover",
              "active:scale-95",
              "disabled:opacity-50 disabled:cursor-not-allowed"
            )}
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Processing...</span>
              </>
            ) : (
              <>
                <ShoppingBag className="w-4 h-4" />
                <span>Continue</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Simple price display for sticky header
 */
export function StickyPriceHeader({
  productTitle,
  price,
  className,
}: {
  productTitle: string;
  price: number;
  className?: string;
}) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Show after scrolling past hero section
      setIsVisible(window.scrollY > 200);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div
      className={cn(
        "fixed top-16 left-0 right-0 z-40",
        "bg-white/95 dark:bg-surface-1/95 backdrop-blur-sm",
        "border-b border-gray-200 dark:border-border",
        "transform transition-all duration-300",
        isVisible ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0",
        className
      )}
    >
      <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-between">
        <span className="font-semibold text-gray-900 dark:text-text-primary">
          {productTitle}
        </span>
        <span className="font-bold text-gray-900 dark:text-gold">
          ${price}
        </span>
      </div>
    </div>
  );
}
