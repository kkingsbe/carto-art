import { type PosterLocation } from '@/types/poster';
import { createError } from '@/lib/errors/ServerActionError';
import { logger } from '@/lib/logger';

const LOCATIONIQ_API_KEY = process.env.LOCATIONIQ_API_KEY;

export interface LocationIQResult {
    place_id: string;
    licence: string;
    osm_type: string;
    osm_id: string;
    boundingbox: [string, string, string, string]; // [minlat, maxlat, minlon, maxlon]
    lat: string;
    lon: string;
    display_name: string;
    class: string;
    type: string;
    importance: number;
    icon?: string;
    address?: Record<string, string>;
    namedetails?: Record<string, string>;
}

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

    if (!LOCATIONIQ_API_KEY) {
        logger.error('LocationIQ API key missing');
        throw createError.configurationError('Geocoding service not configured');
    }

    const params = new URLSearchParams({
        key: LOCATIONIQ_API_KEY,
        q,
        format: 'json',
        limit: String(options.limit ?? 5),
        addressdetails: '1',
        namedetails: '1',
        normalizecity: '1' // normalize city names for consistency
    });

    try {
        const resp = await fetch(`https://us1.locationiq.com/v1/search.php?${params.toString()}`, {
            signal,
            headers: {
                'Accept-Encoding': 'gzip, deflate' // LocationIQ recommendation
            }
        });

        if (!resp.ok) {
            // Handle rate limiting specifically
            if (resp.status === 429) {
                throw createError.rateLimitExceeded('Geocoding rate limit exceeded');
            }

            const errorText = await resp.text().catch(() => 'Unknown error');
            logger.error('LocationIQ search failed', { status: resp.status, error: errorText });
            throw createError.internalError(`Geocoding failed: ${resp.status}`);
        }

        const data: LocationIQResult[] = await resp.json();
        if (!Array.isArray(data)) return [];

        return data
            .map(result => locationIQResultToPosterLocation(result))
            .filter((loc): loc is PosterLocation => loc !== null);

    } catch (err: any) {
        if (err.name === 'AbortError') throw err;
        // Propagate our typed errors, wrap others
        if (err.type && err.message) throw err;

        logger.error('LocationIQ search error', err);
        throw createError.internalError('Failed to search location');
    }
}

export async function reverseGeocode(
    lat: number,
    lon: number,
    signal?: AbortSignal
): Promise<PosterLocation | null> {

    if (!LOCATIONIQ_API_KEY) {
        logger.error('LocationIQ API key missing');
        throw createError.configurationError('Geocoding service not configured');
    }

    const params = new URLSearchParams({
        key: LOCATIONIQ_API_KEY,
        lat: String(lat),
        lon: String(lon),
        format: 'json',
        addressdetails: '1',
        namedetails: '1',
        normalizecity: '1'
    });

    try {
        const resp = await fetch(`https://us1.locationiq.com/v1/reverse.php?${params.toString()}`, { signal });

        if (!resp.ok) {
            if (resp.status === 429) {
                throw createError.rateLimitExceeded('Geocoding rate limit exceeded');
            }
            const errorText = await resp.text();
            logger.error('LocationIQ reverse geocode failed', { status: resp.status, error: errorText });
            throw createError.internalError(`Reverse geocoding failed: ${resp.status}`);
        }

        const data: LocationIQResult = await resp.json();
        return locationIQResultToPosterLocation(data);
    } catch (err: any) {
        if (err.name === 'AbortError') throw err;
        if (err.type && err.message) throw err;

        logger.error('LocationIQ reverse geocode error', err);
        throw createError.internalError('Failed to reverse geocode location');
    }
}

// Helper functions for mapping results

const STATE_INITIALS: Record<string, string> = {
    // US States
    'Alabama': 'AL', 'Alaska': 'AK', 'Arizona': 'AZ', 'Arkansas': 'AR', 'California': 'CA',
    'Colorado': 'CO', 'Connecticut': 'CT', 'Delaware': 'DE', 'Florida': 'FL', 'Georgia': 'GA',
    'Hawaii': 'HI', 'Idaho': 'ID', 'Illinois': 'IL', 'Indiana': 'IN', 'Iowa': 'IA',
    'Kansas': 'KS', 'Kentucky': 'KY', 'Louisiana': 'LA', 'Maine': 'ME', 'Maryland': 'MD',
    'Massachusetts': 'MA', 'Michigan': 'MI', 'Minnesota': 'MN', 'Mississippi': 'MS', 'Missouri': 'MO',
    'Montana': 'MT', 'Nebraska': 'NE', 'Nevada': 'NV', 'New Hampshire': 'NH', 'New Jersey': 'NJ',
    'New Mexico': 'NM', 'New York': 'NY', 'North Carolina': 'NC', 'North Dakota': 'ND', 'Ohio': 'OH',
    'Oklahoma': 'OK', 'Oregon': 'OR', 'Pennsylvania': 'PA', 'Rhode Island': 'RI', 'South Carolina': 'SC',
    'South Dakota': 'SD', 'Tennessee': 'TN', 'Texas': 'TX', 'Utah': 'UT', 'Vermont': 'VT',
    'Virginia': 'VA', 'Washington': 'WA', 'West Virginia': 'WV', 'Wisconsin': 'WI', 'Wyoming': 'WY',
    'District of Columbia': 'DC',
    // Canadian Provinces
    'Alberta': 'AB', 'British Columbia': 'BC', 'Manitoba': 'MB', 'New Brunswick': 'NB',
    'Newfoundland and Labrador': 'NL', 'Nova Scotia': 'NS', 'Ontario': 'ON', 'Prince Edward Island': 'PE',
    'Quebec': 'QC', 'Saskatchewan': 'SK', 'Northwest Territories': 'NT', 'Nunavut': 'NU', 'Yukon': 'YT',
};

function pickPrimaryName(r: LocationIQResult): string {
    const nd = r.namedetails ?? {};
    const addr = r.address ?? {};

    // 1. Explicit name in details
    const name = nd.name || nd['name:en'];
    if (name) return name;

    // 2. Address component based on type
    // If it's a specific address
    if (addr.house_number && (addr.road || addr.pedestrian)) {
        return `${addr.house_number} ${addr.road || addr.pedestrian}`;
    }
    if (addr.road) return addr.road;

    // 3. City/Town/Locality
    const locality = addr.city || addr.town || addr.village || addr.hamlet || addr.suburb || addr.neighbourhood;
    if (locality) return locality;

    // 4. Fallback to first part of display_name
    return r.display_name.split(',')[0].trim();
}

function pickCity(r: LocationIQResult, excludeName?: string): string | undefined {
    const addr = r.address ?? {};

    const city = addr.city || addr.town || addr.village || addr.hamlet || addr.municipality || addr.county;
    if (!city) {
        // Fallback to state/country if no city-level detail
        const state = addr.state || addr.province;
        if (state && (!excludeName || state.toLowerCase() !== excludeName.toLowerCase())) return state;

        const country = addr.country;
        if (country && (!excludeName || country.toLowerCase() !== excludeName.toLowerCase())) return country;

        return undefined;
    }

    // If we have a city, try to append state abbv
    const stateName = addr.state || addr.province;
    if (stateName) {
        const abbv = STATE_INITIALS[stateName];
        if (abbv) {
            const combined = `${city}, ${abbv}`;
            if (!excludeName || combined.toLowerCase() !== excludeName.toLowerCase()) return combined;
        }
    }

    if (excludeName && city.toLowerCase() === excludeName.toLowerCase()) {
        const state = addr.state || addr.province;
        if (state && state.toLowerCase() !== excludeName.toLowerCase()) return state;
        return undefined;
    }

    return city;
}

function pickSubtitle(r: LocationIQResult, excludeName?: string): string | undefined {
    // Generate a nice subtitle (e.g., City, State, Country)
    const addr = r.address ?? {};
    const parts = [
        addr.suburb || addr.neighbourhood,
        addr.city || addr.town || addr.village,
        addr.state || addr.province,
        addr.country
    ].filter(Boolean) as string[];

    // Remove duplicates and the excluded name
    const uniqueParts = [...new Set(parts)].filter(p => !excludeName || p.toLowerCase() !== excludeName.toLowerCase());

    if (uniqueParts.length > 0) return uniqueParts.join(', ');

    return undefined;
}

function locationIQResultToPosterLocation(result: LocationIQResult): PosterLocation | null {
    const lat = parseFloat(result.lat);
    const lon = parseFloat(result.lon);

    if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;

    const bbox = result.boundingbox;
    // LocationIQ returns bbox as [minLat, maxLat, minLon, maxLon]
    // But sometimes it might be strings
    const [minLat, maxLat, minLon, maxLon] = bbox.map(parseFloat);

    const primaryName = pickPrimaryName(result);

    // Calculate zoom
    const latDiff = Math.abs(maxLat - minLat);
    const lonDiff = Math.abs(maxLon - minLon);
    const maxDiff = Math.max(latDiff, lonDiff);

    let zoom = 12;
    if (maxDiff > 5) zoom = 6;
    else if (maxDiff > 2) zoom = 7;
    else if (maxDiff > 1) zoom = 8;
    else if (maxDiff > 0.5) zoom = 9;
    else if (maxDiff > 0.25) zoom = 10;
    else if (maxDiff > 0.1) zoom = 11;

    return {
        name: primaryName,
        city: pickCity(result, primaryName),
        subtitle: pickSubtitle(result, primaryName),
        center: [lon, lat],
        bounds: [
            [minLon, minLat],
            [maxLon, maxLat]
        ],
        zoom
    };
}
