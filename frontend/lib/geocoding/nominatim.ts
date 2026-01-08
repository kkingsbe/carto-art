import type { PosterLocation } from '@/types/poster';
import { createError } from '@/lib/errors/ServerActionError';

export interface SearchOptions {
  limit?: number;
}

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

  const resp = await fetch(`/api/geocode?${params.toString()}`, { signal });

  if (!resp.ok) {
    // Handle Service Unavailable specifically
    if (resp.status === 503) {
      throw new Error('Service busy');
    }

    let errorDetail = '';
    try {
      const errorJson = await resp.json();
      errorDetail = errorJson.error || errorJson.details || errorJson.message || '';

      // If we still don't have a detail string but we have an object, stringify it
      if (!errorDetail && errorJson && typeof errorJson === 'object') {
        errorDetail = JSON.stringify(errorJson);
      }
    } catch {
      // ignore
    }

    const baseMsg = `Geocoding error ${resp.status}`;
    throw createError.internalError(errorDetail ? `${baseMsg}: ${errorDetail}` : `${baseMsg} (no details available)`);
  }

  const data = await resp.json();
  if (!Array.isArray(data)) return [];
  return data as PosterLocation[];
}

export async function reverseGeocode(
  lat: number,
  lon: number,
  signal?: AbortSignal
): Promise<PosterLocation | null> {
  const params = new URLSearchParams({
    lat: String(lat),
    lon: String(lon),
  });

  const resp = await fetch(`/api/geocode?${params.toString()}`, { signal });

  if (!resp.ok) {
    if (resp.status === 404) {
      return null;
    }
    let errorDetail = '';
    try {
      const errorJson = await resp.json();
      errorDetail = errorJson.error || errorJson.details || errorJson.message || '';
    } catch {
      // ignore
    }
    const baseMsg = `Reverse geocoding error ${resp.status}`;
    throw createError.internalError(errorDetail ? `${baseMsg}: ${errorDetail}` : `${baseMsg}`);
  }

  const data = await resp.json();
  return data as PosterLocation;
}
