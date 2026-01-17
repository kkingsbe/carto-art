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

        console.log(`[ProductPreviewGrid] Starting preview generation for ${variants.length} variants`, {
            designUrl: designUrl.substring(0, 50) + '...'
        });

        const generatePreviews = async () => {
            // Load design image once
            if (!designImageRef.current) {
                try {
                    console.log(`[ProductPreviewGrid] Loading design image...`);
                    const img = new Image();
                    img.crossOrigin = "anonymous";
                    img.src = designUrl;
                    await new Promise((resolve, reject) => {
                        img.onload = () => {
                            console.log(`[ProductPreviewGrid] Design image loaded successfully`, {
                                width: img.width,
                                height: img.height,
                                naturalWidth: img.naturalWidth,
                                naturalHeight: img.naturalHeight
                            });
                            resolve(img);
                        };
                        img.onerror = (e) => {
                            console.error(`[ProductPreviewGrid] Failed to load design image`, {
                                error: e,
                                src: designUrl.substring(0, 100)
                            });
                            reject(e);
                        };
                    });
                    designImageRef.current = img;
                } catch (e) {
                    console.error("[ProductPreviewGrid] Failed to load design image", e);
                    return;
                }
            }

            // Generate previews for all variants in parallel
            variants.forEach(async (variant) => {
                if (previews.has(variant.id) || generating.has(variant.id)) return;

                console.log(`[ProductPreviewGrid] Starting preview generation for variant ${variant.id}`);
                setGenerating(prev => new Set(prev).add(variant.id));

                try {
                    const previewUrl = await generateVariantPreview(
                        designUrl,
                        variant,
                        designImageRef.current!
                    );

                    if (previewUrl) {
                        console.log(`[ProductPreviewGrid] Successfully generated preview for variant ${variant.id}`);
                        setPreviews(prev => new Map(prev).set(variant.id, previewUrl));
                    } else {
                        console.warn(`[ProductPreviewGrid] Preview generation returned null for variant ${variant.id}`);
                    }
                } catch (e) {
                    console.error("[ProductPreviewGrid] Failed to generate preview for variant", variant.id, {
                        error: e,
                        errorMessage: e instanceof Error ? e.message : String(e),
                        errorStack: e instanceof Error ? e.stack : undefined,
                        errorName: e instanceof Error ? e.name : undefined,
                        variantId: variant.id,
                        designUrl: designUrl.substring(0, 100),
                        hasDesignImage: !!designImageRef.current,
                        designImageComplete: designImageRef.current?.complete,
                        designImageNaturalWidth: designImageRef.current?.naturalWidth
                    });
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
