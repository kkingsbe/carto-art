'use server';

import { printful } from '@/lib/printful/client';
import { createClient } from '@/lib/supabase/server';
import sharp from 'sharp';

interface PrintArea {
    x: number;
    y: number;
    width: number;
    height: number;
}

/**
 * Convert RGB to HSL
 */
function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0, s = 0;
    const l = (max + min) / 2;

    if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h *= 60;
    }
    return [h, s, l];
}

/**
 * Downloads image and finds the bounding box of the magenta placeholder
 * using HSL-based color matching for better handling of anti-aliased edges
 */
export async function detectPrintArea(imageUrl: string): Promise<PrintArea> {
    const response = await fetch(imageUrl);
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const image = sharp(buffer);
    const metadata = await image.metadata();
    const width = metadata.width || 1000;
    const height = metadata.height || 1000;

    const { data, info } = await image
        .raw()
        .toBuffer({ resolveWithObject: true });

    let minX = width, minY = height, maxX = 0, maxY = 0;
    let found = false;

    // Magenta has a hue of ~300 degrees
    // We use HSL matching to handle anti-aliased edges where
    // the magenta blends with the black border (darker but same hue)
    const MAGENTA_HUE = 300;
    const HUE_TOLERANCE = 15; // degrees
    const MIN_SATURATION = 0.4; // Must be somewhat saturated to be magenta
    const MIN_LIGHTNESS = 0.15; // Must not be too dark (almost black)

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const offset = (y * width + x) * info.channels;
            const r = data[offset];
            const g = data[offset + 1];
            const b = data[offset + 2];

            const [h, s, l] = rgbToHsl(r, g, b);

            // Check for magenta-ish color using HSL
            // Magenta is at hue ~300, with high saturation
            const hueDiff = Math.min(Math.abs(h - MAGENTA_HUE), 360 - Math.abs(h - MAGENTA_HUE));
            const isMagenta = hueDiff < HUE_TOLERANCE && s > MIN_SATURATION && l > MIN_LIGHTNESS;

            if (isMagenta) {
                found = true;
                minX = Math.min(minX, x);
                minY = Math.min(minY, y);
                maxX = Math.max(maxX, x);
                maxY = Math.max(maxY, y);
            }
        }
    }

    if (!found) {
        throw new Error('Could not find magenta placeholder in template');
    }

    // Convert to percentages
    return {
        x: minX / width,
        y: minY / height,
        width: (maxX - minX + 1) / width,
        height: (maxY - minY + 1) / height
    };
}

export async function searchPrintfulProducts(query: string = '', type: string = '') {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error('Unauthorized');

    // Check admin
    const { data: profile, error } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', user.id)
        .single<{ is_admin: boolean }>();

    if (error || !profile || !(profile as any).is_admin) throw new Error('Admin only');

    try {
        const products = await printful.getCatalogProducts(query, type);
        return products;
    } catch (error: any) {
        console.error('Printful Search Error:', error);
        throw new Error(error.message || 'Failed to fetch Printful products');
    }
}

export async function getPrintfulProductVariants(productId: number) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error('Unauthorized');

    // Check admin
    const { data: profile, error } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', user.id)
        .single<{ is_admin: boolean }>();

    if (error || !profile || !(profile as any).is_admin) throw new Error('Admin only');

    try {
        const product = await printful.getProductVariants(productId);
        return product;
    } catch (error: any) {
        console.error('Printful Variant Fetch Error:', error);
        throw new Error(error.message || 'Failed to fetch variants');
    }
}

export async function syncVariantImages() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error('Unauthorized');

    // Check admin
    const { data: profile } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', user.id)
        .single<{ is_admin: boolean }>();

    if (!(profile as any)?.is_admin) throw new Error('Admin only');

    // Get all variants missing an image_url
    const { data: variants, error } = await supabase
        .from('product_variants')
        .select('id')
        .is('image_url', null)
        .returns<{ id: number }[]>();

    if (error) throw error;
    if (!variants || variants.length === 0) return { count: 0 };

    let successCount = 0;
    for (const v of variants) {
        try {
            // Fetch variant info from Printful
            const info = await printful.getVariant(Number(v.id));
            const imageUrl = info?.variant?.image || null;

            if (imageUrl) {
                await (supabase as any)
                    .from('product_variants')
                    .update({ image_url: imageUrl })
                    .eq('id', v.id);
                successCount++;
            }

            // Short delay to be nice to the API
            await new Promise(resolve => setTimeout(resolve, 200));
        } catch (e) {
            console.error(`Failed to sync image for variant ${v.id}`, e);
        }
    }

    return { count: successCount };
}

/**
 * Generate mockup templates for all variants that don't have one.
 * Batches variants by product_id to minimize API calls.
 * 
 * @returns Object with success count and any errors
 */
export async function generateMockupTemplates(): Promise<{
    processed: number;
    errors: { id: number; error: string }[];
}> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error('Unauthorized');

    // Check admin
    const { data: profile } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', user.id)
        .single<{ is_admin: boolean }>();

    if (!(profile as any)?.is_admin) throw new Error('Admin only');

    // Get all variants missing a mockup_template_url OR having an incorrect "api-template" URL
    const { data: variants, error } = await supabase
        .from('product_variants')
        .select('id, product_id')
        .or('mockup_template_url.is.null,mockup_template_url.ilike.%api-template%')
        .returns<{ id: number; product_id: number | null }[]>();

    if (error) throw error;
    if (!variants || variants.length === 0) return { processed: 0, errors: [] };

    // Group variants by product_id for batching
    // If product_id is missing, look it up from Printful
    const variantsByProduct = new Map<number, number[]>();

    for (const v of variants) {
        let productId = v.product_id;

        // If product_id is missing, fetch it from Printful
        if (!productId) {
            try {
                const variantInfo = await printful.getVariant(v.id);
                productId = variantInfo?.variant?.product_id;

                // Also update the database so we don't have to look it up again
                if (productId) {
                    await (supabase as any)
                        .from('product_variants')
                        .update({ product_id: productId })
                        .eq('id', v.id);
                }
            } catch (e) {
                console.warn(`Could not fetch product_id for variant ${v.id}:`, e);
            }
        }

        if (!productId) {
            console.error(`Skipping variant ${v.id}: no product_id available`);
            continue;
        }

        if (!variantsByProduct.has(productId)) {
            variantsByProduct.set(productId, []);
        }
        variantsByProduct.get(productId)!.push(v.id);
    }

    // Magenta placeholder image URL (solid color for keying)
    // Large square image that Printful will automatically scale/crop to fit any product's print area
    const MAGENTA_PLACEHOLDER = 'https://cdhewcjfrghjhenztwdq.supabase.co/storage/v1/object/public/placeholder-templates/magenta-placeholder-4000x4000.png';

    const errors: { id: number; error: string }[] = [];
    let processed = 0;

    // Process each product's variants in a single batch request
    const productEntries = Array.from(variantsByProduct.entries());

    for (let i = 0; i < productEntries.length; i++) {
        const [productId, variantIds] = productEntries[i];

        try {
            console.log(`Generating templates for ${variantIds.length} variants of product ${productId}`);

            // Create mockup task for ALL variants at once
            const task = await printful.createMockupTask({
                variant_ids: variantIds,
                format: 'png',
                files: [{
                    placement: 'default',
                    image_url: MAGENTA_PLACEHOLDER
                }]
            });

            // Poll for completion
            let attempts = 0;
            const maxAttempts = 30; // More attempts for larger batches
            let completedMockups: any[] = [];

            while (attempts < maxAttempts) {
                await new Promise(resolve => setTimeout(resolve, 2000)); // 2s between polls

                const result = await printful.getMockupTask(task.task_key);

                if (result.status === 'completed') {
                    completedMockups = result.mockups || [];
                    break;
                } else if (result.status === 'failed') {
                    throw new Error(result.error || 'Mockup generation failed');
                }

                attempts++;
            }

            if (completedMockups.length === 0) {
                throw new Error('Mockup generation timed out');
            }

            // Default print area for framed posters


            // Update each variant with its mockup
            for (const variantId of variantIds) {
                const mockup = completedMockups.find((m: any) => m.variant_id === variantId);
                const mockupUrl = mockup?.mockup_url;

                if (mockupUrl) {
                    try {
                        const printArea = await detectPrintArea(mockupUrl);
                        console.log(`Detected print area for variant ${variantId}:`, printArea);

                        await (supabase as any)
                            .from('product_variants')
                            .update({
                                mockup_template_url: mockupUrl,
                                mockup_print_area: printArea
                            })
                            .eq('id', variantId);

                        processed++;
                    } catch (err: any) {
                        console.error(`Error processing print area for variant ${variantId}:`, err);

                        // Fallback to safe default if detection fails
                        const defaultPrintArea = {
                            x: 0.12,
                            y: 0.08,
                            width: 0.76,
                            height: 0.84
                        };

                        await (supabase as any)
                            .from('product_variants')
                            .update({
                                mockup_template_url: mockupUrl,
                                mockup_print_area: defaultPrintArea
                            })
                            .eq('id', variantId);

                        errors.push({ id: variantId, error: `Print Area Detection Failed: ${err.message}` });
                    }
                } else {
                    errors.push({ id: variantId, error: 'No mockup URL returned' });
                }
            }

        } catch (e: any) {
            console.error(`Failed to generate templates for product ${productId}:`, e);
            // Add all variants from this batch to errors
            for (const variantId of variantIds) {
                errors.push({ id: variantId, error: e.message || 'Unknown error' });
            }
        }

        // Rate limit between products - Printful has aggressive rate limits for mockup generation
        // Use 30s delay to stay well under their limits
        if (i < productEntries.length - 1) {
            console.log(`Waiting 30 seconds before next product to avoid rate limits...`);
            await new Promise(resolve => setTimeout(resolve, 30000));
        }
    }

    return { processed, errors };
}

/**
 * Get the count of variants missing mockup templates
 */
export async function getMissingTemplateCount(): Promise<number> {
    const supabase = await createClient();

    const { count, error } = await supabase
        .from('product_variants')
        .select('*', { count: 'exact', head: true })
        .or('mockup_template_url.is.null,mockup_template_url.ilike.%api-template%');

    if (error) throw error;
    return count || 0;
}


/**
 * Debug function to inspect the full Printful response for a variant
 */
export async function debugMockupResponse(variantId: number): Promise<any> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error('Unauthorized');

    console.log(`Debugging mockup response for variant ${variantId}`);

    // Magenta placeholder
    const MAGENTA_PLACEHOLDER = 'https://cdhewcjfrghjhenztwdq.supabase.co/storage/v1/object/public/placeholder-templates/magenta-placeholder-4000x4000.png';

    try {
        // Create mockup task
        const task = await printful.createMockupTask({
            variant_ids: [variantId],
            format: 'png',
            files: [{
                placement: 'default',
                image_url: MAGENTA_PLACEHOLDER
            }]
        });

        console.log('Task created:', task.task_key);

        // Poll for completion
        let attempts = 0;
        const maxAttempts = 15;

        while (attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 1000));

            const result = await printful.getMockupTask(task.task_key);

            if (result.status === 'completed') {
                console.log('Debug result:', JSON.stringify(result, null, 2));
                return result;
            } else if (result.status === 'failed') {
                throw new Error(result.error || 'Mockup generation failed');
            }

            attempts++;
        }

        throw new Error('Timeout');
    } catch (e: any) {
        console.error('Debug error:', e);
        return { error: e.message };
    }
}

/**
 * Force regenerate mockup for a specific variant
 */
export async function regenerateVariantMockup(variantId: number) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error('Unauthorized');

    // Check admin
    const { data: profile } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', user.id)
        .single<{ is_admin: boolean }>();

    if (!(profile as any)?.is_admin) throw new Error('Admin only');

    // Magenta placeholder
    const MAGENTA_PLACEHOLDER = 'https://cdhewcjfrghjhenztwdq.supabase.co/storage/v1/object/public/placeholder-templates/magenta-placeholder-4000x4000.png';

    try {
        console.log(`Regenerating mockup for variant ${variantId}`);

        // Create mockup task
        const task = await printful.createMockupTask({
            variant_ids: [variantId],
            format: 'png',
            files: [{
                placement: 'default',
                image_url: MAGENTA_PLACEHOLDER
            }]
        });

        // Poll
        let attempts = 0;
        const maxAttempts = 30;
        let completedMockups: any[] = [];

        while (attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 1000));
            const result = await printful.getMockupTask(task.task_key);

            if (result.status === 'completed') {
                completedMockups = result.mockups || [];
                break;
            } else if (result.status === 'failed') {
                throw new Error(result.error || 'Mockup generation failed');
            }
            attempts++;
        }

        if (completedMockups.length === 0) throw new Error('No mockups generated');

        // Find best mockup
        const mockup = completedMockups.find((m: any) => m.variant_id === variantId);
        const mockupUrl = mockup?.mockup_url || completedMockups[0]?.mockup_url;

        if (!mockupUrl) throw new Error('No mockup URL found in response');

        console.log(`Found new mockup URL: ${mockupUrl}`);

        // Detect print area
        let printArea;
        try {
            printArea = await detectPrintArea(mockupUrl);
            console.log('Detected print area:', printArea);
        } catch (err: any) {
            console.warn(`Failed to detect print area: ${err.message}. Using default.`);
            printArea = {
                x: 0.1, // Approximate default for a framed poster
                y: 0.1,
                width: 0.8,
                height: 0.8
            };
        }

        // Update DB
        const { error } = await (supabase as any)
            .from('product_variants')
            .update({
                mockup_template_url: mockupUrl,
                mockup_print_area: printArea
            })
            .eq('id', variantId);

        if (error) throw error;

        return { success: true, mockupUrl, printArea };

    } catch (e: any) {
        console.error('Regenerate error:', e);
        throw new Error(e.message);
    }
}

/**
 * Inspect available templates for a variant
 */
export async function inspectVariantTemplates(variantId: number) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error('Unauthorized');

    // Check admin
    const { data: profile } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', user.id)
        .single<{ is_admin: boolean }>();

    if (!(profile as any)?.is_admin) throw new Error('Admin only');

    try {
        // 1. Get Product ID
        const variantInfo = await printful.getVariant(variantId);
        const productId = variantInfo.variant.product_id;
        const productName = variantInfo.variant.name;

        // 2. Fetch Templates
        const templatesRes = await fetch(`https://api.printful.com/mockup-generator/templates/${productId}`, {
            headers: { 'Authorization': `Bearer ${process.env.PRINTFUL_API_KEY}` }
        });

        if (!templatesRes.ok) {
            throw new Error(`Failed to fetch templates: ${templatesRes.statusText}`);
        }

        const templatesData = await templatesRes.json();
        const templates = templatesData.result.templates;

        return {
            productId,
            productName,
            templates
        };
    } catch (e: any) {
        console.error('Inspect error:', e);
        throw new Error(e.message);
    }
}
