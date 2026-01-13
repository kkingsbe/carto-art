
import type { Meta, StoryObj } from '@storybook/react';
import { ProductCard } from './ProductCard';
import { ProductGroup } from '@/lib/utils/store';

const meta: Meta<typeof ProductCard> = {
    title: 'Store/ProductCard',
    component: ProductCard,
    parameters: {
        layout: 'centered',
        nextjs: {
            appDirectory: true,
        },
        backgrounds: {
            default: 'light',
            values: [
                { name: 'light', value: '#f8fafc' },
                { name: 'dark', value: '#0f172a' },
                { name: 'warm', value: '#fef7ed' },
            ],
        },
    },
    tags: ['autodocs'],
    argTypes: {
        featured: {
            control: 'boolean',
            description: 'Show featured badge on the card',
        },
        designUrl: {
            control: 'text',
            description: 'URL to the design image (for mockup rendering)',
        },
    },
    decorators: [
        (Story) => (
            <div style={{ width: '340px', padding: '24px' }}>
                <Story />
            </div>
        ),
    ],
};

export default meta;
type Story = StoryObj<typeof ProductCard>;

// Mock variant matching the ProductVariant type
const mockVariant: any = {
    id: 1,
    product_id: 1,
    name: '12x18 in',
    price_cents: 2900,
    display_price_cents: 2900,
    is_active: true,
    display_order: 1,
    mockup_template_url: 'https://files.cdn.printful.com/o/products/172/product_1614596957.jpg',
    mockup_print_area: JSON.stringify({ x: 0.15, y: 0.1, width: 0.7, height: 0.75 }),
    image_url: 'https://files.cdn.printful.com/o/products/172/product_1614596957.jpg',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    printful_variant_id: 123,
    printful_file_id: 456
};

const premiumVariant: any = {
    ...mockVariant,
    id: 2,
    name: '24x36 in',
    price_cents: 7900,
    display_price_cents: 7900,
};

const mockProduct: ProductGroup = {
    id: 1,
    title: 'Tokyo Street Map',
    description: 'A detailed minimalist map of Tokyo streets, perfect for modern interiors and urban design enthusiasts.',
    features: ['Museum-quality paper', 'Giclée printing quality', 'Fade-resistant inks'],
    minPrice: 2900,
    startingPrice: 2900,
    variants: [mockVariant, premiumVariant],
    thumbnailVariant: mockVariant,
};

const canvasProduct: ProductGroup = {
    id: 2,
    title: 'Paris Canvas Print',
    description: 'Premium gallery-wrapped canvas featuring the City of Lights with rich, vibrant colors.',
    features: ['Gallery wrapped', '1.5" thick frame', 'Ready to hang'],
    minPrice: 4900,
    startingPrice: 4900,
    variants: [{ ...mockVariant, id: 3, price_cents: 4900, display_price_cents: 4900 }],
    thumbnailVariant: { ...mockVariant, id: 3, price_cents: 4900, display_price_cents: 4900 },
};

const metalProduct: ProductGroup = {
    id: 3,
    title: 'New York Metal Print',
    description: 'Stunning HD metal print with a modern, industrial aesthetic and exceptional durability.',
    features: ['Aluminum composite', 'UV resistant', 'Float mount included'],
    minPrice: 8900,
    startingPrice: 8900,
    variants: [{ ...mockVariant, id: 4, price_cents: 8900, display_price_cents: 8900 }],
    thumbnailVariant: { ...mockVariant, id: 4, price_cents: 8900, display_price_cents: 8900 },
};

/**
 * The default product card showing a framed map poster
 */
export const Default: Story = {
    args: {
        product: mockProduct,
    },
};

/**
 * A featured product with the special badge
 */
export const Featured: Story = {
    args: {
        product: mockProduct,
        featured: true,
    },
};

/**
 * Product card with a custom design overlay using the mockup renderer
 */
export const WithDesignMockup: Story = {
    args: {
        product: mockProduct,
        designUrl: 'https://images.unsplash.com/photo-1577083552431-6e5fd01988ec?q=80&w=600&auto=format&fit=crop',
    },
};

/**
 * Featured product with custom design
 */
export const FeaturedWithDesign: Story = {
    args: {
        product: mockProduct,
        featured: true,
        designUrl: 'https://images.unsplash.com/photo-1577083552431-6e5fd01988ec?q=80&w=600&auto=format&fit=crop',
    },
};

/**
 * Higher priced premium product (canvas)
 */
export const PremiumCanvas: Story = {
    args: {
        product: canvasProduct,
    },
};

/**
 * Luxury metal print product
 */
export const LuxuryMetal: Story = {
    args: {
        product: metalProduct,
        featured: true,
    },
};

/**
 * Product with long description to test truncation
 */
export const LongDescription: Story = {
    args: {
        product: {
            ...mockProduct,
            title: 'Handcrafted Artisan Map Print',
            description: 'Experience the beauty of cartographic art with this meticulously designed street map poster. Each line and curve has been carefully crafted to create a stunning visual representation of urban architecture and city planning. Perfect for home offices, living rooms, and gift giving.',
        },
    },
};

/**
 * Product with very short description
 */
export const ShortDescription: Story = {
    args: {
        product: {
            ...mockProduct,
            title: 'Berlin Map',
            description: 'Minimalist city map print.',
        },
    },
};

/**
 * Grid of multiple cards to see how they look together
 */
export const ProductGrid: Story = {
    decorators: [
        (Story) => (
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 300px)',
                gap: '24px',
                padding: '32px',
                backgroundColor: '#f8fafc',
            }}>
                <ProductCard product={mockProduct} featured />
                <ProductCard product={canvasProduct} />
                <ProductCard product={metalProduct} />
            </div>
        ),
    ],
    render: () => <></>,
};

/**
 * Dark theme variant (use dark background)
 */
export const DarkTheme: Story = {
    parameters: {
        backgrounds: { default: 'dark' },
    },
    decorators: [
        (Story) => (
            <div className="dark" style={{ width: '340px', padding: '24px' }}>
                <Story />
            </div>
        ),
    ],
    args: {
        product: mockProduct,
        featured: true,
    },
};

/**
 * Loading state before image loads
 */
export const Loading: Story = {
    args: {
        product: {
            ...mockProduct,
            thumbnailVariant: {
                ...mockVariant,
                image_url: '', // Empty URL triggers loading state
            }
        },
    },
};
