'use client';

import { useState, useEffect, useRef } from 'react';
import { VariantCard, VariantCardSkeleton } from './VariantCard';
import { generateVariantPreview } from '@/lib/services/PreviewService';
import { ProductVariant } from '@/lib/constants/products';

interface ProductPreviewGridProps {
    variants: any[]; // Using any to match existing flexibility
    designUrl: string;
    selectedVariantId: number | null;
    onSelectVariant: (variant: any) => void;
    isLoading?: boolean;
}

export function ProductPreviewGrid({
    variants,
    designUrl,
    selectedVariantId,
    onSelectVariant,
    isLoading = false
}: ProductPreviewGridProps) {
    const [previews, setPreviews] = useState<Map<number, string>>(new Map());
    const [generating, setGenerating] = useState<Set<number>>(new Set());
    const designImageRef = useRef<HTMLImageElement | null>(null);

    useEffect(() => {
        // Defensive check for "undefined" string which might be passed in URL
        if (!designUrl || designUrl === 'undefined' || variants.length === 0) return;

        const generatePreviews = async () => {
            // Load design image once
            if (!designImageRef.current) {
                try {
                    const img = new Image();
                    img.crossOrigin = "anonymous";
                    img.src = designUrl;
                    await new Promise((resolve, reject) => {
                        img.onload = resolve;
                        img.onerror = reject;
                    });
                    designImageRef.current = img;
                } catch (e) {
                    console.error("Failed to load design image", e);
                    return;
                }
            }

            // Generate previews for all variants in parallel
            variants.forEach(async (variant) => {
                if (previews.has(variant.id) || generating.has(variant.id)) return;

                setGenerating(prev => new Set(prev).add(variant.id));

                try {
                    const previewUrl = await generateVariantPreview(
                        designUrl,
                        variant,
                        designImageRef.current!
                    );

                    if (previewUrl) {
                        setPreviews(prev => new Map(prev).set(variant.id, previewUrl));
                    }
                } catch (e) {
                    console.error("Failed to generate preview for", variant.id);
                } finally {
                    setGenerating(prev => {
                        const next = new Set(prev);
                        next.delete(variant.id);
                        return next;
                    });
                }
            });
        };

        generatePreviews();
    }, [designUrl, variants]);

    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => <VariantCardSkeleton key={i} />)
            ) : (
                variants.map(variant => (
                    <VariantCard
                        key={variant.id}
                        variant={{
                            ...variant,
                            generatedPreviewUrl: previews.get(variant.id)
                        }}
                        isSelected={selectedVariantId === variant.id}
                        onClick={() => onSelectVariant(variant)}
                        isLoading={generating.has(variant.id) && !previews.has(variant.id)}
                    />
                ))
            )}
        </div>
    );
}
