import type { PosterLocation } from '@/types/poster';
import { createError } from '@/lib/errors/ServerActionError';
import { logger } from '@/lib/logger';

export interface SearchOptions {
  limit?: number;
}

// Keep searchLocation pointing to our internal API (LocationIQ) for better search quality
export async function searchLocation(
  query: string,
  options: SearchOptions = {},
  signal?: AbortSignal
): Promise<PosterLocation[]> {
  const q = query.trim();
  if (!q) return [];

  const params = new URLSearchParams({
    q,
    limit: String(options.limit ?? 5),
  });

  // This goes to our Next.js API route which wraps LocationIQ
  const resp = await fetch(`/api/geocode?${params.toString()}`, { signal });

  if (!resp.ok) {
    if (resp.status === 503) {
      throw new Error('Service busy');
    }

    let errorDetail = '';
    try {
      const errorJson = await resp.json();
      errorDetail = errorJson.error || errorJson.details || errorJson.message || '';

      if (!errorDetail && errorJson && typeof errorJson === 'object') {
        errorDetail = JSON.stringify(errorJson);
      }
    } catch {
      // ignore
    }

    const baseMsg = `Geocoding error ${resp.status}`;
    throw createError.internalError(errorDetail ? `${baseMsg}: ${errorDetail}` : `${baseMsg}`);
  }

  const data = await resp.json();
  if (!Array.isArray(data)) return [];
  return data as PosterLocation[];
}

interface NominatimAddress {
  road?: string;
  suburb?: string;
  city?: string;
  town?: string;
  village?: string;
  state?: string;
  postcode?: string;
  country?: string;
  country_code?: string;
  [key: string]: string | undefined;
}

interface NominatimResponse {
  place_id: number;
  licence: string;
  lat: string;
  lon: string;
  display_name: string;
  address: NominatimAddress;
  boundingbox: string[];
}

// Switch reverseGeocode to use OSM Nominatim directly (Free tier)
// Usage Policy: https://operations.osmfoundation.org/policies/nominatim/
// - No heavy uses (an absolute maximum of 1 request per second)
// - Provide a valid User-Agent (browser handles this automatically)
export async function reverseGeocode(
  lat: number,
  lon: number,
  signal?: AbortSignal
): Promise<PosterLocation | null> {
  const params = new URLSearchParams({
    lat: String(lat),
    lon: String(lon),
    format: 'json',
    zoom: '18',
    addressdetails: '1'
  });

  try {
    const resp = await fetch(`https://nominatim.openstreetmap.org/reverse?${params.toString()}`, {
      signal,
      headers: {
        // Ideally we should include a contact email, but this is a client-side call
        // Browser sets User-Agent automatically
        'Accept-Language': 'en-US,en;q=0.9'
      }
    });

    if (!resp.ok) {
      if (resp.status === 404) return null;
      throw new Error(`Nominatim error: ${resp.status}`);
    }

    const data: NominatimResponse = await resp.json();

    // Map Nominatim response to PosterLocation
    const addr = data.address || {};
    const city = addr.city || addr.town || addr.village || addr.suburb || addr.road;
    const state = addr.state;
    const country = addr.country;

    // Construct primary name
    let name = city;
    if (!name && addr.road) name = addr.road;
    if (!name) name = country;

    // Construct subtitle
    const parts = [state, country].filter(Boolean) as string[];
    const subtitle = parts.join(', ');

    // Parse bbox [minlat, maxlat, minlon, maxlon]
    // Note: Nominatim returns strings
    const bbox = data.boundingbox.map(parseFloat);
    const [minLat, maxLat, minLon, maxLon] = bbox;

    return {
      name: name || 'Unknown Location',
      city: city || '',
      subtitle: subtitle,
      center: [parseFloat(data.lon), parseFloat(data.lat)],
      // Convert [minlat, maxlat, minlon, maxlon] to [[minLon, minLat], [maxLon, maxLat]]
      bounds: [[minLon, minLat], [maxLon, maxLat]],
      // Estimate zoom - simplified compared to our robust server-side logic but sufficient for "My Location"
      zoom: 12
    };

  } catch (err: any) {
    logger.warn('Nominatim reverse geocode failed', err);
    // Don't throw to end user for background location lookups, just return null so UI handles it gracefully
    return null;
  }
}
