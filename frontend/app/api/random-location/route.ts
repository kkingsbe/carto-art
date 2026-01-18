import { NextResponse } from 'next/server';
import { MAP } from '@/lib/constants';

export const runtime = 'nodejs';

function getRandomInRange(from: number, to: number, fixed: number) {
    return parseFloat((Math.random() * (to - from) + from).toFixed(fixed));
}

// Simple land-biased random point generation (no external API required)
function generateRandomLandPoint() {
    // Approximate land regions to bias toward land (simplified)
    const regions = [
        { minLat: 25, maxLat: 70, minLon: -130, maxLon: -60 }, // North America
        { minLat: -55, maxLat: 12, minLon: -80, maxLon: -35 }, // South America
        { minLat: 36, maxLat: 70, minLon: -10, maxLon: 40 }, // Europe
        { minLat: -35, maxLat: 37, minLon: -17, maxLon: 51 }, // Africa
        { minLat: 10, maxLat: 55, minLon: 60, maxLon: 145 }, // Asia
        { minLat: -45, maxLat: -10, minLon: 110, maxLon: 180 }, // Australia/Oceania
        { minLat: 50, maxLat: 75, minLon: 40, maxLon: 180 }, // Russia
    ];

    const region = regions[Math.floor(Math.random() * regions.length)];
    return {
        lat: getRandomInRange(region.minLat, region.maxLat, 5),
        lon: getRandomInRange(region.minLon, region.maxLon, 5)
    };
}

// Simple city names for random locations (no external API required)
const CITIES = [
    { name: 'Paris', city: 'Paris', country: 'France', center: [2.3522, 48.8566] },
    { name: 'Tokyo', city: 'Tokyo', country: 'Japan', center: [139.6917, 35.6895] },
    { name: 'New York', city: 'New York', country: 'United States', center: [-74.0060, 40.7128] },
    { name: 'London', city: 'London', country: 'United Kingdom', center: [-0.1276, 51.5074] },
    { name: 'Sydney', city: 'Sydney', country: 'Australia', center: [151.2093, -33.8688] },
    { name: 'Rio de Janeiro', city: 'Rio de Janeiro', country: 'Brazil', center: [-43.1729, -22.9068] },
    { name: 'Cape Town', city: 'Cape Town', country: 'South Africa', center: [18.4241, -33.9249] },
    { name: 'Dubai', city: 'Dubai', country: 'United Arab Emirates', center: [55.2708, 25.2048] },
    { name: 'Singapore', city: 'Singapore', country: 'Singapore', center: [103.8198, 1.3521] },
    { name: 'Mumbai', city: 'Mumbai', country: 'India', center: [72.8777, 19.0760] },
    { name: 'Berlin', city: 'Berlin', country: 'Germany', center: [13.4050, 52.5200] },
    { name: 'Rome', city: 'Rome', country: 'Italy', center: [12.4964, 41.9028] },
    { name: 'Barcelona', city: 'Barcelona', country: 'Spain', center: [2.1734, 41.3851] },
    { name: 'Vancouver', city: 'Vancouver', country: 'Canada', center: [-123.1207, 49.2827] },
    { name: 'Mexico City', city: 'Mexico City', country: 'Mexico', center: [-99.1332, 19.4326] },
    { name: 'Buenos Aires', city: 'Buenos Aires', country: 'Argentina', center: [-58.3816, -34.6037] },
    { name: 'Cairo', city: 'Cairo', country: 'Egypt', center: [31.2357, 30.0444] },
    { name: 'Istanbul', city: 'Istanbul', country: 'Turkey', center: [28.9784, 41.0082] },
    { name: 'Seoul', city: 'Seoul', country: 'South Korea', center: [126.9780, 37.5665] },
    { name: 'Bangkok', city: 'Bangkok', country: 'Thailand', center: [100.5018, 13.7563] },
    { name: 'Los Angeles', city: 'Los Angeles', country: 'United States', center: [-118.2437, 34.0522] },
    { name: 'San Francisco', city: 'San Francisco', country: 'United States', center: [-122.4194, 37.7749] },
    { name: 'Amsterdam', city: 'Amsterdam', country: 'Netherlands', center: [4.9041, 52.3676] },
    { name: 'Stockholm', city: 'Stockholm', country: 'Sweden', center: [18.0686, 59.3293] },
    { name: 'Vienna', city: 'Vienna', country: 'Austria', center: [16.3738, 48.2082] },
    { name: 'Prague', city: 'Prague', country: 'Czech Republic', center: [14.4378, 50.0755] },
    { name: 'Lisbon', city: 'Lisbon', country: 'Portugal', center: [-9.1394, 38.7223] },
    { name: 'Warsaw', city: 'Warsaw', country: 'Poland', center: [21.0122, 52.2297] },
    { name: 'Athens', city: 'Athens', country: 'Greece', center: [23.7275, 37.9838] },
    { name: 'Edinburgh', city: 'Edinburgh', country: 'United Kingdom', center: [-3.1883, 55.9533] },
    { name: 'Reykjavik', city: 'Reykjavik', country: 'Iceland', center: [-21.9426, 64.1470] },
    { name: 'Wellington', city: 'Wellington', country: 'New Zealand', center: [174.7762, -41.2865] },
];

export async function GET() {
    try {
        // 50% chance to return a known city, 50% chance for random land point
        const useKnownCity = Math.random() > 0.5;

        if (useKnownCity) {
            const city = CITIES[Math.floor(Math.random() * CITIES.length)];
            const zoom = getRandomInRange(6, MAP.MAX_ZOOM_CLAMPED, 2);

            return NextResponse.json({
                center: city.center,
                zoom: zoom,
                name: city.name,
                city: city.city,
                country: city.country,
                subtitle: `${city.city}, ${city.country}`
            });
        } else {
            const point = generateRandomLandPoint();
            const zoom = getRandomInRange(4, MAP.MAX_ZOOM_CLAMPED, 2);

            return NextResponse.json({
                center: [point.lon, point.lat],
                zoom: zoom,
                name: 'Random Location',
                city: 'Somewhere on Earth',
                country: 'World',
                subtitle: `${point.lat.toFixed(4)}°, ${point.lon.toFixed(4)}°`
            });
        }
    } catch (error) {
        console.error('Random location generation error:', error);
        // Fallback to a safe default
        return NextResponse.json({
            center: [0, 20],
            zoom: 2,
            name: 'Paris',
            city: 'Paris',
            country: 'France',
            subtitle: 'Paris, France'
        });
    }
}
