import type { Meta, StoryObj } from '@storybook/react';
import { ExportOptionsModal } from './ExportOptionsModal';

const meta: Meta<typeof ExportOptionsModal> = {
    title: 'Controls/ExportOptionsModal',
    component: ExportOptionsModal,
    parameters: {
        layout: 'centered',
    },
    tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof ExportOptionsModal>;

export const Default: Story = {
    args: {
        isOpen: true,
        onClose: () => console.log('close'),
        onExport: () => console.log('export'),
        isExporting: false,
        format: {
            orientation: 'portrait',
            aspectRatio: '2:3',
            margin: 10,
            borderStyle: 'none',
        },
        onFormatChange: () => { },
        inline: true,
    },
};

export const Exporting: Story = {
    args: {
        ...Default.args,
        isExporting: true,
        exportProgress: { stage: 'Rendering map...', percent: 45 },
    },
};

export const ExportingGIF: Story = {
    args: {
        ...Default.args,
        isExporting: true,
        gifProgress: 30,
        latestFrame: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?q=80&w=2070&auto=format&fit=crop',
    },
};

export const LimitReached: Story = {
    args: {
        ...Default.args,
        exportUsage: {
            used: 3,
            limit: 3,
            allowed: false,
            remaining: 0,
            nextAvailableAt: new Date(Date.now() + 3600000).toISOString(),
        },
        subscriptionTier: 'free',
    },
};

export const UpgradeNudge: Story = {
    args: {
        ...Default.args,
        exportUsage: {
            used: 2,
            limit: 3,
            allowed: true,
            remaining: 1,
            nextAvailableAt: null,
        },
        subscriptionTier: 'free',
    },
};
