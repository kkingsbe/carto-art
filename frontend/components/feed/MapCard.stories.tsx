import type { Meta, StoryObj } from '@storybook/react';
import { MapCard } from './MapCard';
import { TrendingUp, User, Copy, Eye, Heart, MapPin } from 'lucide-react';

const meta: Meta<typeof MapCard> = {
    title: 'Feed/MapCard',
    component: MapCard,
    parameters: {
        layout: 'centered',
    },
    tags: ['autodocs'],
    decorators: [
        (Story) => (
            <div className="w-[300px]">
                <Story />
            </div>
        ),
    ],
};

export default meta;
type Story = StoryObj<typeof MapCard>;

const mockMap = {
    id: '1',
    title: 'New York City Map',
    description: 'A beautiful map of NYC',
    thumbnail_url: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?q=80&w=2070&auto=format&fit=crop',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    user_id: 'user1',
    is_public: true,
    view_count: 1234,
    vote_score: 42,
    config: {},
    author: {
        username: 'johndoe',
        display_name: 'John Doe',
        avatar_url: 'https://github.com/shadcn.png',
    },
};

export const Default: Story = {
    args: {
        map: mockMap,
        index: 0,
    },
};

export const Featured: Story = {
    args: {
        map: {
            ...mockMap,
            title: 'Paris - City of Light',
        },
        featured: true,
        index: 0,
    },
    decorators: [
        (Story) => (
            <div className="w-[600px] h-[800px]">
                <Story />
            </div>
        ),
    ],
};

export const WithActionSlot: Story = {
    args: {
        map: mockMap,
        actionSlot: (
            <button className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors">
                View Details
            </button>
        ),
    },
};

export const NoThumbnail: Story = {
    args: {
        map: {
            ...mockMap,
            thumbnail_url: null,
        },
    },
};
