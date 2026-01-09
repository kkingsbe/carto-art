
import { findBestMatchingVariant, ProductVariant } from './store';
import { createMockVariant } from '@/__tests__/mocks/store.mock';

describe('findBestMatchingVariant - Reproduction', () => {

    // Scenario: Best match has NO mockup, but poor match HAS mockup.
    // Current behavior (before fix): Picks poor match (filtered out no-mockup variants).
    // Desired behavior: Pick best match (18x24) even if no mockup?
    it('selects variant with best aspect ratio even if mockup is missing', () => {
        const variants = [
            // Square with mockup
            createMockVariant({
                id: 1,
                name: '12x12 Canvas',
                mockup_template_url: 'http://example.com/square.jpg',
                mockup_print_area: JSON.stringify({ width: 12, height: 12 })
            }),
            // Portrait with NO mockup
            createMockVariant({
                id: 2,
                name: '18x24 Canvas',
                mockup_template_url: null, // Missing mockup
                mockup_print_area: JSON.stringify({ width: 18, height: 24 })
            })
        ];

        const targetRatio = 2 / 3; // 0.666

        const result = findBestMatchingVariant(variants, targetRatio, 'portrait');

        // This confirms if we are correctly prioritizing ratio over mockup existence
        expect(result?.variant.name).toBe('18x24 Canvas');
    });

    // Scenario: User has Landscape Design (3:2)
    // Product has:
    // 1. 12x12 (Square) [Matches everything]
    // 2. 18x24 (Strict Portrait) [Strict Mismatch]
    // Desired: Pick 18x24 IF we can rotate? Or Pick Square?
    // Strict logic says: Pick Square because 18x24 requires rotation and we don't know if mockup supports it.
    // BUT if the user wants 18x24, they might accept rotation.
    // However, for now, let's just assert current behavior or desired behavior if we know it.
    // Let's Skip this for now or assume current logic is Strict.
});
