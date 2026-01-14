
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import sharp from 'sharp';
import fs from 'fs';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase credentials in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// --- UTILS ---

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

async function detectPrintArea(imageUrl: string) {
    console.log(`Analyzing print area for: ${imageUrl}`);
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
    const HUE_TOLERANCE = 15;
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

            if (hueDiff < HUE_TOLERANCE && s > MIN_SATURATION && l > MIN_LIGHTNESS) {
                found = true;
                minX = Math.min(minX, x);
                minY = Math.min(minY, y);
                maxX = Math.max(maxX, x);
                maxY = Math.max(maxY, y);
            }
        }
    }

    if (!found) {
        // Fallback for failure
        console.warn('Could not find magenta placeholder. Using defaults.');
        return { x: 0.1, y: 0.1, width: 0.8, height: 0.8 };
    }

    return {
        x: minX / width,
        y: minY / height,
        width: (maxX - minX + 1) / width,
        height: (maxY - minY + 1) / height
    };
}

async function saveMockupToStorage(url: string, variantId: number) {
    console.log(`Downloading mockup from ${url}...`);
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed to fetch mockup image: ${res.statusText}`);
    const buffer = await res.arrayBuffer();

    const filename = `variant_${variantId}_${Date.now()}.png`;
    const { error: uploadError } = await supabase.storage
        .from('mockups')
        .upload(filename, Buffer.from(buffer), {
            contentType: 'image/png',
            upsert: true
        });

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
        .from('mockups')
        .getPublicUrl(filename);

    return publicUrl;
}

// --- MAIN ---

async function ensureWhitePlaceholder() {
    console.log('Checking for white placeholder...');
    const filename = 'white-placeholder-4000x4000.png';

    // Check if exists
    const { data: existing } = await supabase.storage
        .from('mockups')
        .getPublicUrl(filename);

    // Ideally we check if it proceeds to download or 404, but Supabase public URLs always return a string.
    // We'll try to download it to see if it exists.
    const check = await fetch(existing.publicUrl, { method: 'HEAD' });
    if (check.ok) {
        console.log('   Using existing white placeholder.');
        return existing.publicUrl;
    }

    console.log('   Generating new white placeholder...');
    // Create white buffer
    const size = 4000;
    const channels = 4;
    const buffer = Buffer.alloc(size * size * channels);
    for (let i = 0; i < size * size; i++) {
        buffer[i * channels] = 255;     // R
        buffer[i * channels + 1] = 255; // G
        buffer[i * channels + 2] = 255; // B
        buffer[i * channels + 3] = 255; // A
    }

    const imageBuffer = await sharp(buffer, { raw: { width: size, height: size, channels } })
        .png()
        .toBuffer();

    console.log('   Uploading white placeholder...');
    const { error } = await supabase.storage
        .from('mockups')
        .upload(filename, imageBuffer, {
            contentType: 'image/png',
            upsert: true
        });

    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage
        .from('mockups')
        .getPublicUrl(filename);

    return publicUrl;
}

async function main() {
    const { printful } = await import('@/lib/printful/client');

    // 1. Find variants with "amazonaws" or "printful" in the URL (indicating temp S3)
    // AND belong to an active product
    const { data: variants, error } = await supabase
        .from('product_variants')
        .select('*, products!inner(is_active)')
        .eq('products.is_active', true)
        .or('mockup_template_url.ilike.%amazonaws%,mockup_template_url.ilike.%printful%')
        .order('id');

    if (error) {
        console.error('Error fetching variants:', error);
        return;
    }

    console.log(`Found ${variants.length} variants with potentially temporary URLs.`);

    // Process all variants
    const toProcess = variants;
    // const toProcess = variants.slice(0, 1); // Debug limit

    if (toProcess.length === 0) {
        console.log("No bad URLs found!");
        return;
    }

    console.log(`Processing ${toProcess.length} variants...`);

    const MAGENTA_PLACEHOLDER = 'https://cdhewcjfrghjhenztwdq.supabase.co/storage/v1/object/public/placeholder-templates/magenta-placeholder-4000x4000.png';

    // Ensure we have a white placeholder for the clean images
    let WHITE_PLACEHOLDER: string;
    try {
        WHITE_PLACEHOLDER = await ensureWhitePlaceholder();
        console.log('WHITE_PLACEHOLDER:', WHITE_PLACEHOLDER);
    } catch (e) {
        console.error("Failed to ensure white placeholder:", e);
        return;
    }

    // Group by product_id
    const variantsByProduct: Record<string, typeof variants> = {};
    for (const v of toProcess) {
        const pid = v.product_id || 'unknown';
        if (!variantsByProduct[pid]) variantsByProduct[pid] = [];
        variantsByProduct[pid].push(v);
    }

    for (const [pid, group] of Object.entries(variantsByProduct)) {
        const variantIds = group.map(v => v.id);
        console.log(`Processing Product ${pid} variants: ${variantIds.join(', ')}`);

        try {
            // --- 1. Template Task (Magenta) ---
            console.log('   Creating Template Task (Magenta)...');
            const taskTemplate = await printful.createMockupTask({
                variant_ids: variantIds,
                format: 'png',
                files: [{
                    placement: 'default',
                    image_url: MAGENTA_PLACEHOLDER
                }]
            });

            // --- 2. Clean Task (White) ---
            console.log('   Creating Clean Task (White)...');
            const taskClean = await printful.createMockupTask({
                variant_ids: variantIds,
                format: 'png', // png allows transparency if we used transparent, but white is fine
                files: [{
                    placement: 'default',
                    image_url: WHITE_PLACEHOLDER
                }]
            });

            console.log(`   Tasks created. Template: ${taskTemplate.task_key}, Clean: ${taskClean.task_key}. Waiting...`);

            // Poll Both
            const pollTask = async (taskKey: string) => {
                let attempts = 0;
                while (attempts < 40) {
                    await new Promise(r => setTimeout(r, 2500));
                    const result = await printful.getMockupTask(taskKey);
                    if (result.status === 'completed') {
                        return result.mockups || [];
                    } else if (result.status === 'failed') {
                        throw new Error(result.error);
                    }
                    attempts++;
                }
                throw new Error("Task timed out");
            };

            const [templateResults, cleanResults] = await Promise.all([
                pollTask(taskTemplate.task_key),
                pollTask(taskClean.task_key)
            ]);

            console.log(`   Got ${templateResults.length} template mockups and ${cleanResults.length} clean mockups.`);

            // Map results by variant ID
            const templateMap = new Map();
            templateResults.forEach((m: any) => {
                const vIds = m.variant_ids || m.variantIds;
                const vId = Array.isArray(vIds) ? vIds[0] : (m.variant_id || m.id);
                // Extract URL
                let url = m.mockup_url || m.url || m.mockupUrl;
                if (!url && m.extra && m.extra.length > 0) url = m.extra[0].url;
                if (vId && url) templateMap.set(vId, url);
            });

            const cleanMap = new Map();
            cleanResults.forEach((m: any) => {
                const vIds = m.variant_ids || m.variantIds;
                const vId = Array.isArray(vIds) ? vIds[0] : (m.variant_id || m.id);
                // Extract URL
                let url = m.mockup_url || m.url || m.mockupUrl;
                if (!url && m.extra && m.extra.length > 0) url = m.extra[0].url;
                if (vId && url) cleanMap.set(vId, url);
            });


            // Process each variant in this group
            for (const v of group) {
                const vId = v.id;
                const tempUrlRaw = templateMap.get(vId);
                const cleanUrlRaw = cleanMap.get(vId);

                if (!tempUrlRaw || !cleanUrlRaw) {
                    console.warn(`   Missing one or both mockups for variant ${vId}. Skipping.`);
                    console.warn(`     Template: ${!!tempUrlRaw}, Clean: ${!!cleanUrlRaw}`);
                    continue;
                }

                try {
                    // Upload Template
                    console.log(`   [${vId}] Uploading template...`);
                    const permTemplateUrl = await saveMockupToStorage(tempUrlRaw, vId); // Existing func uses generic name
                    // We might want to rename it? 
                    // saveMockupToStorage generates `variant_${variantId}_${Date.now()}.png`
                    // That's fine, we'll just accept it.

                    // Upload Clean
                    console.log(`   [${vId}] Uploading clean image...`);
                    const permCleanUrl = await saveMockupToStorage(cleanUrlRaw, vId);

                    // Detect Print Area (from Template)
                    const printArea = await detectPrintArea(permTemplateUrl);

                    // Update DB
                    await supabase
                        .from('product_variants')
                        .update({
                            mockup_template_url: permTemplateUrl,
                            image_url: permCleanUrl,
                            mockup_print_area: printArea
                        })
                        .eq('id', vId);

                    console.log(`   FIXED Variant ${vId}`);

                } catch (e) {
                    console.error(`   Failed to process variant ${vId}:`, e);
                }
            }

        } catch (e) {
            console.error(`   Error processing batch for product ${pid}:`, e);
        }

        console.log("   Waiting 5s before next batch...");
        await new Promise(r => setTimeout(r, 5000));
    }
}

main();
