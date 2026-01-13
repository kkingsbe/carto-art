
import type { Meta, StoryObj } from '@storybook/react';
import { FrameMockupRenderer } from './FrameMockupRenderer';

const meta: Meta<typeof FrameMockupRenderer> = {
    title: 'Ecommerce/FrameMockupRenderer',
    component: FrameMockupRenderer,
    parameters: {
        layout: 'centered',
    },
    tags: ['autodocs'],
    decorators: [
        (Story) => (
            <div className="w-[500px] h-[500px] bg-gray-100 dark:bg-gray-800 flex items-center justify-center p-8 rounded-xl">
                <Story />
            </div>
        ),
    ],
};

export default meta;
type Story = StoryObj<typeof FrameMockupRenderer>;

export const Default: Story = {
    args: {
        // A placeholder frame image
        templateUrl: 'https://images.unsplash.com/photo-1544376798-89aa6b82c6cd?q=80&w=600&auto=format&fit=crop',
        // A placeholder map image
        designUrl: 'https://images.unsplash.com/photo-1577083552431-6e5fd01988ec?q=80&w=600&auto=format&fit=crop',
        // Mock print area (centered 60% of frame)
        printArea: { x: 0.2, y: 0.2, width: 0.6, height: 0.6 },
        className: 'w-full h-full shadow-lg',
        alt: 'Mockup Render',
    },
};

export const NoTemplate: Story = {
    args: {
        templateUrl: null,
        designUrl: 'https://images.unsplash.com/photo-1577083552431-6e5fd01988ec?q=80&w=600&auto=format&fit=crop',
        printArea: null,
        className: 'w-full h-full max-w-sm mx-auto shadow-xl rounded-lg overflow-hidden',
        alt: 'Raw Design',
    },
};
