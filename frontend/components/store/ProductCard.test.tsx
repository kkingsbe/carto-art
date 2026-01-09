/**
 * ProductCard Component Tests
 * 
 * Tests the product card rendering and variant selection logic.
 * Uses Jest + React Testing Library.
 * 
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { ProductCard } from './ProductCard';
import {
    createMockProductGroup,
    createPortraitVariant,
    createLandscapeVariant,
    createSquareVariant,
    createVariantWithoutMockup,
} from '@/__tests__/mocks/store.mock';

// Mock next/navigation
const mockSearchParams = new URLSearchParams();
jest.mock('next/navigation', () => ({
    useSearchParams: () => mockSearchParams,
}));

// Mock FrameMockupRenderer to avoid canvas complexity
jest.mock('@/components/ecommerce/FrameMockupRenderer', () => ({
    FrameMockupRenderer: ({ alt }: { alt: string }) => (
        <div data-testid="frame-mockup-renderer">{alt}</div>
    ),
}));

// ============================================================
// Test Setup
// ============================================================

describe('ProductCard', () => {
    beforeEach(() => {
        // Reset search params before each test
        mockSearchParams.delete('image');
        mockSearchParams.delete('aspect');
        mockSearchParams.delete('orientation');
    });

    // ============================================================
    // Basic Rendering Tests
    // ============================================================

    describe('Basic Rendering', () => {
        it('renders product title', () => {
            const variants = [createPortraitVariant()];
            const product = createMockProductGroup(variants, { title: 'Framed Poster' });

            render(<ProductCard product={product} />);

            expect(screen.getByText('Framed Poster')).toBeInTheDocument();
        });

        it('renders product description', () => {
            const variants = [createPortraitVariant()];
            const product = createMockProductGroup(variants, {
                description: 'Museum-quality matte paper'
            });

            render(<ProductCard product={product} />);

            expect(screen.getByText('Museum-quality matte paper')).toBeInTheDocument();
        });

        it('renders minimum price', () => {
            const variants = [
                createPortraitVariant({ display_price_cents: 4500 }),
                createLandscapeVariant({ display_price_cents: 6000 }),
            ];
            const product = createMockProductGroup(variants);

            render(<ProductCard product={product} />);

            // Price should show $45 (minPrice / 100, rounded up)
            expect(screen.getByText(/from \$45/)).toBeInTheDocument();
        });
    });

    // ============================================================
    // Link Construction Tests
    // ============================================================

    describe('Link Construction', () => {
        it('links to correct product detail page', () => {
            const variants = [createPortraitVariant({ product_id: 42 })];
            const product = createMockProductGroup(variants, { id: 42 });

            render(<ProductCard product={product} />);

            const link = screen.getByRole('link');
            expect(link).toHaveAttribute('href', expect.stringContaining('/store/42'));
        });

        it('preserves image param in link', () => {
            mockSearchParams.set('image', 'https://example.com/design.png');

            const variants = [createPortraitVariant({ product_id: 1 })];
            const product = createMockProductGroup(variants, { id: 1 });

            render(<ProductCard product={product} />);

            const link = screen.getByRole('link');
            expect(link).toHaveAttribute('href', expect.stringContaining('image='));
        });

        it('preserves aspect and orientation params in link', () => {
            mockSearchParams.set('aspect', '2:3');
            mockSearchParams.set('orientation', 'portrait');

            const variants = [createPortraitVariant({ product_id: 1 })];
            const product = createMockProductGroup(variants, { id: 1 });

            render(<ProductCard product={product} />);

            const link = screen.getByRole('link');
            const href = link.getAttribute('href') || '';
            expect(href).toContain('aspect=2%3A3');
            expect(href).toContain('orientation=portrait');
        });
    });

    // ============================================================
    // Variant Selection Tests
    // ============================================================

    describe('Variant Selection', () => {
        it('uses thumbnailVariant when no params present', () => {
            const portraitVariant = createPortraitVariant({ display_order: 0 });
            const landscapeVariant = createLandscapeVariant({ display_order: 1 });

            const product = createMockProductGroup([portraitVariant, landscapeVariant]);
            // thumbnailVariant will be the first with mockup (portrait)

            render(<ProductCard product={product} designUrl="https://example.com/design.png" />);

            // Should render the FrameMockupRenderer with the thumbnail variant
            expect(screen.getByTestId('frame-mockup-renderer')).toBeInTheDocument();
        });

        it('selects matching variant when aspect + orientation params present', () => {
            mockSearchParams.set('aspect', '3:2');
            mockSearchParams.set('orientation', 'landscape');

            const portraitVariant = createPortraitVariant({ display_order: 0 });
            const landscapeVariant = createLandscapeVariant({ display_order: 1 });

            const product = createMockProductGroup([portraitVariant, landscapeVariant]);

            render(<ProductCard product={product} designUrl="https://example.com/design.png" />);

            // Should render FrameMockupRenderer (variant selection happens internally)
            expect(screen.getByTestId('frame-mockup-renderer')).toBeInTheDocument();
        });
    });

    // ============================================================
    // Fallback Behavior Tests
    // ============================================================

    describe('Fallback Behavior', () => {
        it('shows placeholder image when no designUrl', () => {
            const variants = [createVariantWithoutMockup()];
            const product = createMockProductGroup(variants);

            render(<ProductCard product={product} />);

            // Should show regular img tag with placeholder or variant image
            const img = screen.getByRole('img');
            expect(img).toBeInTheDocument();
        });

        it('shows variant image when no mockup template', () => {
            const variantWithoutMockup = createVariantWithoutMockup({
                image_url: 'https://example.com/variant.png'
            });
            const product = createMockProductGroup([variantWithoutMockup]);

            render(<ProductCard product={product} designUrl="https://example.com/design.png" />);

            // Without mockup_template_url, should fall back to regular img
            const img = screen.getByRole('img');
            expect(img).toHaveAttribute('src', 'https://example.com/variant.png');
        });
    });
});
