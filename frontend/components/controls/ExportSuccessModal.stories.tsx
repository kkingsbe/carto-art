import type { Meta, StoryObj } from '@storybook/react';
import { ExportSuccessModal } from './ExportSuccessModal';

const meta: Meta<typeof ExportSuccessModal> = {
    title: 'Controls/ExportSuccessModal',
    component: ExportSuccessModal,
    parameters: {
        layout: 'fullscreen',
    },
    tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof ExportSuccessModal>;

export const Default: Story = {
    args: {
        isOpen: true,
        onClose: () => console.log('closed'),
        onSave: async (name) => console.log('save', name),
        isAuthenticated: true,
        currentMapName: 'My Map',
        previewUrl: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?q=80&w=2070&auto=format&fit=crop',
        onBuyPrint: () => console.log('buy print'),
    },
};

export const Unauthenticated: Story = {
    args: {
        ...Default.args,
        isAuthenticated: false,
    },
};

export const WithoutPreview: Story = {
    args: {
        ...Default.args,
        previewUrl: null,
    },
};

export const WithUnsavedChanges: Story = {
    args: {
        ...Default.args,
        hasUnsavedChanges: true,
    },
};
