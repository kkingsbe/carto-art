import { NextRequest, NextResponse } from 'next/server';

const SOURCES: Record<string, string> = {
  openfreemap: 'https://tiles.openfreemap.org/',
  maptiler: 'https://api.maptiler.com/',
  kontur: 'https://disaster.ninja/active/api/tiles/bivariate/v1/',
  osm: 'https://tiles.openstreetmap.org/',
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path: pathArray } = await params;
    
    if (!pathArray || pathArray.length < 2) {
      return NextResponse.json({ error: 'Invalid path' }, { status: 400 });
    }

    const sourceKey = pathArray[0];
    const baseUrl = SOURCES[sourceKey];
    
    if (!baseUrl) {
      return NextResponse.json({ error: `Unknown source: ${sourceKey}` }, { status: 400 });
    }

    // Reconstruct the remaining path
    const remainingPath = pathArray.slice(1).join('/');
    
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
    const tileUrl = `${baseUrl}${remainingPath}${searchParams ? '?' + searchParams : ''}`;
    
    const response = await fetch(tileUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'No error body');
      console.error(`Tile fetch error (${response.status}) for ${tileUrl}:`, errorText);
      return NextResponse.json(
        { 
          error: 'Upstream fetch failed', 
          status: response.status, 
          url: tileUrl,
          details: errorText.slice(0, 500) 
        }, 
        { status: response.status }
      );
    }

    const data = await response.arrayBuffer();
    const contentType = response.headers.get('Content-Type') || '';

    // If this is a TileJSON request for OpenFreeMap, override the maxzoom and tiles
    if (sourceKey === 'openfreemap' && remainingPath === 'planet' && contentType.includes('application/json')) {
      try {
        const text = new TextDecoder().decode(data);
        const json = JSON.parse(text);
        
        // Override maxzoom to 15 to unlock high-detail tiles
        if (json.maxzoom) {
          json.maxzoom = 15;
        }

        // Rewrite tile URLs to go through our proxy
        if (json.tiles && Array.isArray(json.tiles)) {
          json.tiles = json.tiles.map((url: string) => {
            const matches = url.match(/https:\/\/tiles\.openfreemap\.org\/(.*)/);
            if (matches && matches[1]) {
              // Use absolute URLs to avoid MapLibre Request construction errors in workers
              return `${origin}/api/tiles/openfreemap/${matches[1]}`;
            }
            return url;
          });
        }

        const modifiedData = new TextEncoder().encode(JSON.stringify(json));
        return new NextResponse(modifiedData, {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            // Avoid caching rewritten TileJSON, which could preserve stale relative tile URLs in production.
            'Cache-Control': 'no-store',
            'Access-Control-Allow-Origin': '*',
            // Helpful for proxies/CDNs that cache by header variations
            'Vary': 'Host, X-Forwarded-Host, X-Forwarded-Proto',
          },
        });
      } catch (e) {
        console.error('Error overriding OpenFreeMap TileJSON:', e);
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
    console.error('Tile proxy error:', error);
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

