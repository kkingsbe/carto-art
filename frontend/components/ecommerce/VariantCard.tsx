'use client';

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

interface VariantCardProps {
    variant: {
        id: number;
        name: string;
        price_cents: number;
        display_price_cents?: number; // Margin-adjusted price for display
        image_url?: string;
    };
    isSelected: boolean;
    onClick: () => void;
    isLoading?: boolean;
}

// Parse size from variant name (e.g., "10×10" / 25×25 cm from "Enhanced Matte Paper Framed Poster (in)")
function parseSize(name: string): { dimensions: string; unit: string } | null {
    // Match patterns like "10×10" or "12×16" or "24×36"
    const match = name.match(/(\d+)[×x](\d+)/);
    if (match) {
        return {
            dimensions: `${match[1]}″ × ${match[2]}″`,
            unit: 'in'
        };
    }
    return null;
}

export function VariantCard({ variant, isSelected, onClick, isLoading }: VariantCardProps) {
    const [imageLoaded, setImageLoaded] = useState(false);
    const sizeInfo = parseSize(variant.name);

    // Format price - use display_price_cents if available (margin-adjusted), otherwise fall back to base price
    const price = ((variant.display_price_cents ?? variant.price_cents) / 100).toFixed(2);

    return (
        <div
            onClick={onClick}
            className={cn(
                "group relative cursor-pointer rounded-xl border-2 p-4 transition-all duration-200",
                "hover:shadow-lg hover:border-primary/50",
                isSelected
                    ? "border-primary bg-primary/5 shadow-md ring-2 ring-primary/20"
                    : "border-border bg-card hover:bg-accent/50"
            )}
        >
            {/* Image Preview */}
            <div className="aspect-square relative rounded-lg overflow-hidden bg-muted mb-3">
                {isLoading ? (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                    </div>
                ) : variant.image_url ? (
                    <>
                        {!imageLoaded && (
                            <div className="absolute inset-0 animate-pulse bg-muted" />
                        )}
                        <img
                            src={variant.image_url}
                            alt={variant.name}
                            className={cn(
                                "w-full h-full object-cover transition-opacity duration-300",
                                imageLoaded ? "opacity-100" : "opacity-0"
                            )}
                            onLoad={() => setImageLoaded(true)}
                        />
                    </>
                ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-center text-muted-foreground">
                            <div className="w-12 h-12 mx-auto mb-2 rounded-lg bg-muted-foreground/10 flex items-center justify-center">
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Size Badge */}
            {sizeInfo && (
                <div className="text-center mb-2">
                    <span className="inline-block px-3 py-1 bg-secondary text-secondary-foreground rounded-full text-sm font-semibold">
                        {sizeInfo.dimensions}
                    </span>
                </div>
            )}

            {/* Title */}
            <h3 className="text-sm font-medium text-center line-clamp-2 text-foreground mb-2">
                {variant.name.split(' / ')[0].split(' - ')[0]}
            </h3>

            {/* Price */}
            <div className="text-center">
                <span className="text-lg font-bold text-primary">${price}</span>
            </div>

            {/* Selected Indicator */}
            {isSelected && (
                <div className="absolute top-2 right-2">
                    <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                        <svg className="w-4 h-4 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                </div>
            )}
        </div>
    );
}

// Skeleton loader for variant cards
export function VariantCardSkeleton() {
    return (
        <div className="rounded-xl border-2 border-border p-4 animate-pulse">
            <div className="aspect-square rounded-lg bg-muted mb-3" />
            <div className="h-6 bg-muted rounded-full w-20 mx-auto mb-2" />
            <div className="h-4 bg-muted rounded w-3/4 mx-auto mb-2" />
            <div className="h-6 bg-muted rounded w-16 mx-auto" />
        </div>
    );
}
