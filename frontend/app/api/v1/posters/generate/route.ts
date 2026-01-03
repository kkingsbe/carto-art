import { NextRequest, NextResponse } from 'next/server';
import { authenticateApiRequest } from '@/lib/auth/api-middleware';
import { getBrowser } from '@/lib/rendering/browser';
import { createClient } from '@/lib/supabase/server';
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

            // Set viewport to target resolution
            await page.setViewport({
                width: Math.round(width / pixelRatio),
                height: Math.round(height / pixelRatio),
                deviceScaleFactor: pixelRatio,
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

            // Forward console logs from the browser to the node console
            page.on('console', msg => {
                const type = msg.type();
                const text = msg.text();
                // Filter out some noise if needed, but for now we want everything
                console.log(`[Browser Console] ${type.toUpperCase()}: ${text}`);
            });

            page.on('pageerror', (err: unknown) => {
                console.error(`[Browser Error] ${String(err)}`);
            });

            // Wait for rendering to complete (or timeout)
            // We assume the renderer appends <div id="render-complete"></div>
            console.log(`[PosterDebug] Config injected, waiting for #render-complete for ${requestId}`);
            await page.waitForSelector('#render-complete', { timeout: 60000 });
            console.log(`[PosterDebug] Render complete selector found for ${requestId}`);

            // Screenshot
            console.log(`[PosterDebug] Taking screenshot for ${requestId}`);
            screenshotBuffer = await page.screenshot({
                type: 'png',
                fullPage: true,
                omitBackground: false
            }) as Buffer;

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
        const supabase = await createClient();
        const fileName = `${requestId}.png`;
        const filePath = `api-posters/${fileName}`;

        const { error: uploadError } = await supabase.storage
            .from('posters')
            .upload(filePath, screenshotBuffer, {
                contentType: 'image/png',
                cacheControl: '3600',
                upsert: false
            });

        if (uploadError) {
            logger.error('Upload failed', { error: uploadError, requestId });
            return NextResponse.json({ error: 'Storage upload failed' }, { status: 500 });
        }

        // Get Public URL
        const { data: { publicUrl } } = supabase.storage
            .from('posters')
            .getPublicUrl(filePath);

        // 5. Track Usage
        // Fire and forget
        const duration = Date.now() - startTime;
        (supabase as any).from('api_usage').insert({
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
