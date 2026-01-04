import { z } from 'zod';

const PRINTFUL_API_URL = 'https://api.printful.com';
const API_KEY = process.env.PRINTFUL_API_KEY;

if (!API_KEY) {
    console.warn('Missing PRINTFUL_API_KEY environment variable');
}

// Types
export interface PrintfulShippingRate {
    id: string;
    name: string;
    rate: string;
    currency: string;
    minDeliveryDays: number;
    maxDeliveryDays: number;
}

export interface PrintfulOrder {
    id: number;
    external_id: string;
    status: string;
    costs: {
        subtotal: string;
        tax: string;
        shipping: string;
        total: string;
    };
}

export const printful = {
    /**
     * Calculate shipping rates for a potential order
     */
    async getShippingRates({
        address,
        items,
    }: {
        address: {
            address1: string;
            city: string;
            country_code: string;
            state_code?: string;
            zip?: string;
        };
        items: { variant_id: number; quantity: number }[];
    }): Promise<PrintfulShippingRate[]> {
        const response = await fetch(`${PRINTFUL_API_URL}/shipping/rates`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                recipient: address,
                items,
            }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(`Printful API Error: ${JSON.stringify(error)}`);
        }

        const data = await response.json();
        return data.result.map((rate: any) => ({
            id: rate.id,
            name: rate.name,
            rate: rate.rate,
            currency: rate.currency,
            minDeliveryDays: rate.min_delivery_days,
            maxDeliveryDays: rate.max_delivery_days,
        }));
    },

    /**
     * Create a draft order or confirmed order in Printful
     */
    async createOrder({
        external_id,
        recipient,
        items,
        confirm = false
    }: {
        external_id: string; // Our local Order ID
        recipient: any;
        items: {
            variant_id: number;
            quantity: number;
            files: { url?: string; id?: number | string }[]
        }[];
        confirm?: boolean;
    }): Promise<PrintfulOrder> {
        const response = await fetch(`${PRINTFUL_API_URL}/orders${confirm ? '?confirm=1' : ''}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                external_id,
                recipient,
                items,
            }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(`Printful Order Creation Error: ${JSON.stringify(error)}`);
        }

        const data = await response.json();
        return data.result;
    }
};
