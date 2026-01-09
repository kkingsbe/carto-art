/**
 * Unit Tests for Store Utility Functions
 * 
 * Tests the pure functions in lib/utils/store.ts
 */

import {
    parseVariantDimensions,
    parseAspectRatio,
    variantMatchesAspectRatio,
    variantMatchesOrientationStrict,
    groupVariantsByProduct,
} from './store';

import {
    createMockVariant,
    createPortraitVariant,
    createLandscapeVariant,
    createSquareVariant,
    createVariantWithStringPrintArea,
    createVariantWithoutMockup,
    createFramedPosterVariantSet,
    createCanvasVariantSet,
} from '@/__tests__/mocks/store.mock';

// ============================================================
// parseVariantDimensions Tests
// ============================================================

describe('parseVariantDimensions', () => {
    it('parses simple dimension format "12x18"', () => {
        const result = parseVariantDimensions('12x18 Framed Poster');
        expect(result).toEqual({ width: 12, height: 18 });
    });

    it('parses dimension format with spaces "12 x 18"', () => {
        const result = parseVariantDimensions('12 x 18 Poster');
        expect(result).toEqual({ width: 12, height: 18 });
    });

    it('parses dimension format with units "12 in x 18 in"', () => {
        const result = parseVariantDimensions('12 in x 18 in Canvas');
        expect(result).toEqual({ width: 12, height: 18 });
    });

    it('parses decimal dimensions "8.5 x 11"', () => {
        const result = parseVariantDimensions('8.5 x 11 Letter Size');
        expect(result).toEqual({ width: 8.5, height: 11 });
    });

    it('parses unicode multiplication sign "12×18"', () => {
        const result = parseVariantDimensions('12×18 Enhanced Matte');
        expect(result).toEqual({ width: 12, height: 18 });
    });

    it('parses dimension with inch symbols "12″×16″"', () => {
        const result = parseVariantDimensions('12″×16″ Framed Poster');
        expect(result).toEqual({ width: 12, height: 16 });
    });

    it('returns null for invalid/missing dimensions', () => {
        expect(parseVariantDimensions('Large Poster')).toBeNull();
        expect(parseVariantDimensions('Extra Large')).toBeNull();
        expect(parseVariantDimensions('')).toBeNull();
    });

    it('handles variant name prefix before dimensions', () => {
        const result = parseVariantDimensions('Canvas (in) (12″×36″)');
        expect(result).toEqual({ width: 12, height: 36 });
    });
});

// ============================================================
// parseAspectRatio Tests
// ============================================================

describe('parseAspectRatio', () => {
    it('parses portrait 2:3 ratio correctly', () => {
        const result = parseAspectRatio('2:3', 'portrait');
        expect(result).toBeCloseTo(2 / 3, 5);
    });

    it('parses landscape 2:3 ratio correctly (inverted)', () => {
        const result = parseAspectRatio('2:3', 'landscape');
        expect(result).toBeCloseTo(3 / 2, 5);
    });

    it('parses 3:4 ratio (common photo size)', () => {
        const result = parseAspectRatio('3:4', 'portrait');
        expect(result).toBeCloseTo(0.75, 5);
    });

    it('parses ISO paper ratio correctly', () => {
        const isoRatio = 1 / Math.sqrt(2); // ~0.707
        const result = parseAspectRatio('ISO', 'portrait');
        expect(result).toBeCloseTo(isoRatio, 3);
    });

    it('handles ISO landscape orientation', () => {
        const isoRatioLandscape = Math.sqrt(2); // ~1.414
        const result = parseAspectRatio('ISO', 'landscape');
        expect(result).toBeCloseTo(isoRatioLandscape, 3);
    });

    it('returns 1 for invalid ratio string', () => {
        expect(parseAspectRatio('invalid', 'portrait')).toBe(1);
        expect(parseAspectRatio('', 'portrait')).toBe(1);
        expect(parseAspectRatio(':', 'portrait')).toBe(1);
    });
});

// ============================================================
// variantMatchesAspectRatio Tests
// ============================================================

describe('variantMatchesAspectRatio', () => {
    it('matches variant with exact aspect ratio', () => {
        const variant = { name: '12x18 Poster' }; // 12/18 = 0.667
        const targetRatio = 12 / 18; // 0.667
        expect(variantMatchesAspectRatio(variant, targetRatio)).toBe(true);
    });

    it('matches variant with similar aspect ratio within tolerance', () => {
        const variant = { name: '12x18 Poster' }; // 0.667
        const targetRatio = 0.66; // Close enough
        expect(variantMatchesAspectRatio(variant, targetRatio, 0.05)).toBe(true);
    });

    it('matches rotated variant (18x12 matches 2:3 when rotated)', () => {
        const variant = { name: '18x12 Poster' }; // width > height
        const targetRatio = 12 / 18; // Portrait 2:3
        expect(variantMatchesAspectRatio(variant, targetRatio)).toBe(true);
    });

    it('rejects variant outside tolerance', () => {
        const variant = { name: '12x18 Poster' }; // 0.667
        const targetRatio = 1.0; // Square - very different
        expect(variantMatchesAspectRatio(variant, targetRatio)).toBe(false);
    });

    it('returns false for variants without parseable dimensions', () => {
        const variant = { name: 'Large Poster' };
        expect(variantMatchesAspectRatio(variant, 0.667)).toBe(false);
    });
});

// ============================================================
// variantMatchesOrientationStrict Tests
// ============================================================

describe('variantMatchesOrientationStrict', () => {
    it('matches portrait print area with portrait design', () => {
        const variant = createPortraitVariant();
        expect(variantMatchesOrientationStrict(variant, true)).toBe(true);
    });

    it('rejects portrait print area with landscape design', () => {
        const variant = createPortraitVariant();
        expect(variantMatchesOrientationStrict(variant, false)).toBe(false);
    });

    it('matches landscape print area with landscape design', () => {
        const variant = createLandscapeVariant();
        expect(variantMatchesOrientationStrict(variant, false)).toBe(true);
    });

    it('rejects landscape print area with portrait design', () => {
        const variant = createLandscapeVariant();
        expect(variantMatchesOrientationStrict(variant, true)).toBe(false);
    });

    it('square print area matches both orientations', () => {
        const variant = createSquareVariant();
        expect(variantMatchesOrientationStrict(variant, true)).toBe(true);
        expect(variantMatchesOrientationStrict(variant, false)).toBe(true);
    });

    it('parses print area from JSON string', () => {
        const variant = createVariantWithStringPrintArea();
        // Default print area is portrait-ish (height: 0.84 > width: 0.76)
        expect(variantMatchesOrientationStrict(variant, true)).toBe(true);
    });

    it('returns false when print area is missing', () => {
        const variant = createVariantWithoutMockup();
        expect(variantMatchesOrientationStrict(variant, true)).toBe(false);
        expect(variantMatchesOrientationStrict(variant, false)).toBe(false);
    });

    it('returns false for invalid JSON string', () => {
        const variant = createMockVariant({
            mockup_print_area: 'not valid json' as any,
        });
        expect(variantMatchesOrientationStrict(variant, true)).toBe(false);
    });
});

// ============================================================
// groupVariantsByProduct Tests
// ============================================================

describe('groupVariantsByProduct', () => {
    it('groups variants by product_id', () => {
        const framedPosters = createFramedPosterVariantSet(); // product_id: 1
        const canvas = createCanvasVariantSet(); // product_id: 2
        const allVariants = [...framedPosters, ...canvas];

        const groups = groupVariantsByProduct(allVariants);

        expect(groups).toHaveLength(2);
        expect(groups.find(g => g.id === 1)?.variants).toHaveLength(framedPosters.length);
        expect(groups.find(g => g.id === 2)?.variants).toHaveLength(canvas.length);
    });

    it('calculates correct min price', () => {
        const variants = [
            createMockVariant({ id: 1, product_id: 1, display_price_cents: 6000 }),
            createMockVariant({ id: 2, product_id: 1, display_price_cents: 4500 }),
            createMockVariant({ id: 3, product_id: 1, display_price_cents: 8000 }),
        ];

        const groups = groupVariantsByProduct(variants);

        expect(groups[0].minPrice).toBe(4500);
    });

    it('selects thumbnail variant with mockup_template_url', () => {
        // Note: groupVariantsByProduct sorts by display_order first, then finds first with mockup
        const variants = [
            createVariantWithoutMockup({ id: 1, product_id: 1, display_order: 0 }),
            createMockVariant({ id: 2, product_id: 1, display_order: 1 }), // First with mockup after sort
            createVariantWithoutMockup({ id: 3, product_id: 1, display_order: 2 }),
        ];

        const groups = groupVariantsByProduct(variants);

        // After sorting, variant 2 is at index 1, but it's the first one with a mockup_template_url
        expect(groups[0].thumbnailVariant.mockup_template_url).not.toBeNull();
        expect(groups[0].thumbnailVariant.id).toBe(2);
    });

    it('falls back to first variant if none have mockup', () => {
        const variants = [
            createVariantWithoutMockup({ id: 1, product_id: 1, display_order: 0 }),
            createVariantWithoutMockup({ id: 2, product_id: 1, display_order: 1 }),
        ];

        const groups = groupVariantsByProduct(variants);

        expect(groups[0].thumbnailVariant.id).toBe(1);
    });

    it('infers "Framed Poster" title from variant name', () => {
        const variants = [
            createMockVariant({
                id: 1,
                product_id: 1,
                name: '12×18 Enhanced Matte Paper Framed Poster (in Black Frame)'
            }),
        ];

        const groups = groupVariantsByProduct(variants);

        expect(groups[0].title).toBe('Framed Poster');
    });

    it('infers "Canvas Print" title from variant name', () => {
        const variants = [
            createMockVariant({
                id: 1,
                product_id: 1,
                name: '10×10 Canvas Print'
            }),
        ];

        const groups = groupVariantsByProduct(variants);

        expect(groups[0].title).toBe('Canvas Print');
    });

    it('excludes inactive variants', () => {
        const variants = [
            createMockVariant({ id: 1, product_id: 1, is_active: true }),
            createMockVariant({ id: 2, product_id: 1, is_active: false }),
            createMockVariant({ id: 3, product_id: 1, is_active: true }),
        ];

        const groups = groupVariantsByProduct(variants);

        expect(groups[0].variants).toHaveLength(2);
        expect(groups[0].variants.map(v => v.id)).toEqual([1, 3]);
    });

    it('sorts variants by display_order', () => {
        const variants = [
            createMockVariant({ id: 1, product_id: 1, display_order: 2 }),
            createMockVariant({ id: 2, product_id: 1, display_order: 0 }),
            createMockVariant({ id: 3, product_id: 1, display_order: 1 }),
        ];

        const groups = groupVariantsByProduct(variants);

        expect(groups[0].variants.map(v => v.id)).toEqual([2, 3, 1]);
    });

    it('returns empty array for empty input', () => {
        const groups = groupVariantsByProduct([]);
        expect(groups).toEqual([]);
    });
});
