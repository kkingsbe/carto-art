import { NextRequest, NextResponse } from 'next/server';
import { SPACEPORTS_CACHE } from '@/lib/constants';
import { logger } from '@/lib/logger';
import { createError } from '@/lib/errors/ServerActionError';

export const runtime = 'nodejs';

// Use require for lru-cache to work around Next.js/Turbopack ESM module resolution issues
import type { LRUCache } from 'lru-cache';
const LRUCacheConstructor = require('lru-cache').LRUCache as new (options?: any) => LRUCache<string, any>;

// Use LRU cache for spaceports data (7-day TTL since spaceports change infrequently)
const cache = new LRUCacheConstructor({
  max: 10, // Only need to cache one response
  ttl: SPACEPORTS_CACHE.TTL_MS,
});

const CACHE_KEY = 'spaceports-geojson';
const LAUNCH_LIBRARY_API_BASE = 'https://lldev.thespacedevs.com/2.3.0/pads/';
const MAX_RESULTS_PER_PAGE = 100;

interface LaunchLibraryPad {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  active: boolean;
  location: {
    name: string;
  };
  country: {
    name: string;
    alpha_2_code: string;
  };
  total_launch_count: number;
  orbital_launch_attempt_count: number;
}

interface LaunchLibraryResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: LaunchLibraryPad[];
}

interface GeoJSONFeature {
  type: 'Feature';
  geometry: {
    type: 'Point';
    coordinates: [number, number]; // [longitude, latitude]
  };
  properties: {
    id: number;
    name: string;
    location: string;
    country: string;
    countryCode: string;
    active: boolean;
    totalLaunchCount: number;
    orbitalLaunchCount: number;
  };
}

interface GeoJSONResponse {
  type: 'FeatureCollection';
  features: GeoJSONFeature[];
}

/**
 * Fetches a single page with retry logic
 */
async function fetchPageWithRetry(url: string, retries = 3): Promise<LaunchLibraryResponse> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url, {
        headers: {
          'Accept': 'application/json',
        },
        cache: 'no-store',
      });

      if (!response.ok) {
        // Retry on 5xx errors, but not 4xx errors
        if (response.status >= 500 && attempt < retries) {
          const backoffMs = Math.pow(2, attempt - 1) * 1000; // Exponential backoff: 1s, 2s, 4s
          logger.warn(`API returned ${response.status}, retrying in ${backoffMs}ms (attempt ${attempt}/${retries})`);
          await new Promise(resolve => setTimeout(resolve, backoffMs));
          continue;
        }
        throw createError.internalError(`Launch Library API returned ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      // Retry on network errors
      if (attempt < retries && (error instanceof TypeError || (error as any).code === 'ECONNREFUSED')) {
        const backoffMs = Math.pow(2, attempt - 1) * 1000;
        logger.warn(`Network error, retrying in ${backoffMs}ms (attempt ${attempt}/${retries}):`, error);
        await new Promise(resolve => setTimeout(resolve, backoffMs));
        continue;
      }
      throw error;
    }
  }
  throw createError.internalError('All retry attempts failed');
}

/**
 * Fetches all pads from Launch Library 2 API with pagination support
 */
async function fetchAllPads(): Promise<LaunchLibraryPad[]> {
  const allPads: LaunchLibraryPad[] = [];
  let nextUrl: string | null = `${LAUNCH_LIBRARY_API_BASE}?limit=${MAX_RESULTS_PER_PAGE}&format=json`;
  const MAX_PAGES = 10; // Safety limit: max 1000 pads (10 pages * 100 per page)
  let pageCount = 0;
  const seenUrls = new Set<string>(); // Track seen URLs to detect loops

  while (nextUrl && pageCount < MAX_PAGES) {
    // Safety check: detect infinite loops
    if (seenUrls.has(nextUrl)) {
      logger.warn(`Infinite loop detected in pagination: URL ${nextUrl} already fetched`);
      break;
    }
    seenUrls.add(nextUrl);
    pageCount++;

    try {
      const data = await fetchPageWithRetry(nextUrl);
      
      // Filter out pads with invalid coordinates
      const validPads = data.results.filter(
        (pad) => 
          pad.latitude != null && 
          pad.longitude != null &&
          !isNaN(pad.latitude) &&
          !isNaN(pad.longitude) &&
          pad.latitude >= -90 && pad.latitude <= 90 &&
          pad.longitude >= -180 && pad.longitude <= 180
      );

      allPads.push(...validPads);
      
      nextUrl = data.next;
      
      // Small delay between paginated requests to be respectful
      if (data.next) {
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    } catch (error) {
      logger.error('Error fetching pads from Launch Library API:', error);
      throw error;
    }
  }

  if (pageCount >= MAX_PAGES) {
    logger.warn(`Reached maximum page limit (${MAX_PAGES}) while fetching spaceports. More data may be available.`);
  }

  return allPads;
}

/**
 * Converts Launch Library API pad data to GeoJSON format
 */
function convertToGeoJSON(pads: LaunchLibraryPad[]): GeoJSONResponse {
  const features: GeoJSONFeature[] = pads.map((pad) => ({
    type: 'Feature',
    geometry: {
      type: 'Point',
      coordinates: [pad.longitude, pad.latitude], // GeoJSON uses [lon, lat]
    },
    properties: {
      id: pad.id,
      name: pad.name,
      location: pad.location?.name || '',
      country: pad.country?.name || '',
      countryCode: pad.country?.alpha_2_code || '',
      active: pad.active ?? true,
      totalLaunchCount: pad.total_launch_count || 0,
      orbitalLaunchCount: pad.orbital_launch_attempt_count || 0,
    },
  }));

  return {
    type: 'FeatureCollection',
    features,
  };
}

export async function GET(request: NextRequest) {
  try {
    // Check cache first
    const cached = cache.get(CACHE_KEY);
    if (cached) {
      logger.debug('Returning cached spaceports GeoJSON');
      return NextResponse.json(cached, {
        headers: {
          'Content-Type': 'application/geo+json',
          'Cache-Control': 'public, max-age=604800', // 7 days in seconds
        },
      });
    }

    // Fetch all pads from API
    logger.info('Fetching spaceports data from Launch Library API...');
    const pads = await fetchAllPads();
    
    if (pads.length === 0) {
      logger.warn('No valid pads found in Launch Library API response');
      // Return empty GeoJSON instead of error
      const emptyGeoJSON: GeoJSONResponse = {
        type: 'FeatureCollection',
        features: [],
      };
      return NextResponse.json(emptyGeoJSON, {
        headers: {
          'Content-Type': 'application/geo+json',
          'Cache-Control': 'public, max-age=300', // Short cache for errors
        },
      });
    }

    // Convert to GeoJSON
    const geoJSON = convertToGeoJSON(pads);
    
    // Cache the result
    cache.set(CACHE_KEY, geoJSON);
    logger.info(`Successfully fetched and cached ${pads.length} spaceport pads`);

    return NextResponse.json(geoJSON, {
      headers: {
        'Content-Type': 'application/geo+json',
        'Cache-Control': 'public, max-age=604800', // 7 days in seconds
      },
    });
  } catch (error) {
    logger.error('Unhandled spaceports API error:', error);
    
    // Try to return cached data even if expired, as fallback
    const cached = cache.get(CACHE_KEY);
    if (cached) {
      logger.warn('API error, returning stale cached data');
      return NextResponse.json(cached, {
        headers: {
          'Content-Type': 'application/geo+json',
          'Cache-Control': 'public, max-age=300', // Short cache for stale data
          'X-Data-Freshness': 'stale', // Indicate this is stale/fallback data
        },
      });
    }
    
    // If no cache, return empty GeoJSON
    const emptyGeoJSON: GeoJSONResponse = {
      type: 'FeatureCollection',
      features: [],
    };
    
    return NextResponse.json(emptyGeoJSON, {
      status: 500,
      headers: {
        'Content-Type': 'application/geo+json',
        'Cache-Control': 'no-store',
      },
    });
  }
}

