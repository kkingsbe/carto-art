'use client';

import { ProductGroup } from '@/lib/utils/store';
import { cn } from '@/lib/utils';
import { Check, X, Star } from 'lucide-react';
import Link from 'next/link';

interface ProductComparisonTableProps {
  products: ProductGroup[];
  designUrl?: string;
  className?: string;
}

// Product features for comparison
const COMPARISON_FEATURES = [
  {
    id: 'material',
    label: 'Material',
    values: {
      1: 'Enhanced Matte Paper',
      2: 'Enhanced Matte Paper',
      3: 'Gallery Canvas',
    },
  },
  {
    id: 'frame',
    label: 'Frame Included',
    values: {
      1: true,
      2: false,
      3: false,
    },
  },
  {
    id: 'mounting',
    label: 'Ready to Hang',
    values: {
      1: true,
      2: false,
      3: true,
    },
  },
  {
    id: 'finish',
    label: 'Finish',
    values: {
      1: 'Matte with Glass',
      2: 'Matte',
      3: 'Satin',
    },
  },
  {
    id: 'depth',
    label: 'Depth',
    values: {
      1: '1.25"',
      2: 'Flat',
      3: '1.5"',
    },
  },
  {
    id: 'best_for',
    label: 'Best For',
    values: {
      1: 'Portrait & City Maps',
      2: 'Budget-Friendly',
      3: 'Panoramic & Landscape',
    },
  },
];

/**
 * ProductComparisonTable - Feature comparison grid for products
 */
export function ProductComparisonTable({
  products,
  designUrl,
  className,
}: ProductComparisonTableProps) {
  // Sort products by display order (assuming ID order matches display order)
  const sortedProducts = [...products].sort((a, b) => a.id - b.id);

  return (
    <div className={cn("overflow-hidden", className)}>
      <div className="text-center mb-8">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-text-primary mb-2">
          Compare Products
        </h2>
        <p className="text-gray-500 dark:text-text-secondary">
          Find the perfect format for your space
        </p>
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="p-4 text-left text-sm font-medium text-gray-500 dark:text-text-muted border-b border-gray-200 dark:border-border">
                Feature
              </th>
              {sortedProducts.map((product) => (
                <th
                  key={product.id}
                  className="p-4 text-center border-b border-gray-200 dark:border-border"
                >
                  <div className="font-bold text-gray-900 dark:text-text-primary">
                    {product.title}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-text-secondary mt-1">
                    from ${Math.ceil(product.startingPrice / 100)}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {COMPARISON_FEATURES.map((feature, index) => (
              <tr
                key={feature.id}
                className={cn(
                  index % 2 === 0
                    ? 'bg-gray-50/50 dark:bg-surface-1/30'
                    : 'bg-white dark:bg-background'
                )}
              >
                <td className="p-4 text-sm font-medium text-gray-700 dark:text-text-secondary border-b border-gray-100 dark:border-border-subtle">
                  {feature.label}
                </td>
                {sortedProducts.map((product) => {
                  const value = feature.values[product.id as keyof typeof feature.values];
                  return (
                    <td
                      key={product.id}
                      className="p-4 text-center text-sm border-b border-gray-100 dark:border-border-subtle"
                    >
                      {typeof value === 'boolean' ? (
                        value ? (
                          <Check className="w-5 h-5 text-green-500 dark:text-success mx-auto" />
                        ) : (
                          <X className="w-5 h-5 text-gray-300 dark:text-text-subtle mx-auto" />
                        )
                      ) : (
                        <span className="text-gray-700 dark:text-text-secondary">
                          {value || '—'}
                        </span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
            {/* CTA Row */}
            <tr>
              <td className="p-4" />
              {sortedProducts.map((product) => {
                const href = designUrl
                  ? `/store/${product.id}?image=${encodeURIComponent(designUrl)}`
                  : `/store/${product.id}`;
                return (
                  <td key={product.id} className="p-4 text-center">
                    <Link
                      href={href}
                      className={cn(
                        "inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-full",
                        "bg-gray-900 dark:bg-gold text-white dark:text-background",
                        "font-medium text-sm",
                        "hover:bg-gray-800 dark:hover:bg-gold-hover",
                        "transition-all duration-200"
                      )}
                    >
                      Select {product.title}
                    </Link>
                  </td>
                );
              })}
            </tr>
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-4">
        {sortedProducts.map((product, productIndex) => {
          const href = designUrl
            ? `/store/${product.id}?image=${encodeURIComponent(designUrl)}`
            : `/store/${product.id}`;
          
          return (
            <div
              key={product.id}
              className={cn(
                "rounded-xl border overflow-hidden transition-all duration-200",
                productIndex === 0
                  ? "border-gold/50 bg-gold/5 dark:bg-gold/10 shadow-[var(--glow-gold)]"
                  : "border-gray-200 dark:border-border bg-white dark:bg-surface-1"
              )}
            >
              {/* Header */}
              <div className="p-4 border-b border-gray-100 dark:border-border-subtle flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-gray-900 dark:text-text-primary">
                      {product.title}
                    </h3>
                    {productIndex === 0 && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gold text-background text-xs font-medium">
                        <Star className="w-3 h-3 fill-current" />
                        Best Value
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 dark:text-text-secondary mt-0.5">
                    from ${Math.ceil(product.startingPrice / 100)}
                  </p>
                </div>
              </div>

              {/* Features */}
              <div className="p-4 space-y-3">
                {COMPARISON_FEATURES.map((feature) => {
                  const value = feature.values[product.id as keyof typeof feature.values];
                  return (
                    <div
                      key={feature.id}
                      className="flex items-center justify-between text-sm"
                    >
                      <span className="text-gray-500 dark:text-text-muted">
                        {feature.label}
                      </span>
                      <span className="font-medium text-gray-900 dark:text-text-primary">
                        {typeof value === 'boolean' ? (
                          value ? (
                            <Check className="w-5 h-5 text-green-500 dark:text-success" />
                          ) : (
                            <X className="w-5 h-5 text-gray-300 dark:text-text-subtle" />
                          )
                        ) : (
                          value || '—'
                        )}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* CTA */}
              <div className="p-4 pt-0">
                <Link
                  href={href}
                  className={cn(
                    "w-full flex items-center justify-center gap-2 px-6 py-3 rounded-lg",
                    productIndex === 0
                      ? "bg-gold hover:bg-gold-hover text-background"
                      : "bg-gray-900 dark:bg-surface-2 text-white dark:text-text-primary hover:bg-gray-800 dark:hover:bg-surface-hover",
                    "font-medium text-sm",
                    "transition-all duration-200"
                  )}
                >
                  Select {product.title}
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Compact inline comparison for quick reference
 */
export function ProductComparisonInline({
  products,
  className,
}: {
  products: ProductGroup[];
  className?: string;
}) {
  return (
    <div className={cn("flex flex-wrap gap-4 justify-center", className)}>
      {products.map((product) => (
        <div
          key={product.id}
          className="flex items-center gap-2 px-4 py-2 rounded-full bg-gray-100 dark:bg-surface-1 border border-transparent dark:border-border text-sm"
        >
          <span className="font-medium text-gray-900 dark:text-text-primary">
            {product.title}
          </span>
          <span className="text-gray-500 dark:text-text-secondary">
            from ${Math.ceil(product.startingPrice / 100)}
          </span>
        </div>
      ))}
    </div>
  );
}
