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
        user_id: 'user1',
        type: 'export_completed',
        title: 'Export Ready',
        message: 'Your map of New York is ready to download.',
        read_at: null,
        created_at: new Date().toISOString(),
        data: {},
    },
    {
        id: '2',
        user_id: 'user1',
        type: 'welcome',
        title: 'Welcome to Carto Art',
        message: 'Thanks for joining! Start creating your first map.',
        read_at: new Date(Date.now() - 86400000).toISOString(),
        created_at: new Date(Date.now() - 86400000).toISOString(),
        data: {},
    },
    {
        id: '3',
        user_id: 'user1',
        type: 'system',
        title: 'System Update',
        message: 'We have updated our features to include 3D terrain.',
        read_at: null,
        created_at: new Date(Date.now() - 172800000).toISOString(),
        data: {},
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
