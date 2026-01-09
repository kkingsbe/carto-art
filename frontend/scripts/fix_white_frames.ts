
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import sharp from 'sharp';

// Load environment variables from .env
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase credentials in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

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
 */
async function detectPrintArea(imageUrl: string) {
    console.log(`Downloading mockup verify print area: ${imageUrl}`);
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

    const MAGENTA_HUE = 300;
    const HUE_TOLERANCE = 15; // degrees
    const MIN_SATURATION = 0.4;
    const MIN_LIGHTNESS = 0.15;

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const offset = (y * width + x) * info.channels;
            const r = data[offset];
            const g = data[offset + 1];
            const b = data[offset + 2];

            const [h, s, l] = rgbToHsl(r, g, b);

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

    return {
        x: minX / width,
        y: minY / height,
        width: (maxX - minX + 1) / width,
        height: (maxY - minY + 1) / height
    };
}


async function main() {
    // Dynamic import to ensure env vars are loaded
    const { printful } = await import('@/lib/printful/client');

    console.log('Fetching "White" variants...');

    // Fetch variants with "White" in name AND "black" in URL (to retry failed ones)
    const { data: variants, error } = await supabase
        .from('product_variants')
        .select('*')
        .ilike('name', '%White%')
        .ilike('name', '%Framed%')
        // We only want to fix ones that look wrong (contain "black" in URL)
        // Note: Printful URLs might be opaque, so we also check if we just missed them (no check)
        // But to be safe and save API calls, let's try to target.
        // If checking opaque URLs is hard, we can just run for specific IDs or all again.
        // Let's filter by ones that DON'T look like the new ones (which contain "white")
        // .not('mockup_template_url', 'ilike', '%white%') // This is better
        .ilike('mockup_template_url', '%black%') // The bad ones definitely have "black"
        .order('id');

    if (error) {
        console.error('Error fetching variants:', error);
        return;
    }

    console.log(`Found ${variants.length} "White" Framed variants.`);

    const MAGENTA_PLACEHOLDER = 'https://cdhewcjfrghjhenztwdq.supabase.co/storage/v1/object/public/placeholder-templates/magenta-placeholder-4000x4000.png';

    // Group by product ID to batch requests (Printful API works best this way)
    // Wait, createMockupTask takes variant_ids array. It tries to deduce product ID from first variant.
    // If we have mixed products (different sizes usually map to same product, but different paper types might be diff products),
    // we should be careful.
    // Let's group by product_id just in case.

    const variantsByProduct: Record<string, typeof variants> = {};
    for (const v of variants) {
        // We need product_id. If missing, we can't easily group.
        // Assuming product_id is populated.
        const pid = v.product_id || 'unknown';
        if (!variantsByProduct[pid]) variantsByProduct[pid] = [];
        variantsByProduct[pid].push(v);
    }

    for (const [pid, group] of Object.entries(variantsByProduct)) {
        console.log(`Processing Product ${pid} (${group.length} variants)...`);

        // Process in chunks of 10 to avoid timeouts/limits
        const chunkSize = 5;
        for (let i = 0; i < group.length; i += chunkSize) {
            const chunk = group.slice(i, i + chunkSize);
            const variantIds = chunk.map(v => v.id);
            console.log(`   Generating mockups for variants: ${variantIds.join(', ')}`);

            try {
                const task = await printful.createMockupTask({
                    variant_ids: variantIds,
                    format: 'png',
                    files: [{
                        placement: 'default', // Client will handle dynamic placement lookup
                        image_url: MAGENTA_PLACEHOLDER
                    }]
                });

                console.log(`   Task created: ${task.task_key}. Waiting for completion...`);

                // Poll
                let attempts = 0;
                let completedMockups = [];
                while (attempts < 30) {
                    await new Promise(r => setTimeout(r, 2000));
                    const result = await printful.getMockupTask(task.task_key);
                    if (result.status === 'completed') {
                        completedMockups = result.mockups || [];
                        break;
                    } else if (result.status === 'failed') {
                        throw new Error(result.error);
                    }
                    process.stdout.write('.');
                    attempts++;
                }
                console.log('');

                if (completedMockups.length === 0) {
                    console.error('   Timed out or failed.');
                    continue;
                }

                console.log(`   Got ${completedMockups.length} mockups.`);
                if (completedMockups.length > 0) {
                    console.log('   Sample mockup keys:', Object.keys(completedMockups[0]));
                    console.log('   Sample mockup:', JSON.stringify(completedMockups[0]));
                }

                // Update DB
                for (const m of completedMockups) {
                    // Printful returns variant_ids as an array
                    const vIds = m.variant_ids || m.variantIds;
                    const vId = Array.isArray(vIds) ? vIds[0] : (m.variant_id || m.id);

                    const url = m.mockup_url || m.url || m.mockupUrl;

                    if (!url || !vId) {
                        console.error('   Missing ID or URL in mockup:', m);
                        continue;
                    }

                    try {
                        const printArea = await detectPrintArea(url);
                        console.log(`   Variant ${vId}: URL updated. Print Area: ${JSON.stringify(printArea)}`);

                        await supabase
                            .from('product_variants')
                            .update({
                                mockup_template_url: url,
                                mockup_print_area: printArea
                            })
                            .eq('id', vId);

                    } catch (e) {
                        console.error(`   Failed to detect print area for ${vId}:`, e);
                    }
                }

            } catch (e) {
                console.error(`   Error processing chunk:`, e);
            }

            // Wait a bit between chunks - Printful rate limit is strict
            console.log('   Waiting 60s to respect rate limits...');
            await new Promise(r => setTimeout(r, 60000));
        }
    }
}

main();
