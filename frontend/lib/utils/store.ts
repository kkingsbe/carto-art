
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

/**
 * Strictly checks if a variant's print area matches the design orientation.
 * Unlike variantMatchesAspectRatio, this does NOT allow rotated matches.
 * Use this when selecting mockup templates where the visual orientation must match.
 */
export function variantMatchesOrientationStrict(
    variant: { mockup_print_area?: any },
    isPortrait: boolean,
    tolerance: number = 0.05
): boolean {
    const area = variant.mockup_print_area;
    if (!area) return false;

    // Parse if it's a JSON string
    let parsed = area;
    if (typeof area === 'string') {
        try { parsed = JSON.parse(area); } catch { return false; }
    }

    if (!parsed || typeof parsed.width !== 'number' || typeof parsed.height !== 'number') {
        return false;
    }

    // Check if the print area's orientation matches
    const printAreaIsPortrait = parsed.height > parsed.width;
    const printAreaIsSquare = Math.abs(parsed.width - parsed.height) / Math.max(parsed.width, parsed.height) < tolerance;

    // Square print areas match any orientation
    if (printAreaIsSquare) return true;

    // Otherwise, orientation must match
    return printAreaIsPortrait === isPortrait;
}

export type ProductVariant = Database['public']['Tables']['product_variants']['Row'] & {
    display_price_cents: number;
};

export type ProductType = Database['public']['Tables']['products']['Row'] & {
    variants: ProductVariant[];
};

export interface ProductGroup {
    id: number;
    title: string;
    description: string;
    features: string[];
    minPrice: number;
    variants: ProductVariant[];
    thumbnailVariant: ProductVariant;
    startingPrice: number;
}

export function groupVariantsByProduct(variants: ProductVariant[], products: ProductType[]): ProductGroup[] {
    const groups: ProductGroup[] = [];

    // Create a map of product definitions for easy lookup
    const productMap = new Map(products.map(p => [p.id, p]));

    // Group variants by product_id
    const variantsByProduct = new Map<number, ProductVariant[]>();
    variants.forEach(v => {
        if (!v.is_active) return;
        const pid = v.product_id || 0;
        if (!variantsByProduct.has(pid)) variantsByProduct.set(pid, []);
        variantsByProduct.get(pid)?.push(v);
    });

    // Iterate through defined products to build groups
    // This ensures we only show products that are defined and active in the products table
    products.forEach(product => {
        if (!product.is_active) return;

        const productVariants = variantsByProduct.get(product.id) || [];
        if (productVariants.length === 0) return; // Don't show empty products

        // Sort variants by display order
        productVariants.sort((a, b) => a.display_order - b.display_order);

        // Calculate prices
        const minVariantPrice = Math.min(...productVariants.map(v => v.display_price_cents));
        // Use override price if set, otherwise min variant price
        const startingPrice = product.starting_price || minVariantPrice;

        // Find best thumbnail (prefer medium size, e.g., around 12x16 or 18x24 if possible, or just first with mockup)
        const thumbnailVariant = productVariants.find(v => v.mockup_template_url) || productVariants[0];

        groups.push({
            id: product.id,
            title: product.title,
            description: product.description || '',
            features: product.features || [],
            minPrice: minVariantPrice,
            startingPrice: startingPrice,
            variants: productVariants,
            thumbnailVariant
        });
    });

    // Sort products by display_order
    groups.sort((a, b) => {
        const orderA = productMap.get(a.id)?.display_order ?? 0;
        const orderB = productMap.get(b.id)?.display_order ?? 0;
        return orderA - orderB;
    });

    return groups;
}

