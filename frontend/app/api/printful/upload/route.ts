import { NextResponse } from 'next/server';
import { createClient, createServiceRoleClient } from '@/lib/supabase/server';
import { z } from 'zod';
import sharp from 'sharp';

const PRINTFUL_API_URL = 'https://api.printful.com';


const uploadSchema = z.object({
    url: z.string().url(),
    variant_id: z.number().optional(), // Optional for backward compatibility
});

/**
 * Rotate image if design orientation doesn't match print area orientation
 */
async function rotateImageIfNeeded(
    imageBuffer: Buffer,
    variantId: number,
    supabase: any
): Promise<{ buffer: Buffer; rotated: boolean }> {
    try {
        // 1. Get variant print area and template URL from database
        const { data: variant } = await supabase
            .from('product_variants')
            .select('mockup_print_area, mockup_template_url')
            .eq('id', variantId)
            .single();

        if (!variant?.mockup_print_area) {
            console.log(`[Rotation] No print area found for variant ${variantId}, skipping rotation`);
            return { buffer: imageBuffer, rotated: false };
        }

        const printArea = typeof variant.mockup_print_area === 'string'
            ? JSON.parse(variant.mockup_print_area)
            : variant.mockup_print_area;

        // 2. Get image dimensions
        const metadata = await sharp(imageBuffer).metadata();
        const designWidth = metadata.width || 0;
        const designHeight = metadata.height || 0;

        if (designWidth === 0 || designHeight === 0) {
            console.log(`[Rotation] Invalid image dimensions for variant ${variantId}, skipping rotation`);
            return { buffer: imageBuffer, rotated: false };
        }

        // 3. Determine design orientation
        const designIsPortrait = designHeight > designWidth;
        const designAspectRatio = designWidth / designHeight;

        console.log(`[Rotation] Design: ${designWidth}×${designHeight} (${designIsPortrait ? 'portrait' : 'landscape'}, ratio: ${designAspectRatio.toFixed(3)})`);

        // 4. Determine print area orientation
        // CRITICAL: Must match client logic EXACTLY (FrameMockupRenderer line 117)
        // Client does: printAreaPx.height > printAreaPx.width
        // where printAreaPx = printArea * templateDimensions
        // We MUST fetch template to get actual pixel dimensions
        
        let printAreaIsPortrait: boolean;
        let printAreaAspectRatio: number;

        if (variant.mockup_template_url) {
            try {
                const templateResponse = await fetch(variant.mockup_template_url);
                if (!templateResponse.ok) {
                    throw new Error('Template fetch failed');
                }
                const templateBuffer = Buffer.from(await templateResponse.arrayBuffer());
                const templateMetadata = await sharp(templateBuffer).metadata();
                const templateWidth = templateMetadata.width || 1;
                const templateHeight = templateMetadata.height || 1;
                
                // Calculate actual print area dimensions in pixels (SAME AS CLIENT)
                const printAreaPxWidth = printArea.width * templateWidth;
                const printAreaPxHeight = printArea.height * templateHeight;
                
                printAreaIsPortrait = printAreaPxHeight > printAreaPxWidth;
                printAreaAspectRatio = printAreaPxWidth / printAreaPxHeight;
                
                console.log(`[Rotation] Template: ${templateWidth}×${templateHeight}`);
                console.log(`[Rotation] Print Area (pixels): ${printAreaPxWidth.toFixed(0)}×${printAreaPxHeight.toFixed(0)} (${printAreaIsPortrait ? 'portrait' : 'landscape'}, ratio: ${printAreaAspectRatio.toFixed(3)})`);
            } catch (templateError) {
                console.error(`[Rotation] Could not fetch template:`, templateError);
                // Fallback: assume square template (percentage comparison)
                printAreaIsPortrait = printArea.height > printArea.width;
                printAreaAspectRatio = printArea.width / printArea.height;
                console.log(`[Rotation] ⚠️ Fallback to percentage comparison: ${(printArea.width * 100).toFixed(1)}% × ${(printArea.height * 100).toFixed(1)}% (${printAreaIsPortrait ? 'portrait' : 'landscape'})`);
            }
        } else {
            // No template URL - fallback to percentage comparison
            printAreaIsPortrait = printArea.height > printArea.width;
            printAreaAspectRatio = printArea.width / printArea.height;
            console.log(`[Rotation] No template URL - using percentage comparison: ${(printArea.width * 100).toFixed(1)}% × ${(printArea.height * 100).toFixed(1)}% (${printAreaIsPortrait ? 'portrait' : 'landscape'})`);
        }

        // 5. Rotate if orientations differ
        if (designIsPortrait !== printAreaIsPortrait) {
            console.log(`[Rotation] ⚠️ Orientations differ - rotating image 90° clockwise`);
            console.log(`[Rotation] Design is ${designIsPortrait ? 'portrait' : 'landscape'}, print area is ${printAreaIsPortrait ? 'portrait' : 'landscape'}`);

            const rotatedBuffer = await sharp(imageBuffer)
                .rotate(90) // Rotate 90° clockwise
                .toBuffer();

            // Verify rotation by checking new dimensions
            const rotatedMetadata = await sharp(rotatedBuffer).metadata();
            console.log(`[Rotation] ✓ After rotation: ${rotatedMetadata.width}×${rotatedMetadata.height}`);

            return { buffer: rotatedBuffer, rotated: true };
        }

        console.log(`[Rotation] ✓ No rotation needed - orientations match`);
        return { buffer: imageBuffer, rotated: false };

    } catch (error) {
        console.error(`[Rotation] Error rotating image for variant ${variantId}:`, error);
        // Return original buffer on error (fail-safe)
        return { buffer: imageBuffer, rotated: false };
    }
}

export async function POST(request: Request) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        // Allow guest uploads (handled by checkout) or require valid request
        const userId = user ? user.id : 'guest';

        const body = await request.json();
        const { url, variant_id } = uploadSchema.parse(body);

        const API_KEY = process.env.PRINTFUL_API_KEY;

        if (!API_KEY) {
            return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 });
        }

        // Download image if variant_id is provided (for rotation)
        let imageBuffer: Buffer | null = null;
        let rotated = false;

        if (variant_id) {
            try {
                console.log(`[Upload] Downloading image from ${url} for variant ${variant_id}`);
                const imageResponse = await fetch(url);
                if (!imageResponse.ok) {
                    throw new Error(`Failed to download image: ${imageResponse.statusText}`);
                }
                imageBuffer = Buffer.from(await imageResponse.arrayBuffer());

                // Rotate if needed
                const result = await rotateImageIfNeeded(imageBuffer, variant_id, supabase);
                imageBuffer = result.buffer;
                rotated = result.rotated;
            } catch (error) {
                console.error('[Upload] Error processing image:', error);
                // Fail explicitly if image processing (download/rotation) fails
                // This prevents silent failures where we send the wrong orientation to Printful
                return NextResponse.json({
                    error: `Failed to process image for rotation: ${(error as any).message || 'Unknown error'}`,
                    details: error
                }, { status: 400 });
            }
        }

        // Upload to Printful
        let response;
        let finalUrl = url; // Default to original URL
        let supabaseUrl: string | null = null; // Track the Supabase URL separately

        if (imageBuffer) {
            // Upload rotated image to Supabase Storage first, then send URL to Printful
            console.log(`[Upload] Uploading ${rotated ? 'rotated' : 'original'} image to Supabase Storage (${Math.round(imageBuffer.length / 1024)}KB)`);

            try {
                const adminSupabase = createServiceRoleClient();
                const filename = `user-${userId}-${variant_id || 'unknown'}-${Date.now()}${rotated ? '-rotated' : ''}.png`;
                const path = `printful/${filename}`;

                // Upload to Supabase Storage
                const { error: uploadError } = await adminSupabase.storage
                    .from('print-files')
                    .upload(path, imageBuffer, {
                        contentType: 'image/png',
                        upsert: true
                    });

                if (uploadError) {
                    console.error('[Upload] Supabase upload failed:', uploadError);
                    throw new Error('Failed to upload rotated image to storage');
                }

                // Get public URL
                const { data: { publicUrl } } = adminSupabase.storage
                    .from('print-files')
                    .getPublicUrl(path);

                finalUrl = publicUrl;
                supabaseUrl = publicUrl; // Store the Supabase URL
                console.log(`[Upload] Uploaded to Supabase: ${publicUrl}`);

            } catch (error) {
                console.error('[Upload] Failed to upload rotated image to Supabase:', error);
                // Fall back to original URL if upload fails
                finalUrl = url;
                console.log('[Upload] Falling back to original URL');
            }
        }

        // Upload to Printful via URL
        console.log(`[Upload] Uploading to Printful via URL: ${finalUrl.substring(0, 80)}...`);
        response = await fetch(`${PRINTFUL_API_URL}/files`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                url: finalUrl,
                filename: `user-${userId}-${Date.now()}.png`,
            }),
        });

        if (!response.ok) {
            const error = await response.json();
            console.error('[Upload] Printful upload failed:', error);
            return NextResponse.json({
                error: error.result || error.error?.message || 'Printful Upload Failed',
                details: error
            }, { status: response.status });
        }

        const data = await response.json();
        return NextResponse.json({
            id: data.result.id,
            preview_url: data.result.preview_url,
            rotated, // Include rotation status in response for debugging
            image_url: supabaseUrl || finalUrl // Return the actual rotated image URL for mockup generation
        });

    } catch (error) {
        console.error('Upload Design Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
