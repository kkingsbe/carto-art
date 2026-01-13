
import type { Meta, StoryObj } from '@storybook/react';
import { VariantCard, VariantCardSkeleton } from './VariantCard';

const meta: Meta<typeof VariantCard> = {
    title: 'Ecommerce/VariantCard',
    component: VariantCard,
    parameters: {
        layout: 'centered',
    },
    tags: ['autodocs'],
    decorators: [
        (Story) => (
            <div style={{ width: '200px' }}>
                <Story />
            </div>
        ),
    ],
};

export default meta;
type Story = StoryObj<typeof VariantCard>;

const mockVariant = {
    id: 1,
    name: '12x18 in / 30x45 cm',
    price_cents: 2900,
    display_price_cents: 3500,
    image_url: 'https://images.unsplash.com/photo-1544376798-89aa6b82c6cd?q=80&w=300',
    generatedPreviewUrl: null,
};

export const Default: Story = {
    args: {
        variant: mockVariant,
        isSelected: false,
        onClick: () => console.log('clicked'),
    },
};

export const Selected: Story = {
    args: {
        variant: mockVariant,
        isSelected: true,
        onClick: () => console.log('clicked'),
    },
};

export const WithGeneratedPreview: Story = {
    args: {
        variant: {
            ...mockVariant,
            generatedPreviewUrl: 'https://images.unsplash.com/photo-1577083552431-6e5fd01988ec?q=80&w=300',
        },
        isSelected: false,
        onClick: () => console.log('clicked'),
    },
};

export const LoadingState: Story = {
    args: {
        variant: mockVariant,
        isSelected: false,
        isLoading: true,
        onClick: () => console.log('clicked'),
    },
    parameters: {
        docs: {
            description: {
                story: 'Shows a loader over the image while variant data or image is being prepared.'
            }
        }
    }
};

export const Skeleton = () => <VariantCardSkeleton />;
