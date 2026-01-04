
import { NextResponse } from 'next/server';
import { reverseGeocode } from '@/lib/geocoding/locationiq';

export const runtime = 'nodejs';

function getRandomInRange(from: number, to: number, fixed: number) {
    return parseFloat((Math.random() * (to - from) + from).toFixed(fixed));
}

// Approximate land bounding boxes (continent regions) to bias random point generation toward land
// Format: [minLat, maxLat, minLon, maxLon]
const LAND_REGIONS = [
    // North America
    { minLat: 25, maxLat: 70, minLon: -130, maxLon: -60, weight: 15 },
    // South America
    { minLat: -55, maxLat: 12, minLon: -80, maxLon: -35, weight: 12 },
    // Europe
    { minLat: 36, maxLat: 70, minLon: -10, maxLon: 40, weight: 18 },
    // Africa
    { minLat: -35, maxLat: 37, minLon: -17, maxLon: 51, weight: 15 },
    // Asia (excluding Russia's far east for balance)
    { minLat: 10, maxLat: 55, minLon: 60, maxLon: 145, weight: 20 },
    // Australia/Oceania
    { minLat: -45, maxLat: -10, minLon: 110, maxLon: 180, weight: 8 },
    // Russia
    { minLat: 50, maxLat: 75, minLon: 40, maxLon: 180, weight: 8 },
    // Southeast Asia / Indonesia
    { minLat: -10, maxLat: 20, minLon: 95, maxLon: 140, weight: 6 },
];

function selectWeightedRegion() {
    const totalWeight = LAND_REGIONS.reduce((sum, r) => sum + r.weight, 0);
    let random = Math.random() * totalWeight;
    for (const region of LAND_REGIONS) {
        random -= region.weight;
        if (random <= 0) return region;
    }
    return LAND_REGIONS[0];
}

function generateBiasedLandPoint() {
    const region = selectWeightedRegion();
    return {
        lat: getRandomInRange(region.minLat, region.maxLat, 5),
        lon: getRandomInRange(region.minLon, region.maxLon, 5)
    };
}

export async function GET() {
    try {
        let attempts = 0;
        const maxAttempts = 10; // Fewer retries needed with land-biased generation

        while (attempts < maxAttempts) {
            attempts++;
            const point = generateBiasedLandPoint();

            // Validate with LocationIQ reverse geocoding
            try {
                const location = await reverseGeocode(point.lat, point.lon);

                if (location && location.name) {
                    // Found a valid location!
                    const zoom = getRandomInRange(4, 12, 2);

                    return NextResponse.json({
                        center: [point.lon, point.lat], // MapLibre uses [lng, lat]
                        zoom: zoom,
                        country: location.city || location.name,
                        name: location.name,
                        city: location.city,
                        subtitle: location.subtitle
                    });
                }
            } catch {
                // Location not found (ocean, uninhabited), try again
                continue;
            }
        }

        // Fallback if we fail to find land after max attempts
        // Return a known safe spot (e.g. Paris)
        return NextResponse.json({
            center: [2.3522, 48.8566],
            zoom: 10,
            country: 'France',
            name: 'Paris',
            fallback: true
        });

    } catch (error) {
        console.error('Random location generation error:', error);
        return NextResponse.json(
            { error: 'Failed to generate location' },
            { status: 500 }
        );
    }
}
