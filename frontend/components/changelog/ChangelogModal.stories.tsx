import type { Meta, StoryObj } from '@storybook/react';
import { ChangelogModal } from './ChangelogModal';
import { Button } from '@/components/ui/button';

const meta: Meta<typeof ChangelogModal> = {
    title: 'Changelog/ChangelogModal',
    component: ChangelogModal,
    parameters: {
        layout: 'centered',
    },
    tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof ChangelogModal>;

const mockEntries = [
    {
        id: '1',
        title: '3D Terrain Support',
        description: 'We have added support for 3D terrain Visualization. You can now toggle volumetric terrain in the editor.',
        published_at: new Date().toISOString(),
        is_published: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    },
    {
        id: '2',
        title: 'Export to Video',
        description: 'Create stunning flyover videos of your maps. Available for Plus users.',
        published_at: new Date(Date.now() - 86400000 * 5).toISOString(),
        is_published: true,
        created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
        updated_at: new Date(Date.now() - 86400000 * 5).toISOString(),
    },
];

export const WithFloatingButton: Story = {
    args: {
        showFloatingButton: true,
        initialEntries: mockEntries,
    },
    decorators: [
        (Story) => (
            <div className="h-[200px] w-full relative bg-gray-900 p-4">
                <p className="text-white mb-4">The floating button should appear in the bottom right corner.</p>
                <Story />
            </div>
        ),
    ],
};

export const CustomTrigger: Story = {
    args: {
        trigger: <Button variant="secondary">View Changelog</Button>,
        initialEntries: mockEntries,
    },
};

export const Empty: Story = {
    args: {
        trigger: <Button variant="secondary">View Changelog</Button>,
        initialEntries: [],
    },
};
