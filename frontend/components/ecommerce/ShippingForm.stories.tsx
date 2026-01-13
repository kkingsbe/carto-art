
import type { Meta, StoryObj } from '@storybook/react';
import { ShippingForm } from './ShippingForm';
import { useForm, FormProvider } from 'react-hook-form';
import { Button } from "@/components/ui/button";

const meta: Meta<typeof ShippingForm> = {
    title: 'Ecommerce/ShippingForm',
    component: ShippingForm,
    parameters: {
        layout: 'padded',
    },
    tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof ShippingForm>;

const FormWrapper = ({ children, defaultValues = {} }: { children: React.ReactNode, defaultValues?: any }) => {
    const methods = useForm({
        mode: "onChange",
        defaultValues: {
            shipping: {
                name: '',
                address: {
                    line1: '',
                    line2: '',
                    city: '',
                    state: '',
                    postal_code: '',
                    country: 'US',
                    ...defaultValues
                }
            }
        }
    });

    return (
        <FormProvider {...methods}>
            <form onSubmit={methods.handleSubmit(data => alert(JSON.stringify(data, null, 2)))} className="max-w-md mx-auto border p-6 rounded-lg shadow-sm bg-white dark:bg-slate-900">
                {children}
                <Button type="submit" className="w-full mt-4">Simulate Submit</Button>
            </form>
        </FormProvider>
    );
};

export const Default: Story = {
    decorators: [
        (Story) => (
            <FormWrapper>
                <Story />
            </FormWrapper>
        ),
    ],
};

export const WithPreFilledValues: Story = {
    decorators: [
        (Story) => (
            <FormWrapper defaultValues={{
                line1: '123 Storybook Lane',
                city: 'Component City',
                state: 'NY',
                postal_code: '10001',
                country: 'US'
            }}>
                <Story />
            </FormWrapper>
        ),
    ],
};
