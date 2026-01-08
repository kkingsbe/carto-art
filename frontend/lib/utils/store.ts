
import { Database } from '@/types/database';

// Helper to check aspect ratio match
export function parseVariantDimensions(name: string): { width: number; height: number } | null {
    // Enhanced regex to handle:
    // - Decimals (8.5)
    // - Units (in, cm, mm)
    // - Various spacing
    // e.g. "12x18", "12 in x 18 in", "8.5 x 11"
    const match = name.match(/(\d+(?:\.\d+)?)\s*(?:["″]|in|cm|mm)?\s*[x×]\s*(\d+(?:\.\d+)?)\s*(?:["″]|in|cm|mm)?/i);
    if (match) {
        return { width: parseFloat(match[1]), height: parseFloat(match[2]) };
    }
    return null;
}

export function parseAspectRatio(ratio: string, orientation: 'portrait' | 'landscape' = 'portrait'): number {
    if (ratio === 'ISO') {
        const base = 1 / Math.sqrt(2);
        return orientation === 'portrait' ? base : 1 / base;
    }
    const [w, h] = ratio.split(':').map(Number);
    if (!w || !h) return 1;
    const base = w / h;
    return orientation === 'portrait' ? base : 1 / base;
}

export function variantMatchesAspectRatio(
    variant: { name: string },
    targetRatio: number,
    tolerance: number = 0.05 // Stricter tolerance
): boolean {
    const dims = parseVariantDimensions(variant.name);
    // If dimensions can't be parsed, exclude it
    if (!dims) return false;

    const variantRatio = dims.width / dims.height;

    // Check direct match
    const diff = Math.abs(variantRatio - targetRatio) / targetRatio;

    // Check rotated match (e.g. 18x12 variant effectively supports 2:3 image if rotated)
    const rotatedRatio = dims.height / dims.width;
    const rotatedDiff = Math.abs(rotatedRatio - targetRatio) / targetRatio;

    return diff <= tolerance || rotatedDiff <= tolerance;
}

export type ProductVariant = Database['public']['Tables']['product_variants']['Row'] & {
    display_price_cents: number;
};

export interface ProductGroup {
    id: number;
    title: string;
    description: string;
    minPrice: number;
    variants: ProductVariant[];
    thumbnailVariant: ProductVariant;
}

export function groupVariantsByProduct(variants: ProductVariant[]): ProductGroup[] {
    const groups = new Map<number, ProductVariant[]>();

    // 1. Group by product_id
    variants.forEach(v => {
        if (!v.is_active) return;
        const pid = v.product_id || 0;
        if (!groups.has(pid)) groups.set(pid, []);
        groups.get(pid)?.push(v);
    });

    const products: ProductGroup[] = [];

    groups.forEach((groupVariants, pid) => {
        if (groupVariants.length === 0) return;

        // 2. Sort variants
        groupVariants.sort((a, b) => a.display_order - b.display_order);

        // 3. Determine Product Info
        // Heuristics to derive a clean product title from variant names
        // Example Variant: "12×16 Enhanced Matte Paper Framed Poster (in Black Frame)"
        const baseVariant = groupVariants[0];
        let title = "Fine Art Print";
        let description = "Museum-quality prints that bring your map to life.";

        // Naive detection based on common Printful naming or known products
        const nameLower = baseVariant.name.toLowerCase();

        if (nameLower.includes("framed poster") || nameLower.includes("framed print")) {
            title = "Framed Poster";
            description = "Museum-quality matte paper, framed in semi-hardwood timber.";
        } else if (nameLower.includes("canvas")) {
            title = "Canvas Print";
            description = "Textured, fade-resistant canvas mounting brackets included.";
        } else if (nameLower.includes("poster") && !nameLower.includes("framed")) {
            title = "Art Poster";
            description = "Museum-quality posters made on thick and durable matte paper.";
        }

        // Calculate min price
        const minPrice = Math.min(...groupVariants.map(v => v.display_price_cents));

        // Find best thumbnail (prefer medium size, e.g., around 12x16 or 18x24 if possible, or just first with mockup)
        // We want a variant that has a `mockup_template_url`
        const thumbnailVariant = groupVariants.find(v => v.mockup_template_url) || groupVariants[0];

        products.push({
            id: pid,
            title,
            description,
            minPrice,
            variants: groupVariants,
            thumbnailVariant
        });
    });

    return products;
}
