/**
 * Store Mock Utilities for Testing
 * 
 * Provides mock factories for product variants and product groups.
 */

import type { ProductVariant, ProductGroup } from '@/lib/utils/store';

// ============================================================
// Types
// ============================================================

export interface MockVariantOptions {
    id?: number;
    product_id?: number;
    name?: string;
    price_cents?: number;
    display_price_cents?: number;
    is_active?: boolean;
    display_order?: number;
    image_url?: string | null;
    mockup_template_url?: string | null;
    mockup_print_area?: { x: number; y: number; width: number; height: number } | string | null;
}

// ============================================================
// Default Values
// ============================================================

const DEFAULT_PRINT_AREA = { x: 0.12, y: 0.08, width: 0.76, height: 0.84 };
const DEFAULT_TEMPLATE_URL = 'https://printful-upload.s3-accelerate.amazonaws.com/tmp/mockup-template.png';

// ============================================================
// Variant Mocks
// ============================================================

/**
 * Creates a mock product variant with sensible defaults.
 * All fields can be overridden. Pass null explicitly to set null values.
 */
export function createMockVariant(overrides: MockVariantOptions = {}): ProductVariant {
    const id = overrides.id ?? 12345;
    const price_cents = overrides.price_cents ?? 4500;

    // Use hasOwnProperty to distinguish between "not provided" and "explicitly null"
    const hasExplicitTemplateUrl = Object.prototype.hasOwnProperty.call(overrides, 'mockup_template_url');
    const hasExplicitPrintArea = Object.prototype.hasOwnProperty.call(overrides, 'mockup_print_area');

    return {
        id,
        product_id: overrides.product_id ?? 1,
        name: overrides.name ?? '12×18 Enhanced Matte Paper Framed Poster (in Black Frame)',
        price_cents,
        display_price_cents: overrides.display_price_cents ?? Math.round(price_cents * 1.35),
        is_active: overrides.is_active ?? true,
        display_order: overrides.display_order ?? 0,
        image_url: overrides.image_url ?? 'https://example.com/variant-image.png',
        mockup_template_url: hasExplicitTemplateUrl ? overrides.mockup_template_url : DEFAULT_TEMPLATE_URL,
        mockup_print_area: hasExplicitPrintArea ? overrides.mockup_print_area : DEFAULT_PRINT_AREA,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    } as ProductVariant;
}

// ============================================================
// Preset Variants (Common Test Scenarios)
// ============================================================

/**
 * Portrait variant (height > width in print area)
 * Example: 12×18 (2:3 aspect ratio)
 */
export function createPortraitVariant(overrides: MockVariantOptions = {}): ProductVariant {
    return createMockVariant({
        id: 101,
        name: '12×18 Enhanced Matte Paper Framed Poster (in Black Frame)',
        mockup_print_area: { x: 0.15, y: 0.05, width: 0.7, height: 0.9 }, // Portrait: height > width
        ...overrides,
    });
}

/**
 * Landscape variant (width > height in print area)
 * Example: 18×12 (3:2 aspect ratio)
 */
export function createLandscapeVariant(overrides: MockVariantOptions = {}): ProductVariant {
    return createMockVariant({
        id: 102,
        name: '18×12 Enhanced Matte Paper Framed Poster (in Black Frame)',
        mockup_print_area: { x: 0.05, y: 0.15, width: 0.9, height: 0.7 }, // Landscape: width > height
        ...overrides,
    });
}

/**
 * Square variant (equal width and height)
 * Example: 10×10
 */
export function createSquareVariant(overrides: MockVariantOptions = {}): ProductVariant {
    return createMockVariant({
        id: 103,
        name: '10×10 Canvas Print',
        mockup_print_area: { x: 0.1, y: 0.1, width: 0.8, height: 0.8 }, // Square
        ...overrides,
    });
}

/**
 * Extreme aspect ratio variant
 * Example: 12×36 (1:3 aspect ratio - tall and narrow)
 */
export function createExtremeAspectVariant(overrides: MockVariantOptions = {}): ProductVariant {
    return createMockVariant({
        id: 104,
        name: '12×36 Canvas Print (in)',
        mockup_print_area: { x: 0.35, y: 0.05, width: 0.3, height: 0.9 }, // Very tall
        ...overrides,
    });
}

/**
 * Variant with no mockup data (missing template)
 */
export function createVariantWithoutMockup(overrides: MockVariantOptions = {}): ProductVariant {
    return createMockVariant({
        id: 105,
        name: '8×10 Art Poster',
        mockup_template_url: null,
        mockup_print_area: null,
        ...overrides,
    });
}

/**
 * Variant with print area as JSON string (tests parsing)
 */
export function createVariantWithStringPrintArea(overrides: MockVariantOptions = {}): ProductVariant {
    return createMockVariant({
        id: 106,
        name: '16×20 Framed Poster',
        mockup_print_area: JSON.stringify({ x: 0.12, y: 0.08, width: 0.76, height: 0.84 }),
        ...overrides,
    });
}

// ============================================================
// Product Group Mocks
// ============================================================

/**
 * Creates a mock product group from an array of variants.
 */
export function createMockProductGroup(
    variants: ProductVariant[],
    overrides: Partial<ProductGroup> = {}
): ProductGroup {
    if (variants.length === 0) {
        throw new Error('Product group must have at least one variant');
    }

    const minPrice = Math.min(...variants.map(v => v.display_price_cents));
    const thumbnailVariant = variants.find(v => v.mockup_template_url) || variants[0];
    // startingPrice defaults to minPrice (matches real behavior when no DB override)
    const startingPrice = overrides.startingPrice ?? minPrice;

    return {
        id: overrides.id ?? variants[0].product_id ?? 1,
        title: overrides.title ?? 'Framed Poster',
        description: overrides.description ?? 'Museum-quality matte paper, framed in semi-hardwood timber.',
        features: overrides.features ?? [],
        minPrice,
        startingPrice,
        variants,
        thumbnailVariant,
    };
}

// ============================================================
// Fixture Sets
// ============================================================

/**
 * A complete set of variants for a single product (Framed Poster)
 * Includes portrait, landscape, and square sizes
 */
export function createFramedPosterVariantSet(): ProductVariant[] {
    return [
        createPortraitVariant({ product_id: 1, display_order: 0 }),
        createLandscapeVariant({ product_id: 1, display_order: 1 }),
        createSquareVariant({ product_id: 1, display_order: 2, name: '12×12 Enhanced Matte Paper Framed Poster' }),
        createMockVariant({
            id: 107,
            product_id: 1,
            name: '16×24 Enhanced Matte Paper Framed Poster',
            display_order: 3,
            mockup_print_area: { x: 0.12, y: 0.05, width: 0.76, height: 0.9 }
        }),
    ];
}

/**
 * A complete set of variants for Canvas product
 */
export function createCanvasVariantSet(): ProductVariant[] {
    return [
        createSquareVariant({ id: 201, product_id: 2, name: '10×10 Canvas Print', display_order: 0 }),
        createExtremeAspectVariant({ id: 202, product_id: 2, display_order: 1 }),
        createMockVariant({
            id: 203,
            product_id: 2,
            name: '16×20 Canvas Print',
            display_order: 2,
            mockup_print_area: { x: 0.1, y: 0.08, width: 0.8, height: 0.84 }
        }),
    ];
}

/**
 * Returns all variant sets grouped by product
 */
export function createFullVariantFixture(): ProductVariant[] {
    return [
        ...createFramedPosterVariantSet(),
        ...createCanvasVariantSet(),
    ];
}

// ============================================================
// Test Helpers
// ============================================================

/**
 * Parses mockup_print_area whether it's an object or JSON string
 */
export function getPrintAreaAsObject(variant: ProductVariant): { x: number; y: number; width: number; height: number } | null {
    const area = variant.mockup_print_area;
    if (!area) return null;
    if (typeof area === 'string') {
        try {
            return JSON.parse(area);
        } catch {
            return null;
        }
    }
    return area as { x: number; y: number; width: number; height: number };
}

/**
 * Determines if print area is portrait (height > width)
 */
export function isPrintAreaPortrait(variant: ProductVariant): boolean {
    const area = getPrintAreaAsObject(variant);
    if (!area) return false;
    return area.height > area.width;
}

/**
 * Determines if print area is landscape (width > height)
 */
export function isPrintAreaLandscape(variant: ProductVariant): boolean {
    const area = getPrintAreaAsObject(variant);
    if (!area) return false;
    return area.width > area.height;
}

/**
 * Determines if print area is square (within 5% tolerance)
 */
export function isPrintAreaSquare(variant: ProductVariant, tolerance: number = 0.05): boolean {
    const area = getPrintAreaAsObject(variant);
    if (!area) return false;
    const diff = Math.abs(area.width - area.height) / Math.max(area.width, area.height);
    return diff < tolerance;
}
