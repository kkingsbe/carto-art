'use client';

import { cn } from '@/lib/utils';
import { Sparkles, Truck, Shield, Award } from 'lucide-react';

interface ProductHeroProps {
  title?: string;
  subtitle?: string;
  className?: string;
}

/**
 * ProductHero - Hero section for store pages
 * Shows value proposition and trust signals
 */
export function ProductHero({
  title = "Bring Your Map to Life",
  subtitle = "Choose the perfect format for your custom designed map.",
  className,
}: ProductHeroProps) {
  return (
    <div className={cn("relative overflow-hidden", className)}>
      {/* Background gradient - using new surface colors */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-background dark:via-surface-1 dark:to-background" />
      
      {/* Subtle pattern overlay */}
      <div 
        className="absolute inset-0 opacity-[0.02] dark:opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      <div className="relative max-w-7xl mx-auto px-4 py-12 md:py-16">
        {/* Main content */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-100 dark:bg-gold/15 text-amber-700 dark:text-gold text-sm font-medium mb-4 border border-transparent dark:border-gold/30">
            <Sparkles className="w-4 h-4" />
            Premium Quality Prints
          </div>
          
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-gray-900 dark:text-text-primary mb-4">
            {title}
          </h1>
          
          <p className="text-lg md:text-xl text-gray-600 dark:text-text-secondary max-w-2xl mx-auto">
            {subtitle}
          </p>
        </div>

        {/* Trust signals */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6 max-w-3xl mx-auto">
          <TrustSignal
            icon={Truck}
            title="Free Shipping"
            description="On orders over $75"
          />
          <TrustSignal
            icon={Shield}
            title="Quality Guarantee"
            description="100% satisfaction"
          />
          <TrustSignal
            icon={Award}
            title="Premium Materials"
            description="Museum-quality prints"
          />
        </div>
      </div>
    </div>
  );
}

interface TrustSignalProps {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
}

function TrustSignal({ icon: Icon, title, description }: TrustSignalProps) {
  return (
    <div className="flex items-center gap-3 p-4 rounded-xl bg-white/50 dark:bg-surface-1/50 backdrop-blur-sm border border-gray-200/50 dark:border-border transition-all duration-200 hover:dark:border-border-interactive hover:dark:shadow-[var(--glow-gold)]">
      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gray-100 dark:bg-surface-2 flex items-center justify-center">
        <Icon className="w-5 h-5 text-gray-600 dark:text-text-secondary" />
      </div>
      <div>
        <div className="font-semibold text-gray-900 dark:text-text-primary text-sm">
          {title}
        </div>
        <div className="text-xs text-gray-500 dark:text-text-muted">
          {description}
        </div>
      </div>
    </div>
  );
}

/**
 * Compact hero variant for product detail pages
 */
export function ProductDetailHero({
  productTitle,
  className,
}: {
  productTitle: string;
  className?: string;
}) {
  return (
    <div className={cn("bg-gray-50 dark:bg-surface-1 border-b border-gray-200 dark:border-border", className)}>
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-text-primary">
              {productTitle}
            </h1>
            <p className="text-gray-500 dark:text-text-secondary mt-1">
              Select your size and customize your order
            </p>
          </div>
          
          <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-text-muted">
            <div className="flex items-center gap-1.5">
              <Truck className="w-4 h-4" />
              <span>Free shipping $75+</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Shield className="w-4 h-4" />
              <span>Quality guaranteed</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
