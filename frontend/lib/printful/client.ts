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
    shipments?: {
        id: number;
        carrier: string;
        service: string;
        tracking_number: string;
        tracking_url: string;
        created: number;
        ship_date: string;
        shipped_at: number;
        reshipment: boolean;
        items: {
            item_id: number;
            quantity: number;
        }[];
    }[];
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
     * Get list of orders from Printful
     */
    async getOrders({ limit = 20, offset = 0 } = {}): Promise<PrintfulOrder[]> {
        const response = await fetch(`${PRINTFUL_API_URL}/orders?limit=${limit}&offset=${offset}`, {
            headers: { 'Authorization': `Bearer ${API_KEY}` }
        });

        if (!response.ok) throw new Error('Failed to fetch orders');

        const data = await response.json();
        return data.result;
    },

    /**
     * Get a single order from Printful
     */
    async getOrder(orderId: number | string): Promise<PrintfulOrder> {
        const response = await fetch(`${PRINTFUL_API_URL}/orders/${orderId}`, {
            headers: { 'Authorization': `Bearer ${API_KEY}` }
        });

        if (!response.ok) throw new Error(`Failed to fetch order ${orderId}`);

        const data = await response.json();
        return data.result;
    },

    /**
     * Cancel an order in Printful
     * Only works if status is 'draft' or 'pending'
     */
    async cancelOrder(orderId: number | string): Promise<PrintfulOrder> {
        const response = await fetch(`${PRINTFUL_API_URL}/orders/${orderId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${API_KEY}` }
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.result || error.error || `Failed to cancel order ${orderId}`);
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
                console.log(`[DEBUG] Fetched ${templatesData.result?.templates?.length} templates for Product ${productId}`);

                if (templatesData.result && templatesData.result.templates && templatesData.result.templates.length > 0) {
                    // Find the best template match based on aspect ratio
                    // 1. Get variant info to know expected aspect ratio
                    // const variant = await printful.getVariant(productId); // REMOVED potentially erroneous call

                    const targetVariantId = variant_ids[0];
                    const targetVariant = await printful.getVariant(targetVariantId);

                    let bestTemplate = templatesData.result.templates[0];
                    let bestMatchScore = 0; // Higher is better

                    const variantName = targetVariant.variant.size || targetVariant.variant.name || "";
                    console.log(`[DEBUG] Target Variant Name: "${variantName}"`);

                    const match = variantName.match(/(\d+)["″]?\s*[x×]\s*(\d+)["″]?/i);

                    if (match) {
                        const w = parseFloat(match[1]);
                        const h = parseFloat(match[2]);
                        const targetRatio = w / h;
                        const rotatedRatio = h / w; // Inverse ratio for rotated images
                        console.log(`[DEBUG] Target ratio: ${targetRatio.toFixed(3)} (${w}x${h}), Rotated ratio: ${rotatedRatio.toFixed(3)}`);

                        // Find template with closest aspect ratio
                        // Since the upload endpoint rotates images when orientations differ,
                        // we need to check the rotated ratio first, then fall back to original
                        let bestRatioDiff = Infinity;
                        let usedRotatedRatio = false;

                        // First pass: check rotated ratio (since image may have been rotated)
                        for (const tmpl of templatesData.result.templates) {
                            if (!tmpl.print_area_width || !tmpl.print_area_height) continue;
                            const tmplRatio = tmpl.print_area_width / tmpl.print_area_height;
                            const diff = Math.abs(tmplRatio - rotatedRatio);

                            if (diff < bestRatioDiff) {
                                bestRatioDiff = diff;
                                bestTemplate = tmpl;
                            }
                        }

                        // If rotated ratio match is poor, try original ratio
                        if (bestRatioDiff > 0.05) {
                            console.log(`[DEBUG] Rotated ratio match is poor (${bestRatioDiff.toFixed(3)}), trying original ratio...`);
                            let originalRatioDiff = Infinity;

                            for (const tmpl of templatesData.result.templates) {
                                if (!tmpl.print_area_width || !tmpl.print_area_height) continue;
                                const tmplRatio = tmpl.print_area_width / tmpl.print_area_height;
                                const diff = Math.abs(tmplRatio - targetRatio);

                                if (diff < originalRatioDiff) {
                                    originalRatioDiff = diff;
                                    bestTemplate = tmpl;
                                }
                            }

                            // Use original ratio if it's a better match
                            if (originalRatioDiff < bestRatioDiff) {
                                bestRatioDiff = originalRatioDiff;
                                usedRotatedRatio = false;
                            } else {
                                usedRotatedRatio = true;
                            }
                        } else {
                            usedRotatedRatio = true;
                        }

                        console.log(`[DEBUG] Best template found: ID ${bestTemplate.template_id}, Ratio: ${(bestTemplate.print_area_width / bestTemplate.print_area_height).toFixed(3)}, Diff: ${bestRatioDiff.toFixed(3)}, Used rotated ratio: ${usedRotatedRatio}`);

                        if (bestRatioDiff < 0.05) {
                            console.log(`[DEBUG] Found matching template ID ${bestTemplate.template_id}`);
                        } else {
                            console.log(`[DEBUG] No exact aspect ratio match found. Closest diff: ${bestRatioDiff.toFixed(3)}. using default.`);
                            // If we didn't find a good match, assume default?
                            // But bestTemplate is updated to the "closest" anyway.
                        }
                    } else {
                        console.log('[DEBUG] Could not parse dimensions from variant name');
                    }

                    // Use the best template info
                    if (bestTemplate) {
                        // Crucial: Use template_id not placement if different from default?
                        // if (bestTemplate.template_id) {
                        //     console.log(`[DEBUG] Switching Product ID ${productId} -> Template ID ${bestTemplate.template_id}`);
                        //     productId = bestTemplate.template_id;
                        //     validPlacement = 'default';
                        // } else 
                        if (bestTemplate.placement) {
                            validPlacement = bestTemplate.placement;
                        } else if (bestTemplate.is_template_on_front) {
                            // If placement is missing but it's on front
                            // AOP products usually require 'front', while others (Canvas, etc) require 'default'
                            const fullName = targetVariant.variant.name || "";
                            if (fullName.includes('All-Over Print')) {
                                console.log(`[DEBUG] AOP Product detected. Using 'front' placement.`);
                                validPlacement = 'front';
                            } else {
                                console.log(`[DEBUG] Standard Product detected. Using 'default' placement.`);
                                validPlacement = 'default';
                            }
                        }

                        printAreaWidth = bestTemplate.print_area_width;
                        printAreaHeight = bestTemplate.print_area_height;
                    }
                }
            }
        } catch (e) {
            console.error("[DEBUG] Failed to fetch templates", e);
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

        // Retry logic for rate limiting
        const maxRetries = 5;
        let lastError: Error | null = null;

        for (let attempt = 0; attempt < maxRetries; attempt++) {
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

            if (response.ok) {
                const data = await response.json();
                return data.result; // user_id, task_key, status
            }

            const errorBody = await response.json();
            // console.error('Printful Create Mockup Task Failed:', JSON.stringify(errorBody, null, 2)); // Moved below

            // Handle rate limiting (429)
            if (response.status === 429) {
                // Parse retry-after time from error message
                let waitSeconds = 60; // Default wait time
                const retryMatch = errorBody.result?.match(/after (\d+) seconds/);
                if (retryMatch) {
                    waitSeconds = parseInt(retryMatch[1], 10) + 10; // Add 10s buffer instead of 5
                }

                console.log(`Rate limited by Printful. Waiting ${waitSeconds} seconds before retry ${attempt + 1}/${maxRetries}...`);
                await new Promise(resolve => setTimeout(resolve, waitSeconds * 1000));
                continue;
            }

            // Handle "File type front is not allowed" error (common for some AOP products like tapestries)
            // Error code is usually MG-4, message contains "File type front is not allowed"
            const errorMsg = errorBody.result || (errorBody.error && errorBody.error.message) || '';
            if (errorMsg.includes('File type front is not allowed')) {
                const hasFrontPlacement = validFiles.some(f => f.placement === 'front');
                if (hasFrontPlacement) {
                    console.log(`[DEBUG] Caught 'front' placement error. Switching to 'front_dtfabric' and retrying...`);
                    // Update placements in validFiles
                    validFiles.forEach(f => {
                        if (f.placement === 'front') f.placement = 'front_dtfabric';
                    });

                    // Add a small delay and retry
                    await new Promise(resolve => setTimeout(resolve, 1000));
                    continue;
                }
            }

            // Extract message for other errors
            let msg = '';
            if (typeof errorBody.error === 'string') msg = errorBody.error;
            else if (errorBody.error && typeof errorBody.error === 'object' && errorBody.error.message) msg = errorBody.error.message;
            else if (errorBody.result) msg = errorBody.result;
            else msg = JSON.stringify(errorBody);

            console.error('Printful Create Mockup Task Failed:', JSON.stringify(errorBody, null, 2));
            lastError = new Error(`Printful Error: ${msg}`);
            break; // Don't retry non-rate-limit errors
        }

        throw lastError || new Error('Mockup task creation failed after retries');
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
    },

    /**
     * Get file info from Printful Library
     */
    async getFile(fileId: number | string): Promise<{
        id: number;
        type: string;
        hash: string;
        url: string;
        filename: string;
        mime_type: string;
        size: number;
        width: number;
        height: number;
        dpi: number;
        status: string;
        created: number;
        thumbnail_url: string;
        preview_url: string;
        visible: boolean;
    }> {
        const response = await fetch(`${PRINTFUL_API_URL}/files/${fileId}`, {
            headers: { 'Authorization': `Bearer ${API_KEY}` }
        });

        if (!response.ok) throw new Error(`Failed to fetch file ${fileId}`);

        const data = await response.json();
        return data.result;
    }
};
