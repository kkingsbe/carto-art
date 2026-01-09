/**
 * Integration Tests for Store Mockup Flow
 * 
 * Tests the end-to-end data flow from API → Utilities → Components
 */

// Mock Supabase before imports
jest.mock('@/lib/supabase/server', () => ({
    createClient: jest.fn()
}));

jest.mock('./usage', () => ({
    getSiteConfig: jest.fn().mockResolvedValue(35), // 35% margin
}));

import { createClient } from '@/lib/supabase/server';
import { getMarginAdjustedVariants } from './ecommerce';
import {
    groupVariantsByProduct,
    parseAspectRatio,
    variantMatchesAspectRatio,
    variantMatchesOrientationStrict
} from '@/lib/utils/store';
import {
    createMockVariant,
    createPortraitVariant,
    createLandscapeVariant,
    createSquareVariant,
    createExtremeAspectVariant,
    createFullVariantFixture,
} from '@/__tests__/mocks/store.mock';

// ============================================================
// Test Setup
// ============================================================

describe('Store Mockup Flow Integration', () => {
    let mockSupabase: any;

    beforeEach(() => {
        jest.clearAllMocks();

        mockSupabase = {
            from: jest.fn().mockReturnValue({
                select: jest.fn().mockReturnThis(),
                eq: jest.fn().mockReturnThis(),
                order: jest.fn().mockReturnThis(),
                then: jest.fn((resolve) => resolve({
                    data: createFullVariantFixture(),
                    error: null
                })),
            }),
        };

        (createClient as jest.Mock).mockResolvedValue(mockSupabase);
    });

    // ============================================================
    // API → Utility Chain Tests
    // ============================================================

    describe('getMarginAdjustedVariants → groupVariantsByProduct', () => {
        it('returns variants with display_price_cents calculated', async () => {
            const variants = await getMarginAdjustedVariants();

            expect(variants.length).toBeGreaterThan(0);
            variants.forEach(v => {
                expect(v.display_price_cents).toBeDefined();
                expect(v.display_price_cents).toBeGreaterThan(v.price_cents);
            });
        });

        it('variants have required mockup fields', async () => {
            const variants = await getMarginAdjustedVariants();
            const variantsWithMockup = variants.filter(v => v.mockup_template_url);

            expect(variantsWithMockup.length).toBeGreaterThan(0);
            variantsWithMockup.forEach(v => {
                expect(v.mockup_template_url).toBeTruthy();
                expect(v.mockup_print_area).toBeTruthy();
            });
        });

        it('groupVariantsByProduct correctly processes API data', async () => {
            const variants = await getMarginAdjustedVariants();
            const groups = groupVariantsByProduct(variants);

            expect(groups.length).toBeGreaterThan(0);
            groups.forEach(group => {
                expect(group.id).toBeDefined();
                expect(group.title).toBeDefined();
                expect(group.minPrice).toBeGreaterThan(0);
                expect(group.variants.length).toBeGreaterThan(0);
                expect(group.thumbnailVariant).toBeDefined();
            });
        });
    });

    // ============================================================
    // Aspect Ratio Matching E2E Tests
    // ============================================================

    describe('Aspect Ratio Matching Flow', () => {
        it('portrait design matches portrait variant', () => {
            const variants = [
                createPortraitVariant(),
                createLandscapeVariant(),
                createSquareVariant(),
            ];

            const designAspect = parseAspectRatio('2:3', 'portrait'); // Portrait design
            const isPortrait = true;

            const matchingVariant = variants.find(v =>
                v.mockup_template_url &&
                variantMatchesOrientationStrict(v, isPortrait) &&
                variantMatchesAspectRatio(v, designAspect)
            );

            expect(matchingVariant).toBeDefined();
            expect(matchingVariant!.name).toContain('12×18'); // Portrait variant
        });

        it('landscape design matches landscape variant', () => {
            const variants = [
                createPortraitVariant(),
                createLandscapeVariant(),
                createSquareVariant(),
            ];

            const designAspect = parseAspectRatio('3:2', 'landscape'); // Landscape design
            const isPortrait = false;

            const matchingVariant = variants.find(v =>
                v.mockup_template_url &&
                variantMatchesOrientationStrict(v, isPortrait) &&
                variantMatchesAspectRatio(v, designAspect)
            );

            expect(matchingVariant).toBeDefined();
            expect(matchingVariant!.name).toContain('18×12'); // Landscape variant
        });

        it('square design (1:1) matches square variant', () => {
            const variants = [
                createPortraitVariant(),
                createLandscapeVariant(),
                createSquareVariant(),
            ];

            const designAspect = parseAspectRatio('1:1', 'portrait');

            // For square, both orientations should match
            const matchingVariant = variants.find(v =>
                v.mockup_template_url &&
                variantMatchesAspectRatio(v, designAspect)
            );

            expect(matchingVariant).toBeDefined();
            expect(matchingVariant!.name).toContain('10×10'); // Square variant
        });

        it('extreme aspect ratio (12x36) selects appropriate variant', () => {
            const variants = [
                createPortraitVariant(),
                createLandscapeVariant(),
                createExtremeAspectVariant(), // 12x36 = 1:3 ratio
            ];

            // 12x36 is 1:3 ratio, very tall portrait
            const designAspect = 12 / 36; // 0.333...
            const isPortrait = true;

            const matchingVariant = variants.find(v =>
                v.mockup_template_url &&
                variantMatchesOrientationStrict(v, isPortrait) &&
                variantMatchesAspectRatio(v, designAspect, 0.1) // Wider tolerance for extreme ratios
            );

            expect(matchingVariant).toBeDefined();
            expect(matchingVariant!.name).toContain('12×36');
        });
    });

    // ============================================================
    // Edge Case Tests
    // ============================================================

    describe('Edge Cases', () => {
        it('handles variants with print_area as JSON string', () => {
            const variant = createMockVariant({
                mockup_print_area: JSON.stringify({ x: 0.1, y: 0.1, width: 0.7, height: 0.9 })
            });

            const isPortrait = true;
            expect(variantMatchesOrientationStrict(variant, isPortrait)).toBe(true);
        });

        it('handles empty variants array gracefully', () => {
            const groups = groupVariantsByProduct([]);
            expect(groups).toEqual([]);
        });

        it('handles variants with missing mockup data', () => {
            const variants = [
                createMockVariant({
                    id: 1,
                    mockup_template_url: null,
                    mockup_print_area: null
                }),
            ];

            const groups = groupVariantsByProduct(variants);

            expect(groups.length).toBe(1);
            expect(groups[0].thumbnailVariant.mockup_template_url).toBeNull();
        });
    });
});
