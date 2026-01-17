import type { Meta, StoryObj } from '@storybook/react';
import { Carousel } from './Carousel';

const meta = {
    title: 'Components/UI/Carousel',
    component: Carousel,
    parameters: {
        layout: 'centered',
    },
    tags: ['autodocs'],
    argTypes: {
        aspectRatio: {
            control: 'select',
            options: ['video', 'square', 'wide'],
        },
        fit: {
            control: 'select',
            options: ['cover', 'contain'],
        },
    },
} satisfies Meta<typeof Carousel>;

export default meta;
type Story = StoryObj<typeof meta>;

const sampleImages = [
    'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=80&w=2070&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=2070&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=2070&auto=format&fit=crop'
];

export const Default: Story = {
    args: {
        images: sampleImages,
    },
    render: (args) => (
        <div style={{ width: '800px' }}>
            <Carousel {...args} />
        </div>
    ),
};

export const Square: Story = {
    args: {
        images: sampleImages,
        aspectRatio: 'square',
    },
    render: (args) => (
        <div style={{ width: '500px' }}>
            <Carousel {...args} />
        </div>
    ),
};

export const ContainFit: Story = {
    args: {
        images: sampleImages,
        fit: 'contain',
    },
    render: (args) => (
        <div style={{ width: '800px' }}>
            <Carousel {...args} />
        </div>
    ),
};
