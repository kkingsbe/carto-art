import type { Meta, StoryObj } from '@storybook/react';
import { NotificationList } from './NotificationList';

const meta: Meta<typeof NotificationList> = {
    title: 'Notifications/NotificationList',
    component: NotificationList,
    parameters: {
        layout: 'centered',
    },
    tags: ['autodocs'],
    decorators: [
        (Story) => (
            <div className="w-[400px] border rounded-lg bg-card text-card-foreground shadow-sm">
                <Story />
            </div>
        ),
    ],
};

export default meta;
type Story = StoryObj<typeof NotificationList>;

const mockNotifications = [
    {
        id: '1',
        recipient_id: 'user1',
        actor_id: 'user2',
        type: 'LIKE' as const,
        resource_id: 'map123',
        read_at: null,
        created_at: new Date().toISOString(),
        actor: {
            username: 'johndoe',
            display_name: 'John Doe',
            avatar_url: 'https://github.com/shadcn.png',
        },
        resource_name: 'New York City Map',
    },
    {
        id: '2',
        recipient_id: 'user1',
        actor_id: 'user3',
        type: 'FOLLOW' as const,
        resource_id: null,
        read_at: new Date(Date.now() - 86400000).toISOString(),
        created_at: new Date(Date.now() - 86400000).toISOString(),
        actor: {
            username: 'janedoe',
            display_name: 'Jane Doe',
            avatar_url: 'https://github.com/shadcn.png',
        },
    },
    {
        id: '3',
        recipient_id: 'user1',
        actor_id: 'user4',
        type: 'COMMENT' as const,
        resource_id: 'map456',
        read_at: null,
        created_at: new Date(Date.now() - 172800000).toISOString(),
        actor: {
            username: 'bobsmith',
            display_name: 'Bob Smith',
            avatar_url: 'https://github.com/shadcn.png',
        },
        resource_name: 'Paris Map',
    },
];

export const Default: Story = {
    args: {
        initialNotifications: mockNotifications,
    },
};

export const Empty: Story = {
    args: {
        initialNotifications: [],
    },
};

export const Loading: Story = {
    args: {
        initialNotifications: undefined,
    },
};
