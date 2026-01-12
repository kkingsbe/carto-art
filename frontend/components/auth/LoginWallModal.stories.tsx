import type { Meta, StoryObj } from '@storybook/react';
import { LoginWallModal } from './LoginWallModal';

const meta: Meta<typeof LoginWallModal> = {
    title: 'Auth/LoginWallModal',
    component: LoginWallModal,
    parameters: {
        layout: 'centered',
    },
    tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof LoginWallModal>;

export const Default: Story = {
    args: {
        isOpen: true,
        onClose: () => console.log('closed'),
        title: 'Sign in to Continue',
        description: 'Create a free account to access this feature.',
    },
};

export const Publish: Story = {
    args: {
        isOpen: true,
        onClose: () => console.log('closed'),
        title: 'Sign in to Publish',
        description: 'Create a free account to publish your maps to the community gallery and share them with the world.',
    },
};

export const OrderPrint: Story = {
    args: {
        isOpen: true,
        onClose: () => console.log('closed'),
        title: 'Sign in to Order Print',
        description: 'Create a free account to order high-quality framed prints of your custom maps. Your design will be saved.',
    },
};
