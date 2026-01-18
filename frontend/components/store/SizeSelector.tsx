'use client';

import { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Check, ChevronLeft, ChevronRight } from 'lucide-react';
import { parseVariantDimensions } from '@/lib/utils/store';

interface Variant {
  id: number;
  name: string;
  display_price_cents: number;
  image_url?: string;
  mockup_template_url?: string;
}

interface SizeSelectorProps {
  variants: Variant[];
  selectedVariantId: number;
  onSelect: (variant: Variant) => void;
  className?: string;
}

/**
 * SizeSelector - Visual size picker with swipeable cards
 */
export function SizeSelector({
  variants,
  selectedVariantId,
  onSelect,
  className,
}: SizeSelectorProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  // Check scroll state
  const checkScroll = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setCanScrollLeft(scrollLeft > 0);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, [variants]);

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const scrollAmount = 200;
    scrollRef.current.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
  };

  // Sort variants by price (smallest to largest)
  const sortedVariants = [...variants].sort(
    (a, b) => a.display_price_cents - b.display_price_cents
  );

  return (
    <div className={cn("relative", className)}>
      {/* Scroll buttons for desktop */}
      {canScrollLeft && (
        <button
          onClick={() => scroll('left')}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white dark:bg-surface-2 shadow-lg border border-gray-200 dark:border-border flex items-center justify-center hover:bg-gray-50 dark:hover:bg-surface-hover transition-colors hidden md:flex"
        >
          <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-text-secondary" />
        </button>
      )}
      {canScrollRight && (
        <button
          onClick={() => scroll('right')}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white dark:bg-surface-2 shadow-lg border border-gray-200 dark:border-border flex items-center justify-center hover:bg-gray-50 dark:hover:bg-surface-hover transition-colors hidden md:flex"
        >
          <ChevronRight className="w-5 h-5 text-gray-600 dark:text-text-secondary" />
        </button>
      )}

      {/* Scrollable container */}
      <div
        ref={scrollRef}
        onScroll={checkScroll}
        className="flex gap-3 overflow-x-auto scrollbar-hide snap-x snap-mandatory pb-2 -mx-4 px-4 md:mx-0 md:px-0"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {sortedVariants.map((variant) => {
          const isSelected = variant.id === selectedVariantId;
          const dimensions = parseVariantDimensions(variant.name);
          const sizeLabel = dimensions
            ? `${dimensions.width}×${dimensions.height}`
            : variant.name;

          return (
            <button
              key={variant.id}
              onClick={() => onSelect(variant)}
              className={cn(
                "flex-shrink-0 snap-start",
                "relative p-4 rounded-xl border-2 transition-all duration-200",
                "min-w-[120px] md:min-w-[140px]",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 dark:focus-visible:ring-offset-background",
                isSelected
                  ? "border-gold dark:border-gold bg-gold/5 dark:bg-surface-2 shadow-[var(--glow-gold)]"
                  : "border-gray-200 dark:border-border-subtle bg-white dark:bg-surface-1 hover:border-gray-300 dark:hover:border-border-interactive hover:dark:bg-surface-2"
              )}
            >
              {/* Selected indicator */}
              {isSelected && (
                <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-gold flex items-center justify-center">
                  <Check className="w-4 h-4 text-background" />
                </div>
              )}

              {/* Size visualization */}
              <div className="flex items-center justify-center h-16 mb-3">
                <SizeVisualization
                  width={dimensions?.width || 12}
                  height={dimensions?.height || 18}
                  isSelected={isSelected}
                />
              </div>

              {/* Size label */}
              <div className="text-center">
                <div className={cn(
                  "font-semibold text-sm",
                  isSelected
                    ? "text-gray-900 dark:text-text-primary"
                    : "text-gray-700 dark:text-text-secondary"
                )}>
                  {sizeLabel}"
                </div>
                <div className={cn(
                  "font-bold text-lg mt-1",
                  isSelected
                    ? "text-gold"
                    : "text-gray-900 dark:text-text-primary"
                )}>
                  ${Math.ceil(variant.display_price_cents / 100)}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Mobile scroll indicator */}
      <div className="flex justify-center gap-1 mt-3 md:hidden">
        {sortedVariants.map((variant, index) => (
          <div
            key={variant.id}
            className={cn(
              "w-2 h-2 rounded-full transition-colors",
              variant.id === selectedVariantId
                ? "bg-gold"
                : "bg-gray-300 dark:bg-surface-hover"
            )}
          />
        ))}
      </div>
    </div>
  );
}

/**
 * Visual representation of size proportions
 */
function SizeVisualization({
  width,
  height,
  isSelected,
}: {
  width: number;
  height: number;
  isSelected: boolean;
}) {
  // Normalize to fit within container
  const maxDim = 48;
  const aspectRatio = width / height;
  
  let displayWidth: number;
  let displayHeight: number;
  
  if (aspectRatio > 1) {
    displayWidth = maxDim;
    displayHeight = maxDim / aspectRatio;
  } else {
    displayHeight = maxDim;
    displayWidth = maxDim * aspectRatio;
  }

  return (
    <div
      className={cn(
        "border-2 rounded-sm transition-colors",
        isSelected
          ? "border-gold bg-gold/20 dark:bg-gold/10"
          : "border-gray-300 dark:border-border bg-gray-100 dark:bg-surface-1"
      )}
      style={{
        width: `${displayWidth}px`,
        height: `${displayHeight}px`,
      }}
    />
  );
}

/**
 * Compact size selector for mobile sticky cart
 */
export function SizeSelectorCompact({
  variants,
  selectedVariantId,
  onSelect,
  className,
}: SizeSelectorProps) {
  const selectedVariant = variants.find(v => v.id === selectedVariantId);
  const dimensions = selectedVariant
    ? parseVariantDimensions(selectedVariant.name)
    : null;
  const sizeLabel = dimensions
    ? `${dimensions.width}×${dimensions.height}"`
    : selectedVariant?.name || 'Select size';

  return (
    <div className={cn("relative", className)}>
      <select
        value={selectedVariantId}
        onChange={(e) => {
          const variant = variants.find(v => v.id === Number(e.target.value));
          if (variant) onSelect(variant);
        }}
        className={cn(
          "w-full px-4 py-3 rounded-lg",
          "bg-white dark:bg-surface-1 border border-gray-200 dark:border-border",
          "text-gray-900 dark:text-text-primary font-medium",
          "focus:outline-none focus:ring-2 focus:ring-gold",
          "appearance-none cursor-pointer"
        )}
      >
        {variants.map((variant) => {
          const dims = parseVariantDimensions(variant.name);
          const label = dims ? `${dims.width}×${dims.height}"` : variant.name;
          return (
            <option key={variant.id} value={variant.id}>
              {label} - ${Math.ceil(variant.display_price_cents / 100)}
            </option>
          );
        })}
      </select>
      <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
        <ChevronRight className="w-5 h-5 text-gray-400 dark:text-text-muted rotate-90" />
      </div>
    </div>
  );
}

/**
 * Grid-based size selector for larger screens
 */
export function SizeSelectorGrid({
  variants,
  selectedVariantId,
  onSelect,
  className,
}: SizeSelectorProps) {
  // Sort variants by price
  const sortedVariants = [...variants].sort(
    (a, b) => a.display_price_cents - b.display_price_cents
  );

  return (
    <div className={cn("grid grid-cols-2 sm:grid-cols-3 gap-3", className)}>
      {sortedVariants.map((variant) => {
        const isSelected = variant.id === selectedVariantId;
        const dimensions = parseVariantDimensions(variant.name);
        const sizeLabel = dimensions
          ? `${dimensions.width}×${dimensions.height}"`
          : variant.name;

        return (
          <button
            key={variant.id}
            onClick={() => onSelect(variant)}
            className={cn(
              "relative p-4 rounded-xl border-2 transition-all duration-200",
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 dark:focus-visible:ring-offset-background",
              isSelected
                ? "border-gold bg-gold/5 dark:bg-surface-2 shadow-[var(--glow-gold)]"
                : "border-gray-200 dark:border-border-subtle bg-white dark:bg-surface-1 hover:border-gray-300 dark:hover:border-border-interactive"
            )}
          >
            {isSelected && (
              <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-gold flex items-center justify-center">
                <Check className="w-4 h-4 text-background" />
              </div>
            )}

            <div className="text-center">
              <div className={cn(
                "font-semibold",
                isSelected
                  ? "text-gray-900 dark:text-text-primary"
                  : "text-gray-700 dark:text-text-secondary"
              )}>
                {sizeLabel}
              </div>
              <div className={cn(
                "font-bold text-xl mt-1",
                isSelected
                  ? "text-gold"
                  : "text-gray-900 dark:text-text-primary"
              )}>
                ${Math.ceil(variant.display_price_cents / 100)}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
