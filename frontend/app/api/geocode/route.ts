import { NextRequest, NextResponse } from 'next/server';
import { CACHE, GEOCODING, API } from '@/lib/constants';
import { logger } from '@/lib/logger';

export const runtime = 'nodejs';

// Use require for lru-cache to work around Next.js/Turbopack ESM module resolution issues
import type { LRUCache } from 'lru-cache';
const LRUCacheConstructor = require('lru-cache').LRUCache as new (options?: any) => LRUCache<string, unknown>;

// Use LRU cache for better eviction strategy and automatic TTL management
const cache = new LRUCacheConstructor<string, unknown>({
  max: CACHE.SIZE_LIMIT,
  ttl: CACHE.TTL_MS,
});

/**
 * Rate limiting: Nominatim policy is ~1 request per second.
 * We use a serialized queue to ensure we don't hit the API too fast from this instance.
 */
let lastRequestTime = 0;
let queue: Promise<unknown> = Promise.resolve();

function sleep(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

function enqueue<T>(task: () => Promise<T>): Promise<T> {
  const run = async () => {
    const now = Date.now();
    const wait = Math.max(0, API.MIN_REQUEST_INTERVAL_MS - (now - lastRequestTime));
    if (wait) await sleep(wait);
    lastRequestTime = Date.now();
    return task();
  };

  const p = queue.then(run, run) as Promise<T>;
  queue = p.then(() => undefined, () => undefined);
  return p;
}

function getFromCache(key: string) {
  return cache.get(key) ?? null;
}

function setToCache(key: string, payload: unknown) {
  cache.set(key, payload);
}

async function fetchFromNominatim(endpoint: 'search' | 'reverse', params: URLSearchParams) {
  const userAgent =
    process.env.NOMINATIM_USER_AGENT?.trim() ||
    process.env.VERCEL_URL?.trim()?.replace(/^/, 'carto-art/') ||
    'carto-art (dev)';

  const fromEmail = process.env.NOMINATIM_FROM_EMAIL?.trim();

  const url = `https://nominatim.openstreetmap.org/${endpoint}?${params.toString()}`;

  try {
    const resp = await fetch(url, {
      headers: {
        'User-Agent': userAgent,
        ...(fromEmail ? { From: fromEmail } : {}),
      },
      cache: 'no-store',
    });

    if (!resp.ok) {
      const text = await resp.text().catch(() => '');
      return { __error: true, status: resp.status, text };
    }

    return await resp.json();
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown network error';
    return { __error: true, status: 500, text: msg };
  }
}

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const qRaw = (url.searchParams.get('q') ?? '').trim();
    const lat = url.searchParams.get('lat');
    const lon = url.searchParams.get('lon');

    // Handle Reverse Geocoding
    if (lat && lon) {
      const cacheKey = `rev:${lat}:${lon}`;
      const cached = getFromCache(cacheKey);
      if (cached) {
        return NextResponse.json(cached, {
          headers: { 'Cache-Control': 'public, max-age=300' },
        });
      }

      const payload = await enqueue(() => 
        fetchFromNominatim('reverse', new URLSearchParams({
          lat, lon, format: 'json', addressdetails: '1', namedetails: '1'
        }))
      );

      if (payload && typeof payload === 'object' && (payload as any).__error) {
        return NextResponse.json(
          { error: 'Reverse geocoding failed', details: (payload as any).text },
          { status: (payload as any).status }
        );
      }

      setToCache(cacheKey, payload);
      return NextResponse.json(payload, {
        headers: { 'Cache-Control': 'public, max-age=300' },
      });
    }

    // Forward Geocoding
    const q = qRaw.replace(/\s+/g, ' ');

    if (!q || q.length < GEOCODING.MIN_QUERY_LEN) {
      return NextResponse.json([], { headers: { 'Cache-Control': 'no-store' } });
    }
    if (q.length > GEOCODING.MAX_QUERY_LEN) {
      return NextResponse.json({ error: 'Query too long' }, { status: 400 });
    }

    const limitParam = Number(url.searchParams.get('limit') ?? GEOCODING.DEFAULT_LIMIT);
    const limit = Number.isFinite(limitParam)
      ? Math.min(Math.max(1, limitParam), GEOCODING.MAX_LIMIT)
      : GEOCODING.DEFAULT_LIMIT;

    const cacheKey = `search:${q.toLowerCase()}:${limit}`;
    const cached = getFromCache(cacheKey);
    if (cached) {
      return NextResponse.json(cached, {
        headers: { 'Cache-Control': 'public, max-age=300' },
      });
    }

    const payload = await enqueue(() =>
      fetchFromNominatim('search', new URLSearchParams({
        q, format: 'json', limit: String(limit), addressdetails: '1', namedetails: '1'
      }))
    );

    if (payload && typeof payload === 'object' && (payload as any).__error) {
      return NextResponse.json(
        { error: 'Geocoding failed', details: (payload as any).text },
        { status: (payload as any).status }
      );
    }

    setToCache(cacheKey, payload);

    return NextResponse.json(payload, {
      headers: { 'Cache-Control': 'public, max-age=300' },
    });
  } catch (error) {
    logger.error('Unhandled geocode API error:', error);
    return NextResponse.json(
      { 
        error: 'Internal Server Error', 
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
