import { NextRequest, NextResponse } from 'next/server';
import { authenticateApiRequest } from '@/lib/auth/api-middleware';
import { getBrowser } from '@/lib/rendering/browser';
import { createClient, createServiceRoleClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';
import { z } from 'zod';
import { randomUUID } from 'crypto';
import { trackEvent } from '@/lib/events';

import { getStyleById, getDefaultStyle } from '@/lib/styles';

const SimplifiedPosterSchema = z.object({
    location: z.object({
        lat: z.number(),
        lng: z.number()
    }),
    style: z.string().optional().default('minimal'),
    text: z.object({
        title: z.string().optional(),
        subtitle: z.string().optional(),
        show_title: z.boolean().default(true),
        show_subtitle: z.boolean().default(true),
        show_coordinates: z.boolean().default(true),
        position: z.enum(['top', 'bottom', 'center']).default('bottom'),
        color: z.string().optional(), // Optional override
    }).optional(),
    camera: z.object({
        pitch: z.number().min(0).max(60).default(0),
        bearing: z.number().min(0).max(360).default(0),
        zoom: z.number().min(0).max(20).default(12),
    }).optional().default({ pitch: 0, bearing: 0, zoom: 12 }),
    options: z.object({
        // Core Layers
        buildings_3d: z.boolean().default(false),
        high_res: z.boolean().default(false),
        streets: z.boolean().default(true),
        water: z.boolean().default(true),
        parks: z.boolean().default(true),
        buildings: z.boolean().default(true),
        labels: z.boolean().default(true),
        background: z.boolean().default(true),

        // Advanced Layers
        terrain: z.boolean().default(false),
        terrain_under_water: z.boolean().default(false),
        contours: z.boolean().default(false),
        boundaries: z.boolean().default(false),
        population: z.boolean().default(false),
        pois: z.boolean().default(false),
        marker: z.boolean().default(false),

        // Landcover
        landcover_wood: z.boolean().default(false),
        landcover_grass: z.boolean().default(false),
        landcover_farmland: z.boolean().default(false),
        landcover_ice: z.boolean().default(false),

        // Landuse
        landuse_forest: z.boolean().default(false),
        landuse_orchard: z.boolean().default(false),
        landuse_vineyard: z.boolean().default(false),
        landuse_cemetery: z.boolean().default(false),
        landuse_grass: z.boolean().default(false),
    }).optional().default({
        buildings_3d: false,
        high_res: false,
        streets: true,
        water: true,
        parks: true,
        buildings: true,
        labels: true,
        background: true,
        terrain: false,
        terrain_under_water: false,
        contours: false,
        boundaries: false,
        population: false,
        pois: false,
        marker: false,
        landcover_wood: false,
        landcover_grass: false,
        landcover_farmland: false,
        landcover_ice: false,
        landuse_forest: false,
        landuse_orchard: false,
        landuse_vineyard: false,
        landuse_cemetery: false,
        landuse_grass: false,
    })
});

export async function POST(req: NextRequest) {
    const requestId = randomUUID();
    const startTime = Date.now();
    console.log(`[PosterDebug] Starting request ${requestId}`);

    try {
        // 1. Authentication
        const authResult = await authenticateApiRequest(req);
        if (!authResult.success) {
            const statusMap = {
                'unauthorized': 401,
                'rate_limited': 429,
                'server_error': 500
            } as const;
            return NextResponse.json(
                { error: authResult.reason === 'rate_limited' ? 'Too Many Requests' : 'Unauthorized', message: authResult.message },
                { status: statusMap[authResult.reason as keyof typeof statusMap] || 500 }
            );
        }
        const authContext = authResult.context;
        console.log(`[PosterDebug] Auth successful for ${requestId}`);

        // 2. Parse Body
        const rawBody = await req.text();
        console.log(`[PosterDebug] Request from ${authContext.userId} - Body size: ${rawBody.length} bytes`);

        let body;
        try {
            body = rawBody ? JSON.parse(rawBody) : {};
        } catch (e) {
            console.error(`[PosterDebug] JSON Parse Error for ${requestId}:`, e);
            return NextResponse.json(
                { error: 'Invalid JSON', message: 'The request body must be valid JSON' },
                { status: 400 }
            );
        }

        const validation = SimplifiedPosterSchema.safeParse(body);

        if (!validation.success) {
            console.error(`[PosterDebug] Validation failed for ${requestId}:`, JSON.stringify(validation.error.flatten(), null, 2));
            return NextResponse.json(
                { error: 'Invalid request', details: validation.error.flatten() },
                { status: 400 }
            );
        }

        const data = validation.data;

        // 3. Map simplified input to full PosterConfig
        const selectedStyle = getStyleById(data.style) || getDefaultStyle();

        // Determine title
        const mapTitle = data.text?.title || "API Request";
        const mapSubtitle = data.text?.subtitle || "";

        const config: any = {
            location: {
                center: [data.location.lng, data.location.lat],
                zoom: data.camera.zoom,
                name: mapTitle,
                city: mapSubtitle, // Use city field for subtitle text if needed by renderer, or just allow typography settings to handle it
                bounds: [[data.location.lng - 0.1, data.location.lat - 0.1], [data.location.lng + 0.1, data.location.lat + 0.1]] // Dummy bounds
            },
            style: {
                id: selectedStyle.id,
                name: selectedStyle.name
            },
            palette: selectedStyle.defaultPalette,
            layers: {
                streets: data.options.streets,
                buildings: data.options.buildings,
                water: data.options.water,
                parks: data.options.parks,
                labels: data.options.labels,
                buildings3D: data.options.buildings_3d,
                buildings3DPitch: data.camera.pitch,
                buildings3DBearing: data.camera.bearing,

                // Advanced Layers
                terrain: data.options.terrain,
                terrainUnderWater: data.options.terrain_under_water,
                contours: data.options.contours,
                boundaries: data.options.boundaries,
                population: data.options.population,
                pois: data.options.pois,
                marker: data.options.marker,

                // Landcover
                landcoverWood: data.options.landcover_wood,
                landcoverGrass: data.options.landcover_grass,
                landcoverFarmland: data.options.landcover_farmland,
                landcoverIce: data.options.landcover_ice,

                // Landuse
                landuseForest: data.options.landuse_forest,
                landuseOrchard: data.options.landuse_orchard,
                landuseVineyard: data.options.landuse_vineyard,
                landuseCemetery: data.options.landuse_cemetery,
                landuseGrass: data.options.landuse_grass,

                // Defaults
                labelSize: 1,
                roadWeight: 1,
                labelsCities: data.options.labels
            },
            format: {
                aspectRatio: '2:3',
                orientation: 'portrait',
                margin: 5,
                borderStyle: 'none'
            },
            typography: selectedStyle.defaultPalette.text ? {
                titleFont: selectedStyle.recommendedFonts?.[0] || 'Inter',
                titleSize: 5,
                titleWeight: 800,
                titleLetterSpacing: 0.08,
                titleAllCaps: true,
                subtitleFont: selectedStyle.recommendedFonts?.[0] || 'Inter',
                subtitleSize: 2.5,
                subtitleWeight: 400,
                subtitleLetterSpacing: 0.2,
                showTitle: data.text?.show_title ?? true,
                showSubtitle: data.text?.show_subtitle ?? true,
                showCoordinates: data.text?.show_coordinates ?? true,
                position: data.text?.position || 'bottom'
            } : undefined
        };

        // Resolution handling
        const pixelRatio = data.options.high_res ? 3 : 1;
        const width = 2400;
        const height = 3600;


        // 3. Launch Browser & Render
        // Note: Vercel functions have a timeout (10s hobby, 60s pro). 
        // This part must be FAST.

        let browser = null;
        let screenshotBuffer: Buffer | null = null;

        try {
            console.log(`[PosterDebug] Launching browser for ${requestId}`);
            browser = await getBrowser();
            console.log(`[PosterDebug] Browser launched, opening new page for ${requestId}`);
            const page = await browser.newPage();
            console.log(`[PosterDebug] New page opened for ${requestId}`);

            // Forward console logs from the browser to the node console EARLY
            page.on('console', msg => {
                const type = msg.type();
                const text = msg.text();
                console.log(`[Browser Console] ${type.toUpperCase()}: ${text}`);
            });

            page.on('pageerror', (err: unknown) => {
                console.error(`[Browser Error] ${String(err)}`);
            });

            // Set viewport to a reasonable default - actual rendering size is handled by exportMapToPNG's own canvas
            await page.setViewport({
                width: 1920,
                height: 1080,
                deviceScaleFactor: 1,
            });

            // Construct URL for renderer page
            const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
            const rendererUrl = `${appUrl}/renderer`;
            console.log(`[PosterDebug] Navigating to ${rendererUrl} for ${requestId}`);

            // Navigate
            await page.goto(rendererUrl, { waitUntil: 'domcontentloaded' });
            console.log(`[PosterDebug] Navigation complete, waiting for renderPoster for ${requestId}`);

            // Wait for renderPoster to be exposed
            await page.waitForFunction('typeof window.renderPoster === "function"');
            console.log(`[PosterDebug] renderPoster found, injecting config for ${requestId}`);

            // Inject Config
            await page.evaluate((cfg) => {
                window.renderPoster(cfg);
            }, config as any);

            // Wait for rendering to complete (or timeout)
            // We race between success marker and error marker
            console.log(`[PosterDebug] Config injected, waiting for #render-complete or #render-error for ${requestId}`);

            // Wait for map to be idle and fonts to be loaded
            console.log(`[PosterDebug] Waiting for renderer signal for ${requestId}`);

            const result = await Promise.race([
                page.waitForSelector('#render-complete', { timeout: 45000 }).then(() => 'complete'),
                page.waitForSelector('#render-error', { timeout: 45000 }).then(() => 'error')
            ]);

            if (result === 'error') {
                throw new Error('Renderer reported a configuration error');
            }

            await page.waitForFunction(() => {
                return (window as any).generatePosterImage !== undefined;
            }, { timeout: 5000 });

            console.log(`[PosterDebug] Renderer ready, executing generatePosterImage for ${requestId}`);

            // Execute export
            const base64Image = await page.evaluate(async (res) => {
                return await window.generatePosterImage(res);
            }, { width, height, dpi: 72 * pixelRatio, name: 'poster' }); // dpi is approximate, exportCanvas handles resolution

            console.log(`[PosterDebug] Image generated, decoding base64 for ${requestId}`);
            screenshotBuffer = Buffer.from(base64Image, 'base64');

        } catch (renderError) {
            console.error(`[PosterDebug] Render error for ${requestId}:`, renderError);
            logger.error('Rendering failed', { error: renderError, requestId });
            return NextResponse.json({
                error: 'Rendering failed or timed out',
                details: (renderError as Error).message
            }, { status: 500 });
        } finally {
            if (browser) await browser.close();
        }

        if (!screenshotBuffer) {
            return NextResponse.json({ error: 'Failed to generate screenshot' }, { status: 500 });
        }


        console.log(`[PosterDebug] Screenshot taken (${screenshotBuffer.length} bytes), uploading for ${requestId}`);

        // 4. Upload to Supabase
        // Use service role to bypass policies and avoid cookie issues/RLS
        const supabase = createServiceRoleClient();
        const fileName = `${requestId}.png`;
        const filePath = `api-posters/${fileName}`;

        let uploadError = null;
        let attempt = 0;
        const maxRetries = 3;

        while (attempt < maxRetries) {
            try {
                attempt++;
                if (attempt > 1) console.log(`[PosterDebug] Upload attempt ${attempt}/${maxRetries} for ${requestId} (prev error: ${uploadError?.message})`);

                const { error } = await supabase.storage
                    .from('posters')
                    .upload(filePath, screenshotBuffer, {
                        contentType: 'image/png',
                        cacheControl: '3600',
                        upsert: false
                    });

                if (!error) {
                    uploadError = null;
                    console.log(`[PosterDebug] Upload successful on attempt ${attempt}`);
                    break;
                }

                uploadError = error;
                console.error(`[PosterDebug] Upload failed on attempt ${attempt}:`, error);

                // Wait before retry (exponential backoff: 500ms, 1000ms)
                if (attempt < maxRetries) await new Promise(r => setTimeout(r, 500 * attempt));

            } catch (e: any) {
                console.error(`[PosterDebug] Upload exception on attempt ${attempt}:`, e);
                uploadError = e;
                // Wait before retry
                if (attempt < maxRetries) await new Promise(r => setTimeout(r, 500 * attempt));
            }
        }

        if (uploadError) {
            logger.error('Upload failed after retries', { error: uploadError, requestId });
            return NextResponse.json({
                error: 'Storage upload failed',
                details: (uploadError as any)?.message || String(uploadError)
            }, { status: 500 });
        }

        // Get Public URL
        const { data: { publicUrl } } = supabase.storage
            .from('posters')
            .getPublicUrl(filePath);

        // 5. Track Usage
        // Fire and forget
        const duration = Date.now() - startTime;

        // Use service role client to bypass RLS for administrative logging
        const adminSupabase = createServiceRoleClient();

        (adminSupabase as any).from('api_usage').insert({
            api_key_id: authContext.keyId,
            user_id: authContext.userId,
            endpoint: '/api/v1/posters/generate',
            method: 'POST',
            status_code: 200,
            resource_type: 'poster_generation',
            credits_used: 1, // Or calculate based on resolution
            response_time_ms: duration,
            request_metadata: { resolution: { width, height, pixelRatio } },
        }).then(({ error }: { error: any }) => {
            if (error) logger.error('Failed to log API usage', { error });
        });

        // Track activity event
        await trackEvent({
            eventType: 'poster_export',
            eventName: 'Poster Exported',
            userId: authContext.userId,
            metadata: {
                poster_id: requestId,
                location_name: config.location.name,
                location_coords: config.location.center,
                style_id: config.style.id,
                style_name: config.style.name,
                resolution: { width, height, pixelRatio },
                render_time_ms: duration,
                source: 'api',
                file_size_bytes: screenshotBuffer.length,
                download_url: publicUrl
            }
        });

        // 6. Return Response
        // Check if client prefers image
        const accept = req.headers.get('accept') || '';
        if (accept.includes('image/png') || accept.includes('image/*')) {
            // Fix: cast buffer to Uint8Array for NextResponse compatibility
            const body = new Uint8Array(screenshotBuffer);
            return new NextResponse(body, {
                headers: {
                    'Content-Type': 'image/png',
                    'Content-Length': screenshotBuffer.length.toString(),
                    'X-Poster-ID': requestId,
                    'X-Render-Time-Ms': duration.toString()
                }
            });
        }

        return NextResponse.json({
            id: requestId,
            status: 'completed',
            download_url: publicUrl,
            metadata: {
                render_time_ms: duration,
                file_size_bytes: screenshotBuffer.length,
                dimensions: `${width}x${height}`
            }
        });

    } catch (error) {
        logger.error('Unexpected error in POST /api/v1/posters/generate', { error });
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
