import type { Meta, StoryObj } from '@storybook/react';
import { BlogAuthorCard } from './BlogAuthorCard';

const meta = {
    title: 'Components/Blog/BlogAuthorCard',
    component: BlogAuthorCard,
    parameters: {
        layout: 'padded',
    },
    tags: ['autodocs'],
    argTypes: {
        author: { control: 'text' },
        description: { control: 'text' },
    },
} satisfies Meta<typeof BlogAuthorCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {
        author: 'Carto Art Team',
        description: 'Sharing tips and tricks for creating beautiful map posters. Part of the Carto-Art team building the best free map editor on the web.',
    },
    render: (args) => (
        <div className="max-w-[320px] bg-[#0a0f1a] p-8 pt-12">
            <BlogAuthorCard {...args} />
        </div>
    ),
};

export const LongDescription: Story = {
    args: {
        author: 'Jane Doe',
        description: 'A cartography enthusiast with over 10 years of experience in GIS and map design. Passionate about visualizing data and creating stunning topographic maps that tell a story. Regularly contributes to open-source mapping projects.',
    },
    render: (args) => (
        <div className="max-w-[320px] bg-[#0a0f1a] p-8 pt-12">
            <BlogAuthorCard {...args} />
        </div>
    ),
};
