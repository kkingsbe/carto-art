import type { PosterLocation } from '@/types/poster';
import { createError } from '@/lib/errors/ServerActionError';

export interface NominatimResult {
  display_name: string;
  lat: string;
  lon: string;
  boundingbox?: [string, string, string, string]; // [minlat, maxlat, minlon, maxlon]
  place_id: number;
  type: string;
  class: string;
  address?: Record<string, string | undefined>;
  namedetails?: Record<string, string | undefined>;
}

export interface SearchOptions {
  limit?: number;
}

export async function searchLocation(
  query: string,
  options: SearchOptions = {},
  signal?: AbortSignal
): Promise<NominatimResult[]> {
  const q = query.trim();
  if (!q) return [];

  const params = new URLSearchParams({
    q,
    limit: String(options.limit ?? 5),
  });

  const resp = await fetch(`/api/geocode?${params.toString()}`, { signal });

  if (!resp.ok) {
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
  return data as NominatimResult[];
}

export async function reverseGeocode(
  lat: number,
  lon: number,
  signal?: AbortSignal
): Promise<NominatimResult | null> {
  const params = new URLSearchParams({
    lat: String(lat),
    lon: String(lon),
  });

  const resp = await fetch(`/api/geocode?${params.toString()}`, { signal });

  if (!resp.ok) {
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
  return data as NominatimResult;
}

const STATE_INITIALS: Record<string, string> = {
  // US States
  'Alabama': 'AL',
  'Alaska': 'AK',
  'Arizona': 'AZ',
  'Arkansas': 'AR',
  'California': 'CA',
  'Colorado': 'CO',
  'Connecticut': 'CT',
  'Delaware': 'DE',
  'Florida': 'FL',
  'Georgia': 'GA',
  'Hawaii': 'HI',
  'Idaho': 'ID',
  'Illinois': 'IL',
  'Indiana': 'IN',
  'Iowa': 'IA',
  'Kansas': 'KS',
  'Kentucky': 'KY',
  'Louisiana': 'LA',
  'Maine': 'ME',
  'Maryland': 'MD',
  'Massachusetts': 'MA',
  'Michigan': 'MI',
  'Minnesota': 'MN',
  'Mississippi': 'MS',
  'Missouri': 'MO',
  'Montana': 'MT',
  'Nebraska': 'NE',
  'Nevada': 'NV',
  'New Hampshire': 'NH',
  'New Jersey': 'NJ',
  'New Mexico': 'NM',
  'New York': 'NY',
  'North Carolina': 'NC',
  'North Dakota': 'ND',
  'Ohio': 'OH',
  'Oklahoma': 'OK',
  'Oregon': 'OR',
  'Pennsylvania': 'PA',
  'Rhode Island': 'RI',
  'South Carolina': 'SC',
  'South Dakota': 'SD',
  'Tennessee': 'TN',
  'Texas': 'TX',
  'Utah': 'UT',
  'Vermont': 'VT',
  'Virginia': 'VA',
  'Washington': 'WA',
  'West Virginia': 'WV',
  'Wisconsin': 'WI',
  'Wyoming': 'WY',
  'District of Columbia': 'DC',
  // Canadian Provinces
  'Alberta': 'AB',
  'British Columbia': 'BC',
  'Manitoba': 'MB',
  'New Brunswick': 'NB',
  'Newfoundland and Labrador': 'NL',
  'Nova Scotia': 'NS',
  'Ontario': 'ON',
  'Prince Edward Island': 'PE',
  'Quebec': 'QC',
  'Saskatchewan': 'SK',
  'Northwest Territories': 'NT',
  'Nunavut': 'NU',
  'Yukon': 'YT',
};

function pickPrimaryName(r: NominatimResult): string {
  const nd = r.namedetails ?? {};
  const addr = r.address ?? {};

  // Check for named details first (buildings, landmarks, etc.)
  const fromNamedetails =
    nd.name ||
    nd['name:en'] ||
    nd['name:local'] ||
    nd['official_name'] ||
    nd['short_name'];

  if (fromNamedetails) {
    return fromNamedetails.toString();
  }

  // Check for street addresses (house_number + road, or just road)
  const houseNumber = addr.house_number;
  const road = addr.road;
  if (road) {
    const streetAddress = houseNumber ? `${houseNumber} ${road}` : road;
    return streetAddress;
  }

  // Check for other address fields (city, town, etc.)
  const fromAddress =
    addr.city ||
    addr.town ||
    addr.village ||
    addr.hamlet ||
    addr.county ||
    addr.state ||
    addr.country;

  if (fromAddress) {
    return fromAddress.toString();
  }

  // Fallback to display_name
  const fallback = r.display_name?.split(',')?.[0]?.trim();
  return (fallback || 'Unknown').toString();
}

function pickSubtitle(r: NominatimResult, excludeName?: string): string | undefined {
  const addr = r.address ?? {};
  // For street addresses, show the broader location context including suburb/neighbourhood
  const parts = [
    addr.suburb || addr.neighbourhood,
    addr.city || addr.town || addr.village || addr.hamlet,
    addr.state,
    addr.country,
  ].filter(Boolean) as string[];

  let filteredParts = parts;
  if (excludeName) {
    const nameLower = excludeName.toLowerCase();
    filteredParts = parts.filter(p => p.toLowerCase() !== nameLower);
  }

  const compact = filteredParts.join(', ');
  if (compact) return compact;

  const dn = r.display_name?.trim();
  if (!dn) return undefined;

  let finalSubtitle = dn;
  if (excludeName) {
    const nameLower = excludeName.toLowerCase();
    finalSubtitle = dn.split(',')
      .map(p => p.trim())
      .filter(p => p.toLowerCase() !== nameLower)
      .join(', ');
  }

  // Keep it short-ish (UI)
  return finalSubtitle.length > 120 ? `${finalSubtitle.slice(0, 117)}...` : finalSubtitle;
}

function pickCity(r: NominatimResult, excludeName?: string): string | undefined {
  const addr = r.address ?? {};
  
  // Try to find a city/town/etc.
  let city = (
    addr.city ||
    addr.town ||
    addr.village ||
    addr.hamlet ||
    addr.municipality ||
    addr.county
  )?.toString();

  // If we found a city, check for state initials
  if (city) {
    const stateName = addr.state || addr.province;
    if (stateName) {
      const stateInitials = STATE_INITIALS[stateName];
      if (stateInitials) {
        const fullCity = `${city}, ${stateInitials}`;
        if (!excludeName || fullCity.toLowerCase() !== excludeName.toLowerCase()) {
          return fullCity;
        }
      }
    }
    
    // If the city name is redundant with the primary name, try to use state or country
    if (excludeName && city.toLowerCase() === excludeName.toLowerCase()) {
      const state = addr.state || addr.province;
      if (state && state.toLowerCase() !== excludeName.toLowerCase()) {
        return state;
      }
      const country = addr.country;
      if (country && country.toLowerCase() !== excludeName.toLowerCase()) {
        return country;
      }
      return undefined;
    }
    return city;
  }

  // If no city-level info, try state or country as fallback subtitle
  const state = addr.state || addr.province;
  if (state && (!excludeName || state.toLowerCase() !== excludeName.toLowerCase())) {
    return state;
  }

  const country = addr.country;
  if (country && (!excludeName || country.toLowerCase() !== excludeName.toLowerCase())) {
    return country;
  }

  return undefined;
}

export function nominatimResultToPosterLocation(result: NominatimResult, zoom?: number): PosterLocation | null {
  const lat = Number.parseFloat(result.lat);
  const lon = Number.parseFloat(result.lon);

  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;

  const bbox = result.boundingbox;
  if (!bbox || bbox.length !== 4) return null;

  const [minLat, maxLat, minLon, maxLon] = bbox.map((v) => Number.parseFloat(v));
  if (![minLat, maxLat, minLon, maxLon].every(Number.isFinite)) return null;

  const latDiff = Math.abs(maxLat - minLat);
  const lonDiff = Math.abs(maxLon - minLon);
  const maxDiff = Math.max(latDiff, lonDiff);

  let calculatedZoom = zoom;
  if (!calculatedZoom) {
    if (maxDiff > 5) calculatedZoom = 6;
    else if (maxDiff > 2) calculatedZoom = 7;
    else if (maxDiff > 1) calculatedZoom = 8;
    else if (maxDiff > 0.5) calculatedZoom = 9;
    else if (maxDiff > 0.25) calculatedZoom = 10;
    else if (maxDiff > 0.1) calculatedZoom = 11;
    else calculatedZoom = 12;
  }

  const primaryName = pickPrimaryName(result);

  return {
    name: primaryName,
    city: pickCity(result, primaryName),
    subtitle: pickSubtitle(result, primaryName),
    center: [lon, lat],
    bounds: [
      [minLon, minLat], // SW
      [maxLon, maxLat], // NE
    ],
    zoom: calculatedZoom,
  };
}
