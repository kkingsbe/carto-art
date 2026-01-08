'use client';

import { useSearchParams } from 'next/navigation';
import { OrderSteps } from './OrderSteps';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';

// Helper to check aspect ratio match (copied from ProductModal logic)
function parseVariantDimensions(name: string): { width: number; height: number } | null {
    const match = name.match(/(\d+)[″"]?\s*[×x]\s*(\d+)/);
    if (match) {
        return { width: parseInt(match[1]), height: parseInt(match[2]) };
    }
    return null;
}

function parseAspectRatio(ratio: string, orientation: 'portrait' | 'landscape' = 'portrait'): number {
    if (ratio === 'ISO') {
        const base = 1 / Math.sqrt(2);
        return orientation === 'portrait' ? base : 1 / base;
    }
    const [w, h] = ratio.split(':').map(Number);
    if (!w || !h) return 1;
    const base = w / h;
    return orientation === 'portrait' ? base : 1 / base;
}

function variantMatchesAspectRatio(
    variant: { name: string },
    targetRatio: number,
    tolerance: number = 0.20
): boolean {
    const dims = parseVariantDimensions(variant.name);
    if (!dims) return true;

    const variantRatio = dims.width / dims.height;
    const diff = Math.abs(variantRatio - targetRatio) / targetRatio;
    return diff <= tolerance;
}

interface OrderPageClientProps {
    variants: any[];
}

export function OrderPageClient({ variants }: OrderPageClientProps) {
    const searchParams = useSearchParams();

    const designUrl = searchParams?.get('image');
    const aspectRatio = searchParams?.get('aspect') || '2:3';
    const orientation = (searchParams?.get('orientation') as 'portrait' | 'landscape') || 'portrait';

    if (!designUrl) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-4">
                <h1 className="text-2xl font-bold mb-4">No Design Selected</h1>
                <p className="text-muted-foreground mb-8">Please go back to the editor and select "Order Print" to verify your design.</p>
                <Link href="/editor">
                    <Button>Back to Editor</Button>
                </Link>
            </div>
        );
    }

    // Filter variants based on aspect ratio
    const targetRatio = parseAspectRatio(aspectRatio, orientation);
    const filteredVariants = variants.filter(v => variantMatchesAspectRatio(v, targetRatio));
    const finalVariants = filteredVariants.length > 0 ? filteredVariants : variants;

    return (
        <div className="min-h-screen bg-gray-50/50 dark:bg-gray-950">
            {/* Header */}
            <div className="bg-white dark:bg-gray-900 border-b sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/editor" className="text-muted-foreground hover:text-foreground transition-colors">
                            <ChevronLeft className="w-5 h-5" />
                        </Link>
                        <h1 className="text-lg font-bold">Order Framed Print</h1>
                    </div>
                    {/* Could add cart/help icons here */}
                </div>
            </div>

            <OrderSteps
                variants={finalVariants}
                designUrl={designUrl}
                aspectRatio={aspectRatio}
                orientation={orientation}
            />
        </div>
    );
}
