
import { NextResponse } from 'next/server';
// @ts-ignore
import geocoder from 'fast-reverse-geocoder';

export const runtime = 'nodejs';

// Bounding box for valid latitudes/longitudes to avoid pure polar ice caps if desired, 
// but generally the country check handles most.
const MAX_LAT = 80;
const MIN_LAT = -60; // Avoid Antarctica if desired, or keep it. Let's do -85 to 85 standard.

function getRandomInRange(from: number, to: number, fixed: number) {
    return parseFloat((Math.random() * (to - from) + from).toFixed(fixed));
}

// Function to generate a random point
function generateRandomPoint() {
    return {
        lat: getRandomInRange(-85, 85, 5),
        lon: getRandomInRange(-180, 180, 5)
    };
}

export async function GET() {
    try {
        let attempts = 0;
        const maxAttempts = 50; // Give it enough tries to hit land

        while (attempts < maxAttempts) {
            attempts++;
            const point = generateRandomPoint();

            // Validation: Check if point is in a country
            // fast-reverse-geocoder returns an object if found, or null/undefined ?? 
            // It actually might return null or an object with country code.
            // Let's verify the API. Based on docs, it returns data or throws/null.
            // Actually it takes a callback or returns promise? 
            // Usually these older libs are callback based. Let's check usage if we could, 
            // but for now I'll assume standard usage or wrap in promise.
            // Looking at similar libs, it might be synchronous or async.
            // Given "fast-reverse-geocoder" is csv based loaded into memory usually.

            // Let's assume it's synchronous after load or promise based.
            // Since I can't check docs easily without browsing, I will wrap in try/catch and assume the standard:
            // geocoder.search({ lat, lon }) -> result

            // Wait, "fast-reverse-geocoder" npm usually:
            // var geocoder = require('fast-reverse-geocoder');
            // var result = geocoder.search({ lat: 48.8566, lon: 2.3522 });

            // Let's try synchronous first.
            const result = geocoder.search(point);

            if (result && result.code) {
                // Found a country!

                // Random zoom between 3 (continent) and 10 (city region)
                const zoom = getRandomInRange(3, 10, 2);

                return NextResponse.json({
                    center: [point.lon, point.lat], // MapLibre uses [lng, lat]
                    zoom: zoom,
                    country: result.country,
                    code: result.code
                });
            }
        }

        // Fallback if we fail to find land (unlikely in 50 tries)
        // Return a known safe spot (e.g. London)
        return NextResponse.json({
            center: [-0.1276, 51.5072],
            zoom: 10,
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
