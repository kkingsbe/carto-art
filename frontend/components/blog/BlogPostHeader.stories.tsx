import type { Meta, StoryObj } from '@storybook/react';
import { BlogPostHeader } from './BlogPostHeader';

const meta = {
    title: 'Components/Blog/BlogPostHeader',
    component: BlogPostHeader,
    parameters: {
        layout: 'padded',
    },
    tags: ['autodocs'],
    argTypes: {
        heroImage: { control: 'text' },
    },
} satisfies Meta<typeof BlogPostHeader>;

export default meta;
type Story = StoryObj<typeof meta>;

const defaultArgs = {
    title: 'How to Render 3D Terrain with Carto Art',
    category: 'Guides',
    readTime: '5 min read',
    author: 'Carto Art Team',
    publishedDate: '2026-01-14T00:00:00Z',
    tags: ['3d', 'terrain', 'tutorial'],
    heroImage: 'https://images.unsplash.com/photo-1542259148-3b89542f1243?q=80&w=2070',
};

export const Default: Story = {
    args: defaultArgs,
    render: (args) => (
        <div className="max-w-4xl mx-auto bg-[#0a0f1a] p-8">
            <BlogPostHeader {...args} />
        </div>
    ),
};

export const NoImage: Story = {
    args: {
        ...defaultArgs,
        heroImage: undefined,
    },
    render: (args) => (
        <div className="max-w-4xl mx-auto bg-[#0a0f1a] p-8">
            <BlogPostHeader {...args} />
        </div>
    ),
};

export const LongTitle: Story = {
    args: {
        ...defaultArgs,
        title: 'This is a very long title that should wrap nicely across multiple lines and look dramatic and cool',
    },
    render: (args) => (
        <div className="max-w-4xl mx-auto bg-[#0a0f1a] p-8">
            <BlogPostHeader {...args} />
        </div>
    ),
};
