import { NextRequest, NextResponse } from 'next/server';
import { CACHE, GEOCODING, API } from '@/lib/constants';
import { logger } from '@/lib/logger';
import { checkRateLimit } from '@/lib/middleware/rateLimit';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

// Use require for lru-cache to work around Next.js/Turbopack ESM module resolution issues
import type { LRUCache } from 'lru-cache';
const LRUCacheConstructor = require('lru-cache').LRUCache as new (options?: any) => LRUCache<string, any>;

// Use LRU cache for better eviction strategy and automatic TTL management
const cache = new LRUCacheConstructor({
  max: CACHE.SIZE_LIMIT,
  ttl: CACHE.TTL_MS,
});

/**
 * Rate limiting: Nominatim policy is ~1 request per second.
 * We use a serialized queue to ensure we don't hit the API too fast from this instance.
 * NOTE: This is per-instance, so with multiple instances, we still need per-user rate limiting.
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

/**
 * Fetch from Nominatim with retry logic and timeout
 */
async function fetchFromNominatim(
  endpoint: 'search' | 'reverse', 
  params: URLSearchParams,
  retries = 3
): Promise<{ __error?: boolean; status?: number; text?: string; data?: any }> {
  const userAgent =
    process.env.NOMINATIM_USER_AGENT?.trim() ||
    process.env.VERCEL_URL?.trim()?.replace(/^/, 'carto-art/') ||
    'carto-art (dev)';

  const fromEmail = process.env.NOMINATIM_FROM_EMAIL?.trim();

  const url = `https://nominatim.openstreetmap.org/${endpoint}?${params.toString()}`;

  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      // Add timeout to prevent hanging requests
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      const resp = await fetch(url, {
        headers: {
          'User-Agent': userAgent,
          ...(fromEmail ? { From: fromEmail } : {}),
        },
        cache: 'no-store',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Handle rate limiting (429) or service unavailable (503)
      if (resp.status === 429 || resp.status === 503) {
        const retryAfter = resp.headers.get('Retry-After');
        const waitTime = retryAfter 
          ? parseInt(retryAfter, 10) * 1000 
          : Math.min(1000 * Math.pow(2, attempt), 10000); // Exponential backoff, max 10s
        
        if (attempt < retries - 1) {
          logger.warn(`Nominatim rate limited, retrying after ${waitTime}ms`, { 
            status: resp.status, 
            attempt: attempt + 1,
            retries 
          });
          await sleep(waitTime);
          continue;
        }
        
        const text = await resp.text().catch(() => 'Rate limit exceeded');
        return { __error: true, status: resp.status, text };
      }

      if (!resp.ok) {
        const text = await resp.text().catch(() => '');
        return { __error: true, status: resp.status, text };
      }

      const data = await resp.json();
      return { data };
    } catch (err) {
      // Handle timeout or network errors
      if (err instanceof Error && err.name === 'AbortError') {
        if (attempt < retries - 1) {
          logger.warn('Nominatim request timeout, retrying', { attempt: attempt + 1, retries });
          await sleep(1000 * Math.pow(2, attempt)); // Exponential backoff
          continue;
        }
        return { __error: true, status: 504, text: 'Request timeout' };
      }

      const msg = err instanceof Error ? err.message : 'Unknown network error';
      
      // Retry on network errors
      if (attempt < retries - 1) {
        logger.warn('Nominatim network error, retrying', { 
          error: msg, 
          attempt: attempt + 1, 
          retries 
        });
        await sleep(1000 * Math.pow(2, attempt)); // Exponential backoff
        continue;
      }
      
      return { __error: true, status: 500, text: msg };
    }
  }

  return { __error: true, status: 500, text: 'Max retries exceeded' };
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
    // Per-user rate limiting: 10 requests per minute per user
    const userId = await getUserId(request);
    if (userId) {
      const rateLimit = await checkRateLimit(userId, 'geocode', 10, 60 * 1000);
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

      const result = await enqueue(() => 
        fetchFromNominatim('reverse', new URLSearchParams({
          lat, lon, format: 'json', addressdetails: '1', namedetails: '1'
        }))
      );

      if (result.__error) {
        logger.error('Reverse geocoding failed', { 
          status: result.status, 
          text: result.text,
          userId 
        });
        return NextResponse.json(
          { 
            error: 'Reverse geocoding failed', 
            details: result.text,
            retryable: result.status === 429 || result.status === 503
          },
          { status: result.status || 500 }
        );
      }

      const payload = result.data;
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

    const result = await enqueue(() =>
      fetchFromNominatim('search', new URLSearchParams({
        q, format: 'json', limit: String(limit), addressdetails: '1', namedetails: '1'
      }))
    );

    if (result.__error) {
      logger.error('Geocoding failed', { 
        status: result.status, 
        text: result.text,
        query: q,
        userId 
      });
      return NextResponse.json(
        { 
          error: 'Geocoding failed', 
          details: result.text,
          retryable: result.status === 429 || result.status === 503
        },
        { status: result.status || 500 }
      );
    }

    const payload = result.data;
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
