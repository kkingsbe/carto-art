import { NextRequest, NextResponse } from 'next/server';

/**
 * Proxy endpoint to fetch external images and return them with proper CORS headers.
 * This is needed because Printful's S3 bucket doesn't allow cross-origin access.
 * 
 * Usage: /api/proxy-image?url=<encoded-image-url>
 */
export async function GET(request: NextRequest) {
    const url = request.nextUrl.searchParams.get('url');

    console.log('[ProxyImage] Request received', {
        url: url?.substring(0, 100),
        hasUrl: !!url,
        fullUrl: url
    });

    if (!url) {
        console.error('[ProxyImage] Missing url parameter');
        return NextResponse.json(
            { error: 'Missing url parameter' },
            { status: 400 }
        );
    }

    try {
        // Validate the URL is from allowed domains
        const parsedUrl = new URL(url);
        const allowedDomains = [
            'printful-upload.s3-accelerate.amazonaws.com',
            'printful.s3.amazonaws.com',
            's3.amazonaws.com',
            'supabase.co', // Allow Supabase storage for mockup templates
        ];

        const isAllowed = allowedDomains.some(domain =>
            parsedUrl.hostname === domain || parsedUrl.hostname.endsWith(`.${domain}`)
        );

        console.log('[ProxyImage] URL validation', {
            hostname: parsedUrl.hostname,
            isAllowed,
            allowedDomains
        });

        if (!isAllowed) {
            console.error('[ProxyImage] Domain not allowed', { hostname: parsedUrl.hostname });
            return NextResponse.json(
                { error: 'Domain not allowed' },
                { status: 403 }
            );
        }

        console.log('[ProxyImage] Fetching image from S3', {
            url: url.substring(0, 100)
        });

        // Fetch the image with a User-Agent to satisfy S3 checks
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });

        console.log('[ProxyImage] S3 response', {
            status: response.status,
            statusText: response.statusText,
            ok: response.ok,
            contentType: response.headers.get('content-type'),
            contentLength: response.headers.get('content-length')
        });

        if (!response.ok) {
            console.error('[ProxyImage] Failed to fetch image', {
                status: response.status,
                statusText: response.statusText,
                url: url.substring(0, 100)
            });
            return NextResponse.json(
                { error: `Failed to fetch image: ${response.status}` },
                { status: response.status }
            );
        }

        const contentType = response.headers.get('content-type') || 'image/png';
        const buffer = await response.arrayBuffer();

        console.log('[ProxyImage] Successfully proxied image', {
            contentType,
            size: buffer.byteLength,
            url: url.substring(0, 100)
        });

        // Return the image with CORS headers
        return new NextResponse(buffer, {
            status: 200,
            headers: {
                'Content-Type': contentType,
                'Cache-Control': 'public, max-age=86400', // Cache for 24 hours
                'Access-Control-Allow-Origin': '*',
            },
        });
    } catch (error) {
        console.error('[ProxyImage] Error:', error);
        return NextResponse.json(
            { error: 'Failed to proxy image' },
            { status: 500 }
        );
    }
}
