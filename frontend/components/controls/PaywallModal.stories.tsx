import type { Meta, StoryObj } from '@storybook/react';
import { PaywallModal } from './PaywallModal';

const meta: Meta<typeof PaywallModal> = {
    title: 'Controls/PaywallModal',
    component: PaywallModal,
    parameters: {
        layout: 'centered',
    },
    tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof PaywallModal>;

export const ProjectLimit: Story = {
    args: {
        isOpen: true,
        onClose: () => console.log('closed'),
        variant: 'project_limit',
        usage: {
            used: 3,
            limit: 3,
        },
    },
};

export const ExportLimit: Story = {
    args: {
        isOpen: true,
        onClose: () => console.log('closed'),
        variant: 'export_limit',
        usage: {
            used: 5,
            limit: 5,
        },
        countdown: '4h 30m',
    },
};

export const SoftPaywall: Story = {
    args: {
        isOpen: true,
        onClose: () => console.log('closed'),
        variant: 'soft',
    },
};
