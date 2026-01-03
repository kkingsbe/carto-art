import { NextRequest, NextResponse } from 'next/server';
import { authenticateApiRequest } from '@/lib/auth/api-middleware';
import { getBrowser } from '@/lib/rendering/browser';
import { createClient, createServiceRoleClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';
import { z } from 'zod';
import { randomUUID } from 'crypto';

// Basic Validation Schema (You might want to make this stricter/more complete)
// Using a loose schema for now to accept the existing PosterConfig structure
const GeneratePosterSchema = z.object({
    config: z.object({
        palette: z.object({
            background: z.string(),
            text: z.string(),
            // Add other critical fields as optional if needed, but background/text are usually essential
        }).passthrough(),
    }).passthrough(),
    resolution: z.object({
        width: z.number().min(100).max(10000),
        height: z.number().min(100).max(10000),
        pixelRatio: z.number().min(1).max(4).optional().default(1)
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
            };
            return NextResponse.json(
                { error: authResult.reason === 'rate_limited' ? 'Too Many Requests' : 'Unauthorized', message: authResult.message },
                { status: statusMap[authResult.reason] }
            );
        }
        const authContext = authResult.context;
        console.log(`[PosterDebug] Auth successful for ${requestId}`);

        // 2. Parse Body
        const rawBody = await req.text();
        console.log(`[PosterDebug] Request from ${authContext.userId} - Body size: ${rawBody.length} bytes`);

        if (rawBody.length > 0) {
            console.log(`[PosterDebug] Raw Body Preview: ${rawBody.slice(0, 500)}`);
        } else {
            console.warn(`[PosterDebug] WARNING: Received EMPTY body for requestId ${requestId}`);
        }

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

        const validation = GeneratePosterSchema.safeParse(body);

        if (!validation.success) {
            console.error(`[PosterDebug] Validation failed for ${requestId}:`, JSON.stringify(validation.error.flatten(), null, 2));
            return NextResponse.json(
                { error: 'Invalid request', details: validation.error.flatten() },
                { status: 400 }
            );
        }

        const { config, resolution } = validation.data;
        const { width, height, pixelRatio } = resolution;

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
            request_metadata: { resolution },
        }).then(({ error }: { error: any }) => {
            if (error) logger.error('Failed to log API usage', { error });
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
