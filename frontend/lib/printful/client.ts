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
            // Printful errors: { code: 400, result: "Reason", error: "Message" }
            const message = error.result || error.error || 'Printful API Error';
            throw new Error(message);
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
    },

    /**
     * Get list of products from Printful Catalog
     */
    async getCatalogProducts(search: string = '', type: string = ''): Promise<any[]> {
        // Use v2 catalog endpoint if possible, or v1 /products
        // v1 /products returns all customizable products
        const response = await fetch(`${PRINTFUL_API_URL}/products`, {
            headers: { 'Authorization': `Bearer ${API_KEY}` }
        });

        if (!response.ok) throw new Error('Failed to fetch products');

        const data = await response.json();
        let products = data.result;

        if (search || type) {
            const lowerSearch = search.toLowerCase();
            const lowerType = type.toLowerCase();

            products = products.filter((p: any) => {
                const matchesSearch = !search ||
                    p.title.toLowerCase().includes(lowerSearch) ||
                    p.type.toLowerCase().includes(lowerSearch);

                const matchesType = !type ||
                    p.type.toLowerCase() === lowerType ||
                    (lowerType === 'poster' && p.type.toLowerCase().includes('poster')); // Loose match for posters

                return matchesSearch && matchesType;
            });
        }

        return products;
    },

    /**
     * Get variants for a specific product
     */
    async getProductVariants(productId: number): Promise<any> {
        const response = await fetch(`${PRINTFUL_API_URL}/products/${productId}`, {
            headers: { 'Authorization': `Bearer ${API_KEY}` }
        });

        if (!response.ok) throw new Error(`Failed to fetch product ${productId}`);

        const data = await response.json();
        return data.result;
    },

    /**
     * Get single variant info
     */
    async getVariant(variantId: number): Promise<any> {
        // Authenticated endpoint to get variant details
        // Note: The public catalog endpoint is GET /products/variant/{id}
        // store/variants/{id} is for connection variants.
        // We are using catalog variants.
        const response = await fetch(`${PRINTFUL_API_URL}/products/variant/${variantId}`, {
            headers: { 'Authorization': `Bearer ${API_KEY}` }
        });

        if (!response.ok) throw new Error(`Failed to fetch variant ${variantId}`);
        const data = await response.json();
        return data.result;
    },

    /**
     * Create a mockup generation task
     * https://developers.printful.com/docs/#operation/createMockupTask
     */
    async createMockupTask({
        variant_ids,
        format = 'jpg',
        files
    }: {
        variant_ids: number[];
        format?: 'jpg' | 'png';
        files: { placement: string; image_url: string; position?: any }[];
    }) {
        // 1. Resolve Product ID from the first variant
        // The API requires the Product ID in the URL for reliable task creation
        let productId;
        try {
            const variantInfo = await printful.getVariant(variant_ids[0]);
            productId = variantInfo.variant.product_id;
        } catch (e) {
            console.error("Failed to resolve product ID from variant", e);
            // Fallback to trying the variant ID in URL if resolution fails (though unlikely to work if that was the bug)
            productId = variant_ids[0];
        }

        // 2. Fetch available templates to get the correct placement ID and print area dimensions
        // This is robust against product type differences.
        let validPlacement = 'default';
        let printAreaWidth = 1800;
        let printAreaHeight = 2400;

        try {
            const templatesRes = await fetch(`${PRINTFUL_API_URL}/mockup-generator/templates/${productId}`, {
                headers: { 'Authorization': `Bearer ${API_KEY}` }
            });
            if (templatesRes.ok) {
                const templatesData = await templatesRes.json();
                console.log('Fetched Templates:', JSON.stringify(templatesData));

                // templatesData.result.templates is an array of objects with 'placement' property
                if (templatesData.result && templatesData.result.templates && templatesData.result.templates.length > 0) {
                    // Just take the first one for now, or prefer 'default' if it exists
                    const placements = templatesData.result.templates.map((t: any) => t.placement);
                    validPlacement = placements.includes('default') ? 'default' : (placements[0] || 'default');

                    // Get the first template to extract print area dimensions
                    const firstTemplate = templatesData.result.templates[0];
                    if (firstTemplate.print_area_width && firstTemplate.print_area_height) {
                        printAreaWidth = firstTemplate.print_area_width;
                        printAreaHeight = firstTemplate.print_area_height;
                        console.log(`Using print area dimensions: ${printAreaWidth}x${printAreaHeight}`);
                    }
                }
            }
        } catch (e) {
            console.error("Failed to fetch templates", e);
        }

        const validFiles = files.map(f => ({
            ...f,
            placement: validPlacement, // Override with dynamic placement
            position: f.position || {
                area_width: printAreaWidth,
                area_height: printAreaHeight,
                width: printAreaWidth,
                height: printAreaHeight,
                top: 0,
                left: 0
            }
        }));

        console.log('Sending Mockup Request:', {
            url: `${PRINTFUL_API_URL}/mockup-generator/create-task/${productId}`,
            productId,
            variant_ids,
            files: validFiles
        });

        const response = await fetch(`${PRINTFUL_API_URL}/mockup-generator/create-task/${productId}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                variant_ids,
                format,
                files: validFiles
            }),
        });

        if (!response.ok) {
            const errorBody = await response.json();
            console.error('Printful Create Mockup Task Failed:', JSON.stringify(errorBody, null, 2));

            // Extract message recursively or check specific fields
            let msg = '';
            if (typeof errorBody.error === 'string') msg = errorBody.error;
            else if (errorBody.error && typeof errorBody.error === 'object' && errorBody.error.message) msg = errorBody.error.message;
            else if (errorBody.result) msg = errorBody.result;
            else msg = JSON.stringify(errorBody);

            throw new Error(`Printful Error: ${msg}`);
        }

        const data = await response.json();
        return data.result; // user_id, task_key, status
    },

    /**
     * Retrieve generation task result
     */
    async getMockupTask(taskKey: string) {
        const response = await fetch(`${PRINTFUL_API_URL}/mockup-generator/task?task_key=${taskKey}`, {
            headers: { 'Authorization': `Bearer ${API_KEY}` }
        });

        if (!response.ok) throw new Error('Failed to check task status');

        const data = await response.json();
        return data.result; // status, mockups
    }
};
