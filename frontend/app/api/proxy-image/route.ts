import { NextRequest, NextResponse } from 'next/server';

/**
 * Proxy endpoint to fetch external images and return them with proper CORS headers.
 * This is needed because Printful's S3 bucket doesn't allow cross-origin access.
 * 
 * Usage: /api/proxy-image?url=<encoded-image-url>
 */
export async function GET(request: NextRequest) {
    const url = request.nextUrl.searchParams.get('url');

    if (!url) {
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
        ];

        const isAllowed = allowedDomains.some(domain =>
            parsedUrl.hostname === domain || parsedUrl.hostname.endsWith(`.${domain}`)
        );

        if (!isAllowed) {
            return NextResponse.json(
                { error: 'Domain not allowed' },
                { status: 403 }
            );
        }

        // Fetch the image with a User-Agent to satisfy S3 checks
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });

        if (!response.ok) {
            return NextResponse.json(
                { error: `Failed to fetch image: ${response.status}` },
                { status: response.status }
            );
        }

        const contentType = response.headers.get('content-type') || 'image/png';
        const buffer = await response.arrayBuffer();

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
        console.error('Image proxy error:', error);
        return NextResponse.json(
            { error: 'Failed to proxy image' },
            { status: 500 }
        );
    }
}
