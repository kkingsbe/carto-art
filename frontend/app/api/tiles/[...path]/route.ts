import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

const SOURCES: Record<string, string> = {
  openfreemap: 'https://tiles.openfreemap.org/',
  maptiler: 'https://api.maptiler.com/',
  kontur: 'https://disaster.ninja/active/api/tiles/bivariate/v1/',
  osm: 'https://tiles.openstreetmap.org/',
  'aws-terrain': 'https://s3.amazonaws.com/elevation-tiles-prod/',
};

// Allowlist of valid source keys for security
const ALLOWED_SOURCES = Object.keys(SOURCES);

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path: pathArray } = await params;

    if (!pathArray || pathArray.length < 2) {
      return NextResponse.json({ error: 'Invalid path: path must contain at least 2 segments' }, { status: 400 });
    }

    const sourceKey = pathArray[0];

    // Validate source key against allowlist
    if (!ALLOWED_SOURCES.includes(sourceKey)) {
      return NextResponse.json({
        error: `Unknown source: ${sourceKey}`,
        allowedSources: ALLOWED_SOURCES
      }, { status: 400 });
    }

    const baseUrl = SOURCES[sourceKey];

    // Reconstruct the remaining path
    const remainingPath = pathArray.slice(1).join('/');

    // Validate path doesn't contain dangerous patterns (path traversal, double slashes, etc.)
    if (remainingPath.includes('..') || remainingPath.includes('//') || remainingPath.startsWith('/')) {
      return NextResponse.json({
        error: 'Invalid path: path contains dangerous patterns',
        details: 'Path traversal and double slashes are not allowed'
      }, { status: 400 });
    }

    // Additional validation: ensure path segments don't contain control characters or special patterns
    const dangerousPatterns = /[<>:"|?*\x00-\x1f]/;
    if (dangerousPatterns.test(remainingPath)) {
      return NextResponse.json({
        error: 'Invalid path: path contains invalid characters'
      }, { status: 400 });
    }

    // Construct the target URL
    const urlObj = new URL(request.url);
    // In production we may be behind a proxy/CDN, so build a public origin using forwarded headers.
    // This is critical because MapLibre workers can fail to resolve relative URLs like "/api/tiles/...".
    const forwardedProto = request.headers.get('x-forwarded-proto') ?? urlObj.protocol.replace(':', '');
    const forwardedHost =
      request.headers.get('x-forwarded-host') ??
      request.headers.get('host') ??
      urlObj.host;
    const origin = forwardedHost ? `${forwardedProto}://${forwardedHost}` : urlObj.origin;
    const searchParams = urlObj.searchParams.toString();
    const targetUrl = `${baseUrl}${remainingPath}${searchParams ? '?' + searchParams : ''}`;

    // Log the constructed URL for debugging purposes (especially for export failures)
    // logger.debug(`Proxying ${request.url} to ${targetUrl}`);

    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'No error body');
      logger.error(`Tile fetch error (${response.status}) for ${targetUrl}:`, errorText);
      return NextResponse.json(
        {
          error: 'Upstream fetch failed',
          status: response.status,
          url: targetUrl,
          details: errorText.slice(0, 500)
        },
        { status: response.status }
      );
    }

    const data = await response.arrayBuffer();
    const contentType = response.headers.get('Content-Type') || '';

    // If this is a TileJSON request (OpenFreeMap or MapTiler), rewrite tile URLs to go through our proxy
    const isTileJson = contentType.includes('application/json') && (remainingPath.endsWith('tiles.json') || remainingPath === 'planet');

    if (isTileJson) {
      try {
        const text = new TextDecoder().decode(data);
        const json = JSON.parse(text);

        // OpenFreeMap specific: Override maxzoom to 15 to unlock high-detail tiles
        if (sourceKey === 'openfreemap' && json.maxzoom) {
          json.maxzoom = 15;
        }

        // Rewrite tile URLs to go through our proxy
        if (json.tiles && Array.isArray(json.tiles)) {
          json.tiles = json.tiles.map((url: string) => {
            // Handle OpenFreeMap
            if (sourceKey === 'openfreemap') {
              const matches = url.match(/https:\/\/tiles\.openfreemap\.org\/(.*)/);
              if (matches && matches[1]) {
                return `${origin}/api/tiles/openfreemap/${matches[1]}`;
              }
            }

            // Handle MapTiler
            if (sourceKey === 'maptiler') {
              const matches = url.match(/https:\/\/api\.maptiler\.com\/(.*)/);
              if (matches && matches[1]) {
                // MapTiler URLs in TileJSON already include the key, but we want to proxy them
                // We'll strip the key if it's already in our searchParams to avoid duplication, 
                // but the current proxy setup just appends searchParams from the request.
                return `${origin}/api/tiles/maptiler/${matches[1]}`;
              }
            }

            return url;
          });
        }

        const modifiedData = new TextEncoder().encode(JSON.stringify(json));
        return new NextResponse(modifiedData, {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-store',
            'Access-Control-Allow-Origin': '*',
            'Vary': 'Host, X-Forwarded-Host, X-Forwarded-Proto',
          },
        });
      } catch (e) {
        logger.error(`Error overriding ${sourceKey} TileJSON:`, e);
      }
    }

    return new NextResponse(data, {
      status: 200,
      headers: {
        'Content-Type': contentType || 'application/x-protobuf',
        'Cache-Control': 'public, max-age=86400',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    logger.error('Tile proxy error:', error);
    return NextResponse.json(
      {
        error: 'Proxy exception',
        message: error instanceof Error ? error.message : 'Unknown error',
        details: error instanceof Error ? error.stack : String(error)
      },
      { status: 500 }
    );
  }
}

