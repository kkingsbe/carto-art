
import type { Meta, StoryObj } from '@storybook/react';
import { ProductPreviewGrid } from './ProductPreviewGrid';

const meta: Meta<typeof ProductPreviewGrid> = {
    title: 'Ecommerce/ProductPreviewGrid',
    component: ProductPreviewGrid,
    parameters: {
        layout: 'padded',
    },
    tags: ['autodocs'],
    decorators: [
        (Story) => (
            <div className="max-w-4xl mx-auto">
                <Story />
            </div>
        ),
    ],
};

export default meta;
type Story = StoryObj<typeof ProductPreviewGrid>;

const mockVariants: any[] = [
    {
        id: 1,
        name: '8x10 in / 20x25 cm',
        price_cents: 1900,
        display_price_cents: 2500,
        mockup_template_url: 'https://images.unsplash.com/photo-1544376798-89aa6b82c6cd?q=80&w=300&auto=format&fit=crop',
        mockup_print_area: JSON.stringify({ x: 0.1, y: 0.1, width: 0.8, height: 0.8 }),
        image_url: 'https://images.unsplash.com/photo-1544376798-89aa6b82c6cd?q=80&w=300&auto=format&fit=crop',
    },
    {
        id: 2,
        name: '12x18 in / 30x45 cm',
        price_cents: 2900,
        display_price_cents: 3500,
        mockup_template_url: 'https://images.unsplash.com/photo-1544376798-89aa6b82c6cd?q=80&w=300&auto=format&fit=crop',
        mockup_print_area: JSON.stringify({ x: 0.15, y: 0.15, width: 0.7, height: 0.7 }),
        image_url: 'https://images.unsplash.com/photo-1544376798-89aa6b82c6cd?q=80&w=300&auto=format&fit=crop',
    },
    {
        id: 3,
        name: '18x24 in / 45x60 cm',
        price_cents: 3900,
        display_price_cents: 4500,
        mockup_template_url: 'https://images.unsplash.com/photo-1544376798-89aa6b82c6cd?q=80&w=300&auto=format&fit=crop',
        mockup_print_area: JSON.stringify({ x: 0.1, y: 0.1, width: 0.8, height: 0.8 }),
        image_url: 'https://images.unsplash.com/photo-1544376798-89aa6b82c6cd?q=80&w=300&auto=format&fit=crop',
    }
];

export const Default: Story = {
    args: {
        variants: mockVariants,
        // Use a valid image so local preview generation might work if CORS allows, otherwise it will just log error and show fallback
        designUrl: 'https://images.unsplash.com/photo-1577083552431-6e5fd01988ec?q=80&w=600&auto=format&fit=crop',
        selectedVariantId: 2,
        onSelectVariant: (v: any) => console.log('Selected variant:', v.id),
        isLoading: false,
    },
};

export const Loading: Story = {
    args: {
        variants: [], // Skeleton loading usually happens when no variants are present or explicit loading flag
        designUrl: 'https://images.unsplash.com/photo-1577083552431-6e5fd01988ec?q=80&w=600',
        selectedVariantId: null,
        onSelectVariant: () => { },
        isLoading: true,
    },
};
