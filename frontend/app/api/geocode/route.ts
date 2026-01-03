import { NextRequest, NextResponse } from 'next/server';
import { CACHE, GEOCODING } from '@/lib/constants';
import { logger } from '@/lib/logger';
import { checkRateLimit } from '@/lib/middleware/rateLimit';
import { createClient } from '@/lib/supabase/server';
import { searchLocation, reverseGeocode } from '@/lib/geocoding/locationiq';

export const runtime = 'nodejs';

// Use require for lru-cache to work around Next.js/Turbopack ESM module resolution issues
import type { LRUCache } from 'lru-cache';
const LRUCacheConstructor = require('lru-cache').LRUCache as new (options?: any) => LRUCache<string, any>;

// Use LRU cache to save API calls
const cache = new LRUCacheConstructor({
  max: CACHE.SIZE_LIMIT,
  ttl: CACHE.TTL_MS,
});

function getFromCache(key: string) {
  return cache.get(key) ?? null;
}

function setToCache(key: string, payload: unknown) {
  cache.set(key, payload);
}

/**
 * Get user ID from request (for rate limiting)
 */
async function getUserId(request: NextRequest): Promise<string | null> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    return user?.id ?? null;
  } catch {
    // If auth fails, use IP as fallback identifier
    const forwarded = request.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0].trim() :
      request.headers.get('x-real-ip') ??
      'anonymous';
    return `ip:${ip}`;
  }
}

export async function GET(request: NextRequest) {
  try {
    // Per-user rate limiting: 20 requests per minute per user (generous but prevents abuse)
    const userId = await getUserId(request);
    if (userId) {
      const rateLimit = await checkRateLimit(userId, 'geocode', 20, 60 * 1000);
      if (!rateLimit.allowed) {
        return NextResponse.json(
          {
            error: 'Rate limit exceeded',
            retryAfter: rateLimit.retryAfter,
            message: 'Too many geocoding requests. Please wait a moment and try again.'
          },
          {
            status: 429,
            headers: {
              'Retry-After': String(rateLimit.retryAfter ?? 60),
              'Cache-Control': 'no-store'
            }
          }
        );
      }
    }

    const url = new URL(request.url);
    const qRaw = (url.searchParams.get('q') ?? '').trim();
    const latStr = url.searchParams.get('lat');
    const lonStr = url.searchParams.get('lon');

    // Handle Reverse Geocoding
    if (latStr && lonStr) {
      const lat = parseFloat(latStr);
      const lon = parseFloat(lonStr);

      const cacheKey = `rev:${lat}:${lon}`;
      const cached = getFromCache(cacheKey);
      if (cached) {
        return NextResponse.json(cached, {
          headers: { 'Cache-Control': 'public, max-age=300' },
        });
      }

      const result = await reverseGeocode(lat, lon);

      if (!result) {
        return NextResponse.json({ error: 'Location not found' }, { status: 404 });
      }

      setToCache(cacheKey, result);
      return NextResponse.json(result, {
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

    const results = await searchLocation(q, { limit });

    setToCache(cacheKey, results);

    return NextResponse.json(results, {
      headers: { 'Cache-Control': 'public, max-age=300' },
    });
  } catch (error: any) {
    logger.error('Unhandled geocode API error:', error);

    // Pass through status codes if they exist (e.g. 429 from lib)
    const status = error.status || 500;
    const message = error.message || 'Internal Server Error';

    return NextResponse.json(
      {
        error: message,
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status }
    );
  }
}
